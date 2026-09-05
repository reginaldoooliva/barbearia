import { IsDateString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  barbeiroId!: string;

  @IsUUID()
  servicoId!: string;

  @IsDateString()
  dataHoraInicio!: string; // ISO 8601, ex: 2026-09-10T14:00:00
}
