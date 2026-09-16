# Teste Técnico – Estagiário Full Stack
Solucionar um problema de agendamento que bloqueia feriados e finais de semana de horário para uma cliníca de saúde.
consultando a API pública [date.nager.at](https://date.nager.at/api/v3/PublicHolidays/2026/BR).

## Arquitetura

- **Backend:** Node.js + Express + MySQL (rotas REST, validação de regras de negócio, consumo da API de feriados)
- **Frontend:** HTML + CSS + JavaScript puro (sem build), consumindo a API do backend
- **Banco de dados:** MySQL

## Como rodar

### 1. Banco de dados

```bash
mysql -u root -p < schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# edite o .env com suas credenciais do MySQL
npm start
```

O servidor sobe em `http://localhost:3000`.

### 3. Frontend

Basta abrir `frontend/index.html` no navegador (ou servir com uma extensão tipo Live Server).
Certifique-se de que o backend está rodando antes.

## Tratamento de datas e horários passados

- O campo de data usa a data local atual como valor mínimo, impedindo a seleção de dias anteriores no navegador.
- Caso uma data passada seja informada manualmente, o frontend limpa o campo e exibe a mensagem: `Não é possível selecionar uma data passada.`
- A API repete a validação em `GET /available` e `POST /appointments`, retornando HTTP `400` para impedir requisições diretas com datas anteriores.
- Para a data atual, horários que já passaram não são exibidos como disponíveis e também são rejeitados pela API ao tentar confirmar o agendamento.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/available?date=YYYY-MM-DD` | Lista horários disponíveis para uma data |
| POST | `/appointments` | Cria um agendamento (`{ date, time, paciente }`) |
| GET | `/appointments` | Lista todos os agendamentos |

## Regras de negócio

- Funcionamento: 08:00 às 18:00, consultas de 1h (10 slots por dia)
- Bloqueio automático de feriados nacionais (via API) e finais de semana
- Bloqueio de horários já ocupados
- Bloqueio de datas passadas: não é possível consultar disponibilidade nem criar
  agendamento para uma data anterior à data atual
- Validação feita tanto no frontend (UX) quanto no backend (segurança), com uma
  `UNIQUE KEY` no banco como última camada de proteção contra concorrência

## Decisões técnicas

- **Cache de feriados em memória:** a lista de feriados de um ano não muda, então
  evitamos bater na API externa a cada requisição de disponibilidade.
- **Sem framework de frontend:** para um teste desse escopo, HTML/JS puro reduz
  complexidade de build e deixa o foco na lógica de negócio.
- **Pool de conexões MySQL:** mais eficiente do que abrir uma conexão nova a cada request.
- **Validação de datas passadas nos dois endpoints:** a checagem é feita tanto em
  `GET /available` quanto em `POST /appointments`, já que o backend não pode confiar
  que toda requisição vem do frontend (alguém pode chamar a API diretamente). Na
  comparação, a hora é zerada (`setHours(0,0,0,0)`) para comparar apenas o dia, e não
  o horário exato do momento da requisição.
