import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { BarbeirosService } from './barbeiros.service';

@Controller('barbeiros')
export class BarbeirosController {
  constructor(private barbeiros: BarbeirosService) {}

  @Get()
  listar() {
    return this.barbeiros.listar();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPRIETARIO)
  @Post()
  criar(@Body() body: { nome: string }) {
    return this.barbeiros.criar(body.nome);
  }
}
