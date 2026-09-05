import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get('disponibilidade')
  disponibilidade(@Query('barbeiroId') barbeiroId: string, @Query('data') data: string) {
    return this.appointmentsService.listarHorariosDisponiveis(barbeiroId, data);
  }

  @Roles(Role.PROPRIETARIO)
  @Get('agenda')
  agenda(@Query('data') data?: string) {
    return this.appointmentsService.agendaDoDia(data);
  }

  @Roles(Role.CLIENTE)
  @Post()
  criar(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.criarReserva(req.user.id, dto);
  }

  @Roles(Role.CLIENTE)
  @Get('meus')
  meus(@Req() req: any) {
    return this.appointmentsService.meusAgendamentos(req.user.id);
  }

  @Roles(Role.CLIENTE)
  @Delete(':id')
  cancelar(@Req() req: any, @Param('id') id: string) {
    return this.appointmentsService.cancelar(req.user.id, id);
  }
}
