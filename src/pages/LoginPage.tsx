import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cog, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, loadAll } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'Admin' },
    { username: 'sam', password: 'sam123', role: 'Branch Mgr' },
    { username: 'jordan', password: 'jordan123', role: 'Advisor' },
    { username: 'casey', password: 'casey123', role: 'Technician' },
    { username: 'taylor', password: 'taylor123', role: 'Cashier' },
    { username: 'riley', password: 'riley123', role: 'Inventory' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = login(username, password);
    if (user) {
      loadAll();
    } else {
      setError('Invalid username or password');
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    const user = login(u, p);
    if (user) loadAll();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary mb-4">
            <Cog className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight uppercase">AutoCore Pro</h1>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.25em] font-mono">Workshop · POS · Inventory</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Username</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" className="bg-secondary/50" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive font-mono">
                <AlertCircle className="h-3.5 w-3.5" />{error}
              </div>
            )}
            <Button type="submit" className="w-full font-heading uppercase tracking-wider font-bold">Sign In</Button>
          </form>

          <div className="pt-2 border-t border-border">
            <button onClick={() => setShowCredentials(!showCredentials)}
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors w-full text-center uppercase tracking-widest font-mono">
              {showCredentials ? 'Hide' : 'Show'} demo credentials
            </button>
            {showCredentials && (
              <div className="mt-3 space-y-1">
                {demoUsers.map(u => (
                  <button key={u.username} onClick={() => quickLogin(u.username, u.password)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-secondary/80 transition-all text-left text-xs border border-transparent hover:border-border">
                    <span className="font-mono text-foreground text-[11px]">{u.username}<span className="text-muted-foreground"> / {u.password}</span></span>
                    <span className="text-[9px] text-primary uppercase tracking-wider font-mono">{u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[9px] text-muted-foreground/50 mt-6 uppercase tracking-[0.3em] font-mono">
          AutoCore Pro v1.0
        </p>
      </div>
    </div>
  );
}
