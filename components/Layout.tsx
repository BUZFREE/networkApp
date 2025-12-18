
import React from 'react';
import { Shield, Activity, List, Menu, X, LayoutDashboard, Youtube, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const { t, language, setLanguage, dir } = useLanguage();
  const location = useLocation();

  const navItems = [
    { name: t('dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
    { name: t('new_scan'), path: '/new-scan', icon: <Activity size={20} /> },
    { name: t('history'), path: '/history', icon: <List size={20} /> },
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
        fixed top-0 z-50 h-screen w-64 bg-surface border-slate-700 transition-transform duration-300 ease-in-out flex flex-col
        ${dir === 'rtl' ? 'border-l right-0' : 'border-r left-0'}
        ${isSidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
        md:translate-x-0 md:static
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700 flex-shrink-0">
          <Shield className={`text-primary ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} size={28} />
          <span className="text-xl font-bold tracking-wider text-white">SecuScan Pro</span>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
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

        {/* Sidebar Footer & Language Switcher */}
        <div className="p-4 border-t border-slate-700 bg-surface flex-shrink-0 space-y-4">
          
          {/* Language Switcher */}
          <div className="bg-slate-900 rounded-lg p-2 border border-slate-700">
             <p className="text-xs text-gray-500 uppercase font-bold mb-2 px-2 flex items-center">
                <Globe size={12} className={`mr-1 ${dir === 'rtl' ? 'ml-1' : ''}`}/> 
                {language === 'ar' ? 'اللغة' : 'Langue / Language'}
             </p>
             <div className="flex space-x-1">
                <button 
                  onClick={() => setLanguage('fr')}
                  className={`flex-1 py-1 px-1 rounded text-[10px] font-medium transition-all flex items-center justify-center ${
                    language === 'fr' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  🇫🇷 FR
                </button>
                <button 
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-1 px-1 rounded text-[10px] font-medium transition-all flex items-center justify-center ${
                    language === 'en' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  🇬🇧 EN
                </button>
                <button 
                  onClick={() => setLanguage('ar')}
                  className={`flex-1 py-1 px-1 rounded text-[10px] font-medium transition-all flex items-center justify-center ${
                    language === 'ar' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  🇸🇦 AR
                </button>
             </div>
          </div>

          <a 
            href="https://www.youtube.com/@issaadhassani" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20"
          >
            <Youtube size={20} />
            <span className="font-medium text-sm">{t('tutorials')}</span>
          </a>

          <div className="flex items-center space-x-3 text-sm text-gray-500 px-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs">{t('os_system')}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-surface border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
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
