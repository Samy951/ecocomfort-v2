import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, loginSchema } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: any): Promise<LoginResponseDto> {
    // Validate request body with Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { email, password } = validationResult.data;

    // Validate user credentials
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token and return response
    return this.authService.login(user);
  }
}