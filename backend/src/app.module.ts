import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { ServicesCatalogModule } from './services-catalog/services-catalog.module';
import { BarbeirosModule } from './barbeiros/barbeiros.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AppointmentsModule,
    PaymentsModule,
    ServicesCatalogModule,
    BarbeirosModule,
  ],
})
export class AppModule {}
