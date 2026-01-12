# Sistema de Verificação de Email

Sistema completo de autenticação por email com código de 6 dígitos desenvolvido em TypeScript + React.

## Features

- 🔐 Código de verificação de 6 dígitos
- 📧 Envio de email via SMTP (Gmail, Outlook, SendGrid)
- 📊 Rastreamento de abertura de email (pixel tracking)
- ⏰ Expiração automática (10 minutos)
- 🎨 Interface responsiva com 6 inputs individuais
- ⌨️ Navegação inteligente (setas, backspace, auto-avançar)
- 📋 Suporte a colar código completo
- 🍎 Autocomplete automático no Safari (iOS/macOS)
- 💪 100% TypeScript (type-safe)

## Tecnologias

**Backend:**
- Node.js + Express
- TypeScript
- Nodemailer (envio de emails)
- Dotenv (variáveis de ambiente)

**Frontend:**
- React 18
- TypeScript
- Vite (build tool)
- CSS modular

## Instalação

### 1. Clonar e instalar dependências

```bash
cd email-service
yarn install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e configure:

```env
PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

**Para Gmail:**
1. Ativar verificação em 2 etapas
2. Gerar senha de app em: https://myaccount.google.com/apppasswords
3. Usar senha de 16 dígitos no SMTP_PASS

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 4. Build para produção

```bash
npm run build
npm start
```

## Como Funciona

### Fluxo Completo

1. **Usuário digita email**
   - Frontend valida formato
   - POST /api/send-verification-code

2. **Backend gera código**
   - Código aleatório de 6 dígitos
   - Armazena em memória (Map)
   - Define expiração de 10 minutos
   - Envia email HTML formatado

3. **Email enviado**
   - Template responsivo com código destacado
   - Pixel de tracking (1x1) para detectar abertura
   - Instruções de segurança

4. **Usuário recebe e digita código**
   - 6 inputs individuais
   - Navegação automática entre campos
   - Suporte a colar código completo
   - Safari: autocomplete automático

5. **Validação**
   - POST /api/verify-code
   - Compara código fornecido
   - Retorna se email foi aberto
   - Remove código (uso único)

## API Endpoints

### POST /api/send-verification-code
Envia código de verificação.

```json
Request: { "email": "usuario@email.com" }
Response: {
  "success": true,
  "message": "Código enviado com sucesso!",
  "data": { "messageId": "..." }
}
```

### POST /api/verify-code
Valida código.

```json
Request: {
  "email": "usuario@email.com",
  "code": "123456"
}
Response: {
  "success": true,
  "message": "Código verificado com sucesso!",
  "data": {
    "verified": true,
    "emailOpened": true
  }
}
```

### GET /api/track/:emailId
Pixel de rastreamento (interno).

### GET /api/health
Health check do servidor.

## Estrutura de Arquivos

```
email-service/
├── src/
│   ├── server.ts              # Backend Express
│   └── types/
│       └── index.ts           # TypeScript types
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmailForm.tsx
│   │   │   └── VerificationForm.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── dist/                      # Build output
├── .env                       # Configurações (não commitar!)
├── package.json
└── DOCUMENTATION.md           # Documentação técnica completa
```

## Funcionalidades dos 6 Inputs

### Navegação
- ✅ Digite: avança automaticamente
- ✅ Backspace: volta ao anterior se vazio
- ✅ Setas: navega entre campos
- ✅ Colar: distribui código automaticamente

### Autocomplete (Safari)
- Input oculto com `autocomplete="one-time-code"`
- Safari detecta código do email
- Distribui automaticamente nos 6 inputs

**Compatibilidade:**
- ✅ Safari (iOS/macOS): automático
- ⚠️ Outros navegadores: copiar/colar manual

## Rastreamento de Email

Sistema de pixel tracking (1x1 transparente):

```html
<img src="http://localhost:3001/api/track/UNIQUE_ID" />
```

**Quando funciona:**
- ✅ Gmail (desktop)
- ✅ Outlook (desktop)
- ⚠️ Bloqueado se usuário desativa imagens

**Taxa de detecção:** ~40-60%

## Segurança

### Implementado
- ✅ Validação de email (regex)
- ✅ Códigos numéricos (6 dígitos)
- ✅ Expiração automática (10 minutos)
- ✅ Uso único (deletado após verificação)
- ✅ CORS habilitado

### Para Produção
- [ ] Migrar Map para Redis/PostgreSQL
- [ ] Implementar rate limiting
- [ ] Adicionar CAPTCHA
- [ ] HTTPS obrigatório
- [ ] Hash de códigos armazenados

## Scripts Disponíveis

```bash
npm run dev              # Desenvolvimento (backend + frontend)
npm run dev:server       # Apenas backend
npm run dev:client       # Apenas frontend
npm run build            # Build completo
npm run build:server     # Build backend
npm run build:client     # Build frontend
npm start                # Produção
```

## Troubleshooting

### Email não chega
1. Verificar logs no console
2. Conferir credenciais no .env
3. Gmail: usar senha de app (não senha normal)
4. Verificar pasta de spam

### Código inválido
1. Verificar se expirou (10 minutos)
2. Usar email correto
3. Código é case-sensitive

### Build falha
```bash
rm -rf node_modules dist
yarn install
npm run build
```

## Documentação Completa

Para detalhes técnicos, veja [DOCUMENTATION.md](./DOCUMENTATION.md)

## Licença

MIT