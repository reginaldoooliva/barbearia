import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesCatalogService {
  constructor(private prisma: PrismaService) {}

  listar() {
    return this.prisma.servico.findMany();
  }

  criar(nome: string, duracaoMin: number, precoCentavos: number) {
    return this.prisma.servico.create({ data: { nome, duracaoMin, precoCentavos } });
  }
}
