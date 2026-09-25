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
│       ├── appointments/      # agendamento e trava de horário
│       └── services-catalog/  # serviços oferecidos (corte, barba, etc)
└── frontend/          # App Expo (mobile + web)
    ├── app/
    │   ├── (auth)/         # login-client.tsx, login-owner.tsx, register.tsx
    │   ├── (client)/       # home, schedule, my-appointments
    │   └── (owner)/        # dashboard
    └── src/
        ├── services/api.ts
        └── context/AuthContext.tsx
```

## Como rodar o backend

```bash
cd backend
npm install
cp .env.example .env   # preencha DATABASE_URL e JWT_SECRET
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
- Agendamento é confirmado (`CONFIRMADO`) imediatamente ao ser criado — o pagamento é feito presencialmente na barbearia, não pelo app.
- Guarda de rotas por papel (`@Roles(Role.PROPRIETARIO)`) para endpoints que só o dono pode usar, como cadastrar serviços.
- Telas de login separadas para cliente e proprietário, cadastro, agendamento com tratamento de conflito de horário (HTTP 409), e listagem de agendamentos.

## Próximos passos sugeridos

1. Cadastro de horário de funcionamento por barbeiro, usado para gerar os slots disponíveis dinamicamente (hoje `schedule.tsx` usa horários fixos de exemplo).
2. Notificações push (lembrete de horário).
3. Tela para o proprietário cancelar/reagendar um horário direto pelo painel.