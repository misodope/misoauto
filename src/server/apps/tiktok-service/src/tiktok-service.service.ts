import { Injectable } from '@nestjs/common';

@Injectable()
export class TiktokServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
