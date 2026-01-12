import { useState } from 'react';
import EmailForm from './components/EmailForm';
import VerificationForm from './components/VerificationForm';
import './App.css';

export default function App() {
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setStep('verification');
  };

  const handleVerificationSuccess = () => {
    alert('Verificação concluída com sucesso!');
    setStep('email');
    setEmail('');
  };

  const handleBack = () => {
    setStep('email');
    setEmail('');
  };

  return (
    <div className="app">
      <div className="card">
        <div className="card-header">
          <h1>Verificação de Email</h1>
          <p>Sistema de autenticação em duas etapas</p>
        </div>

        {step === 'email' ? (
          <EmailForm onSubmit={handleEmailSubmit} />
        ) : (
          <VerificationForm
            email={email}
            onSuccess={handleVerificationSuccess}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
