import { useState } from "react";
import { useAdminLoginMutation } from "@/hooks/api/useAdminLoginMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cog, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const loginMutation = useAdminLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  const submitting = loginMutation.isPending;

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
              <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin email"
                autoComplete="email"
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="bg-secondary/50"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive font-mono">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full font-heading uppercase tracking-wider font-bold" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="text-[10px] text-muted-foreground text-center font-mono leading-relaxed">
            Sign in with your backend user account. Menus and actions follow the permissions assigned in User Management. Default admin credentials are set in backend{" "}
            <span className="text-foreground/80">.env</span> (<span className="text-foreground/80">ADMIN_EMAIL</span> / <span className="text-foreground/80">ADMIN_PASSWORD</span>).
          </p>
        </div>

        <p className="text-center text-[9px] text-muted-foreground/50 mt-6 uppercase tracking-[0.3em] font-mono">AutoCore Pro v1.0</p>
      </div>
    </div>
  );
}
