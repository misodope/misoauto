import { Controller, Get } from '@nestjs/common';
import { UploadServiceService } from './upload-service.service';

@Controller('api')
export class UploadServiceController {
  constructor(private readonly uploadServiceService: UploadServiceService) {}

  @Get('upload')
  getHello(): string {
    return this.uploadServiceService.getHello();
  }
}
