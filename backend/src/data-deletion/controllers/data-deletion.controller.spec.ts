import { NotFoundException } from '@nestjs/common';
import {
  DataDeletionStatus,
  PlatformType,
} from '@backend/generated/prisma/client';
import { DataDeletionController } from './data-deletion.controller';

describe('DataDeletionController', () => {
  const dataDeletionService = { findByCode: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for an unknown code', async () => {
    dataDeletionService.findByCode.mockResolvedValue(null);
    const controller = new DataDeletionController(dataDeletionService as never);

    await expect(controller.getStatus('unknown-code')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns status data without platform IDs or personal data', async () => {
    dataDeletionService.findByCode.mockResolvedValue({
      confirmationCode: 'confirmation-code',
      platform: PlatformType.INSTAGRAM,
      status: DataDeletionStatus.COMPLETED,
      dataFound: true,
      requestedAt: new Date('2026-10-25T00:00:00.000Z'),
      completedAt: new Date('2026-10-25T00:01:00.000Z'),
    });
    const controller = new DataDeletionController(dataDeletionService as never);

    await expect(controller.getStatus('confirmation-code')).resolves.toEqual({
      confirmationCode: 'confirmation-code',
      platform: PlatformType.INSTAGRAM,
      status: DataDeletionStatus.COMPLETED,
      dataFound: true,
      requestedAt: new Date('2026-10-25T00:00:00.000Z'),
      completedAt: new Date('2026-10-25T00:01:00.000Z'),
    });
    expect(
      JSON.stringify(await controller.getStatus('confirmation-code')),
    ).not.toContain('userId');
    expect(
      JSON.stringify(await controller.getStatus('confirmation-code')),
    ).not.toContain('accountId');
  });
});
