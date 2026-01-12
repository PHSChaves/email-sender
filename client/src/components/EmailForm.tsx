import { useState, FormEvent } from 'react';
import './EmailForm.css';

interface EmailFormProps {
  onSubmit: (email: string) => void;
}

export default function EmailForm({ onSubmit }: EmailFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar código');
      }

      onSubmit(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="email-form" onSubmit={handleSubmit}>
      <div className="form-content">
        <div className="icon-wrapper">
          <span className="icon">📧</span>
        </div>

        <h2>Digite seu email</h2>
        <p className="subtitle">
          Enviaremos um código de verificação de 6 dígitos
        </p>

        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            disabled={loading}
            className="email-input"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Enviando...' : 'Enviar Código'}
        </button>
      </div>
    </form>
  );
}
