import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { StatusAgendamento } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria o agendamento já confirmado — o pagamento é feito na barbearia,
   * então não há etapa intermediária de reserva/expiração aqui.
   *
   * A trava contra dois clientes pegando o mesmo horário não depende de
   * "verificar antes de criar" (isso tem condição de corrida). Ela depende
   * do índice único (barbeiroId, dataHoraInicio) no banco: se dois pedidos
   * chegarem ao mesmo tempo, o banco garante que só um INSERT terá sucesso.
   * O segundo cai no catch abaixo com erro de violação de unicidade (P2002).
   */
  async criarAgendamento(clienteId: string, dto: CreateAppointmentDto) {
    const servico = await this.prisma.servico.findUnique({ where: { id: dto.servicoId } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');

    const inicio = new Date(dto.dataHoraInicio);
    const fim = new Date(inicio.getTime() + servico.duracaoMin * 60_000);

    try {
      const agendamento = await this.prisma.agendamento.create({
        data: {
          clienteId,
          barbeiroId: dto.barbeiroId,
          servicoId: dto.servicoId,
          dataHoraInicio: inicio,
          dataHoraFim: fim,
          status: StatusAgendamento.CONFIRMADO,
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

  async listarHorariosDisponiveis(barbeiroId: string, data: string) {
    // TODO: cruzar com horário de funcionamento do barbeiro.
    // Aqui só filtra os slots já ocupados por agendamentos confirmados no dia.
    const inicioDia = new Date(`${data}T00:00:00`);
    const fimDia = new Date(`${data}T23:59:59`);

    const ocupados = await this.prisma.agendamento.findMany({
      where: {
        barbeiroId,
        dataHoraInicio: { gte: inicioDia, lte: fimDia },
        status: StatusAgendamento.CONFIRMADO,
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
        status: StatusAgendamento.CONFIRMADO,
      },
      include: {
        cliente: { select: { id: true, nome: true, email: true, telefone: true } },
        barbeiro: true,
        servico: true,
      },
      orderBy: { dataHoraInicio: 'asc' },
    });
  }

  async meusAgendamentos(clienteId: string) {
    return this.prisma.agendamento.findMany({
      where: { clienteId },
      include: { barbeiro: true, servico: true },
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

  /**
   * Mesma lista de horários candidatos usada em schedule.tsx (09:00–16:00,
   * 6 slots/dia). Ainda não há horário de funcionamento configurável por
   * barbeiro (mesmo TODO de listarHorariosDisponiveis), então a ocupação é
   * calculada em cima desse número fixo.
   */
  private static SLOTS_POR_DIA = 6;

  async estatisticasDashboard(dataInicio: string, dataFim: string) {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59`);

    const [agendamentos, barbeiros] = await Promise.all([
      this.prisma.agendamento.findMany({
        where: { dataHoraInicio: { gte: inicio, lte: fim } },
        include: { barbeiro: true, servico: true },
      }),
      this.prisma.barbeiro.findMany({ where: { ativo: true } }),
    ]);

    const confirmados = agendamentos.filter((a) => a.status === StatusAgendamento.CONFIRMADO);
    const cancelados = agendamentos.filter((a) => a.status === StatusAgendamento.CANCELADO);
    const totalAgendamentos = agendamentos.length;
    const taxaCancelamento = totalAgendamentos > 0 ? (cancelados.length / totalAgendamentos) * 100 : 0;

    const totalDias = Math.floor((fim.getTime() - inicio.getTime()) / 86_400_000) + 1;
    const slotsTotais = barbeiros.length * totalDias * AppointmentsService.SLOTS_POR_DIA;
    const percentualOcupacao = slotsTotais > 0 ? (confirmados.length / slotsTotais) * 100 : 0;

    const porBarbeiro = new Map<string, { barbeiroId: string; nome: string; confirmados: number; cancelados: number }>();
    const porServico = new Map<string, { servicoId: string; nome: string; confirmados: number; cancelados: number }>();

    for (const a of agendamentos) {
      const b = porBarbeiro.get(a.barbeiroId) ?? {
        barbeiroId: a.barbeiroId,
        nome: a.barbeiro.nome,
        confirmados: 0,
        cancelados: 0,
      };
      const s = porServico.get(a.servicoId) ?? {
        servicoId: a.servicoId,
        nome: a.servico.nome,
        confirmados: 0,
        cancelados: 0,
      };
      if (a.status === StatusAgendamento.CONFIRMADO) {
        b.confirmados++;
        s.confirmados++;
      } else {
        b.cancelados++;
        s.cancelados++;
      }
      porBarbeiro.set(a.barbeiroId, b);
      porServico.set(a.servicoId, s);
    }

    return {
      periodo: { dataInicio, dataFim },
      totalAgendamentos,
      confirmados: confirmados.length,
      cancelados: cancelados.length,
      taxaCancelamento,
      ocupacao: {
        slotsOcupados: confirmados.length,
        slotsTotais,
        percentual: percentualOcupacao,
      },
      porBarbeiro: [...porBarbeiro.values()].sort((a, b) => b.confirmados - a.confirmados),
      porServico: [...porServico.values()].sort((a, b) => b.confirmados - a.confirmados),
    };
  }
}
