import { Module } from '@nestjs/common';
import { BarbeirosService } from './barbeiros.service';
import { BarbeirosController } from './barbeiros.controller';

@Module({
  providers: [BarbeirosService],
  controllers: [BarbeirosController],
})
export class BarbeirosModule {}
