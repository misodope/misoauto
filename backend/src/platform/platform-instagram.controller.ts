import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  Param, 
  Logger 
} from '@nestjs/common';
import { PlatformConnectInstagramService } from './platform-connect-instagram.service';

// DTOs for Instagram requests
export interface AuthUrlRequest {
  state?: string;
}

export interface TokenExchangeRequest {
  code: string;
}

export interface TokenRequest {
  accessToken: string;
}

export interface UserMediaRequest {
  accessToken: string;
  limit?: number;
}

@Controller('platform/instagram')
export class InstagramController {
  private readonly logger = new Logger(InstagramController.name);

  constructor(
    private readonly instagramService: PlatformConnectInstagramService,
  ) {}

  @Get('auth-url')
  generateAuthUrl(@Query() query: AuthUrlRequest) {
    this.logger.log('Generating Instagram OAuth URL');
    return {
      authUrl: this.instagramService.generateAuthUrl(query.state),
      platform: 'instagram',
    };
  }

  @Post('exchange-token')
  async exchangeToken(@Body() body: TokenExchangeRequest) {
    this.logger.log('Exchanging Instagram authorization code for tokens');
    const shortLivedToken = await this.instagramService.exchangeCodeForToken(body.code);
    const longLivedToken = await this.instagramService.exchangeForLongLivedToken(shortLivedToken.access_token);
    
    return {
      shortLivedToken,
      longLivedToken,
      platform: 'instagram',
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: TokenRequest) {
    this.logger.log('Refreshing Instagram long-lived token');
    const refreshedToken = await this.instagramService.refreshLongLivedToken(body.accessToken);
    
    return {
      ...refreshedToken,
      platform: 'instagram',
    };
  }

  @Post('user-info')
  async getUserInfo(@Body() body: TokenRequest) {
    this.logger.log('Fetching Instagram user information');
    const userInfo = await this.instagramService.getUserInfo(body.accessToken);
    
    return {
      user: userInfo,
      platform: 'instagram',
    };
  }

  @Post('user-media')
  async getUserMedia(@Body() body: UserMediaRequest) {
    this.logger.log('Fetching Instagram user media');
    const media = await this.instagramService.getUserMedia(body.accessToken, body.limit);
    
    return {
      media,
      platform: 'instagram',
      count: media.length,
    };
  }

  @Post('media/:mediaId')
  async getMediaById(@Param('mediaId') mediaId: string, @Body() body: TokenRequest) {
    this.logger.log(`Fetching Instagram media by ID: ${mediaId}`);
    const media = await this.instagramService.getMediaById(mediaId, body.accessToken);
    
    return {
      media,
      platform: 'instagram',
    };
  }

  @Post('validate-token')
  async validateToken(@Body() body: TokenRequest) {
    this.logger.log('Validating Instagram access token');
    const isValid = await this.instagramService.validateToken(body.accessToken);
    
    return {
      valid: isValid,
      platform: 'instagram',
    };
  }

  @Get('config-status')
  getConfigStatus() {
    this.logger.log('Checking Instagram service configuration');
    const configStatus = this.instagramService.getConfigStatus();
    
    return {
      ...configStatus,
      platform: 'instagram',
    };
  }

  @Get('health')
  getHealth() {
    this.logger.log('Checking Instagram service health');
    return {
      status: 'healthy',
      configured: this.instagramService.isConfigured(),
      platform: 'instagram',
      timestamp: new Date().toISOString(),
    };
  }
}
