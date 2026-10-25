import {
  DataDeletionSource,
  PlatformType,
} from '@backend/generated/prisma/client';
import { DataDeletionRequestWriter } from './data-deletion-request-writer';

describe('DataDeletionRequestWriter', () => {
  it('retries once when confirmation code generation collides', async () => {
    const prisma = {
      dataDeletionRequest: {
        create: jest
          .fn()
          .mockRejectedValueOnce({ code: 'P2002' })
          .mockResolvedValueOnce({ id: 1, confirmationCode: 'code' }),
      },
    };
    const writer = new DataDeletionRequestWriter(prisma as never);

    await expect(
      writer.create({
        platform: PlatformType.INSTAGRAM,
        source: DataDeletionSource.META_DATA_DELETION,
      }),
    ).resolves.toEqual({ id: 1, confirmationCode: 'code' });
    expect(prisma.dataDeletionRequest.create).toHaveBeenCalledTimes(2);
  });
});
