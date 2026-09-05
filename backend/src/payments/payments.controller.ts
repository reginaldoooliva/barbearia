import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':agendamentoId')
  criar(@Req() req: any, @Param('agendamentoId') agendamentoId: string) {
    return this.paymentsService.criarCobranca(req.user.id, agendamentoId);
  }

  // Endpoint público: é o Mercado Pago que chama, não o app.
  @Post('webhook')
  webhook(@Body() body: { data?: { id?: string } }) {
    if (body?.data?.id) {
      return this.paymentsService.processarWebhook(body.data.id);
    }
  }
}
