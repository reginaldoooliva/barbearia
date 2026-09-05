import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BarbeirosService {
  constructor(private prisma: PrismaService) {}

  listar() {
    return this.prisma.barbeiro.findMany({ where: { ativo: true } });
  }

  criar(nome: string) {
    return this.prisma.barbeiro.create({ data: { nome } });
  }
}
