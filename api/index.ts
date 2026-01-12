import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import crypto from 'crypto';
import { VerificationCode, EmailRequest, VerifyCodeRequest, ApiResponse } from '../src/types';

dotenv.config();

const app = express();
const verificationCodes = new Map<string, VerificationCode>();

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateEmailId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function getEmailTemplate(recipientEmail: string, code: string, emailId: string): string {
  const trackingUrl = `https://email-sender-ruby-theta.vercel.app/api/track/${emailId}`;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 30px;
        }
        .code-box {
          background-color: #f8f9fa;
          border: 2px dashed #667eea;
          padding: 20px;
          margin: 30px 0;
          border-radius: 8px;
          text-align: center;
        }
        .code {
          font-size: 48px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .info-text {
          color: #666;
          font-size: 14px;
          margin-top: 10px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
          border-top: 1px solid #e9ecef;
        }
        @media only screen and (max-width: 600px) {
          .container {
            margin: 10px;
          }
          .code {
            font-size: 36px;
            letter-spacing: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Código de Verificação</h1>
          <p>Sistema de Autenticação</p>
        </div>
        <div class="content">
          <h2 style="color: #333; text-align: center;">Seu Código de Verificação</h2>
          <p>Use o código abaixo para completar sua verificação:</p>

          <div class="code-box">
            <div class="code">${code}</div>
            <div class="info-text">Este código expira em 10 minutos</div>
          </div>

          <p><strong>Para sua segurança:</strong></p>
          <ul>
            <li>Não compartilhe este código com ninguém</li>
            <li>Nossa equipe nunca solicitará este código por telefone ou email</li>
            <li>Se você não solicitou este código, ignore este email</li>
          </ul>

          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            <strong>Destinatário:</strong> ${recipientEmail}
          </p>
        </div>
        <div class="footer">
          <p>© 2026 Sistema de Autenticação</p>
          <p>Este é um email automático, por favor não responda</p>
        </div>
      </div>
      <img src="${trackingUrl}" width="1" height="1" style="display:none" alt="" />
    </body>
    </html>
  `;
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Servidor rodando',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/send-verification-code', async (req: Request<{}, {}, EmailRequest>, res: Response<ApiResponse>) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email é obrigatório'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de email inválido'
    });
  }

  const code = generateCode();
  const emailId = generateEmailId();

  verificationCodes.set(email, {
    code,
    timestamp: Date.now(),
    opened: false,
    emailId
  });

  setTimeout(() => {
    verificationCodes.delete(email);
  }, 10 * 60 * 1000);

  const mailOptions = {
    from: `"Sistema de Autenticação" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Seu Código de Verificação',
    html: getEmailTemplate(email, code, emailId)
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Código enviado com sucesso!',
      data: { messageId: info.messageId }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email'
    });
  }
});

app.post('/api/verify-code', (req: Request<{}, {}, VerifyCodeRequest>, res: Response<ApiResponse>) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: 'Email e código são obrigatórios'
    });
  }

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res.status(404).json({
      success: false,
      message: 'Código não encontrado ou expirado'
    });
  }

  if (storedData.code !== code) {
    return res.status(400).json({
      success: false,
      message: 'Código inválido'
    });
  }

  verificationCodes.delete(email);

  res.json({
    success: true,
    message: 'Código verificado com sucesso!',
    data: {
      verified: true,
      emailOpened: storedData.opened
    }
  });
});

app.get('/api/track/:emailId', (req: Request, res: Response) => {
  const { emailId } = req.params;

  for (const [email, data] of verificationCodes.entries()) {
    if (data.emailId === emailId && !data.opened) {
      data.opened = true;
      break;
    }
  }

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });
  res.end(pixel);
});

export default app;
