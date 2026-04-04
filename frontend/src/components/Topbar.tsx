import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppState } from '@/providers/AppStateProvider';
import { useBranchesForUi } from '@/hooks/useBranches';
import { canSelectBranchContext } from '@/lib/permissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LogOut, Building2 } from 'lucide-react';

export function Topbar() {
  const { currentUser, currentBranchId, setBranch, logout } = useAppState();
  const { branches } = useBranchesForUi();

  return (
    <header className="h-12 flex items-center justify-between border-b border-topbar-border bg-topbar px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
        <div className="h-4 w-px bg-border" />
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono hidden sm:block">
          {currentUser?.role?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {currentUser && canSelectBranchContext(currentUser) && (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={currentBranchId} onValueChange={setBranch}>
              <SelectTrigger className="w-[180px] h-8 text-xs border-border bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary font-mono">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="text-xs text-foreground font-medium hidden sm:block">{currentUser.name}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
