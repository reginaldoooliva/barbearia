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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mercadopago_1 = require("mercadopago");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const mpClient = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.paymentApi = new mercadopago_1.Payment(mpClient);
    }
    /**
     * Gera a preferência/cobrança no Mercado Pago para um agendamento
     * que já está com status RESERVADO. O front usa o retorno (init_point
     * ou dados do Pix) para mostrar a tela de pagamento.
     */
    async criarCobranca(clienteId, agendamentoId) {
        const agendamento = await this.prisma.agendamento.findFirst({
            where: { id: agendamentoId, clienteId, status: client_1.StatusAgendamento.RESERVADO },
            include: { servico: true },
        });
        if (!agendamento)
            throw new common_1.NotFoundException('Reserva não encontrada ou já expirada');
        const valorCentavos = agendamento.servico.precoCentavos;
        // Chamada real à API do Mercado Pago (Checkout Transparente / Pix).
        // Documentação: https://www.mercadopago.com.br/developers
        const pagamentoMp = await this.paymentApi.create({
            body: {
                transaction_amount: valorCentavos / 100,
                description: `Agendamento ${agendamento.servico.nome}`,
                payment_method_id: 'pix',
                payer: { email: 'cliente@exemplo.com' }, // TODO: usar e-mail real do usuário
                external_reference: agendamento.id,
                notification_url: `${process.env.BACKEND_URL}/payments/webhook`,
            },
        });
        await this.prisma.pagamento.upsert({
            where: { agendamentoId: agendamento.id },
            create: {
                agendamentoId: agendamento.id,
                valorCentavos,
                status: client_1.StatusPagamento.PENDENTE,
                metodo: 'pix',
                mercadoPagoPaymentId: String(pagamentoMp.id),
            },
            update: {
                status: client_1.StatusPagamento.PENDENTE,
                mercadoPagoPaymentId: String(pagamentoMp.id),
            },
        });
        return {
            pagamentoId: pagamentoMp.id,
            qrCode: pagamentoMp.point_of_interaction?.transaction_data?.qr_code,
            qrCodeBase64: pagamentoMp.point_of_interaction?.transaction_data?.qr_code_base64,
        };
    }
    /**
     * Webhook chamado pelo Mercado Pago quando o status do pagamento muda.
     * É aqui que a reserva vira confirmação de verdade — nunca confie
     * apenas no retorno da tela de pagamento no app do cliente.
     */
    async processarWebhook(mercadoPagoPaymentId) {
        const infoPagamento = await this.paymentApi.get({ id: mercadoPagoPaymentId });
        const agendamentoId = infoPagamento.external_reference;
        if (!agendamentoId)
            return;
        const pago = infoPagamento.status === 'approved';
        await this.prisma.$transaction(async (tx) => {
            await tx.pagamento.update({
                where: { agendamentoId },
                data: { status: pago ? client_1.StatusPagamento.APROVADO : client_1.StatusPagamento.RECUSADO },
            });
            await tx.agendamento.update({
                where: { id: agendamentoId },
                data: { status: pago ? client_1.StatusAgendamento.CONFIRMADO : client_1.StatusAgendamento.CANCELADO },
            });
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
