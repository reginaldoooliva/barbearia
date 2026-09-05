import { Injectable, NotFoundException } from '@nestjs/common';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';
import { StatusAgendamento, StatusPagamento } from '@prisma/client';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
});

@Injectable()
export class PaymentsService {
  private paymentApi = new Payment(mpClient);

  constructor(private prisma: PrismaService) {}

  /**
   * Gera a preferência/cobrança no Mercado Pago para um agendamento
   * que já está com status RESERVADO. O front usa o retorno (init_point
   * ou dados do Pix) para mostrar a tela de pagamento.
   */
  async criarCobranca(clienteId: string, agendamentoId: string) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: { id: agendamentoId, clienteId, status: StatusAgendamento.RESERVADO },
      include: { servico: true },
    });
    if (!agendamento) throw new NotFoundException('Reserva não encontrada ou já expirada');

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
        status: StatusPagamento.PENDENTE,
        metodo: 'pix',
        mercadoPagoPaymentId: String(pagamentoMp.id),
      },
      update: {
        status: StatusPagamento.PENDENTE,
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
  async processarWebhook(mercadoPagoPaymentId: string) {
    const infoPagamento = await this.paymentApi.get({ id: mercadoPagoPaymentId });
    const agendamentoId = infoPagamento.external_reference;
    if (!agendamentoId) return;

    const pago = infoPagamento.status === 'approved';

    await this.prisma.$transaction(async (tx) => {
      await tx.pagamento.update({
        where: { agendamentoId },
        data: { status: pago ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO },
      });

      await tx.agendamento.update({
        where: { id: agendamentoId },
        data: { status: pago ? StatusAgendamento.CONFIRMADO : StatusAgendamento.CANCELADO },
      });
    });
  }
}
