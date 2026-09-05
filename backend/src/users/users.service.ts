import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, telefone: true, papel: true },
    });
  }
}
