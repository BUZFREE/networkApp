import React from 'react';
import { Shield, Activity, List, Menu, X, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Tableau de bord', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Nouveau Scan', path: '/new-scan', icon: <Activity size={20} /> },
    { name: 'Historique', path: '/history', icon: <List size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-background text-gray-100 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-surface border-r border-slate-700 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <Shield className="text-primary mr-3" size={28} />
          <span className="text-xl font-bold tracking-wider text-white">SecuScan Pro</span>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path) 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-gray-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Système Opérationnel</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-surface border-b border-slate-700 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Shield className="text-primary mr-2" size={24} />
            <span className="font-bold">SecuScan Pro</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-white"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;