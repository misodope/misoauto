import { Test, TestingModule } from '@nestjs/testing';
import { InstagramController } from '../../src/platform/platform-instagram.controller';
import { PlatformConnectInstagramService } from '../../src/platform/platform-connect-instagram.service';

describe('InstagramController', () => {
  let controller: InstagramController;
  let instagramService: jest.Mocked<PlatformConnectInstagramService>;

  const mockUserInfo = {
    id: '123456789',
    username: 'testuser',
    account_type: 'BUSINESS' as const,
    media_count: 100,
  };

  const mockMedia = [
    {
      id: 'media1',
      caption: 'Test caption',
      media_type: 'IMAGE' as const,
      media_url: 'https://example.com/media1.jpg',
      permalink: 'https://instagram.com/p/abc123',
      timestamp: '2023-01-01T00:00:00Z',
      username: 'testuser',
    },
  ];

  const mockTokenResponse = {
    access_token: 'short_token',
    user_id: 123456789,
  };

  const mockLongLivedToken = {
    access_token: 'long_token',
    token_type: 'bearer',
    expires_in: 5183944,
  };

  beforeEach(async () => {
    const mockInstagramService = {
      generateAuthUrl: jest.fn(),
      exchangeCodeForToken: jest.fn(),
      exchangeForLongLivedToken: jest.fn(),
      refreshLongLivedToken: jest.fn(),
      getUserInfo: jest.fn(),
      getUserMedia: jest.fn(),
      getMediaById: jest.fn(),
      validateToken: jest.fn(),
      getConfigStatus: jest.fn(),
      isConfigured: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstagramController],
      providers: [
        {
          provide: PlatformConnectInstagramService,
          useValue: mockInstagramService,
        },
      ],
    }).compile();

    controller = module.get<InstagramController>(InstagramController);
    instagramService = module.get(PlatformConnectInstagramService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateAuthUrl', () => {
    it('should generate auth URL successfully', async () => {
      const authUrl = 'https://api.instagram.com/oauth/authorize?client_id=123&redirect_uri=test';
      instagramService.generateAuthUrl.mockReturnValue(authUrl);

      const result = await controller.generateAuthUrl({ state: 'test-state' });

      expect(instagramService.generateAuthUrl).toHaveBeenCalledWith('test-state');
      expect(result).toEqual({
        authUrl,
        platform: 'instagram',
      });
    });

    it('should generate auth URL without state', async () => {
      const authUrl = 'https://api.instagram.com/oauth/authorize?client_id=123&redirect_uri=test';
      instagramService.generateAuthUrl.mockReturnValue(authUrl);

      const result = await controller.generateAuthUrl({});

      expect(instagramService.generateAuthUrl).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({
        authUrl,
        platform: 'instagram',
      });
    });
  });

  describe('exchangeToken', () => {
    it('should exchange token successfully', async () => {
      instagramService.exchangeCodeForToken.mockResolvedValue(mockTokenResponse);
      instagramService.exchangeForLongLivedToken.mockResolvedValue(mockLongLivedToken);

      const result = await controller.exchangeToken({ code: 'auth-code' });

      expect(instagramService.exchangeCodeForToken).toHaveBeenCalledWith('auth-code');
      expect(instagramService.exchangeForLongLivedToken).toHaveBeenCalledWith(mockTokenResponse.access_token);
      expect(result).toEqual({
        shortLivedToken: mockTokenResponse,
        longLivedToken: mockLongLivedToken,
        platform: 'instagram',
      });
    });

    it('should handle token exchange error', async () => {
      instagramService.exchangeCodeForToken.mockRejectedValue(new Error('Invalid code'));

      await expect(controller.exchangeToken({ code: 'invalid-code' })).rejects.toThrow('Invalid code');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      instagramService.refreshLongLivedToken.mockResolvedValue(mockLongLivedToken);

      const result = await controller.refreshToken({ accessToken: 'old-token' });

      expect(instagramService.refreshLongLivedToken).toHaveBeenCalledWith('old-token');
      expect(result).toEqual({
        ...mockLongLivedToken,
        platform: 'instagram',
      });
    });

    it('should handle refresh token error', async () => {
      instagramService.refreshLongLivedToken.mockRejectedValue(new Error('Token expired'));

      await expect(controller.refreshToken({ accessToken: 'expired-token' })).rejects.toThrow('Token expired');
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      instagramService.getUserInfo.mockResolvedValue(mockUserInfo);

      const result = await controller.getUserInfo({ accessToken: 'valid-token' });

      expect(instagramService.getUserInfo).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({
        user: mockUserInfo,
        platform: 'instagram',
      });
    });

    it('should handle get user info error', async () => {
      instagramService.getUserInfo.mockRejectedValue(new Error('Invalid token'));

      await expect(controller.getUserInfo({ accessToken: 'invalid-token' })).rejects.toThrow('Invalid token');
    });
  });

  describe('getUserMedia', () => {
    it('should get user media successfully', async () => {
      instagramService.getUserMedia.mockResolvedValue(mockMedia);

      const result = await controller.getUserMedia({ accessToken: 'valid-token', limit: 10 });

      expect(instagramService.getUserMedia).toHaveBeenCalledWith('valid-token', 10);
      expect(result).toEqual({
        media: mockMedia,
        platform: 'instagram',
        count: mockMedia.length,
      });
    });

    it('should get user media with default limit', async () => {
      instagramService.getUserMedia.mockResolvedValue(mockMedia);

      const result = await controller.getUserMedia({ accessToken: 'valid-token' });

      expect(instagramService.getUserMedia).toHaveBeenCalledWith('valid-token', undefined);
      expect(result).toEqual({
        media: mockMedia,
        platform: 'instagram',
        count: mockMedia.length,
      });
    });
  });

  describe('getMediaById', () => {
    it('should get media by ID successfully', async () => {
      const singleMedia = mockMedia[0];
      instagramService.getMediaById.mockResolvedValue(singleMedia);

      const result = await controller.getMediaById('media1', { accessToken: 'valid-token' });

      expect(instagramService.getMediaById).toHaveBeenCalledWith('media1', 'valid-token');
      expect(result).toEqual({
        media: singleMedia,
        platform: 'instagram',
      });
    });

    it('should handle get media by ID error', async () => {
      instagramService.getMediaById.mockRejectedValue(new Error('Media not found'));

      await expect(controller.getMediaById('invalid-media-id', { accessToken: 'valid-token' }))
        .rejects.toThrow('Media not found');
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      instagramService.validateToken.mockResolvedValue(true);

      const result = await controller.validateToken({ accessToken: 'valid-token' });

      expect(instagramService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({
        valid: true,
        platform: 'instagram',
      });
    });

    it('should return false for invalid token', async () => {
      instagramService.validateToken.mockResolvedValue(false);

      const result = await controller.validateToken({ accessToken: 'invalid-token' });

      expect(result).toEqual({
        valid: false,
        platform: 'instagram',
      });
    });
  });

  describe('getConfigStatus', () => {
    it('should get config status successfully', async () => {
      const configStatus = {
        configured: true,
        missingFields: [],
      };
      instagramService.getConfigStatus.mockReturnValue(configStatus);

      const result = await controller.getConfigStatus();

      expect(instagramService.getConfigStatus).toHaveBeenCalled();
      expect(result).toEqual({
        ...configStatus,
        platform: 'instagram',
      });
    });

    it('should return config status with missing fields', async () => {
      const configStatus = {
        configured: false,
        missingFields: ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET'],
      };
      instagramService.getConfigStatus.mockReturnValue(configStatus);

      const result = await controller.getConfigStatus();

      expect(result).toEqual({
        ...configStatus,
        platform: 'instagram',
      });
    });
  });

  describe('getHealth', () => {
    it('should get health status successfully', async () => {
      instagramService.isConfigured.mockReturnValue(true);

      const result = await controller.getHealth();

      expect(instagramService.isConfigured).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'healthy',
        configured: true,
        platform: 'instagram',
        timestamp: expect.any(String),
      });
    });

    it('should get health status with not configured', async () => {
      instagramService.isConfigured.mockReturnValue(false);

      const result = await controller.getHealth();

      expect(result).toEqual({
        status: 'healthy',
        configured: false,
        platform: 'instagram',
        timestamp: expect.any(String),
      });
    });
  });
});
