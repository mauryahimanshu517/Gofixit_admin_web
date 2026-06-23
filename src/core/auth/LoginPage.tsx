import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/store/auth';
import { Button, Input, Card } from '@/core/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('9000000099');
  const [code, setCode] = useState('123456');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(phone, code);
      navigate('/dashboard');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <img
          src="https://www.gofixit.in/_next/image?url=%2Flogo.png&w=640&q=75"
          alt="GoFixit"
          style={{ height: 40, width: 'auto', display: 'block', marginBottom: 16 }}
        />
        <h1 style={{ color: 'var(--primary)', margin: 0, fontSize: 22 }}>Admin Login</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: 13 }}>
          Sign in with your admin mobile number
        </p>
        <form onSubmit={onSubmit} style={{ marginTop: 20 }}>
          <Input
            label="Mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            maxLength={10}
          />
          <Input
            label="OTP (dev: 123456)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
          />
          {err && (
            <div role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>
              {err}
            </div>
          )}
          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
