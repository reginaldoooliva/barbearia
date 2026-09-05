import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ServicesCatalogService } from './services-catalog.service';

@Controller('services-catalog')
export class ServicesCatalogController {
  constructor(private catalog: ServicesCatalogService) {}

  @Get()
  listar() {
    return this.catalog.listar();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPRIETARIO)
  @Post()
  criar(@Body() body: { nome: string; duracaoMin: number; precoCentavos: number }) {
    return this.catalog.criar(body.nome, body.duracaoMin, body.precoCentavos);
  }
}
