import { Controller, Get, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { GamificationStatsDto } from './dto/gamification-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get gamification statistics for current user' })
  @ApiResponse({
    status: 200,
    description: 'Gamification statistics',
  })
  async getCurrentUserStats(@CurrentUser() user: any): Promise<GamificationStatsDto> {
    try {
      return await this.gamificationService.getGamificationStats(user.id);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string): Promise<GamificationStatsDto> {
    try {
      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber)) {
        throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
      }

      return await this.gamificationService.getGamificationStats(userIdNumber);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.message === 'User not found') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}