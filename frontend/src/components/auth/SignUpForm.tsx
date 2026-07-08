import React, { useState } from 'react';
import { loadUsers, saveUsers, setCurrentUser } from '../../services/storage';

const validateEmail = (value: string) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
const validatePassword = (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(value);

export default function SignUpForm({ onSuccess, onSwitchToSignIn }: { onSuccess: (name: string) => void; onSwitchToSignIn?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [incomeBracket, setIncomeBracket] = useState('');
  const [error, setError] = useState<string | null>(null);

  const countries = [
    'United States','Canada','United Kingdom','Australia','India','Germany','France','Italy','Spain','Netherlands','Brazil','Mexico','Japan','China','South Korea','South Africa','New Zealand','Ireland','Sweden','Norway','Denmark','Finland','Belgium','Switzerland','Austria','Portugal','Greece','Poland','Czech Republic','Hungary','Russia','Turkey','Saudi Arabia','United Arab Emirates','Argentina','Colombia','Chile','Peru','Venezuela','Indonesia','Malaysia','Singapore','Thailand','Philippines','Vietnam','Egypt','Morocco','Kenya','Nigeria'
  ];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters and include uppercase, lowercase, and a number.');
      return;
    }
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const users = loadUsers();
      if (users.find((u: any) => u.username === username)) {
        setError('Username is already taken.');
        return;
      }
      if (users.find((u: any) => u.email === email)) {
        setError('An account with this email already exists.');
        return;
      }

      const newUser = { username, email, password, fullName };
      users.push(newUser);
      saveUsers(users);
      // Do not auto-sign-in after signup. Let user sign in manually.
      onSuccess(fullName || username);
    } catch (e) {
      setError('Failed to create account.');
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Username
        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Choose a password" />
      </label>
      <label>
        Full Name
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" />
      </label>
      <label>
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" />
      </label>
      <label>
        Country
        <select value={country} onChange={(event) => setCountry(event.target.value)}>
          <option value="">Select your country</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Income Bracket (Optional)
        <select value={incomeBracket} onChange={(event) => setIncomeBracket(event.target.value)}>
          <option value="">Select your income bracket</option>
          <option value="low">Low</option>
          <option value="middle">Middle</option>
          <option value="high">High</option>
        </select>
      </label>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <button type="submit">Create Account</button>
      <p className="help-text">Already have an account? <button type="button" onClick={() => onSwitchToSignIn && onSwitchToSignIn()} className="link-button">Sign in</button></p>
    </form>
  );
}
