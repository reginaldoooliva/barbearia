import { IsDateString } from 'class-validator';

export class DashboardStatsQueryDto {
  @IsDateString()
  dataInicio!: string; // YYYY-MM-DD

  @IsDateString()
  dataFim!: string; // YYYY-MM-DD
}
