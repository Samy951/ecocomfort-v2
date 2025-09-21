import { UserLevel } from '../../shared/enums/user-level.enum';

export interface LoginResponseDto {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    level: UserLevel;
    points: number;
  };
}