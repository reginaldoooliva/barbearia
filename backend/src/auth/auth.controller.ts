import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Mesmo endpoint serve cliente e proprietário: o "papel" enviado no
// registro (ou já salvo no usuário, no login) é o que define a experiência
// e as permissões no front. A tela de login pode ser visualmente separada,
// mas por baixo chama o mesmo /auth/login.
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
