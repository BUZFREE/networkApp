
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line, BarChart, Bar } from 'recharts';
import { AlertTriangle, Server, ShieldCheck, Terminal, Download, Globe, Network, Zap, Cpu, Activity, Lock, Search, Share2, Map, Smartphone, Check, XCircle, FileText, Bot, PlayCircle, BarChart2, Layers } from 'lucide-react';
import { ScanResult, Severity } from '../types';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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

const ResultsView: React.FC<ResultsViewProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'infrastructure' | 'network' | 'topology' | 'selenium' | 'jmeter'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

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

  // Helper to parse metrics for the BarChart
  const getPerformanceChartData = () => {
    if (!result.performanceReport?.metrics) return [];
    
    // Filter for time-based metrics to keep scale consistent (avoiding CLS which is 0.1 etc)
    const timeMetrics = ['LCP', 'FCP', 'TTFB', 'TBT', 'FID', 'Speed Index'];
    
    return result.performanceReport.metrics
      .filter(m => timeMetrics.some(tm => m.name.includes(tm)))
      .map(m => {
        let val = 0;
        // Simple parsing: "1.2s" -> 1200, "500ms" -> 500
        if (m.value.includes('ms')) {
           val = parseFloat(m.value.replace('ms', '').trim());
        } else if (m.value.includes('s')) {
           val = parseFloat(m.value.replace('s', '').trim()) * 1000;
        }
        return {
          name: m.name,
          duration: val,
          display: m.value
        };
      });
  };

  const perfChartData = getPerformanceChartData();
  
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

  const handleExportReport = async () => {
    setIsExporting(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Header ---
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SecuScan Pro", 14, 15);
    doc.setFontSize(12);
    doc.text("Rapport d'Audit de Sécurité", 14, 25);
    
    doc.setFontSize(10);
    doc.text(`Cible: ${result.targetUrl}`, pageWidth - 15, 15, { align: 'right' });
    doc.text(`Date: ${new Date(result.timestamp).toLocaleString()}`, pageWidth - 15, 20, { align: 'right' });
    doc.text(`Score: ${result.overallScore}/100`, pageWidth - 15, 25, { align: 'right' });

    let yPos = 50;
    doc.setTextColor(0, 0, 0);

    // --- AI Summary ---
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // Primary color
    doc.text("Résumé de l'Analyse IA", 14, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const splitAi = doc.splitTextToSize(result.aiAnalysis, pageWidth - 28);
    doc.text(splitAi, 14, yPos);
    yPos += (splitAi.length * 5) + 10;

    // --- Charts Capture ---
    const severityChart = document.getElementById('chart-severity');
    if (severityChart) {
        try {
            const canvas = await html2canvas(severityChart);
            const imgData = canvas.toDataURL('image/png');
            // Scale to fit half page
            doc.addImage(imgData, 'PNG', 14, yPos, 80, 60);
            
            // Add severity stats text next to chart
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("Statistiques Vulnérabilités", 110, yPos + 10);
            let statY = yPos + 20;
            doc.setFontSize(10);
            Object.entries(severityCounts).forEach(([sev, count]) => {
                doc.text(`${sev}: ${count}`, 110, statY);
                statY += 6;
            });
            
            yPos += 70;
        } catch (e) {
            console.error("Chart capture failed", e);
        }
    }

    // --- Vulnerabilities Table ---
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("Détail des Vulnérabilités", 14, yPos);
    yPos += 5;

    autoTable(doc, {
        startY: yPos,
        head: [['Sévérité', 'Nom', 'Outil']],
        body: result.vulnerabilities.map(v => [v.severity, v.name, v.toolDetected]),
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 9 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- Open Ports Table ---
    if (result.openPorts.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text("Ports Ouverts", 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Port', 'Service', 'État', 'Version']],
            body: result.openPorts.map(p => [p.port, p.service, p.state, p.version || '-']),
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 9 },
        });
    }
    
    // --- Connected Assets Table (New) ---
    if (result.connectedAssets && result.connectedAssets.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text("Actifs Connectés & IPs", 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Hostname', 'IP', 'Type', 'Localisation']],
            body: result.connectedAssets.map(a => [a.hostname, a.ip, a.type, a.location]),
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 9 },
        });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} sur ${pageCount} - Généré par SecuScan Pro`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`SecuScan_Rapport_${result.id}.pdf`);
    setIsExporting(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Action Bar */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleExportReport} 
          disabled={isExporting}
          className="flex items-center space-x-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
        >
          {isExporting ? <Activity className="animate-spin" size={18} /> : <FileText size={18} />}
          <span>{isExporting ? 'Génération...' : 'Exporter le rapport PDF'}</span>
        </button>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Score de Sécurité</p>
            <p className={`text-4xl font-bold mt-2 ${
              result.overallScore > 80 ? 'text-primary' : result.overallScore > 50 ? 'text-warning' : 'text-danger'
            }`}>
              {result.overallScore}/100
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
            <ShieldCheck className={result.overallScore > 80 ? 'text-primary' : 'text-gray-400'} />
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Vulnérabilités</p>
            <p className="text-4xl font-bold mt-2 text-white">{result.vulnerabilities.length}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
            <AlertTriangle className="text-warning" />
          </div>
        </div>

        {result.serverHealth ? (
           <div className="bg-surface p-6 rounded-xl border border-slate-700 flex items-center justify-between">
             <div>
               <p className="text-gray-400 text-sm">Charge Serveur</p>
               <div className="flex space-x-4 mt-2">
                 <div><span className="text-xs text-gray-500">CPU</span> <span className="font-bold">{result.serverHealth.cpuUsage}%</span></div>
                 <div><span className="text-xs text-gray-500">RAM</span> <span className="font-bold">{result.serverHealth.ramUsage}%</span></div>
               </div>
             </div>
             <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
               <Cpu className="text-secondary" />
             </div>
           </div>
        ) : (
           <div className="bg-surface p-6 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                 <p className="text-gray-400 text-sm">Ports Ouverts</p>
                 <p className="text-4xl font-bold mt-2 text-white">{result.openPorts.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                 <Server className="text-secondary" />
              </div>
           </div>
        )}

        {result.connectedAssets && result.connectedAssets.length > 0 ? (
            <div className="bg-surface p-6 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">IPs & Actifs</p>
                    <p className="text-4xl font-bold mt-2 text-white">{result.connectedAssets.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <Globe className="text-blue-400" />
                </div>
            </div>
        ) : (
            <div className="bg-surface p-6 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">Latence (Ping)</p>
                    <p className="text-4xl font-bold mt-2 text-white">{result.networkStats?.ping || 0}ms</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <Activity className="text-purple-400" />
                </div>
            </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 flex space-x-6 overflow-x-auto">
          {['overview', 'infrastructure', 'network', 'topology', 'selenium', 'jmeter'].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)} 
               className={`py-3 px-2 border-b-2 font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab 
                   ? 'border-primary text-primary' 
                   : 'border-transparent text-gray-400 hover:text-white'}`}
             >
               {tab === 'topology' ? 'Topologie & Découverte' : 
                tab === 'selenium' ? 'Automatisation (Selenium)' : 
                tab === 'jmeter' ? 'JMeter Load Test' : 
                tab}
             </button>
          ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg" id="chart-severity">
              <h3 className="text-lg font-semibold mb-6 text-white">Sévérité des Failles</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as Severity] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-semibold text-white">Ports Ouverts</h3>
                 <button onClick={handleExportPortsCSV} className="p-1.5 bg-slate-800 rounded border border-slate-600 hover:bg-slate-700" title="CSV"><Download size={14} /></button>
               </div>
               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                 {result.openPorts.map((port, idx) => (
                   <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-800">
                     <div className="flex items-center space-x-3">
                       <span className="text-secondary font-mono text-sm">{port.port}</span>
                       <span className="text-gray-300 font-medium">{port.service}</span>
                     </div>
                     <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary uppercase">{port.state}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Overview Quick View of IPs */}
            <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                    <Globe className="mr-2 text-blue-400" size={18} /> IPs & Actifs Connectés
                </h3>
                {result.connectedAssets && result.connectedAssets.length > 0 ? (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto">
                        {result.connectedAssets.slice(0, 5).map((asset, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-800 transition-colors">
                                <div>
                                    <span className="font-bold text-white block">{asset.hostname}</span>
                                    <span className="text-xs text-gray-500">{asset.ip}</span>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded text-gray-300">{asset.type}</span>
                            </div>
                        ))}
                        {result.connectedAssets.length > 5 && (
                             <p className="text-center text-xs text-primary pt-2 cursor-pointer" onClick={() => setActiveTab('network')}>
                                 + {result.connectedAssets.length - 5} autres (voir onglet Réseau)
                             </p>
                        )}
                    </div>
                ) : <p className="text-gray-500 text-sm">Aucun actif connecté.</p>}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-primary/30 p-6 rounded-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Terminal size={100} /></div>
               <h3 className="text-lg font-bold text-primary mb-3">● Analyse IA</h3>
               <p className="text-gray-300 leading-relaxed whitespace-pre-line">{result.aiAnalysis}</p>
            </div>

            {result.performanceReport && (
              <div className="bg-surface border border-purple-500/30 p-6 rounded-xl shadow-lg relative">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center"><Zap className="mr-2 text-purple-500" size={24} /> Performance Web</h3>
                      <span className="text-xl font-bold px-3 py-1 rounded bg-slate-800 border border-slate-600">{result.performanceReport.overallScore}/100</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {result.performanceReport.metrics.map((metric, idx) => (
                          <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 text-center">
                              <span className="block text-gray-400 text-xs font-bold uppercase mb-1">{metric.name}</span>
                              <span className={`block text-xl font-mono font-bold ${metric.score === 'good' ? 'text-green-400' : metric.score === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>{metric.value}</span>
                          </div>
                      ))}
                  </div>
              </div>
            )}

            <div className="space-y-4">
               <h3 className="text-xl font-bold text-white">Vulnérabilités</h3>
               {result.vulnerabilities.map((vuln) => (
                 <div key={vuln.id} className="bg-surface border border-slate-700 rounded-xl overflow-hidden hover:border-slate-500">
                   <div className="p-4 flex justify-between bg-slate-800/50 border-b border-slate-700">
                     <h4 className="font-bold text-white">{vuln.name}</h4>
                     <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${vuln.severity === Severity.CRITICAL ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>{vuln.severity}</span>
                   </div>
                   <div className="p-4"><p className="text-gray-300 text-sm">{vuln.description}</p></div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* INFRASTRUCTURE TAB */}
      {activeTab === 'infrastructure' && (
         <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1 space-y-6">
                     <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg" id="chart-health">
                         <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                             <Cpu className="mr-2" size={20}/> Santé Serveur
                         </h3>
                         {result.serverHealth ? (
                             <div className="flex justify-around">
                                 <div className="h-32 w-32 relative">
                                     <ResponsiveContainer>
                                         <PieChart>
                                             <Pie data={cpuData} innerRadius={25} outerRadius={40} dataKey="value" startAngle={90} endAngle={-270}>
                                                 <Cell fill="#3b82f6" />
                                                 <Cell fill="#1e293b" />
                                             </Pie>
                                         </PieChart>
                                     </ResponsiveContainer>
                                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                                         <span className="text-xl font-bold text-white">{result.serverHealth.cpuUsage}%</span>
                                         <span className="text-xs text-gray-500">CPU</span>
                                     </div>
                                 </div>
                                 <div className="h-32 w-32 relative">
                                     <ResponsiveContainer>
                                         <PieChart>
                                             <Pie data={ramData} innerRadius={25} outerRadius={40} dataKey="value" startAngle={90} endAngle={-270}>
                                                 <Cell fill="#8b5cf6" />
                                                 <Cell fill="#1e293b" />
                                             </Pie>
                                         </PieChart>
                                     </ResponsiveContainer>
                                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                                         <span className="text-xl font-bold text-white">{result.serverHealth.ramUsage}%</span>
                                         <span className="text-xs text-gray-500">RAM</span>
                                     </div>
                                 </div>
                             </div>
                         ) : (
                             <div className="text-center text-gray-500 py-8">Données non disponibles</div>
                         )}
                         {result.serverHealth && (
                             <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-gray-400">
                                 <div className="flex justify-between mb-2"><span>OS:</span> <span className="text-white">{result.serverHealth.os}</span></div>
                                 <div className="flex justify-between"><span>Uptime:</span> <span className="text-white">{result.serverHealth.uptime}</span></div>
                             </div>
                         )}
                     </div>
                 </div>

                 <div className="lg:col-span-2">
                     <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg h-full" id="chart-load">
                         <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                             <Activity className="mr-2 text-orange-400" size={20}/> Test de Charge (Stress Test)
                         </h3>
                         {result.loadTestResults && result.loadTestResults.length > 0 ? (
                             <div className="h-[300px] w-full">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <AreaChart data={result.loadTestResults}>
                                         <defs>
                                             <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                                 <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                                 <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                             </linearGradient>
                                         </defs>
                                         <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                         <XAxis dataKey="time" stroke="#94a3b8" />
                                         <YAxis stroke="#94a3b8" label={{ value: 'Latence (ms)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                                         <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                                         <Legend />
                                         <Area type="monotone" dataKey="latency" stroke="#f97316" fillOpacity={1} fill="url(#colorLatency)" name="Latence (ms)" />
                                         <Area type="monotone" dataKey="requestsPerSecond" stroke="#3b82f6" fill="transparent" name="Req/Sec" />
                                     </AreaChart>
                                 </ResponsiveContainer>
                             </div>
                         ) : (
                             <div className="flex items-center justify-center h-64 text-gray-500">Aucune donnée de test de charge.</div>
                         )}
                     </div>
                 </div>
             </div>

             {/* New BarChart for Web Vitals (Added as requested) */}
             {perfChartData.length > 0 && (
                 <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                    <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                       <BarChart2 className="mr-2 text-primary" size={20} /> Métriques de Performance (Web Vitals)
                    </h3>
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={perfChartData}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                             <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                             <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'Durée (ms)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                             />
                             <Legend />
                             <Bar dataKey="duration" fill="#10b981" name="Temps (ms)" radius={[4, 4, 0, 0]} barSize={50} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
             )}
         </div>
      )}

      {/* NETWORK TAB */}
      {activeTab === 'network' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              {/* Connected Assets Section */}
              <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                      <Globe className="mr-2 text-blue-400" size={20} /> Actifs Connectés & Sous-domaines
                  </h3>
                  {result.connectedAssets && result.connectedAssets.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.connectedAssets.map((asset, idx) => (
                              <div key={idx} className="p-4 bg-slate-900 rounded border border-slate-800 flex items-center justify-between hover:border-slate-600 transition-colors">
                                  <div>
                                      <p className="font-bold text-white text-sm">{asset.hostname}</p>
                                      <p className="text-xs text-secondary font-mono mt-1">{asset.ip}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className={`text-[10px] uppercase px-2 py-1 rounded border ${
                                          asset.type === 'Primary' ? 'bg-primary/20 text-primary border-primary/30' : 
                                          asset.type === 'Database' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' :
                                          'bg-slate-800 text-gray-400 border-slate-700'
                                      }`}>
                                          {asset.type}
                                      </span>
                                      <p className="text-[10px] text-gray-500 mt-2 flex items-center justify-end">
                                          <Map size={10} className="mr-1"/> {asset.location}
                                      </p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-8 text-gray-500 italic flex flex-col items-center">
                          <Globe size={32} className="mb-2 opacity-20" />
                          Aucun actif connecté détecté.
                      </div>
                  )}
              </div>

              <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                      <Lock className="mr-2 text-emerald-400" size={20} /> En-têtes de Sécurité (Headers)
                  </h3>
                  <div className="space-y-4">
                      {result.securityHeaders?.map((header, idx) => (
                          <div key={idx} className="flex items-start justify-between p-3 bg-slate-900 rounded border border-slate-800">
                              <div>
                                  <p className="text-gray-200 font-mono text-sm font-bold">{header.name}</p>
                                  <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={header.value}>{header.value}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded uppercase font-bold ${
                                  header.status === 'secure' ? 'bg-green-500/20 text-green-500' :
                                  header.status === 'insecure' ? 'bg-red-500/20 text-red-500' :
                                  'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                  {header.status === 'missing' ? 'Manquant' : header.status}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="space-y-6">
                  <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                          <Network className="mr-2 text-blue-400" size={20} /> Connectivité
                      </h3>
                      {result.networkStats && (
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-900 rounded border border-slate-800 text-center">
                                  <p className="text-gray-400 text-xs uppercase">Ping Moyen</p>
                                  <p className="text-2xl font-bold text-white mt-1">{result.networkStats.ping}ms</p>
                              </div>
                              <div className="p-4 bg-slate-900 rounded border border-slate-800 text-center">
                                  <p className="text-gray-400 text-xs uppercase">Perte Paquets</p>
                                  <p className="text-2xl font-bold text-white mt-1">{result.networkStats.packetLoss}%</p>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                       <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                           <Search className="mr-2 text-gray-400" size={20} /> Traceroute (Hops)
                       </h3>
                       <div className="space-y-2 bg-black/30 p-4 rounded font-mono text-xs text-green-400 max-h-[200px] overflow-y-auto">
                           {result.networkStats?.traceroute.map((hop, i) => (
                               <div key={i}>{i + 1}. {hop}</div>
                           ))}
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* TOPOLOGY TAB */}
      {activeTab === 'topology' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              
              {/* Network Map / Topology */}
              <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                      <Share2 className="mr-2 text-primary" size={20} /> Topologie Réseau & Infrastructure
                  </h3>
                  <div className="relative h-64 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-around p-8 overflow-hidden">
                      {/* Connection Lines (Simulated with absolute divs) */}
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-20 transform -translate-y-1/2 pointer-events-none"></div>

                      {result.topology?.nodes.map((node, index) => (
                          <div key={index} className="flex flex-col items-center z-10">
                              <div className={`
                                  w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-xl transition-all hover:scale-110
                                  ${node.status === 'active' ? 'border-green-500/50 bg-slate-800' : 'border-red-500/50 bg-slate-900'}
                              `}>
                                  {node.type === 'internet' && <Globe className="text-blue-400" />}
                                  {node.type === 'firewall' && <ShieldCheck className="text-primary" />}
                                  {node.type === 'load_balancer' && <Network className="text-purple-400" />}
                                  {node.type === 'server' && <Server className="text-secondary" />}
                                  {node.type === 'database' && <Activity className="text-orange-400" />}
                              </div>
                              <p className="mt-3 text-xs font-bold text-gray-300 uppercase tracking-wide bg-slate-900 px-2 py-1 rounded">{node.label}</p>
                          </div>
                      ))}
                      {!result.topology && <p className="text-gray-500">Topologie non disponible.</p>}
                  </div>
              </div>

              {/* Device Fingerprint */}
              <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                      <Smartphone className="mr-2 text-indigo-400" size={20} /> Empreinte Numérique (Fingerprint)
                  </h3>
                  {result.deviceFingerprint ? (
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800">
                              <span className="text-gray-400">OS Détecté</span>
                              <span className="text-white font-mono font-bold">{result.deviceFingerprint.os}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800">
                              <span className="text-gray-400">Type de Device</span>
                              <span className="text-white font-mono uppercase">{result.deviceFingerprint.deviceType}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800">
                              <span className="text-gray-400">Indice de Confiance</span>
                              <div className="flex items-center">
                                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden mr-3">
                                      <div className="h-full bg-green-500" style={{ width: `${result.deviceFingerprint.confidence}%` }}></div>
                                  </div>
                                  <span className="text-green-500 font-bold">{result.deviceFingerprint.confidence}%</span>
                              </div>
                          </div>
                      </div>
                  ) : <p className="text-gray-500">Fingerprint non disponible.</p>}
              </div>

              {/* Global Ping */}
              <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                      <Map className="mr-2 text-pink-400" size={20} /> Disponibilité Mondiale (Global Ping)
                  </h3>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                      {result.globalPing?.map((ping, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-800 hover:border-slate-600">
                              <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-3 ${
                                      ping.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                  }`}></div>
                                  <div>
                                      <p className="text-sm font-bold text-gray-200">{ping.location}</p>
                                      <p className="text-[10px] text-gray-500 uppercase">{ping.region}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-sm font-mono text-secondary">{ping.latency}ms</p>
                                  <p className={`text-[10px] font-bold ${ping.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                                      {ping.status === 'online' ? 'OK' : 'DOWN'}
                                  </p>
                              </div>
                          </div>
                      ))}
                      {!result.globalPing && <p className="text-gray-500">Ping mondial non disponible.</p>}
                  </div>
              </div>

          </div>
      )}

      {/* SELENIUM / FUNCTIONAL TAB */}
      {activeTab === 'selenium' && (
          <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                      <Bot className="mr-3 text-green-400" size={24} /> 
                      Tests Automatisés (Selenium / E2E)
                  </h3>
                  {result.seleniumReport && (
                      <span className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-gray-300">
                          {result.seleniumReport.length} Scénarios Exécutés
                      </span>
                  )}
              </div>

              {!result.seleniumReport || result.seleniumReport.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                      <Bot size={48} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400 font-medium">Aucun rapport Selenium disponible.</p>
                      <p className="text-sm text-gray-500 mt-2">Activez l'outil "Selenium Tests" lors de la configuration du scan.</p>
                  </div>
              ) : (
                  <div className="space-y-6">
                      {result.seleniumReport.map((scenario, index) => (
                          <div key={index} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900/50">
                              {/* Scenario Header */}
                              <div 
                                  className="p-4 bg-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-750 transition-colors"
                                  onClick={() => setExpandedScenario(expandedScenario === scenario.name ? null : scenario.name)}
                              >
                                  <div className="flex items-center space-x-4">
                                      {scenario.status === 'pass' ? (
                                          <CheckCircle size={24} className="text-green-500" />
                                      ) : (
                                          <XCircle size={24} className="text-red-500" />
                                      )}
                                      <div>
                                          <h4 className="font-bold text-white text-lg">{scenario.name}</h4>
                                          <p className="text-sm text-gray-400">{scenario.description}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-6">
                                      <div className="text-right hidden md:block">
                                          <span className="block text-xs text-gray-500 uppercase">Durée</span>
                                          <span className="font-mono text-secondary">{scenario.duration}</span>
                                      </div>
                                      <PlayCircle size={20} className={`text-gray-400 transition-transform ${expandedScenario === scenario.name ? 'rotate-90' : ''}`} />
                                  </div>
                              </div>

                              {/* Steps Detail */}
                              {expandedScenario === scenario.name && (
                                  <div className="p-6 bg-black/20 border-t border-slate-700 animate-in slide-in-from-top-2">
                                      <div className="space-y-4 relative">
                                          {/* Timeline line */}
                                          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-700"></div>

                                          {scenario.steps.map((step, sIdx) => (
                                              <div key={sIdx} className="relative pl-12">
                                                  {/* Timeline dot */}
                                                  <div className={`
                                                      absolute left-[11px] top-3 w-3 h-3 rounded-full border-2 
                                                      ${step.status === 'pass' ? 'bg-green-500 border-green-900' : 
                                                        step.status === 'fail' ? 'bg-red-500 border-red-900' : 
                                                        'bg-yellow-500 border-yellow-900'}
                                                  `}></div>

                                                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                                      <div className="flex justify-between items-start mb-2">
                                                          <h5 className="font-mono text-sm text-primary font-bold">Step {step.stepNumber}: {step.action}</h5>
                                                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                                              step.status === 'pass' ? 'bg-green-500/10 text-green-400' : 
                                                              step.status === 'fail' ? 'bg-red-500/10 text-red-400' : 
                                                              'bg-yellow-500/10 text-yellow-400'
                                                          }`}>
                                                              {step.status}
                                                          </span>
                                                      </div>
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                          <div>
                                                              <span className="text-gray-500 text-xs uppercase block mb-1">Résultat Attendu</span>
                                                              <span className="text-gray-300">{step.expectedResult}</span>
                                                          </div>
                                                          <div>
                                                              <span className="text-gray-500 text-xs uppercase block mb-1">Résultat Réel</span>
                                                              <span className="text-white">{step.actualResult}</span>
                                                          </div>
                                                      </div>
                                                      {step.status === 'fail' && (
                                                          <div className="mt-3 p-2 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-300 flex items-center">
                                                              <AlertTriangle size={12} className="mr-2" />
                                                              Échec critique détecté à cette étape.
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* JMETER TAB (NEW) */}
      {activeTab === 'jmeter' && (
          <div className="space-y-8 animate-fade-in">
              <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                      <Layers className="mr-3 text-orange-500" size={24} /> Apache JMeter - Load Test Report
                  </h3>

                  {!result.jmeterReport ? (
                      <div className="text-center py-12">
                          <p className="text-gray-400">Aucun rapport JMeter disponible pour ce scan.</p>
                          <p className="text-sm text-gray-500">Sélectionnez "Apache JMeter" lors de la configuration.</p>
                      </div>
                  ) : (
                      <>
                          {/* Summary Cards */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                                  <p className="text-xs text-gray-400 uppercase font-bold">Total Samples</p>
                                  <p className="text-2xl font-bold text-white mt-1">{result.jmeterReport.summary.totalSamples}</p>
                              </div>
                              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                                  <p className="text-xs text-gray-400 uppercase font-bold">Throughput (req/s)</p>
                                  <p className="text-2xl font-bold text-green-400 mt-1">{result.jmeterReport.summary.throughput}</p>
                              </div>
                              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                                  <p className="text-xs text-gray-400 uppercase font-bold">Avg Latency</p>
                                  <p className="text-2xl font-bold text-blue-400 mt-1">{result.jmeterReport.summary.averageLatency}ms</p>
                              </div>
                              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                                  <p className="text-xs text-gray-400 uppercase font-bold">Error Rate</p>
                                  <p className={`text-2xl font-bold mt-1 ${result.jmeterReport.summary.errorPct > 1 ? 'text-red-500' : 'text-gray-200'}`}>
                                      {result.jmeterReport.summary.errorPct}%
                                  </p>
                              </div>
                          </div>

                          {/* Percentiles */}
                          <div className="grid grid-cols-3 gap-4 mb-8">
                              <div className="bg-slate-900/50 p-3 rounded border border-slate-800 flex justify-between">
                                  <span className="text-gray-400 text-sm">90th Percentile</span>
                                  <span className="font-mono text-white font-bold">{result.jmeterReport.summary.p90}ms</span>
                              </div>
                              <div className="bg-slate-900/50 p-3 rounded border border-slate-800 flex justify-between">
                                  <span className="text-gray-400 text-sm">95th Percentile</span>
                                  <span className="font-mono text-white font-bold">{result.jmeterReport.summary.p95}ms</span>
                              </div>
                              <div className="bg-slate-900/50 p-3 rounded border border-slate-800 flex justify-between">
                                  <span className="text-gray-400 text-sm">99th Percentile</span>
                                  <span className="font-mono text-warning font-bold">{result.jmeterReport.summary.p99}ms</span>
                              </div>
                          </div>

                          {/* Charts */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                  <h4 className="text-sm text-gray-400 uppercase font-bold mb-4 text-center">Response Time Over Time</h4>
                                  <div className="h-64">
                                      <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={result.jmeterReport.samples}>
                                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                              <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} />
                                              <YAxis stroke="#94a3b8" fontSize={10} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                              <Legend />
                                              <Line type="monotone" dataKey="latency" stroke="#3b82f6" dot={false} strokeWidth={2} name="Latency" />
                                          </LineChart>
                                      </ResponsiveContainer>
                                  </div>
                              </div>
                              
                              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                  <h4 className="text-sm text-gray-400 uppercase font-bold mb-4 text-center">Throughput vs Threads</h4>
                                  <div className="h-64">
                                      <ResponsiveContainer width="100%" height="100%">
                                          <AreaChart data={result.jmeterReport.samples}>
                                              <defs>
                                                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                  </linearGradient>
                                              </defs>
                                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                              <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} />
                                              <YAxis stroke="#94a3b8" fontSize={10} />
                                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                              <Legend />
                                              <Area type="monotone" dataKey="throughput" stroke="#10b981" fillOpacity={1} fill="url(#colorThroughput)" name="Throughput (req/s)" />
                                              <Line type="monotone" dataKey="activeThreads" stroke="#f59e0b" strokeDasharray="3 3" dot={false} name="Active Threads" />
                                          </AreaChart>
                                      </ResponsiveContainer>
                                  </div>
                              </div>
                          </div>
                      </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

// Helper for Selenium Icon (CheckCircle used in code but imported manually to avoid collision)
const CheckCircle = ({size, className}: {size: number, className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default ResultsView;
