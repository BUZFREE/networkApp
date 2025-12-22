
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import ScannerForm from './components/ScannerForm';
import ResultsView from './components/ResultsView';
import InventoryManager from './components/InventoryManager';
import VideoGenerator from './components/VideoGenerator';
import { ScanRequest, ScanResult } from './types';
import { performSimulatedScan } from './services/geminiService';
import { Clock, Loader2, FileText, ChevronRight, AlertCircle, Search, Trash2, Activity, AlertTriangle } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const ReportPage = ({ scans }: { scans: ScanResult[] }) => {
  const { id } = useParams<{ id: string }>();
  const scan = scans.find(s => s.id === id);

  if (!scan) return <div className="text-center py-20 text-gray-500"><AlertCircle size={48} className="mx-auto mb-4" /> Rapport introuvable.</div>;
  if (scan.status === 'running') return <div className="text-center py-20 text-gray-400"><Loader2 className="animate-spin mx-auto mb-4" /> Analyse en cours...</div>;
  if (scan.status === 'failed') return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20 mb-6">
            <AlertTriangle size={48} className="text-danger" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Analyse Échouée</h2>
          <p className="text-gray-400 max-w-md mb-8">Le moteur d'analyse n'a pas pu compléter le scan de la cible. Cela peut être dû à une erreur de connexion ou d'indisponibilité du service IA.</p>
          <a href="/#/new-scan" className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">Réessayer un scan</a>
      </div>
  );

  return <ResultsView result={scan} />;
};

const HistoryPage = ({ scans, onDelete }: { scans: ScanResult[], onDelete: (id: string) => void }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [filter, setFilter] = useState('');

  const filtered = scans.filter(s => s.targetUrl.includes(filter) || (s.projectName && s.projectName.includes(filter)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">{t('history_title')}</h1>
        <div className="relative w-full md:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher une cible..." 
            className="w-full bg-surface border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-gray-400 font-bold uppercase text-xs">
            <tr>
              <th className="p-4">{t('table_target')}</th>
              <th className="p-4">{t('table_date')}</th>
              <th className="p-4">{t('table_score')}</th>
              <th className="p-4">{t('table_status')}</th>
              <th className="p-4 text-right">{t('table_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-600 italic">Aucun résultat trouvé.</td></tr>
            ) : filtered.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(scan => (
              <tr key={scan.id} className="hover:bg-slate-800/50 transition-all group">
                <td className="p-4">
                  <div className="font-bold text-white group-hover:text-primary transition-colors">{scan.projectName || 'Sans titre'}</div>
                  <div className="text-xs text-gray-500">{scan.targetUrl}</div>
                </td>
                <td className="p-4 text-gray-400">{new Date(scan.timestamp).toLocaleString()}</td>
                <td className="p-4">
                  <span className={`font-mono font-bold ${scan.overallScore > 75 ? 'text-primary' : scan.overallScore > 40 ? 'text-warning' : 'text-danger'}`}>
                    {scan.overallScore}/100
                  </span>
                </td>
                <td className="p-4">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border transition-all ${scan.status === 'completed' ? 'bg-primary/10 text-primary border-primary/20' : scan.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                    {scan.status}
                   </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => navigate(`/report/${scan.id}`)} 
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-primary/10" 
                    title="Ouvrir le rapport"
                  >
                    <FileText size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(scan.id)} 
                    className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-danger/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DashboardContent: React.FC<{ scans: ScanResult[] }> = ({ scans }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const completedScans = scans.filter(s => s.status === 'completed');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold text-white">{t('dashboard_title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 hover:border-primary/50 transition-all duration-300 shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Activity size={120} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">{t('start_analysis_title')}</h2>
            <p className="text-gray-400 mb-8 max-w-sm">{t('start_analysis_desc')}</p>
            <button 
              onClick={() => navigate('/new-scan')} 
              className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group/btn"
            >
               <span>{t('btn_new_scan')}</span>
               <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
         </div>

         <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center"><Clock className="mr-3 text-secondary animate-pulse" size={20} /> {t('recent_activity')}</h2>
            <div className="space-y-4">
               {completedScans.length === 0 ? (
                   <div className="text-center py-10 text-gray-600 italic">{t('no_history')}</div>
               ) : (
                   completedScans.slice(0, 3).map(scan => (
                     <div 
                        key={scan.id} 
                        onClick={() => navigate(`/report/${scan.id}`)} 
                        className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-primary/30 hover:bg-slate-800 cursor-pointer flex justify-between items-center group transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg transition-colors ${scan.overallScore > 75 ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-danger/10 text-danger group-hover:bg-danger group-hover:text-white'}`}>
                                <FileText size={20} />
                            </div>
                            <div>
                               <p className="font-bold text-white group-hover:text-primary transition-colors">{scan.projectName || scan.targetUrl}</p>
                               <p className="text-[10px] text-gray-500 font-mono">{new Date(scan.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className={`text-sm font-black font-mono transition-all group-hover:scale-110 ${scan.overallScore > 75 ? 'text-primary' : 'text-danger'}`}>{scan.overallScore}%</div>
                     </div>
                   ))
               )}
               {completedScans.length > 3 && (
                   <button 
                    onClick={() => navigate('/history')} 
                    className="w-full py-2 text-xs font-bold text-gray-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all uppercase tracking-widest"
                   >
                       Voir tout l'historique
                   </button>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { tool: 'Nmap', status: 'OK', color: 'bg-primary' },
            { tool: 'NetBox', status: 'SYNC', color: 'bg-secondary' },
            { tool: 'IDS/IPS', status: 'OK', color: 'bg-danger' },
            { tool: 'DPI Engine', status: 'OK', color: 'bg-warning' }
         ].map((item) => (
            <div key={item.tool} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center shadow-inner relative group cursor-default transition-all hover:border-slate-600 hover:-translate-y-1">
               <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${item.color} animate-pulse`}></div>
               <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">{item.tool}</span>
               <span className="text-lg font-black text-white group-hover:text-primary transition-colors">{item.status}</span>
            </div>
         ))}
      </div>
    </div>
  );
};

const App = () => {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const savedScans = localStorage.getItem('secuscan_history');
    if (savedScans) try { setScans(JSON.parse(savedScans)); } catch (e) { console.error(e); }
  }, []);

  const handleStartScan = async (request: ScanRequest) => {
    setIsScanning(true);
    const tempId = Date.now().toString();
    const tempScan: ScanResult = { 
        id: tempId, 
        projectName: request.projectName, 
        targetUrl: request.target, 
        targetIp: "Recherche...", 
        timestamp: new Date().toISOString(), 
        status: 'running', 
        overallScore: 0, 
        toolsUsed: request.tools, 
        openPorts: [], 
        connectedAssets: [], 
        vulnerabilities: [], 
        aiAnalysis: "Initialisation des agents...", 
        topology: { nodes: [], links: [] }, 
        globalPing: [] 
    };
    
    const updatedScansRunning = [tempScan, ...scans];
    setScans(updatedScansRunning);
    localStorage.setItem('secuscan_history', JSON.stringify(updatedScansRunning));

    try {
      const partialResult = await performSimulatedScan(request);
      const fullResult: ScanResult = { ...tempScan, ...partialResult, id: tempId, status: 'completed' };
      const finalScans = [fullResult, ...scans];
      setScans(finalScans);
      localStorage.setItem('secuscan_history', JSON.stringify(finalScans));
      
      window.location.hash = `/report/${tempId}`;
    } catch (error) {
      const failedScan: ScanResult = { ...tempScan, status: 'failed', aiAnalysis: "Échec de l'analyse." };
      const finalScans = [failedScan, ...scans];
      setScans(finalScans);
      localStorage.setItem('secuscan_history', JSON.stringify(finalScans));
    } finally { setIsScanning(false); }
  };

  const handleDeleteScan = (id: string) => {
      const filtered = scans.filter(s => s.id !== id);
      setScans(filtered);
      localStorage.setItem('secuscan_history', JSON.stringify(filtered));
  };

  return (
    <LanguageProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardContent scans={scans} />} />
            <Route path="/new-scan" element={<div className="max-w-3xl mx-auto"><h1 className="text-3xl font-black text-white mb-8">Nouveau Scan Sécurité</h1><ScannerForm onStartScan={handleStartScan} isScanning={isScanning} /></div>} />
            <Route path="/inventory" element={<InventoryManager />} />
            <Route path="/video-generator" element={<VideoGenerator />} />
            <Route path="/report/:id" element={<ReportPage scans={scans} />} />
            <Route path="/history" element={<HistoryPage scans={scans} onDelete={handleDeleteScan} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </LanguageProvider>
  );
};

export default App;
