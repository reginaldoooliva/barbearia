import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { StatusAgendamento } from '@prisma/client';

const MINUTOS_DE_RESERVA = Number(process.env.RESERVATION_HOLD_MINUTES ?? 10);

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria a reserva temporária do horário.
   *
   * A trava contra dois clientes pegando o mesmo horário não depende de
   * "verificar antes de criar" (isso tem condição de corrida). Ela depende
   * do índice único (barbeiroId, dataHoraInicio) no banco: se dois pedidos
   * chegarem ao mesmo tempo, o banco garante que só um INSERT terá sucesso.
   * O segundo cai no catch abaixo com erro de violação de unicidade (P2002).
   */
  async criarReserva(clienteId: string, dto: CreateAppointmentDto) {
    const servico = await this.prisma.servico.findUnique({ where: { id: dto.servicoId } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');

    const inicio = new Date(dto.dataHoraInicio);
    const fim = new Date(inicio.getTime() + servico.duracaoMin * 60_000);
    const expiraEm = new Date(Date.now() + MINUTOS_DE_RESERVA * 60_000);

    // Antes de tentar reservar, libera qualquer reserva antiga já expirada
    // para esse mesmo horário (senão o índice único bloquearia à toa).
    await this.expirarReservasVencidas(dto.barbeiroId, inicio);

    try {
      const agendamento = await this.prisma.agendamento.create({
        data: {
          clienteId,
          barbeiroId: dto.barbeiroId,
          servicoId: dto.servicoId,
          dataHoraInicio: inicio,
          dataHoraFim: fim,
          expiraEm,
          status: StatusAgendamento.RESERVADO,
        },
      });
      return agendamento;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Esse horário acabou de ser reservado por outro cliente');
      }
      throw err;
    }
  }

  private async expirarReservasVencidas(barbeiroId: string, dataHoraInicio: Date) {
    await this.prisma.agendamento.updateMany({
      where: {
        barbeiroId,
        dataHoraInicio,
        status: StatusAgendamento.RESERVADO,
        expiraEm: { lt: new Date() },
      },
      data: { status: StatusAgendamento.CANCELADO },
    });
  }

  async listarHorariosDisponiveis(barbeiroId: string, data: string) {
    // TODO: cruzar com horário de funcionamento do barbeiro.
    // Aqui só filtra os slots já ocupados (reservados válidos ou confirmados) no dia.
    const inicioDia = new Date(`${data}T00:00:00`);
    const fimDia = new Date(`${data}T23:59:59`);

    const ocupados = await this.prisma.agendamento.findMany({
      where: {
        barbeiroId,
        dataHoraInicio: { gte: inicioDia, lte: fimDia },
        OR: [
          { status: StatusAgendamento.CONFIRMADO },
          { status: StatusAgendamento.RESERVADO, expiraEm: { gt: new Date() } },
        ],
      },
      select: { dataHoraInicio: true, dataHoraFim: true },
    });

    return ocupados;
  }

  async agendaDoDia(data?: string) {
    const dia = data ?? new Date().toISOString().slice(0, 10);
    const inicioDia = new Date(`${dia}T00:00:00`);
    const fimDia = new Date(`${dia}T23:59:59`);

    return this.prisma.agendamento.findMany({
      where: {
        dataHoraInicio: { gte: inicioDia, lte: fimDia },
        status: { in: [StatusAgendamento.CONFIRMADO, StatusAgendamento.RESERVADO] },
      },
      include: {
        cliente: { select: { id: true, nome: true, email: true, telefone: true } },
        barbeiro: true,
        servico: true,
        pagamento: true,
      },
      orderBy: { dataHoraInicio: 'asc' },
    });
  }

  async meusAgendamentos(clienteId: string) {
    return this.prisma.agendamento.findMany({
      where: { clienteId },
      include: { barbeiro: true, servico: true, pagamento: true },
      orderBy: { dataHoraInicio: 'desc' },
    });
  }

  async cancelar(clienteId: string, agendamentoId: string) {
    const agendamento = await this.prisma.agendamento.findUnique({ where: { id: agendamentoId } });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    if (agendamento.clienteId !== clienteId) throw new ForbiddenException();

    return this.prisma.agendamento.update({
      where: { id: agendamentoId },
      data: { status: StatusAgendamento.CANCELADO },
    });
  }
}
