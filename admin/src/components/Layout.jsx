import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, LayoutGrid, LogOut, ShieldCheck, MessageSquare, Megaphone } from 'lucide-react';

export default function Layout({ setAuth }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    setAuth(false);
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'User Management', icon: Users },
    { path: '/fields', label: 'Field Ecosystem', icon: LayoutGrid },
    { path: '/queries', label: 'Community Queries', icon: MessageSquare },
    { path: '/announcements', label: 'Announcements', icon: Megaphone }
  ];

  return (
    <div className="min-h-screen bg-admin-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-admin-card border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-admin-accent/20 rounded-xl flex items-center justify-center border border-admin-accent/30">
            <ShieldCheck className="text-admin-accent w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">AgriBrain</h1>
            <p className="text-xs text-admin-accent">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-admin-accent/10 text-admin-accent border border-admin-accent/20 shadow-inner' : 'text-admin-muted hover:text-white hover:bg-white/5'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-admin-dark to-admin-dark">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
