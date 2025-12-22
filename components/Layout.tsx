
import React from 'react';
import { Shield, Activity, List, Menu, X, LayoutDashboard, Youtube, Globe, Boxes, Video } from 'lucide-react';
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
    { name: t('inventory'), path: '/inventory', icon: <Boxes size={20} /> },
    { name: t('video_promo'), path: '/video-generator', icon: <Video size={20} /> },
    { name: t('history'), path: '/history', icon: <List size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-background text-gray-100 font-sans">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 z-50 h-screen w-64 bg-surface border-slate-700 transition-all duration-300 ease-in-out flex flex-col shadow-2xl
        ${dir === 'rtl' ? 'border-l right-0' : 'border-r left-0'}
        ${isSidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
        md:translate-x-0 md:static
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-700 flex-shrink-0 bg-slate-900/50">
          <Shield className={`text-primary animate-pulse ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`} size={28} />
          <span className="text-xl font-black tracking-tighter text-white">SecuScan Pro</span>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(item.path) 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                  : 'text-gray-400 hover:bg-slate-700/50 hover:text-white hover:translate-x-1'
              }`}
            >
              <span className={`transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>
                {item.icon}
              </span>
              <span className="font-bold text-sm tracking-tight">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-surface/80 backdrop-blur-sm flex-shrink-0 space-y-4">
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700 shadow-inner">
             <p className="text-[10px] text-gray-500 uppercase font-black mb-3 px-1 flex items-center tracking-widest">
                <Globe size={12} className={`mr-2 ${dir === 'rtl' ? 'ml-2' : ''} text-secondary`}/> 
                {language === 'ar' ? 'اللغة' : 'Localization'}
             </p>
             <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button onClick={() => setLanguage('fr')} className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-black transition-all ${language === 'fr' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>FR</button>
                <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-black transition-all ${language === 'en' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>EN</button>
                <button onClick={() => setLanguage('ar')} className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-black transition-all ${language === 'ar' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>AR</button>
             </div>
          </div>

          <a 
            href="https://www.youtube.com/@issaadhassani" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 border border-transparent hover:shadow-lg hover:shadow-red-500/20 active:scale-95 group"
          >
            <Youtube size={20} className="group-hover:animate-bounce" />
            <span className="font-black text-xs uppercase tracking-widest">{t('tutorials')}</span>
          </a>

          <div className="flex items-center space-x-3 text-xs text-gray-500 px-4 py-2 bg-slate-900/40 rounded-lg border border-slate-800/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
            <span className="font-mono">{t('os_system')}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden h-16 bg-surface border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0 z-10">
          <div className="flex items-center">
            <Shield className="text-primary mr-2" size={24} />
            <span className="font-black tracking-tighter">SecuScan Pro</span>
          </div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white transition-colors bg-slate-800 rounded-lg border border-slate-700 active:scale-90">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
