# Barbershop App

Estrutura inicial do app de agendamento de barbearia: backend em NestJS + PostgreSQL (via Prisma) e frontend em React Native (Expo), rodando em mobile e web a partir do mesmo código.

## Estrutura

```
barbershop-app/
├── backend/           # API NestJS
│   ├── prisma/schema.prisma
│   └── src/
│       ├── auth/              # login/cadastro, JWT, guarda de papéis (cliente/proprietário)
│       ├── users/
│       ├── appointments/      # reserva, trava de horário, expiração
│       ├── payments/          # integração Mercado Pago + webhook
│       └── services-catalog/  # serviços oferecidos (corte, barba, etc)
└── frontend/          # App Expo (mobile + web)
    ├── app/
    │   ├── (auth)/         # login-client.tsx, login-owner.tsx
    │   ├── (client)/       # home, schedule, payment, my-appointments
    │   └── (owner)/        # dashboard
    └── src/
        ├── services/api.ts
        └── context/AuthContext.tsx
```

## Como rodar o backend

```bash
cd backend
npm install
cp .env.example .env   # preencha DATABASE_URL, JWT_SECRET e MERCADOPAGO_ACCESS_TOKEN
npx prisma migrate dev --name init
npm run start:dev
```

A API sobe em `http://localhost:3000`.

## Como rodar o frontend

```bash
cd frontend
npm install
npm run start     # abre o Metro/Expo Dev Tools
npm run web       # roda no navegador
npm run android   # roda no emulador/dispositivo Android
npm run ios       # roda no simulador iOS (precisa de Mac)
```

Ajuste `baseURL` em `src/services/api.ts` para o endereço real do backend quando for testar em um dispositivo físico (não use `localhost` nesse caso — use o IP da sua máquina na rede).

## O que já está implementado

- Cadastro/login únicos (`/auth/register`, `/auth/login`), diferenciando cliente e proprietário pelo campo `papel`.
- Trava de horário via índice único `(barbeiroId, dataHoraInicio)` no banco — a defesa real contra dois clientes pegando o mesmo horário, não apenas uma verificação no código.
- Reserva temporária (`RESERVADO`) com expiração automática se o pagamento não é concluído a tempo.
- Criação de cobrança Pix via Mercado Pago e webhook que confirma o agendamento quando o pagamento é aprovado.
- Guarda de rotas por papel (`@Roles(Role.PROPRIETARIO)`) para endpoints que só o dono pode usar, como cadastrar serviços.
- Telas de login separadas para cliente e proprietário, agendamento com tratamento de conflito de horário (HTTP 409), tela de pagamento com QR code Pix, e listagem de agendamentos.

## Próximos passos sugeridos

1. Endpoint `/appointments/agenda` para o dashboard do proprietário ver todos os agendamentos do dia (não só os de um cliente).
2. Cadastro de horário de funcionamento por barbeiro, usado para gerar os slots disponíveis dinamicamente (hoje `schedule.tsx` usa horários fixos de exemplo).
3. Notificações push (lembrete de horário, confirmação de pagamento).
4. Tela de cadastro (`/auth/register`) no frontend — hoje só o backend já suporta.
5. Job periódico (ou lógica no próprio Postgres) para marcar como `CANCELADO` reservas expiradas que nunca chegaram a ter um pagamento tentado.