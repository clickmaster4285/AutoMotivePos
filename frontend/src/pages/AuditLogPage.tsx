import { useState, useMemo } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { useAuditLogsQuery } from '@/hooks/api/useAuditLogs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ScrollText } from 'lucide-react';

const modules = ['all', 'auth', 'inventory', 'jobs', 'pos', 'refunds', 'customers', 'suppliers', 'purchases'];

// Helper function to format log details for non-developers
function formatUserFriendlyDetails(log: any): string {
  try {
    const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
    const action = log.action || '';
    const module = log.module || '';
    
    // Extract meaningful information based on action type
    if (details.body) {
      const body = details.body;
      
      // Product related actions
      if (action.includes('product') || module === 'inventory') {
        if (body.name) return `Product: ${body.name}`;
        if (body.productName) return `Product: ${body.productName}`;
        if (body.sku) return `Product SKU: ${body.sku}`;
        if (body.centralizedProductId) return `Product ID updated`;
        return `Product ${action.replace('_', ' ')}`;
      }
      
      // Branch related actions
      if (body.branch_name) return `Branch: ${body.branch_name}`;
      if (body.name && module === 'branches') return `Branch: ${body.name}`;
      
      // Customer related actions
      if (module === 'customers') {
        if (body.name) return `Customer: ${body.name}`;
        if (body.email) return `Customer: ${body.email}`;
        if (body.phone) return `Customer: ${body.phone}`;
        return `Customer ${action.replace('_', ' ')}`;
      }
      
      // Supplier related actions
      if (module === 'suppliers') {
        if (body.name) return `Supplier: ${body.name}`;
        if (body.company) return `Supplier: ${body.company}`;
        return `Supplier ${action.replace('_', ' ')}`;
      }
      
      // Purchase order actions
      if (module === 'purchases') {
        if (body.purchaseOrderId) return `PO #${body.purchaseOrderId}`;
        if (body.id) return `Purchase #${body.id}`;
        return `Purchase order ${action.replace('_', ' ')}`;
      }
      
      // POS / Refund actions
      if (module === 'pos' || module === 'refunds') {
        if (body.orderId) return `Order #${body.orderId}`;
        if (body.transactionId) return `Transaction #${body.transactionId}`;
        if (body.amount) return `${action.replace('_', ' ')}: $${body.amount}`;
        return `${action.replace('_', ' ')} processed`;
      }
      
      // Job actions
      if (module === 'jobs') {
        if (body.jobId) return `Job #${body.jobId}`;
        if (body.title) return `Job: ${body.title}`;
        return `Job ${action.replace('_', ' ')}`;
      }
      
      // Generic: Show key identifying fields
      const identifyingFields = ['id', 'name', 'title', 'email', 'username', 'reference'];
      for (const field of identifyingFields) {
        if (body[field]) {
          return `${action.replace('_', ' ')}: ${body[field]}`;
        }
      }
    }
    
    // Fallback: Show HTTP method + path (still cleaner than full JSON)
    if (details.method && details.path) {
      const cleanPath = details.path.replace('/api/', '');
      return `${details.method} ${cleanPath}`;
    }
    
    // Last resort: Show just the action
    return action.replace(/_/g, ' ');
    
  } catch (e) {
    // If parsing fails, show truncated raw details (max 100 chars)
    const detailsStr = typeof log.details === 'string' ? log.details : JSON.stringify(log.details);
    return detailsStr.length > 100 ? detailsStr.substring(0, 100) + '...' : detailsStr;
  }
}

export default function AuditLogPage() {
  const { currentUser, currentBranchId } = useAppState();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';

  const logsQuery = useAuditLogsQuery(
    { module: moduleFilter, search, branchId: isAdmin ? undefined : currentBranchId, limit: 200 },
    { enabled: !!currentUser }
  );
  const auditLogs = logsQuery.data ?? [];

  const filtered = useMemo(() => {
    return auditLogs
      .filter(l => moduleFilter === 'all' || l.module === moduleFilter)
      .filter(l => !search || 
        formatUserFriendlyDetails(l).toLowerCase().includes(search.toLowerCase()) || 
        l.userName.toLowerCase().includes(search.toLowerCase()))
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
        <div className="table-container overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Module</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 text-foreground text-xs whitespace-nowrap">
                    {l.userName}
                   </td>
                  <td className="p-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                      {l.module}
                    </span>
                   </td>
                  <td className="p-3 text-xs font-medium text-foreground capitalize whitespace-nowrap">
                    {l.action.replace(/_/g, ' ')}
                   </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {formatUserFriendlyDetails(l)}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}