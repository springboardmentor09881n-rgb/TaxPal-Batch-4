import React, { useState } from 'react';
import { loadUsers, setCurrentUser } from '../../services/storage';
import PasswordResetForm from './PasswordResetForm';

const validateEmail = (value: string) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
const validatePassword = (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(value);

export default function SignInForm({ onSuccess, onSwitchToSignUp, notice }: { onSuccess: () => void; onSwitchToSignUp?: () => void; notice?: string | null }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter username/email and password.');
      return;
    }
    if (identifier.includes('@') && !validateEmail(identifier)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters and include uppercase, lowercase, and a number.');
      return;
    }

    try {
      const users = loadUsers();
      const found = users.find((u: any) => u.username === identifier || u.email === identifier);
      if (!found) {
        setError('No account found for that username or email.');
        return;
      }
      if (found.password !== password) {
        setError('Incorrect password.');
        return;
      }
      setCurrentUser(found);
      onSuccess();
    } catch (e) {
      setError('Authentication failed.');
    }
  };

  if (forgotMode) {
    return <PasswordResetForm onResetSuccess={onSuccess} onCancel={() => setForgotMode(false)} />;
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {notice && <div className="success-text">{notice}</div>}
      <label>
        Username or Email
        <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Enter your username or email" />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
      </label>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <button type="submit">Sign in</button>
      <p className="help-text">
        <button type="button" className="link-button" onClick={() => setForgotMode(true)}>Forgot password?</button>
      </p>
      <p className="help-text">Don't have an account? <button type="button" onClick={() => onSwitchToSignUp && onSwitchToSignUp()} className="link-button">Create account</button></p>
    </form>
  );
}
