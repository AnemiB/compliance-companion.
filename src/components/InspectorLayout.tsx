import { useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { getAuth, logout } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Building2, FileText, History, BarChart3, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import dolLogo from '@/assets/dol-logo.png';

const navItems = [
  { to: '/inspector/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inspector/businesses', label: 'Businesses', icon: Building2 },
  { to: '/inspector/documents', label: 'Documents', icon: FileText },
  { to: '/inspector/history', label: 'History', icon: History },
  { to: '/inspector/reports', label: 'Reports', icon: BarChart3 },
  { to: '/inspector/profile', label: 'Profile', icon: User },
];

const InspectorLayout = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!auth || auth.role !== 'inspector') {
      navigate('/');
    }
  }, []);

  if (!auth) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-primary transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-primary-foreground/10 px-4 py-4">
          <img src={dolLogo} alt="DoL Logo" className="h-10 rounded bg-card p-0.5" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-primary-foreground">Labour Compliance</h1>
            <p className="text-[10px] text-primary-foreground/60">Republic of South Africa</p>
          </div>
          <button className="text-primary-foreground md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-primary-foreground/10 px-3 py-4">
          <div className="mb-3 px-3">
            <p className="truncate text-sm font-medium text-primary-foreground">{auth.name}</p>
            <p className="truncate text-xs text-primary-foreground/60">{auth.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-sm font-bold">Labour Compliance System</h1>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default InspectorLayout;
