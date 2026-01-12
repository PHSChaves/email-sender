# Sistema de Verificação de Email - Documentação Técnica

## Visão Geral

Sistema completo de autenticação por email com código de verificação de 6 dígitos, desenvolvido em TypeScript com Express (backend) e React (frontend).

## Arquitetura

```
email-service/
├── src/                    # Backend TypeScript
│   ├── server.ts          # Servidor Express principal
│   └── types/             # Definições de tipos
│       └── index.ts
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── App.tsx        # Componente principal
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Estilos globais
│   └── index.html
├── dist/                  # Build output (gerado)
├── .env                   # Variáveis de ambiente
└── package.json
```

## Backend (src/server.ts)

### Estrutura de Dados

**VerificationCode** - Armazenamento temporário de códigos
```typescript
{
  code: string;        // Código de 6 dígitos
  timestamp: number;   // Timestamp de criação
  opened: boolean;     // Se o email foi aberto
  emailId: string;     // ID único para tracking
}
```

### Endpoints da API

#### POST /api/send-verification-code
Gera e envia código de verificação por email.

**Request Body:**
```typescript
{ email: string }
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: { messageId: string }
}
```

**Processo:**
1. Valida formato do email (regex)
2. Gera código aleatório de 6 dígitos
3. Cria emailId único (crypto.randomBytes)
4. Armazena em Map (verificationCodes)
5. Envia email com template HTML
6. Define timeout de 10 minutos para expiração

**Código relacionado (src/server.ts):**
- Linhas 50-53: Função generateCode()
- Linhas 55-57: Função generateEmailId()
- Linhas 144-212: Handler do endpoint

#### POST /api/verify-code
Valida código fornecido pelo usuário.

**Request Body:**
```typescript
{
  email: string;
  code: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    verified: boolean;
    emailOpened: boolean;
  }
}
```

**Processo:**
1. Verifica se email e código foram fornecidos
2. Busca código armazenado no Map
3. Compara código fornecido com armazenado
4. Remove código do Map (uso único)
5. Retorna status de verificação e abertura

**Código relacionado (src/server.ts):**
- Linhas 214-252: Handler do endpoint

#### GET /api/track/:emailId
Pixel tracking para detectar abertura de email.

**Processo:**
1. Recebe emailId dos parâmetros da URL
2. Itera sobre verificationCodes Map
3. Marca campo 'opened' como true
4. Retorna pixel GIF transparente 1x1

**Código relacionado (src/server.ts):**
- Linhas 254-270: Handler do endpoint
- Linha 142 do template: Tag <img> do pixel

**Limitações:**
- Clientes de email podem bloquear imagens
- Taxa de detecção: ~40-60%

#### GET /api/health
Health check do servidor.

### Template de Email

**Função:** getEmailTemplate()
**Código relacionado:** src/server.ts linhas 59-143

**Estrutura:**
1. HTML responsivo com inline CSS
2. Código de 6 dígitos em destaque
3. Aviso de expiração (10 minutos)
4. Dicas de segurança
5. Pixel de tracking no rodapé

**Elementos importantes:**
- Linha 61: Variável trackingUrl com emailId
- Linhas 91-94: Box do código (estilizado)
- Linha 142: Pixel de tracking (1x1, display:none)

### Configuração SMTP

**Variáveis .env necessárias:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app
```

**Código relacionado:** src/server.ts linhas 18-26

**Transporters suportados:**
- Gmail (porta 587 ou 465)
- Outlook (porta 587)
- SendGrid (porta 587)
- Mailtrap (porta 2525 - apenas testes)

### Segurança

**Expiração de códigos:**
- Timeout: 10 minutos (600.000ms)
- Implementado via setTimeout
- Código relacionado: src/server.ts linhas 181-184

**Validações:**
- Email: regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Código: apenas dígitos, exatamente 6 caracteres
- Uso único: código deletado após verificação

**Armazenamento:**
- Map em memória (desenvolvimento)
- Para produção: migrar para Redis/PostgreSQL

## Frontend (client/src/)

### Fluxo de Telas

**App.tsx** - Controle de estado principal
```typescript
useState<'email' | 'verification'>('email')
```

**Estados:**
1. 'email': Formulário de entrada de email
2. 'verification': Formulário de 6 inputs

### EmailForm.tsx

**Funcionalidades:**
- Input de email com validação HTML5
- Chamada à API /api/send-verification-code
- Estados de loading e erro
- Transição para tela de verificação

**Código relacionado:**
- Linhas 16-35: handleSubmit com fetch
- Linha 48: Input type="email" com validação nativa

### VerificationForm.tsx

**Sistema de 6 Inputs**

**Estados:**
```typescript
const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
```

**Input Oculto para Autocomplete:**
```typescript
<input
  ref={hiddenInputRef}
  type="text"
  autocomplete="one-time-code"
  onChange={handleHiddenInput}
  className="hidden-input"
/>
```

**Código relacionado:** Linhas 113-120

**Como funciona:**
- Safari/iOS detecta código no email
- Preenche input oculto automaticamente
- Evento onChange distribui para os 6 inputs visíveis
- Função distributeCode (linhas 56-77)

**Navegação entre Inputs:**

1. **Avançar automaticamente** (linhas 29-34):
   - Ao digitar, foca próximo input
   - Só aceita dígitos (regex /^\d*$/)

2. **Backspace** (linhas 36-40):
   - Se input vazio, volta para anterior
   - Permite correção fácil

3. **Setas do teclado** (linhas 42-48):
   - ArrowLeft: input anterior
   - ArrowRight: próximo input

4. **Colar código completo** (linhas 50-54):
   - Detecta Ctrl+V em qualquer input
   - Distribui 6 dígitos automaticamente
   - Remove caracteres não numéricos

**Validação e Envio:**
- Verifica se 6 dígitos estão preenchidos
- Concatena array em string (code.join(''))
- Envia para /api/verify-code
- Em caso de erro, limpa inputs

**Código relacionado:** Linhas 79-111

### Estilos

**Responsividade:**
- Desktop: inputs 56x64px, font-size 32px
- Mobile: inputs 44x52px, font-size 24px

**Animações:**
- Focus: scale(1.05) + shadow azul
- Hover em botões: translateY(-2px)
- Transições: 0.3s ease

**Código relacionado:**
- VerificationForm.css linhas 13-35
- EmailForm.css linhas 29-40

## Instalação e Uso

### 1. Instalar dependências
```bash
yarn install
# ou
npm install
```

### 2. Configurar .env
Copiar .env.example para .env e preencher:
```
PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app-16-digitos
```

### 3. Desenvolvimento
```bash
npm run dev
```
Inicia:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

### 4. Build para produção
```bash
npm run build
```
Gera:
- dist/server.js (backend compilado)
- dist/client/ (frontend otimizado)

### 5. Rodar produção
```bash
npm start
```

## Compatibilidade do autocomplete="one-time-code"

### Para EMAIL:
- ✅ Safari (iOS 12+, macOS)
- ❌ Chrome, Edge, Firefox

### Para SMS:
- ✅ Safari (iOS)
- ✅ Chrome (Android) + Web OTP API

**Estratégia implementada:**
- Input oculto captura autocomplete
- 6 inputs visíveis para UX
- Fallback: copiar/colar manual funciona em todos

## Testes Manuais

### Testar envio de código:
1. Acessar http://localhost:5173
2. Digitar email válido
3. Verificar recebimento do email
4. Observar logs do console no terminal

### Testar verificação:
1. Copiar código de 6 dígitos do email
2. Colar em qualquer input (distribui automaticamente)
3. Ou digitar manualmente (avança automático)
4. Clicar "Verificar Código"

### Testar tracking:
1. Abrir email recebido
2. Observar logs no terminal: "📧 Email aberto"
3. Verificar após validação: emailOpened: true

### Testar expiração:
1. Enviar código
2. Aguardar 10 minutos
3. Tentar validar
4. Deve retornar: "Código não encontrado ou expirado"

## Migração para Produção

### Banco de Dados:
Substituir Map por Redis:
```typescript
import Redis from 'ioredis';
const redis = new Redis();

await redis.setex(
  `verification:${email}`,
  600,
  JSON.stringify(verificationData)
);
```

### Variáveis de Ambiente:
- DATABASE_URL
- REDIS_URL
- FRONTEND_URL (para CORS)

### SMTP:
Usar serviço profissional:
- SendGrid (100 emails/dia grátis)
- AWS SES
- Mailgun

### Rate Limiting:
Adicionar express-rate-limit:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

app.use('/api/send-verification-code', limiter);
```

## Troubleshooting

### Email não chega:
1. Verificar logs do console (erro SMTP)
2. Testar credenciais SMTP manualmente
3. Verificar spam/lixeira
4. Para Gmail: confirmar senha de app (não senha normal)

### Código inválido:
1. Verificar se passou de 10 minutos
2. Conferir se está usando email correto
3. Checar logs: código armazenado vs fornecido

### Build falha:
1. Verificar TypeScript errors: `npx tsc --noEmit`
2. Limpar node_modules e reinstalar
3. Verificar versões das dependências

### Autocomplete não funciona:
- Normal em navegadores não-Safari
- Testar copiar/colar manual
- Verificar se input oculto está presente (DevTools)

## Melhorias Futuras

1. **Backend:**
   - [ ] Migrar para banco de dados
   - [ ] Adicionar rate limiting
   - [ ] Implementar logs estruturados (Winston)
   - [ ] Adicionar testes (Jest)

2. **Frontend:**
   - [ ] Adicionar loading states
   - [ ] Melhorar acessibilidade (ARIA labels)
   - [ ] Adicionar testes (Vitest, React Testing Library)
   - [ ] Internacionalização (i18n)

3. **Segurança:**
   - [ ] Implementar CAPTCHA
   - [ ] Hash de códigos no armazenamento
   - [ ] HTTPS obrigatório
   - [ ] CSP headers

4. **Funcionalidades:**
   - [ ] Opção de reenviar código
   - [ ] SMS como alternativa
   - [ ] Customização de templates
   - [ ] Dashboard de analytics
