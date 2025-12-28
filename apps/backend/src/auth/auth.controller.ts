import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Public } from './decorators/public.decorator';
import { ConfigService } from '../config/config.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const user = req.user;
    if (!user) {
      return res.redirect(
        `${this.configService.frontendUrl}/login?error=unauthorized`,
      );
    }

    const token = this.authService.generateToken(user);
    return res.redirect(`${this.configService.frontendUrl}/auth/callback?token=${token}`);
  }

  @Public()
  @Get('status')
  getStatus() {
    return { status: 'ok' };
  }
}
