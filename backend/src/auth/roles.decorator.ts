import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
// Uso: @Roles(Role.PROPRIETARIO) em cima da rota que só o dono pode acessar
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
