import { useState } from 'react';

interface PasswordGateProps {
  onUnlock: () => void;
}

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onUnlock();
      } else {
        setError(true);
        setPassword('');
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div className="password-gate">
      <div className="gate-box">
        <h1>cf<span className="accent">TETRIS</span></h1>
        <p>Enter password to play</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="PASSWORD"
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'UNLOCK'}
          </button>
        </form>
        {error && <div className="gate-error">Wrong password</div>}
      </div>
    </div>
  );
}
