import { useState, useMemo } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ScrollText } from 'lucide-react';

const modules = ['all', 'auth', 'inventory', 'jobs', 'pos', 'refunds', 'customers', 'suppliers', 'purchases'];

export default function AuditLogPage() {
  const { auditLogs } = useAppState();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const filtered = useMemo(() => {
    return auditLogs
      .filter(l => moduleFilter === 'all' || l.module === moduleFilter)
      .filter(l => !search || l.details.toLowerCase().includes(search.toLowerCase()) || l.userName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, search, moduleFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">Complete activity trail across the system</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {modules.map(m => <SelectItem key={m} value={m}>{m === 'all' ? 'All Modules' : m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-40" />No audit logs
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
              <th className="text-left p-3 font-medium text-muted-foreground">User</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Module</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Details</th>
            </tr></thead>
            <tbody>
              {filtered.slice(0, 200).map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-3 text-foreground text-xs">{l.userName}</td>
                  <td className="p-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{l.module}</span></td>
                  <td className="p-3 text-xs font-medium text-foreground capitalize">{l.action.replace('_', ' ')}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[300px] truncate">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
