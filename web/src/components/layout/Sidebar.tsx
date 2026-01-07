import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CreditCard,
  BarChart3,
  LogOut,
  ShieldCheck,
  UserCircle,
  ScanBarcode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/logo.png';

const adminNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Quản lý Users' },
  { to: '/classes', icon: Dumbbell, label: 'Lớp học' },
  { to: '/memberships', icon: CreditCard, label: 'Gói hội viên' },
  { to: '/reports', icon: BarChart3, label: 'Báo cáo' },
  { to: '/check-in', icon: ScanBarcode, label: 'Check-in' },
];

const staffNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/check-in', icon: ScanBarcode, label: 'Check-in' },
];

export function Sidebar() {
  const { profile, isAdmin, isStaff, signOut } = useAuthContext();
  const location = useLocation();

  const navItems = isAdmin ? adminNavItems : staffNavItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <img src={logo} alt="Gymbros" className="h-10 w-10 rounded-xl object-cover" />
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">Gymbros</h1>
          <p className="text-xs text-muted-foreground">Admin Console</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Role Badge */}
      <div className="px-4 py-3">
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
          isAdmin ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
        )}>
          <ShieldCheck className="h-4 w-4" />
          {isAdmin ? 'Administrator' : 'Staff'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary gym-shadow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-3">
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              <UserCircle className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.full_name || 'Admin User'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.role || 'admin'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
