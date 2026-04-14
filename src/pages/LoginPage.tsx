import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import dolLogo from '@/assets/dol-logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'inspector' | 'admin'>('inspector');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const user = login(email, password, role);
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div className="bg-primary px-6 py-8 text-center">
          <img src={dolLogo} alt="Department of Employment and Labour" className="mx-auto mb-4 h-20 w-auto rounded bg-card p-1" />
          <h1 className="text-2xl font-bold text-primary-foreground">Labour Compliance System</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">Republic of South Africa</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 p-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="name@domain.co.za" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="role">Login As</Label>
            <select id="role" value={role} onChange={e => setRole(e.target.value as 'inspector' | 'admin')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="inspector">Labour Inspector</option>
              <option value="admin">Admin (Government)</option>
            </select>
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" /> Secured by SA Government Digital Services
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
