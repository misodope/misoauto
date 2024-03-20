import { Test, TestingModule } from '@nestjs/testing';
import { TiktokServiceController } from './tiktok-service.controller';
import { TiktokServiceService } from './tiktok-service.service';

describe('TiktokServiceController', () => {
  let tiktokServiceController: TiktokServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TiktokServiceController],
      providers: [TiktokServiceService],
    }).compile();

    tiktokServiceController = app.get<TiktokServiceController>(TiktokServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(tiktokServiceController.getHello()).toBe('Hello World!');
    });
  });
});
