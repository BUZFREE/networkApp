
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScannerForm from './components/ScannerForm';
import ResultsView from './components/ResultsView';
import { ScanRequest, ScanResult, Severity } from './types';
import { performSimulatedScan } from './services/geminiService';
import { Activity, Clock, ChevronDown, ChevronUp, AlertTriangle, Server, ShieldCheck, Loader2, RefreshCw, Wrench, ArrowRight } from 'lucide-react';

// Wrapper component to use router hooks
const DashboardContent: React.FC<{ 
  scans: ScanResult[], 
  onStartScan: (req: ScanRequest) => void, 
  isScanning: boolean 
}> = ({ scans, onStartScan, isScanning }) => {
  const navigate = useNavigate();

  const handleScanStart = async (request: ScanRequest) => {
    onStartScan(request);
  };

  const completedScans = scans.filter(s => s.status === 'completed');
  const runningScans = scans.filter(s => s.status === 'running' || s.status === 'pending');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold text-white">Tableau de Bord</h1>
         <div className="flex space-x-3">
             {runningScans.length > 0 && (
                 <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full border border-blue-500/30 text-sm flex items-center animate-pulse">
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {runningScans.length} scan(s) en cours
                 </div>
             )}
             <div className="bg-surface px-4 py-2 rounded-full border border-slate-700 text-sm text-gray-400">
                {completedScans.length} scans effectués
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Start New Scan CTA - Maps to Form */}
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 hover:border-primary/50 transition-all shadow-lg group">
            <h2 className="text-xl font-bold text-white mb-2">Démarrer une analyse</h2>
            <p className="text-gray-400 mb-6">Lancez un nouveau test de sécurité sur votre infrastructure.</p>
            <button 
               onClick={() => navigate('/new-scan')}
               className="w-full bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-white py-3 rounded-lg font-semibold transition-all"
            >
               Nouveau Scan
            </button>
         </div>

         {/* Recent Activity Mini-View */}
         <div className="bg-surface p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
               <Clock className="mr-2" size={20} /> Activité Récente
            </h2>
            <div className="space-y-3">
               {completedScans.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun historique disponible.</p>
               ) : (
                  completedScans.slice(0, 4).map(scan => (
                     <div 
                        key={scan.id} 
                        onClick={() => navigate(`/report/${scan.id}`)}
                        className="p-3 bg-slate-900 rounded border border-slate-800 hover:border-slate-600 cursor-pointer flex justify-between items-center"
                     >
                        <div>
                           <p className="font-medium text-white">{scan.targetUrl}</p>
                           <p className="text-xs text-gray-500">{new Date(scan.timestamp).toLocaleString()}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                           scan.overallScore > 80 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                           {scan.overallScore}
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {['Nmap', 'Nikto', 'OpenVAS', 'OWASP ZAP'].map((tool) => (
            <div key={tool} className="bg-surface p-4 rounded-xl border border-slate-700 flex flex-col justify-center items-center">
               <span className="text-gray-400 text-xs uppercase tracking-widest mb-1">Module</span>
               <span className="text-lg font-bold text-white">{tool}</span>
               <span className="text-xs text-green-500 mt-1 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Actif
               </span>
            </div>
         ))}
      </div>
    </div>
  );
};

const NewScanPage: React.FC<{ onStartScan: (r: ScanRequest) => void, isScanning: boolean }> = ({ onStartScan, isScanning }) => {
   return (
      <div className="max-w-3xl mx-auto">
         <h1 className="text-3xl font-bold text-white mb-8">Nouveau Scan de Sécurité</h1>
         <ScannerForm onStartScan={onStartScan} isScanning={isScanning} />
      </div>
   );
};

const ReportPageWrapper = ({ scans }: { scans: ScanResult[] }) => {
   const navigate = useNavigate();
   // Simple ID retrieval from path for this demo structure
   const [id, setId] = useState<string | null>(null);

   useEffect(() => {
      const hash = window.location.hash;
      const parts = hash.split('/');
      if (parts.length > 0) setId(parts[parts.length - 1]);
   }, [window.location.hash]);

   const scan = scans.find(s => window.location.hash.includes(s.id));

   if (!scan) {
      return (
         <div className="text-center py-20">
            <h2 className="text-2xl text-gray-400">Rapport non trouvé</h2>
            <button onClick={() => navigate('/')} className="mt-4 text-primary">Retour au tableau de bord</button>
         </div>
      );
   }

   return (
      <div>
         <button 
            onClick={() => navigate('/history')} 
            className="mb-6 text-gray-400 hover:text-white text-sm flex items-center"
         >
            ← Retour à l'historique
         </button>
         <div className="flex items-center justify-between mb-8">
            <div>
               <h1 className="text-3xl font-bold text-white mb-2">Rapport de Sécurité</h1>
               <p className="text-gray-400 font-mono">{scan.targetUrl} • {new Date(scan.timestamp).toLocaleString()}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${
               scan.status === 'running' ? 'border-blue-500 text-blue-500 animate-pulse' :
               scan.overallScore > 75 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
            }`}>
               {scan.status === 'running' && <Loader2 size={16} className="animate-spin" />}
               <span>État: {scan.status === 'completed' ? 'Terminé' : scan.status === 'failed' ? 'Échoué' : 'En cours'}</span>
            </div>
         </div>
         {scan.status === 'completed' ? (
             <ResultsView result={scan} />
         ) : (
             <div className="bg-surface rounded-xl border border-slate-700 p-12 text-center">
                 <Loader2 size={48} className="mx-auto text-primary animate-spin mb-4" />
                 <h2 className="text-xl font-bold text-white">Analyse en cours...</h2>
                 <p className="text-gray-400 mt-2">Veuillez patienter pendant que nous scannons la cible.</p>
             </div>
         )}
      </div>
   );
};

const HistoryPage: React.FC<{ scans: ScanResult[], onRefresh: () => void }> = ({ scans, onRefresh }) => {
   const navigate = useNavigate();
   const [expandedRow, setExpandedRow] = useState<string | null>(null);

   useEffect(() => {
     const hasActiveScans = scans.some(s => s.status === 'running' || s.status === 'pending');
     if (hasActiveScans) {
       const intervalId = setInterval(onRefresh, 30000);
       return () => clearInterval(intervalId);
     }
   }, [scans, onRefresh]);

   const toggleRow = (id: string) => {
      setExpandedRow(expandedRow === id ? null : id);
   };

   const getSeverityWeight = (severity: string) => {
      switch (severity) {
         case Severity.CRITICAL: return 5;
         case Severity.HIGH: return 4;
         case Severity.MEDIUM: return 3;
         case Severity.LOW: return 2;
         case Severity.INFO: return 1;
         default: return 0;
      }
   };

   return (
      <div className="animate-fade-in">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Historique des Scans</h1>
            <button 
                onClick={onRefresh}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-gray-400 hover:text-white transition-colors"
                title="Rafraîchir"
            >
                <RefreshCw size={20} />
            </button>
         </div>
         
         <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                     <th className="p-4 w-12 text-center text-gray-500"></th>
                     <th className="p-4 text-gray-400 font-medium text-sm w-1/6">Cible</th>
                     <th className="p-4 text-gray-400 font-medium text-sm w-1/6">Date</th>
                     <th className="p-4 text-gray-400 font-medium text-sm w-1/12">État</th>
                     <th className="p-4 text-gray-400 font-medium text-sm w-1/4">Analyse IA</th>
                     <th className="p-4 text-gray-400 font-medium text-sm w-24 text-center">Score</th>
                     <th className="p-4 text-gray-400 font-medium text-sm w-24 text-center">Failles</th>
                     <th className="p-4 text-gray-400 font-medium text-sm text-right">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {scans.length === 0 ? (
                     <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">Aucun scan enregistré.</td>
                     </tr>
                  ) : (
                     scans.slice().reverse().map((scan) => (
                        <React.Fragment key={scan.id}>
                           <tr 
                              onClick={() => toggleRow(scan.id)}
                              className={`border-b border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer ${expandedRow === scan.id ? 'bg-slate-800/50' : ''}`}
                           >
                              <td className="p-4 text-center">
                                 <button
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         toggleRow(scan.id);
                                     }}
                                     className="p-1.5 hover:bg-slate-700 rounded-full transition-colors text-gray-400 hover:text-white"
                                     aria-label={expandedRow === scan.id ? "Réduire" : "Étendre"}
                                 >
                                     {expandedRow === scan.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                 </button>
                              </td>
                              <td className="p-4 font-medium text-white">{scan.targetUrl}</td>
                              <td className="p-4 text-gray-400 text-sm">{new Date(scan.timestamp).toLocaleDateString()}</td>
                              <td className="p-4">
                                  {scan.status === 'completed' ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                          Terminé
                                      </span>
                                  ) : scan.status === 'failed' ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                          Échoué
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                          <Loader2 size={10} className="mr-1 animate-spin" /> En cours
                                      </span>
                                  )}
                              </td>
                              <td className="p-4">
                                 <div className="max-w-xs text-sm text-gray-300 line-clamp-2" title={scan.aiAnalysis || "Analyse en attente..."}>
                                    {scan.aiAnalysis || <span className="text-gray-600 italic">En attente...</span>}
                                 </div>
                              </td>
                              <td className="p-4 text-center">
                                 {scan.status === 'completed' && (
                                     <span className={`font-bold ${
                                        scan.overallScore > 80 ? 'text-green-500' : scan.overallScore > 50 ? 'text-warning' : 'text-danger'
                                     }`}>
                                        {scan.overallScore}
                                     </span>
                                 )}
                              </td>
                              <td className="p-4 text-center text-white font-mono">
                                  {scan.status === 'completed' ? scan.vulnerabilities.length : '-'}
                              </td>
                              <td className="p-4 text-right">
                                 <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/report/${scan.id}`);
                                    }}
                                    className="text-primary hover:text-emerald-400 text-sm font-medium"
                                 >
                                    Rapport
                                 </button>
                              </td>
                           </tr>
                           
                           {/* Expanded Row */}
                           {expandedRow === scan.id && scan.status === 'completed' && (
                              <tr className="bg-slate-800/30 animate-in slide-in-from-top-2 duration-200">
                                 <td colSpan={8} className="p-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-700 border-b border-slate-700">
                                       
                                       {/* Column 1: Tools Used */}
                                       <div className="p-6 space-y-3">
                                          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center mb-4">
                                             <Wrench size={14} className="mr-2" /> Outils Utilisés
                                          </h4>
                                          {scan.toolsUsed && scan.toolsUsed.length > 0 ? (
                                              <div className="flex flex-wrap gap-2">
                                                  {scan.toolsUsed.map((tool, idx) => (
                                                      <span key={idx} className="px-2 py-1 text-xs font-mono bg-slate-900 border border-slate-600 rounded text-gray-300">
                                                          {tool}
                                                      </span>
                                                  ))}
                                              </div>
                                          ) : (
                                              <p className="text-gray-500 text-sm italic">Aucune information sur les outils.</p>
                                          )}
                                       </div>

                                       {/* Column 2: Open Ports Summary */}
                                       <div className="p-6 space-y-3">
                                          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                              <Server size={14} className="mr-2" /> Services & Ports
                                          </h4>
                                          {scan.openPorts.length > 0 ? (
                                             <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                {scan.openPorts.slice(0, 5).map((port, idx) => (
                                                   <div key={idx} className="flex justify-between items-center text-sm">
                                                      <div className="flex items-center space-x-2">
                                                         <span className="font-mono text-secondary w-12">{port.port}</span>
                                                         <span className="text-gray-300 truncate max-w-[120px]">{port.service || 'Inconnu'}</span>
                                                      </div>
                                                      <div className="flex items-center">
                                                         <div className={`w-2 h-2 rounded-full mr-2 ${
                                                            port.state === 'open' ? 'bg-green-500' : 
                                                            port.state === 'filtered' ? 'bg-orange-500' : 'bg-gray-500'
                                                         }`}></div>
                                                         <span className="text-xs text-gray-500 capitalize">{port.state}</span>
                                                      </div>
                                                   </div>
                                                ))}
                                                {scan.openPorts.length > 5 && (
                                                   <p className="text-xs text-gray-500 pt-1">+{scan.openPorts.length - 5} autres ports...</p>
                                                )}
                                             </div>
                                          ) : (
                                             <p className="text-gray-500 text-sm italic">Aucun port ouvert détecté.</p>
                                          )}
                                       </div>

                                       {/* Column 3: Top Critical Vulnerabilities */}
                                       <div className="p-6">
                                          <div className="flex justify-between items-center mb-4">
                                              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                                                  <AlertTriangle size={14} className="mr-2" /> Vulnérabilités Critiques
                                              </h4>
                                              <button 
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      navigate(`/report/${scan.id}`);
                                                  }}
                                                  className="text-xs text-primary hover:underline flex items-center"
                                              >
                                                  Voir tout <ArrowRight size={10} className="ml-1" />
                                              </button>
                                          </div>
                                          {scan.vulnerabilities.length > 0 ? (
                                             <div className="space-y-3">
                                                {scan.vulnerabilities
                                                   .sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity))
                                                   .slice(0, 3)
                                                   .map((vuln) => (
                                                   <div key={vuln.id} className="bg-slate-900 border border-slate-700 rounded p-2">
                                                      <div className="flex justify-between items-start mb-1">
                                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                            vuln.severity === Severity.CRITICAL ? 'bg-red-500/20 text-red-500' :
                                                            vuln.severity === Severity.HIGH ? 'bg-orange-500/20 text-orange-500' :
                                                            'bg-blue-500/20 text-blue-500'
                                                         }`}>
                                                            {vuln.severity}
                                                         </span>
                                                      </div>
                                                      <p className="text-gray-300 text-xs font-medium truncate">{vuln.name}</p>
                                                   </div>
                                                ))}
                                             </div>
                                          ) : (
                                             <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                 <ShieldCheck size={24} className="mb-2 opacity-50" />
                                                 <p className="text-sm">Aucune vulnérabilité.</p>
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 </td>
                              </tr>
                           )}
                        </React.Fragment>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
};

// Main App Component
const App = () => {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Load scans from localStorage on boot
  useEffect(() => {
    const savedScans = localStorage.getItem('secuscan_history');
    if (savedScans) {
      try {
        setScans(JSON.parse(savedScans));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveScans = (newScans: ScanResult[]) => {
    setScans(newScans);
    localStorage.setItem('secuscan_history', JSON.stringify(newScans));
  };

  const refreshScans = () => {
     const savedScans = localStorage.getItem('secuscan_history');
     if (savedScans) {
         setScans(JSON.parse(savedScans));
     }
  };

  const handleStartScan = async (request: ScanRequest) => {
    setIsScanning(true);
    
    // Create a temporary "running" scan entry
    const tempId = Date.now().toString();
    const tempScan: ScanResult = {
        id: tempId,
        targetUrl: request.target,
        targetIp: "...",
        timestamp: new Date().toISOString(),
        status: 'running',
        overallScore: 0,
        toolsUsed: request.tools,
        openPorts: [],
        connectedAssets: [],
        vulnerabilities: [],
        aiAnalysis: "Analyse en cours...",
        // Init empty complex objects
        topology: { nodes: [], links: [] },
        globalPing: [],
        deviceFingerprint: undefined,
        serverHealth: undefined,
        networkStats: undefined,
        securityHeaders: [],
        loadTestResults: [],
        performanceReport: undefined
    };

    // Add to state immediately
    const updatedScansRunning = [...scans, tempScan];
    saveScans(updatedScansRunning);

    try {
      const partialResult = await performSimulatedScan(request);
      
      const fullResult: ScanResult = {
        ...tempScan,
        ...partialResult, // This overwrites the temp data with AI data
        id: tempId, // Keep same ID
        targetUrl: request.target, // Ensure target is kept
        timestamp: new Date().toISOString(),
        status: 'completed',
        toolsUsed: request.tools // Ensure tools list is preserved
      };
      
      const finalScans = updatedScansRunning.map(s => s.id === tempId ? fullResult : s);
      saveScans(finalScans);

    } catch (error) {
      console.error("Scan failed", error);
      const failedScan: ScanResult = {
          ...tempScan,
          status: 'failed',
          aiAnalysis: "L'analyse a échoué. Veuillez vérifier la cible ou réessayer."
      };
      const finalScans = updatedScansRunning.map(s => s.id === tempId ? failedScan : s);
      saveScans(finalScans);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardContent scans={scans} onStartScan={handleStartScan} isScanning={isScanning} />} />
          <Route path="/new-scan" element={<NewScanPage onStartScan={handleStartScan} isScanning={isScanning} />} />
          <Route path="/report/:id" element={<ReportPageWrapper scans={scans} />} />
          <Route path="/history" element={<HistoryPage scans={scans} onRefresh={refreshScans} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
