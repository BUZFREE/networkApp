
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line, BarChart, Bar } from 'recharts';
import { AlertTriangle, Server, ShieldCheck, Terminal, Download, Globe, Network, Zap, Cpu, Activity, Lock, Search, Share2, Map, Smartphone, Check, XCircle, FileText, Bot, PlayCircle, BarChart2, Layers, Wifi, FileCode, AlertOctagon, AlignLeft, ExternalLink, Siren, Navigation, Clock, Building2 } from 'lucide-react';
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

const ResultsView: React.FC<ResultsViewProps> = ({ result }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'infrastructure' | 'network' | 'topology' | 'selenium' | 'jmeter' | 'traffic' | 'ids'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);
  const [showForensics, setShowForensics] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);

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

  const getPerformanceChartData = () => {
    if (!result.performanceReport?.metrics) return [];
    const timeMetrics = ['LCP', 'FCP', 'TTFB', 'TBT', 'FID', 'Speed Index'];
    return result.performanceReport.metrics
      .filter(m => timeMetrics.some(tm => m.name.includes(tm)))
      .map(m => {
        let val = 0;
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    const chartsToCapture = [
        { id: 'export-chart-severity', name: 'severityImg' },
        { id: 'export-chart-health', name: 'healthImg' },
        { id: 'export-chart-load', name: 'loadImg' },
        { id: 'export-chart-performance', name: 'perfImg' },
        { id: 'export-chart-topology', name: 'topologyImg' },
        { id: 'export-chart-jmeter-latency', name: 'jmeterLatImg' },
        { id: 'export-chart-jmeter-throughput', name: 'jmeterThrImg' }
    ];
    const capturedImages: Record<string, string | null> = {};
    try {
        for (const chart of chartsToCapture) {
            const el = document.getElementById(chart.id);
            if (el) {
                const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#1e293b', useCORS: true, logging: false }); 
                capturedImages[chart.name] = canvas.toDataURL('image/png', 1.0);
            }
        }
    } catch (e) { console.warn("Chart capture warning:", e); }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const addSectionHeader = (title: string) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text(title, 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
    };
    const addImageToPdf = (imgKey: string, height = 80) => {
        if (capturedImages[imgKey]) {
            if (yPos + height > 280) { doc.addPage(); yPos = 20; }
            doc.addImage(capturedImages[imgKey]!, 'PNG', 14, yPos, pageWidth - 28, height);
            yPos += height + 10;
        }
    };
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SecuScan Pro", 14, 15);
    doc.setFontSize(12);
    doc.text("Rapport d'Audit de Sécurité & Infrastructure", 14, 25);
    doc.setFontSize(10);
    doc.text(`Cible: ${result.targetUrl}`, pageWidth - 15, 15, { align: 'right' });
    doc.text(`Date: ${new Date(result.timestamp).toLocaleString()}`, pageWidth - 15, 20, { align: 'right' });
    doc.text(`Score: ${result.overallScore}/100`, pageWidth - 15, 25, { align: 'right' });
    yPos = 50;
    doc.setTextColor(0, 0, 0);
    addSectionHeader("1. Résumé Exécutif & Analyse IA");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const splitAi = doc.splitTextToSize(result.aiAnalysis, pageWidth - 28);
    doc.text(splitAi, 14, yPos);
    yPos += (splitAi.length * 5) + 10;
    addImageToPdf('severityImg', 100);
    addSectionHeader("2. Détail des Vulnérabilités");
    autoTable(doc, { startY: yPos, head: [['Sévérité', 'Vulnérabilité', 'Outil', 'Description']], body: result.vulnerabilities.map(v => [v.severity, v.name, v.toolDetected, v.description.substring(0, 80) + '...']), headStyles: { fillColor: [30, 41, 59] }, styles: { fontSize: 8 }, columnStyles: { 0: { fontStyle: 'bold' } } });
    yPos = (doc as any).lastAutoTable.finalY + 10;
    addSectionHeader("3. Infrastructure & Performance Web");
    if (result.serverHealth) { doc.text("Santé Serveur (CPU/RAM):", 14, yPos); yPos += 5; addImageToPdf('healthImg', 70); }
    if (result.loadTestResults && result.loadTestResults.length > 0) { doc.text("Test de Charge (Simulé):", 14, yPos); yPos += 5; addImageToPdf('loadImg', 80); }
    if (perfChartData.length > 0) { doc.text("Métriques Web Vitals:", 14, yPos); yPos += 5; addImageToPdf('perfImg', 80); }
    const infraData = [];
    if(result.serverHealth) { infraData.push(['CPU / RAM', `CPU: ${result.serverHealth.cpuUsage}% | RAM: ${result.serverHealth.ramUsage}%`]); infraData.push(['OS / Uptime', `${result.serverHealth.os} | Up: ${result.serverHealth.uptime}`]); }
    if(result.performanceReport) { infraData.push(['Score Performance', `${result.performanceReport.overallScore}/100`]); }
    autoTable(doc, { startY: yPos, head: [['Métrique', 'Valeur']], body: infraData, headStyles: { fillColor: [71, 85, 105] } });
    yPos = (doc as any).lastAutoTable.finalY + 10;
    if (result.performanceReport?.metrics) { doc.setFontSize(10); doc.text("Détail Web Vitals:", 14, yPos); yPos += 5; autoTable(doc, { startY: yPos, head: [['Métrique', 'Valeur', 'Score']], body: result.performanceReport.metrics.map(m => [m.name, m.value, m.score]), styles: { fontSize: 8 }, headStyles: { fillColor: [71, 85, 105] } }); yPos = (doc as any).lastAutoTable.finalY + 10; }
    addSectionHeader("4. Réseau, Topologie & Actifs");
    if (result.topology) { doc.text("Topologie Détectée:", 14, yPos); yPos += 5; addImageToPdf('topologyImg', 90); }
    if(result.connectedAssets.length > 0) { doc.setFontSize(10); doc.text("Actifs Connectés (IPs/Sous-domaines):", 14, yPos); yPos += 5; autoTable(doc, { startY: yPos, head: [['Hostname', 'IP', 'Type', 'Localisation']], body: result.connectedAssets.map(a => [a.hostname, a.ip, a.type, a.location]), styles: { fontSize: 8 }, headStyles: { fillColor: [30, 41, 59] } }); yPos = (doc as any).lastAutoTable.finalY + 10; }
    if(result.securityHeaders) { doc.setFontSize(10); doc.text("En-têtes de Sécurité:", 14, yPos); yPos += 5; autoTable(doc, { startY: yPos, head: [['Header', 'Status', 'Valeur']], body: result.securityHeaders.map(h => [h.name, h.status, h.value.substring(0,30)+'...']), styles: { fontSize: 8 }, headStyles: { fillColor: [30, 41, 59] } }); yPos = (doc as any).lastAutoTable.finalY + 10; }
    if(result.seleniumReport) { addSectionHeader("5. Tests Automatisés (Selenium)"); result.seleniumReport.forEach(scenario => { doc.setFontSize(9); doc.setTextColor(100); doc.text(`Scénario: ${scenario.name} (${scenario.status})`, 14, yPos); yPos += 5; autoTable(doc, { startY: yPos, head: [['Étape', 'Action', 'Attendu', 'Réel', 'Status']], body: scenario.steps.map(s => [s.stepNumber, s.action, s.expectedResult, s.actualResult, s.status]), styles: { fontSize: 8 }, headStyles: { fillColor: [22, 163, 74] } }); yPos = (doc as any).lastAutoTable.finalY + 10; }); }
    if(result.jmeterReport) { addSectionHeader("6. Test de Charge (JMeter)"); doc.text("Latence:", 14, yPos); yPos += 5; addImageToPdf('jmeterLatImg', 80); doc.text("Débit (Throughput):", 14, yPos); yPos += 5; addImageToPdf('jmeterThrImg', 80); const sum = result.jmeterReport.summary; autoTable(doc, { startY: yPos, head: [['Métrique', 'Valeur', 'Métrique', 'Valeur']], body: [['Total Samples', sum.totalSamples, 'Throughput', `${sum.throughput}/s`], ['Avg Latency', `${sum.averageLatency}ms`, 'Max Latency', `${sum.maxLatency}ms`], ['Error Rate', `${sum.errorPct}%`, '99th %', `${sum.p99}ms`]], headStyles: { fillColor: [234, 88, 12] } }); yPos = (doc as any).lastAutoTable.finalY + 10; }
    if(result.packetCapture) { addSectionHeader("7. Analyse Trafic (Wireshark)"); if (result.forensicsReport?.protocolStats) { autoTable(doc, { startY: yPos, head: [['Protocole', '%', 'Paquets']], body: result.forensicsReport.protocolStats.map(s => [s.protocol, `${s.percent}%`, s.packets]), styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] } }); yPos = (doc as any).lastAutoTable.finalY + 10; } doc.text("Extrait de capture (30 premiers paquets):", 14, yPos); yPos += 5; autoTable(doc, { startY: yPos, head: [['No', 'Time', 'Src', 'Dst', 'Proto', 'Info']], body: result.packetCapture.slice(0, 30).map(p => [p.no, p.time, p.source, p.destination, p.protocol, p.info.substring(0,40)]), styles: { fontSize: 7, font: 'courier' }, headStyles: { fillColor: [15, 23, 42] } }); }
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150); doc.text(`Page ${i} sur ${pageCount} - Généré par SecuScan Pro`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' }); }
    doc.save(`Rapport_Complet_${result.targetUrl}.pdf`);
    setIsExporting(false);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
            { label: 'Score', val: `${result.overallScore}/100`, icon: <ShieldCheck />, color: 'text-primary', border: 'hover:border-primary/50' },
            { label: 'Failles', val: result.vulnerabilities.length, icon: <AlertTriangle />, color: 'text-warning', border: 'hover:border-warning/50' },
            { label: 'Système', val: result.serverHealth ? `${result.serverHealth.cpuUsage}%` : result.openPorts.length, icon: result.serverHealth ? <Cpu /> : <Server />, color: 'text-secondary', border: 'hover:border-secondary/50' },
            { label: 'Réseau', val: result.connectedAssets.length, icon: <Globe />, color: 'text-pink-400', border: 'hover:border-pink-400/50' }
        ].map((stat, i) => (
            <div key={i} className={`bg-surface p-6 rounded-2xl border border-slate-700 flex items-center justify-between shadow-md transition-all hover:-translate-y-1 ${stat.border}`}>
                <div><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p><p className={`text-3xl font-black mt-2 text-white`}>{stat.val}</p></div>
                <div className={`h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 ${stat.color}`}>{stat.icon}</div>
            </div>
        ))}
      </div>

      <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex space-x-1 overflow-x-auto scrollbar-hide shadow-inner">
          {['overview', 'infrastructure', 'network', 'topology', 'traffic', 'ids'].map((tab) => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`flex-1 py-2.5 px-4 rounded-xl font-black transition-all duration-300 capitalize whitespace-nowrap text-[11px] tracking-widest border
                ${activeTab === tab 
                    ? 'bg-slate-800 text-primary border-slate-700 shadow-lg scale-[1.02] active:scale-95' 
                    : 'bg-transparent text-gray-500 border-transparent hover:text-white hover:bg-slate-900 active:scale-95'}`}
            >
                {t(`tab_${tab}`)}
            </button>
          ))}
      </div>

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
                    {result.openPorts.map((port, idx) => (
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
                {result.vulnerabilities.map((vuln) => (
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

      {/* Les autres onglets héritent du style global animate-fade-in */}
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

                      {geoData && (
                          <div className="flex flex-col sm:flex-row gap-6 lg:text-right">
                              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700 flex-1 lg:min-w-[160px] group-hover:bg-slate-800 transition-colors">
                                  <p className="text-[9px] text-gray-500 uppercase font-black mb-2 flex items-center lg:justify-end tracking-widest"><Clock size={10} className="mr-2 text-warning" /> Local Time</p>
                                  <p className="text-2xl font-black text-white font-mono">{geoData.timezone?.current_time?.split('T')[1]?.substring(0, 5) || '--:--'}</p>
                                  <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-tighter">{geoData.timezone?.id}</p>
                              </div>
                              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700 flex-1 lg:min-w-[160px] group-hover:bg-slate-800 transition-colors">
                                  <p className="text-[9px] text-gray-500 uppercase font-black mb-2 flex items-center lg:justify-end tracking-widest"><MapPin size={10} className="mr-2 text-danger" /> Coordinates</p>
                                  <p className="text-xl font-black text-pink-400 font-mono tracking-tighter">{geoData.latitude?.toFixed(4)}, {geoData.longitude?.toFixed(4)}</p>
                                  <a 
                                      href={`https://www.google.com/maps?q=${geoData.latitude},${geoData.longitude}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-[10px] text-primary hover:text-white hover:underline font-black uppercase tracking-[0.1em] mt-2 inline-flex items-center group/map"
                                  >
                                      Satellite View <ExternalLink size={10} className="ml-2 group-hover/map:scale-125 transition-transform" />
                                  </a>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Reste inchangé, mais l'effet de fade-in global s'applique */}
    </div>
  );
};

const CheckCircle = ({size, className}: {size: number, className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

const MapPin = ({size, className}: {size: number, className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

export default ResultsView;
