import React, { useState, useEffect, useRef } from 'react';
import { getPasswordResetCode, setPasswordResetCode, clearPasswordResetCode, loadUsers, saveUsers, setCurrentUser } from '../../services/storage';

const validateEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function PasswordResetForm({ onResetSuccess, onCancel }: { onResetSuccess: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<'request' | 'verify' | 'newpassword'>('request');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    let timer: number | undefined;
    if (step === 'verify') {
      timer = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [step]);

  const sendOtp = (targetEmail: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setPasswordResetCode(targetEmail, otp);
    setGeneratedCode(otp);
    setDigits(['', '', '', '', '', '']);
    setSecondsLeft(300);
  };

  const handleRequest = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email || !validateEmail(email)) {
      setError('Enter a valid email.');
      return;
    }
    const users = loadUsers();
    const found = users.find((u: any) => u.email === email);
    if (!found) {
      setError('No account found with that email.');
      return;
    }
    sendOtp(email);
    setStep('verify');
  };

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const otp = digits.join('');
    if (otp.length < 6) {
      setError('Enter the full 6-digit OTP.');
      return;
    }
    const stored = getPasswordResetCode(email);
    if (!stored || stored.code !== otp) {
      setError('Invalid OTP. Try again.');
      return;
    }
    if (Date.now() > stored.expiresAt) {
      setError('OTP expired. Please resend.');
      return;
    }
    setStep('newpassword');
  };

  const handleUpdatePassword = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const users = loadUsers();
    const index = users.findIndex((u: any) => u.email === email);
    if (index === -1) {
      setError('Account not found.');
      return;
    }
    users[index].password = newPassword;
    saveUsers(users);
    clearPasswordResetCode(email);
    setCurrentUser(users[index]);
    onResetSuccess();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]*$/.test(value)) return;
    const nextDigits = [...digits];
    nextDigits[index] = value.slice(-1);
    setDigits(nextDigits);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    sendOtp(email);
    setError(null);
  };

  const stored = getPasswordResetCode(email);
  const isExpired = stored ? Date.now() > stored.expiresAt : false;

  return (
    <div className="auth-form">
      {step === 'request' && (
        <form onSubmit={handleRequest}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button type="submit">Send OTP</button>
          <p className="help-text"><button type="button" className="link-button" onClick={onCancel}>Back to sign in</button></p>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerify}>
          <p className="secondary-text">OTP sent to <strong>{email}</strong>.</p>
          <div className="otp-group">
            {digits.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handleOtpChange(event.target.value, index)}
                onKeyDown={(event) => handleOtpKeyDown(event, index)}
                ref={(el) => (inputsRef.current[index] = el)}
                className="otp-input"
              />
            ))}
          </div>
          <div className="otp-footer">
            <span>{isExpired ? 'OTP expired.' : `Expires in ${formatTime(secondsLeft)}`}</span>
            <button type="button" className="link-button" onClick={handleResend}>Resend OTP</button>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" disabled={isExpired}>Verify OTP</button>
          <p className="help-text"><button type="button" className="link-button" onClick={() => setStep('request')}>Change email</button></p>
        </form>
      )}

      {step === 'newpassword' && (
        <form onSubmit={handleUpdatePassword}>
          <label>
            New Password
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Enter a new password" />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button type="submit">Update Password</button>
          <p className="help-text"><button type="button" className="link-button" onClick={() => setStep('verify')}>Back to OTP</button></p>
        </form>
      )}
    </div>
  );
}
