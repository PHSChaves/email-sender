import { useState, useRef, FormEvent, KeyboardEvent, ClipboardEvent, ChangeEvent, useEffect } from 'react';
import './VerificationForm.css';

interface VerificationFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function VerificationForm({ email, onSuccess, onBack }: VerificationFormProps) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    distributeCode(pastedData);
  };

  const handleHiddenInput = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    distributeCode(value);
  };

  const distributeCode = (fullCode: string) => {
    const digits = fullCode.split('').slice(0, 6);
    const newCode = [...code];

    digits.forEach((digit, index) => {
      newCode[index] = digit;
    });

    for (let i = digits.length; i < 6; i++) {
      newCode[i] = '';
    }

    setCode(newCode);

    if (digits.length === 6) {
      inputRefs.current[5]?.focus();
    } else if (digits.length > 0) {
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Por favor, preencha todos os 6 dígitos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Código inválido');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar código');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="verification-form" onSubmit={handleSubmit}>
      <div className="form-content">
        <div className="icon-wrapper">
          <span className="icon">🔐</span>
        </div>

        <h2>Digite o código</h2>
        <p className="subtitle">
          Enviamos um código de 6 dígitos para<br />
          <strong>{email}</strong>
        </p>

        <input
          ref={hiddenInputRef}
          type="text"
          autoComplete="one-time-code"
          onChange={handleHiddenInput}
          className="hidden-input"
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className="code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={loading}
              className="code-input"
              autoComplete="off"
            />
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Verificando...' : 'Verificar Código'}
        </button>

        <button type="button" onClick={onBack} className="back-button">
          ← Voltar
        </button>
      </div>
    </form>
  );
}
