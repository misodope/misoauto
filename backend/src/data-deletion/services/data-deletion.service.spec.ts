import {
  DataDeletionSource,
  DataDeletionStatus,
  PlatformType,
} from '@backend/generated/prisma/client';
import { DataDeletionService } from './data-deletion.service';

describe('DataDeletionService', () => {
  const writer = {
    create: jest.fn(),
    markCompleted: jest.fn(),
    markFailed: jest.fn(),
  };
  const reader = { findByCode: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    writer.create.mockResolvedValue({
      id: 4,
      status: DataDeletionStatus.PENDING,
    });
    writer.markCompleted.mockImplementation(async (id, dataFound) => ({
      id,
      status: DataDeletionStatus.COMPLETED,
      dataFound,
    }));
    writer.markFailed.mockResolvedValue({
      id: 4,
      status: DataDeletionStatus.FAILED,
    });
  });

  const createService = () =>
    new DataDeletionService(writer as never, reader as never);

  const baseParams = {
    platform: PlatformType.INSTAGRAM,
    source: DataDeletionSource.META_DATA_DELETION,
  };

  it('completes a request when data is found and removed', async () => {
    const service = createService();

    await expect(
      service.handleRequest({ ...baseParams, remove: async () => true }),
    ).resolves.toMatchObject({
      status: DataDeletionStatus.COMPLETED,
      dataFound: true,
    });
    expect(writer.markCompleted).toHaveBeenCalledWith(4, true);
    expect(writer.markFailed).not.toHaveBeenCalled();
  });

  it('completes a request with dataFound false when no account exists', async () => {
    const service = createService();

    await expect(
      service.handleRequest({ ...baseParams, remove: async () => false }),
    ).resolves.toMatchObject({
      status: DataDeletionStatus.COMPLETED,
      dataFound: false,
    });
    expect(writer.markCompleted).toHaveBeenCalledWith(4, false);
  });

  it('marks the request failed and rethrows removal errors', async () => {
    const service = createService();
    const error = new Error('database unavailable');

    await expect(
      service.handleRequest({
        ...baseParams,
        remove: async () => {
          throw error;
        },
      }),
    ).rejects.toBe(error);
    expect(writer.markFailed).toHaveBeenCalledWith(4);
    expect(writer.markCompleted).not.toHaveBeenCalled();
  });
});
