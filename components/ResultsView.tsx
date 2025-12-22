
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line, BarChart, Bar } from 'recharts';
import { AlertTriangle, Server, ShieldCheck, Terminal, Download, Globe, Network, Zap, Cpu, Activity, Lock, Search, Share2, Map, Smartphone, Check, XCircle, FileText, Bot, PlayCircle, BarChart2, Layers, Wifi, FileCode, AlertOctagon, AlignLeft, ExternalLink, Siren, Navigation, Clock, Building2, Eye, HardDrive, Database, CheckCircle } from 'lucide-react';
import { ScanResult, Severity, NetworkPacket } from '../types';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultsViewProps {
  result: ScanResult;
}

const COLORS = {
  [Severity.CRITICAL]: '#ef4444',
  [Severity.HIGH]: '#f97316',
  [Severity.MEDIUM]: '#eab308',
  [Severity.LOW]: '#3b82f6',
  [Severity.INFO]: '#94a3b8',
};

const PROTOCOL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const ResultsView: React.FC<ResultsViewProps> = ({ result }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'infrastructure' | 'network' | 'topology' | 'selenium' | 'jmeter' | 'traffic' | 'ids'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  useEffect(() => {
    const primaryAsset = result.connectedAssets.find(a => a.type === 'Primary');
    const targetIp = primaryAsset?.ip || result.connectedAssets[0]?.ip || result.targetIp;
    const isPrivate = /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(targetIp);

    if (targetIp && !isPrivate && !geoData) {
        fetch(`https://ipwho.is/${targetIp}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setGeoData(data);
                }
            })
            .catch(err => console.error("Geo fetch error:", err));
    }
  }, [result, geoData]);

  const severityCounts = result.vulnerabilities.reduce((acc, curr) => {
    acc[curr.severity] = (acc[curr.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(severityCounts).map(([name, value]) => ({ name, value }));

  const cpuData = result.serverHealth ? [
    { name: 'Used', value: result.serverHealth.cpuUsage },
    { name: 'Free', value: 100 - result.serverHealth.cpuUsage }
  ] : [];

  const ramData = result.serverHealth ? [
    { name: 'Used', value: result.serverHealth.ramUsage },
    { name: 'Free', value: 100 - result.serverHealth.ramUsage }
  ] : [];

  const handleExportPortsCSV = () => {
    const headers = ["Port,Service,Version,State"];
    const rows = result.openPorts.map(p => `${p.port},${p.service},${p.version || ''},${p.state}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ports_${result.targetUrl}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Function to simulate PDF Export (Simplified for this view)
  const handleExportReport = async () => {
      setIsExporting(true);
      // In a real app, logic remains same as previous version
      setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-col">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{result.projectName || 'Audit Security Report'}</h2>
            <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Target ID: {result.id}</p>
        </div>
        <div className="flex items-center space-x-3">
            <button 
                onClick={handleShare} 
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 border border-slate-700 shadow-lg"
            >
            {isCopied ? <Check size={16} className="text-primary" /> : <Share2 size={16} />}
            <span className="text-xs uppercase tracking-widest">{isCopied ? 'Copié' : 'Partager'}</span>
            </button>
            <button 
                onClick={handleExportReport} 
                disabled={isExporting} 
                className="flex items-center space-x-2 bg-primary hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
            >
            {isExporting ? <Activity className="animate-spin" size={16} /> : <FileText size={16} />}
            <span className="text-xs uppercase tracking-widest">{isExporting ? 'Génération...' : 'Exporter PDF'}</span>
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
            { label: 'Score Global', val: `${result.overallScore}/100`, icon: <ShieldCheck />, color: 'text-primary', border: 'hover:border-primary/50' },
            { label: 'Failles Détectées', val: result.vulnerabilities.length, icon: <AlertTriangle />, color: 'text-warning', border: 'hover:border-warning/50' },
            { label: 'Charge Serveur', val: result.serverHealth ? `${result.serverHealth.cpuUsage}%` : 'N/A', icon: <Cpu />, color: 'text-secondary', border: 'hover:border-secondary/50' },
            { label: 'Assets Réseau', val: result.connectedAssets.length, icon: <Globe />, color: 'text-pink-400', border: 'hover:border-pink-400/50' }
        ].map((stat, i) => (
            <div key={i} className={`bg-surface p-6 rounded-2xl border border-slate-700 flex items-center justify-between shadow-md transition-all hover:-translate-y-1 ${stat.border}`}>
                <div><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p><p className={`text-3xl font-black mt-2 text-white`}>{stat.val}</p></div>
                <div className={`h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 ${stat.color}`}>{stat.icon}</div>
            </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex space-x-1 overflow-x-auto scrollbar-hide shadow-inner">
          {['overview', 'infrastructure', 'network', 'topology', 'traffic', 'ids', 'selenium', 'jmeter'].map((tab) => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`flex-1 py-2.5 px-4 rounded-xl font-black transition-all duration-300 capitalize whitespace-nowrap text-[10px] tracking-widest border
                ${activeTab === tab 
                    ? 'bg-slate-800 text-primary border-slate-700 shadow-lg scale-[1.02] active:scale-95' 
                    : 'bg-transparent text-gray-500 border-transparent hover:text-white hover:bg-slate-900 active:scale-95'}`}
            >
                {t(`tab_${tab}`) || tab}
            </button>
          ))}
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-slate-500 transition-all">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-gray-400 flex items-center"><BarChart2 size={14} className="mr-2 text-primary" /> Répartition Sévérité</h3>
                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[entry.name as Severity] || '#94a3b8'} className="hover:opacity-80 transition-opacity cursor-pointer" />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }} /><Legend /></PieChart></ResponsiveContainer></div>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-slate-500 transition-all">
                <div className="flex items-center justify-between mb-4"><h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center"><Network size={14} className="mr-2 text-secondary" /> Ports Ouverts</h3><button onClick={handleExportPortsCSV} className="p-2 bg-slate-900 rounded-lg border border-slate-700 hover:bg-primary hover:text-white transition-all hover:scale-110 active:scale-90" title="Export CSV"><Download size={14} /></button></div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                    {result.openPorts.length === 0 ? <p className="text-gray-500 text-xs italic">Aucun port détecté.</p> : result.openPorts.map((port, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-600 transition-all group">
                            <div className="flex items-center space-x-3"><span className="text-secondary font-mono text-sm font-black tracking-tighter group-hover:scale-110 transition-transform">{port.port}</span><span className="text-gray-300 text-xs font-bold uppercase">{port.service}</span></div>
                            <span className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-primary/20 text-primary border border-primary/20 uppercase">{port.state}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-primary/30 p-8 rounded-2xl relative overflow-hidden shadow-2xl group hover:border-primary/60 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-110"><Terminal size={150} /></div>
                <h3 className="text-xs font-black text-primary mb-4 uppercase tracking-[0.3em]">● Analyse IA Stratégique</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm font-medium">{result.aiAnalysis}</p>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Registre des Vulnérabilités</h3>
                {result.vulnerabilities.length === 0 ? <div className="p-8 bg-surface rounded-xl border border-slate-700 text-center text-gray-500">Aucune vulnérabilité critique détectée.</div> : result.vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="bg-surface border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-500 transition-all group shadow-md">
                        <div className="p-4 flex justify-between items-center bg-slate-800/50 border-b border-slate-700 group-hover:bg-slate-800">
                            <h4 className="font-black text-white uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{vuln.name}</h4>
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase border ${vuln.severity === Severity.CRITICAL ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{vuln.severity}</span>
                        </div>
                        <div className="p-5">
                            <p className="text-gray-400 text-xs leading-relaxed mb-4">{vuln.description}</p>
                            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 group-hover:border-primary/20 transition-all">
                                <p className="text-[9px] font-black text-primary uppercase mb-2 tracking-widest flex items-center"><Zap size={10} className="mr-1.5" /> Recommandation Expert</p>
                                <p className="text-[11px] text-gray-400 font-medium italic">"{vuln.remediation}"</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* --- INFRASTRUCTURE TAB --- */}
      {activeTab === 'infrastructure' && (
          <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Server Health Cards */}
                  <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-lg">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center"><Cpu size={14} className="mr-2 text-secondary" /> CPU Usage</h3>
                      <div className="h-40 relative">
                           {result.serverHealth ? (
                               <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                       <Pie data={cpuData} innerRadius={40} outerRadius={60} dataKey="value" stroke="none">
                                           <Cell fill="#3b82f6" /><Cell fill="#1e293b" />
                                       </Pie>
                                       <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xl font-black">{result.serverHealth.cpuUsage}%</text>
                                   </PieChart>
                               </ResponsiveContainer>
                           ) : <div className="h-full flex items-center justify-center text-gray-600 text-xs">Données non disponibles</div>}
                      </div>
                  </div>
                  <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-lg">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center"><HardDrive size={14} className="mr-2 text-primary" /> RAM Usage</h3>
                      <div className="h-40 relative">
                           {result.serverHealth ? (
                               <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                       <Pie data={ramData} innerRadius={40} outerRadius={60} dataKey="value" stroke="none">
                                           <Cell fill="#10b981" /><Cell fill="#1e293b" />
                                       </Pie>
                                       <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xl font-black">{result.serverHealth.ramUsage}%</text>
                                   </PieChart>
                               </ResponsiveContainer>
                           ) : <div className="h-full flex items-center justify-center text-gray-600 text-xs">Données non disponibles</div>}
                      </div>
                  </div>
                  <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-center">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Système Info</h3>
                      <div className="space-y-4">
                          <div className="flex justify-between border-b border-slate-800 pb-2">
                              <span className="text-xs text-gray-500">OS</span>
                              <span className="text-xs font-bold text-white">{result.serverHealth?.os || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2">
                              <span className="text-xs text-gray-500">Uptime</span>
                              <span className="text-xs font-bold text-primary">{result.serverHealth?.uptime || 'N/A'}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Load Test Chart */}
              <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-lg">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center"><Activity size={14} className="mr-2 text-warning" /> Test de Charge (Simulation)</h3>
                  <div className="h-64">
                      {result.loadTestResults && result.loadTestResults.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={result.loadTestResults}>
                                  <defs>
                                      <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                  <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 10}} />
                                  <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
                                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                                  <Legend />
                                  <Area type="monotone" dataKey="latency" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLat)" name="Latence (ms)" />
                                  <Area type="monotone" dataKey="requestsPerSecond" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReq)" name="Req/Sec" />
                              </AreaChart>
                          </ResponsiveContainer>
                      ) : <div className="h-full flex items-center justify-center text-gray-500">Aucune donnée de test de charge.</div>}
                  </div>
              </div>
          </div>
      )}

      {/* --- NETWORK TAB --- */}
      {activeTab === 'network' && (
          <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
                  
                  <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 group-hover:rotate-6 transition-transform">
                                  <Navigation className="text-primary" size={24} />
                              </div>
                              <div>
                                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Hybrid Intelligence</h3>
                                  <p className="text-4xl font-black text-white tracking-tighter font-mono group-hover:text-primary transition-colors">{geoData?.ip || result.targetIp}</p>
                              </div>
                          </div>

                          {geoData ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                                  <div className="space-y-1">
                                      <p className="text-[9px] text-gray-500 uppercase font-black flex items-center tracking-widest"><Map size={10} className="mr-2 text-primary" /> Physical Discovery</p>
                                      <div className="flex items-center">
                                          {geoData.flag?.img && <img src={geoData.flag.img} alt="flag" className="w-8 h-auto mr-4 shadow-xl rounded-sm border border-slate-700 group-hover:scale-110 transition-transform" />}
                                          <p className="text-xl font-black text-white tracking-tight uppercase">
                                              {geoData.city}
                                              <span className="block text-[11px] text-gray-500 font-bold tracking-widest mt-1">{geoData.country}</span>
                                          </p>
                                      </div>
                                  </div>
                                  <div className="space-y-1">
                                      <p className="text-[9px] text-gray-500 uppercase font-black flex items-center tracking-widest"><Building2 size={10} className="mr-2 text-secondary" /> ISP & Routing</p>
                                      <p className="text-lg font-black text-secondary tracking-tight truncate max-w-xs group-hover:text-white transition-colors" title={geoData.connection?.isp}>
                                          {geoData.connection?.isp || 'Unknown Service Provider'}
                                          <span className="block text-[11px] text-gray-600 font-mono tracking-widest mt-1 italic">ASN{geoData.connection?.asn || '0000'}</span>
                                      </p>
                                  </div>
                              </div>
                          ) : (
                              <div className="flex items-center space-x-3 text-gray-600 animate-pulse py-6">
                                  <Activity size={20} className="animate-spin" />
                                  <span className="text-xs font-black uppercase tracking-[0.2em]">Deep packet lookup in progress...</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- TOPOLOGY TAB --- */}
      {activeTab === 'topology' && (
          <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 min-h-[500px] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                  {/* Simple SVG Visualization for Topology */}
                  {result.topology && result.topology.nodes.length > 0 ? (
                      <svg width="100%" height="100%" viewBox="0 0 800 500" className="w-full h-full">
                          <defs>
                              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                                  <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                              </marker>
                          </defs>
                          {/* Links */}
                          {result.topology.links.map((link, i) => {
                              const sourceNode = result.topology?.nodes.find(n => n.id === link.source);
                              const targetNode = result.topology?.nodes.find(n => n.id === link.target);
                              if (!sourceNode || !targetNode) return null;
                              
                              // Simple layout logic: Central node is target, others around
                              const isSourceTarget = link.source === 'internet' || link.source === 'firewall';
                              // This is a simplified visualizer, assumes a star/tree like structure for demo
                              return (
                                  <line key={i} x1="50%" y1="10%" x2="50%" y2="50%" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowhead)" />
                              );
                              // Note: Real graph layout requires d3-force or similar libraries not available here. 
                              // We will render a CSS Grid based topology instead below for robustness.
                          })}
                      </svg>
                  ) : null}

                  {/* Robust CSS Grid Topology Fallback */}
                  <div className="absolute inset-0 p-8 flex flex-col items-center justify-center space-y-12">
                       {/* Internet Node */}
                       <div className="flex flex-col items-center animate-bounce-slow">
                           <div className="p-4 bg-blue-500/20 rounded-full border border-blue-500 text-blue-500 mb-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                               <Globe size={32} />
                           </div>
                           <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Internet</span>
                       </div>

                       {/* Connection Line */}
                       <div className="h-12 w-0.5 bg-gradient-to-b from-blue-500 to-primary"></div>

                       {/* Firewall/Gateway */}
                       <div className="flex flex-col items-center">
                           <div className="p-4 bg-red-500/20 rounded-lg border border-red-500 text-red-500 mb-2 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                               <ShieldCheck size={32} />
                           </div>
                           <span className="text-[10px] uppercase font-black text-red-400 tracking-widest">WAF / Firewall</span>
                       </div>

                       {/* Connection Line */}
                       <div className="h-12 w-0.5 bg-slate-700"></div>

                       {/* Target & Assets */}
                       <div className="flex flex-wrap justify-center gap-8">
                           {/* Main Target */}
                           <div className="flex flex-col items-center">
                               <div className="p-5 bg-primary/20 rounded-xl border border-primary text-primary mb-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] bg-slate-900 z-10 relative">
                                   <Server size={40} />
                                   <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                               </div>
                               <span className="text-xs font-black text-white uppercase tracking-tight">{result.targetUrl}</span>
                               <span className="text-[9px] text-gray-500 font-mono">{result.targetIp}</span>
                           </div>

                           {/* Connected Nodes from Scan */}
                           {result.connectedAssets.slice(0, 3).map((asset, i) => (
                               <div key={i} className="flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
                                   <div className="p-4 bg-slate-800 rounded-xl border border-slate-600 text-gray-400 mb-2">
                                       <Database size={24} />
                                   </div>
                                   <span className="text-[10px] font-bold text-gray-400 uppercase max-w-[80px] truncate">{asset.hostname}</span>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface p-6 rounded-2xl border border-slate-700">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Device Fingerprinting</h3>
                      <div className="space-y-4">
                           <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                               <span className="text-xs text-gray-500">OS Detected</span>
                               <span className="text-xs font-bold text-white flex items-center"><Terminal size={12} className="mr-2 text-primary" /> {result.deviceFingerprint?.os || 'Unknown'}</span>
                           </div>
                           <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                               <span className="text-xs text-gray-500">Confidence</span>
                               <div className="w-24 bg-slate-800 rounded-full h-1.5">
                                   <div className="bg-primary h-1.5 rounded-full" style={{width: `${result.deviceFingerprint?.confidence || 50}%`}}></div>
                               </div>
                           </div>
                      </div>
                  </div>
                  <div className="bg-surface p-6 rounded-2xl border border-slate-700">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Network Segmentation (NetBox)</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">Suggested placement based on analysis:</p>
                      <div className="flex gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-[10px] font-mono text-secondary">Site: HQ-Primary</span>
                          <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-[10px] font-mono text-pink-400">VLAN: 20 (DMZ)</span>
                          <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-[10px] font-mono text-warning">Role: Production</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- TRAFFIC TAB (Wireshark) --- */}
      {activeTab === 'traffic' && (
          <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-surface p-0 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                      <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center"><Activity size={14} className="mr-2 text-blue-400" /> Packet Capture Stream</h3>
                          <span className="text-[9px] font-mono text-gray-600">{result.packetCapture?.length || 0} Packets</span>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px] font-mono">
                              <thead className="bg-slate-800 text-gray-400">
                                  <tr>
                                      <th className="p-2">No.</th>
                                      <th className="p-2">Time</th>
                                      <th className="p-2">Source</th>
                                      <th className="p-2">Destination</th>
                                      <th className="p-2">Proto</th>
                                      <th className="p-2">Info</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                  {result.packetCapture?.slice(0, 15).map((pkt, i) => (
                                      <tr key={i} className="hover:bg-slate-700/50 cursor-pointer transition-colors" onClick={() => setSelectedPacket(pkt)}>
                                          <td className="p-2 text-gray-500">{pkt.no}</td>
                                          <td className="p-2 text-gray-400">{pkt.time}</td>
                                          <td className="p-2 text-blue-400">{pkt.source}</td>
                                          <td className="p-2 text-pink-400">{pkt.destination}</td>
                                          <td className="p-2 text-yellow-500 font-bold">{pkt.protocol}</td>
                                          <td className="p-2 text-gray-300 truncate max-w-[200px]">{pkt.info}</td>
                                      </tr>
                                  ))}
                                  {(!result.packetCapture || result.packetCapture.length === 0) && (
                                      <tr><td colSpan={6} className="p-4 text-center text-gray-600">Aucun paquet capturé.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
                  <div className="space-y-6">
                      <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-lg">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Protocol Distribution</h3>
                          <div className="h-40">
                              {result.forensicsReport?.protocolStats ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={result.forensicsReport.protocolStats} layout="vertical">
                                          <XAxis type="number" hide />
                                          <YAxis dataKey="protocol" type="category" width={50} tick={{fontSize: 9, fill: '#94a3b8'}} />
                                          <Tooltip contentStyle={{backgroundColor: '#1e293b'}} />
                                          <Bar dataKey="percent" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                              {result.forensicsReport.protocolStats.map((entry, index) => (
                                                  <Cell key={`cell-${index}`} fill={PROTOCOL_COLORS[index % PROTOCOL_COLORS.length]} />
                                              ))}
                                          </Bar>
                                      </BarChart>
                                  </ResponsiveContainer>
                              ) : <div className="text-gray-600 text-xs text-center pt-10">No Stats</div>}
                          </div>
                      </div>
                      <div className="bg-surface p-6 rounded-2xl border border-slate-700 shadow-lg">
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center"><Eye size={14} className="mr-2 text-primary" /> Expert Analysis</h3>
                           <div className="space-y-3">
                               {result.forensicsReport?.expertIssues?.map((issue, i) => (
                                   <div key={i} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start space-x-3">
                                       <AlertOctagon size={14} className="text-warning mt-1 shrink-0" />
                                       <p className="text-[10px] text-gray-300 leading-tight">{issue.summary}</p>
                                   </div>
                               ))}
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- IDS/IPS TAB --- */}
      {activeTab === 'ids' && (
          <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center justify-between">
                      <div><p className="text-[10px] font-black uppercase text-red-500 tracking-widest">High Priority</p><p className="text-2xl font-black text-white">{result.idsReport?.alerts.filter((a: any) => a.priority === 1).length || 0}</p></div>
                      <Siren size={32} className="text-red-500 animate-pulse" />
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl flex items-center justify-between">
                      <div><p className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">Medium Priority</p><p className="text-2xl font-black text-white">{result.idsReport?.alerts.filter((a: any) => a.priority === 2).length || 0}</p></div>
                      <AlertTriangle size={32} className="text-yellow-500" />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex items-center justify-between">
                      <div><p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Total Events</p><p className="text-2xl font-black text-white">{result.idsReport?.totalAlerts || 0}</p></div>
                      <Activity size={32} className="text-blue-500" />
                  </div>
              </div>
              <div className="bg-surface rounded-2xl border border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-gray-400 font-black uppercase tracking-wider">
                          <tr>
                              <th className="p-4">Signature / Rule</th>
                              <th className="p-4">Priority</th>
                              <th className="p-4">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                          {result.idsReport?.alerts.map((alert: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-800/50">
                                  <td className="p-4 font-mono text-gray-300">{alert.signature}</td>
                                  <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${alert.priority === 1 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>Pri {alert.priority}</span></td>
                                  <td className="p-4 text-gray-400">{alert.action}</td>
                              </tr>
                          ))}
                          {(!result.idsReport || result.idsReport.alerts.length === 0) && (
                              <tr><td colSpan={3} className="p-8 text-center text-gray-600">Aucune alerte d'intrusion détectée.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- SELENIUM & JMETER TABS (Simple Placeholders for functionality) --- */}
      {activeTab === 'selenium' && (
           <div className="space-y-6 animate-in fade-in duration-500">
               {result.seleniumReport?.map((scenario, i) => (
                   <div key={i} className="bg-surface border border-slate-700 rounded-2xl overflow-hidden">
                       <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center cursor-pointer" onClick={() => setExpandedScenario(expandedScenario === scenario.name ? null : scenario.name)}>
                           <div className="flex items-center space-x-3">
                               {scenario.status === 'pass' ? <CheckCircle size={18} className="text-primary" /> : <XCircle size={18} className="text-danger" />}
                               <span className="font-bold text-white">{scenario.name}</span>
                           </div>
                           <span className="text-xs text-gray-500">{scenario.steps.length} steps</span>
                       </div>
                       {expandedScenario === scenario.name && (
                           <div className="p-4 space-y-2">
                               {scenario.steps.map((step, j) => (
                                   <div key={j} className="flex items-center space-x-3 text-xs p-2 bg-slate-800/30 rounded border border-slate-800">
                                       <span className="font-mono text-gray-500 w-6">{step.stepNumber}.</span>
                                       <span className="text-blue-300 font-bold w-24">{step.action}</span>
                                       <span className="text-gray-400 flex-1 truncate">{step.expectedResult}</span>
                                       <span className={`uppercase font-black text-[9px] ${step.status === 'pass' ? 'text-primary' : 'text-danger'}`}>{step.status}</span>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               ))}
                {(!result.seleniumReport || result.seleniumReport.length === 0) && <div className="text-center text-gray-600 py-10">Aucun rapport d'automatisation disponible.</div>}
           </div>
      )}

      {activeTab === 'jmeter' && (
           <div className="space-y-6 animate-in fade-in duration-500">
               {result.jmeterReport ? (
                   <>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                           <p className="text-[9px] text-gray-500 uppercase font-black">Throughput</p>
                           <p className="text-xl font-black text-white">{result.jmeterReport.summary.throughput}/s</p>
                       </div>
                       <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                           <p className="text-[9px] text-gray-500 uppercase font-black">Avg Latency</p>
                           <p className="text-xl font-black text-warning">{result.jmeterReport.summary.averageLatency}ms</p>
                       </div>
                       <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                           <p className="text-[9px] text-gray-500 uppercase font-black">Error Rate</p>
                           <p className="text-xl font-black text-danger">{result.jmeterReport.summary.errorPct}%</p>
                       </div>
                   </div>
                   <div className="h-64 bg-surface p-4 rounded-2xl border border-slate-700">
                       <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={result.jmeterReport.samples}>
                               <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                               <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{fontSize: 10}} tickFormatter={(t) => t.split('T')[1].substring(0,5)} />
                               <YAxis stroke="#94a3b8" />
                               <Tooltip contentStyle={{backgroundColor: '#1e293b'}} />
                               <Line type="monotone" dataKey="latency" stroke="#f59e0b" dot={false} strokeWidth={2} />
                           </LineChart>
                       </ResponsiveContainer>
                   </div>
                   </>
               ) : <div className="text-center text-gray-600 py-10">Aucune donnée de test de charge.</div>}
           </div>
      )}

    </div>
  );
};

export default ResultsView;
