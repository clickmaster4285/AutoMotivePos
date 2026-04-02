import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, Wrench, ShoppingCart, Users, Truck, BarChart3, Cog,
  RotateCcw, ArrowRightLeft, ScrollText, Store, UserCog, Warehouse,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { useAppState } from '@/providers/AppStateProvider';
import { hasAnyPermission } from '@/lib/permissions';
import { PID } from '@/lib/permissionIds';

const allNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, requiredPermissions: [PID.dashboard.main.read] },
  { title: 'Branches', url: '/branches', icon: Store, requiredPermissions: [PID.branch.management.read] },
  { title: 'User management', url: '/user-management', icon: UserCog, requiredPermissions: [PID.employee.database.read, PID.settings.users.read] },

  { title: 'Categories', url: '/categories', icon: Package, requiredPermissions: [PID.inventory.product.read, PID.inventory.stock.read] },

  { title: 'Warehouses', url: '/warehouses', icon: Warehouse, requiredPermissions: [PID.warehouse.management.read] },
   

  { title: 'Inventory', url: '/inventory', icon: Package, requiredPermissions: [PID.inventory.product.read, PID.inventory.stock.read] },


  { title: 'Transfers', url: '/transfers', icon: ArrowRightLeft, requiredPermissions: [PID.inventory.stock.read] },

  { title: 'Job Cards', url: '/jobs', icon: Wrench, requiredPermissions: [PID.employee.shift.read, PID.employee.performance.read] },
  { title: 'Point of Sale', url: '/pos', icon: ShoppingCart, requiredPermissions: [PID.pos.transaction.read] },
  { title: 'Refunds', url: '/refunds', icon: RotateCcw, requiredPermissions: [PID.pos.returns.read] },
  { title: 'Customers', url: '/customers', icon: Users, requiredPermissions: [PID.customer.database.read] },
  { title: 'Suppliers', url: '/suppliers', icon: Truck, requiredPermissions: [PID.inventory.vendor.read] },
  { title: 'Reports', url: '/reports', icon: BarChart3, requiredPermissions: [PID.reporting.sales.read] },
  { title: 'Audit Log', url: '/audit', icon: ScrollText, requiredPermissions: [PID.settings.security.read, PID.settings.users.read] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { currentUser } = useAppState();

  const navItems = useMemo(
    () =>
      allNavItems.filter((item) => hasAnyPermission(currentUser, item.requiredPermissions)),
    [currentUser]
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary">
            <Cog className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-heading font-bold text-sidebar-accent-foreground tracking-tight uppercase">AutoCore</span>
              <span className="text-[9px] text-sidebar-foreground uppercase tracking-[0.2em] font-mono">Workshop · POS</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/40 px-3 mb-1 font-mono">
            {!collapsed ? 'Navigation' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const active = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-2 border-transparent'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                        {!collapsed && <span className="uppercase text-xs tracking-wide">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && currentUser && (
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center text-xs font-bold text-primary font-mono">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-sidebar-accent-foreground truncate">{currentUser.name}</span>
              <span className="text-[9px] text-sidebar-foreground uppercase tracking-widest font-mono">{currentUser.role.replace(/_/g, ' ')}</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
