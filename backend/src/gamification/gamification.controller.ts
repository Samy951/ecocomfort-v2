import { Controller, Get, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationStatsDto } from './dto/gamification-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string): Promise<GamificationStatsDto> {
    try {
      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber)) {
        throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
      }

      return await this.gamificationService.getGamificationStats(userIdNumber);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}