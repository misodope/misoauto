import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Request, Response } from 'express';

type PrismaErrorEntry = {
  statusCode: number;
  logLabel: string;
  clientMessage: (meta: Record<string, unknown> | undefined) => string;
};

// Converts a snake_case DB column name to a readable label.
// e.g. "phone_number" → "phone number", "userId" → "userId"
function fieldLabel(raw: string): string {
  return raw.replace(/_/g, ' ');
}

// Maps Prisma error codes to a clean handler so the underlying DB
// technology is never exposed to the client.
const PRISMA_ERROR_MAP: Record<string, PrismaErrorEntry> = {
  P2002: {
    statusCode: HttpStatus.CONFLICT,
    logLabel: 'Unique Constraint Violation',
    clientMessage: (meta) => {
      const targets = meta?.target as string[] | undefined;
      if (targets?.length) {
        const fields = targets.map(fieldLabel).join(' and ');
        return `That ${fields} is already in use.`;
      }
      return 'A record with that value already exists.';
    },
  },
  P2025: {
    statusCode: HttpStatus.NOT_FOUND,
    logLabel: 'Record Not Found',
    clientMessage: () => 'The requested record was not found.',
  },
  P2003: {
    statusCode: HttpStatus.BAD_REQUEST,
    logLabel: 'Foreign Key Constraint Violation',
    clientMessage: (meta) => {
      const field = meta?.field_name as string | undefined;
      if (field) {
        const label = fieldLabel(field.replace(/_id$/, ''));
        return `The referenced ${label} does not exist.`;
      }
      return 'Operation failed due to a related record constraint.';
    },
  },
  P2014: {
    statusCode: HttpStatus.BAD_REQUEST,
    logLabel: 'Required Relation Violation',
    clientMessage: () => 'Operation failed due to a required relation.',
  },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { statusCode, clientMessage, logMessage, logLevel } =
      this.resolveException(exception);

    const logContext = `${request.method} ${request.url}`;

    if (logLevel === 'error') {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`[${statusCode}] ${logContext}: ${logMessage}`, stack);
    } else {
      this.logger.warn(`[${statusCode}] ${logContext}: ${logMessage}`);
    }

    response.status(statusCode).json({
      statusCode,
      message: clientMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveException(exception: unknown): {
    statusCode: number;
    clientMessage: string;
    logMessage: string;
    logLevel: 'warn' | 'error';
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const responseBody = exception.getResponse();
      const message =
        typeof responseBody === 'string'
          ? responseBody
          : (responseBody as any)?.message || exception.message;
      return {
        statusCode,
        clientMessage: message,
        logMessage: message,
        logLevel: statusCode >= 500 ? 'error' : 'warn',
      };
    }

    if (exception instanceof PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        const target = (exception.meta?.target as string[])?.join(', ');
        const logMessage = target
          ? `${mapped.logLabel} on [${target}]`
          : mapped.logLabel;
        return {
          statusCode: mapped.statusCode,
          clientMessage: mapped.clientMessage(exception.meta ?? undefined),
          logMessage,
          logLevel: 'warn',
        };
      }
      // Unknown Prisma error — log the code but hide details from client
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        clientMessage: 'A database error occurred.',
        logMessage: `Prisma error ${exception.code}: ${exception.message}`,
        logLevel: 'error',
      };
    }

    const logMessage =
      exception instanceof Error ? exception.message : 'Unknown error';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      clientMessage: 'Internal server error.',
      logMessage,
      logLevel: 'error',
    };
  }
}
