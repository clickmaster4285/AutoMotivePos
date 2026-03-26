import { Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { canAccessRoute } from '@/lib/permissions';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  path: string;
}

export function RouteGuard({ children, path }: Props) {
  const currentUser = useStore(s => s.currentUser);

  if (!currentUser) return <Navigate to="/" replace />;

  if (!canAccessRoute(currentUser.role, path)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4 animate-fade-in">
        <div className="h-16 w-16 rounded-lg bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-lg font-heading font-bold text-foreground uppercase tracking-wider">Access Denied</h2>
        <p className="text-sm text-muted-foreground font-mono max-w-sm">
          Your role <span className="text-primary font-bold uppercase">{currentUser.role.replace(/_/g, ' ')}</span> does not have permission to access this module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
