"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const MINUTOS_DE_RESERVA = Number(process.env.RESERVATION_HOLD_MINUTES ?? 10);
let AppointmentsService = class AppointmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Cria a reserva temporária do horário.
     *
     * A trava contra dois clientes pegando o mesmo horário não depende de
     * "verificar antes de criar" (isso tem condição de corrida). Ela depende
     * do índice único (barbeiroId, dataHoraInicio) no banco: se dois pedidos
     * chegarem ao mesmo tempo, o banco garante que só um INSERT terá sucesso.
     * O segundo cai no catch abaixo com erro de violação de unicidade (P2002).
     */
    async criarReserva(clienteId, dto) {
        const servico = await this.prisma.servico.findUnique({ where: { id: dto.servicoId } });
        if (!servico)
            throw new common_1.NotFoundException('Serviço não encontrado');
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
                    status: client_1.StatusAgendamento.RESERVADO,
                },
            });
            return agendamento;
        }
        catch (err) {
            if (err?.code === 'P2002') {
                throw new common_1.ConflictException('Esse horário acabou de ser reservado por outro cliente');
            }
            throw err;
        }
    }
    async expirarReservasVencidas(barbeiroId, dataHoraInicio) {
        await this.prisma.agendamento.updateMany({
            where: {
                barbeiroId,
                dataHoraInicio,
                status: client_1.StatusAgendamento.RESERVADO,
                expiraEm: { lt: new Date() },
            },
            data: { status: client_1.StatusAgendamento.CANCELADO },
        });
    }
    async listarHorariosDisponiveis(barbeiroId, data) {
        // TODO: cruzar com horário de funcionamento do barbeiro.
        // Aqui só filtra os slots já ocupados (reservados válidos ou confirmados) no dia.
        const inicioDia = new Date(`${data}T00:00:00`);
        const fimDia = new Date(`${data}T23:59:59`);
        const ocupados = await this.prisma.agendamento.findMany({
            where: {
                barbeiroId,
                dataHoraInicio: { gte: inicioDia, lte: fimDia },
                OR: [
                    { status: client_1.StatusAgendamento.CONFIRMADO },
                    { status: client_1.StatusAgendamento.RESERVADO, expiraEm: { gt: new Date() } },
                ],
            },
            select: { dataHoraInicio: true, dataHoraFim: true },
        });
        return ocupados;
    }
    async agendaDoDia(data) {
        const dia = data ?? new Date().toISOString().slice(0, 10);
        const inicioDia = new Date(`${dia}T00:00:00`);
        const fimDia = new Date(`${dia}T23:59:59`);
        return this.prisma.agendamento.findMany({
            where: {
                dataHoraInicio: { gte: inicioDia, lte: fimDia },
                status: { in: [client_1.StatusAgendamento.CONFIRMADO, client_1.StatusAgendamento.RESERVADO] },
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
    async meusAgendamentos(clienteId) {
        return this.prisma.agendamento.findMany({
            where: { clienteId },
            include: { barbeiro: true, servico: true, pagamento: true },
            orderBy: { dataHoraInicio: 'desc' },
        });
    }
    async cancelar(clienteId, agendamentoId) {
        const agendamento = await this.prisma.agendamento.findUnique({ where: { id: agendamentoId } });
        if (!agendamento)
            throw new common_1.NotFoundException('Agendamento não encontrado');
        if (agendamento.clienteId !== clienteId)
            throw new common_1.ForbiddenException();
        return this.prisma.agendamento.update({
            where: { id: agendamentoId },
            data: { status: client_1.StatusAgendamento.CANCELADO },
        });
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
