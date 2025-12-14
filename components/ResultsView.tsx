
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line, BarChart, Bar } from 'recharts';
import { AlertTriangle, Server, ShieldCheck, Terminal, Download, Globe, Network, Zap, Cpu, Activity, Lock, Search, Share2, Map, Smartphone, Check, XCircle, FileText, Bot, PlayCircle, BarChart2, Layers, Wifi, FileCode, AlertOctagon, AlignLeft, ExternalLink, Siren } from 'lucide-react';
import { ScanResult, Severity, NetworkPacket } from '../types';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'infrastructure' | 'network' | 'topology' | 'selenium' | 'jmeter' | 'traffic' | 'ids'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);
  const [showForensics, setShowForensics] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    // Fetch rich geo data for the primary IP
    const primaryAsset = result.connectedAssets.find(a => a.type === 'Primary');
    const targetIp = primaryAsset?.ip || result.connectedAssets[0]?.ip || result.targetIp;
    
    // Basic private IP check
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

  // Helper to parse metrics for the BarChart
  const getPerformanceChartData = () => {
    if (!result.performanceReport?.metrics) return [];
    
    // Filter for time-based metrics to keep scale consistent
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

  // --- EXHAUSTIVE PDF EXPORT FUNCTION ---
  const handleExportReport = async () => {
    setIsExporting(true);
    
    // 1. Capture Visible Charts (using the hidden export containers to ensure availability)
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
                // HIGH QUALITY CAPTURE: Scale set to 3 for sharp text/lines
                const canvas = await html2canvas(el, { 
                    scale: 3, 
                    backgroundColor: '#1e293b',
                    useCORS: true,
                    logging: false
                }); 
                capturedImages[chart.name] = canvas.toDataURL('image/png', 1.0);
            }
        }
    } catch (e) {
        console.warn("Chart capture warning:", e);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Helper: Add Section Title
    const addSectionHeader = (title: string) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129); // Primary Color
        doc.text(title, 14, yPos);
        doc.setTextColor(0, 0, 0); // Reset color
        yPos += 10;
    };

    // Helper: Add Image
    const addImageToPdf = (imgKey: string, height = 80) => {
        if (capturedImages[imgKey]) {
            if (yPos + height > 280) { doc.addPage(); yPos = 20; }
            // Center the image
            doc.addImage(capturedImages[imgKey]!, 'PNG', 14, yPos, pageWidth - 28, height);
            yPos += height + 10;
        }
    };

    // --- COVER PAGE ---
    doc.setFillColor(15, 23, 42); // Slate 900
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

    // 1. OVERVIEW & AI ANALYSIS
    addSectionHeader("1. Résumé Exécutif & Analyse IA");
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const splitAi = doc.splitTextToSize(result.aiAnalysis, pageWidth - 28);
    doc.text(splitAi, 14, yPos);
    yPos += (splitAi.length * 5) + 10;
    
    addImageToPdf('severityImg', 100);

    // 2. VULNERABILITIES DETAILED
    addSectionHeader("2. Détail des Vulnérabilités");
    autoTable(doc, {
        startY: yPos,
        head: [['Sévérité', 'Vulnérabilité', 'Outil', 'Description']],
        body: result.vulnerabilities.map(v => [v.severity, v.name, v.toolDetected, v.description.substring(0, 80) + '...']),
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // 3. INFRASTRUCTURE & PERFORMANCE
    addSectionHeader("3. Infrastructure & Performance Web");
    
    if (result.serverHealth) {
        doc.text("Santé Serveur (CPU/RAM):", 14, yPos); yPos += 5;
        addImageToPdf('healthImg', 70);
    }
    
    if (result.loadTestResults && result.loadTestResults.length > 0) {
        doc.text("Test de Charge (Simulé):", 14, yPos); yPos += 5;
        addImageToPdf('loadImg', 80);
    }
    
    if (perfChartData.length > 0) {
        doc.text("Métriques Web Vitals:", 14, yPos); yPos += 5;
        addImageToPdf('perfImg', 80);
    }

    const infraData = [];
    if(result.serverHealth) {
        infraData.push(['CPU / RAM', `CPU: ${result.serverHealth.cpuUsage}% | RAM: ${result.serverHealth.ramUsage}%`]);
        infraData.push(['OS / Uptime', `${result.serverHealth.os} | Up: ${result.serverHealth.uptime}`]);
    }
    if(result.performanceReport) {
        infraData.push(['Score Performance', `${result.performanceReport.overallScore}/100`]);
    }
    
    autoTable(doc, {
        startY: yPos,
        head: [['Métrique', 'Valeur']],
        body: infraData,
        headStyles: { fillColor: [71, 85, 105] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Web Vitals Table
    if (result.performanceReport?.metrics) {
        doc.setFontSize(10); doc.text("Détail Web Vitals:", 14, yPos); yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Métrique', 'Valeur', 'Score']],
            body: result.performanceReport.metrics.map(m => [m.name, m.value, m.score]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [71, 85, 105] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // 4. NETWORK & TOPOLOGY
    addSectionHeader("4. Réseau, Topologie & Actifs");
    
    if (result.topology) {
        doc.text("Topologie Détectée:", 14, yPos); yPos += 5;
        addImageToPdf('topologyImg', 90);
    }

    // Connected Assets Table
    if(result.connectedAssets.length > 0) {
        doc.setFontSize(10); doc.text("Actifs Connectés (IPs/Sous-domaines):", 14, yPos); yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Hostname', 'IP', 'Type', 'Localisation']],
            body: result.connectedAssets.map(a => [a.hostname, a.ip, a.type, a.location]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 41, 59] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Security Headers
    if(result.securityHeaders) {
        doc.setFontSize(10); doc.text("En-têtes de Sécurité:", 14, yPos); yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Header', 'Status', 'Valeur']],
            body: result.securityHeaders.map(h => [h.name, h.status, h.value.substring(0,30)+'...']),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 41, 59] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // 5. AUTOMATION (SELENIUM)
    if(result.seleniumReport) {
        addSectionHeader("5. Tests Automatisés (Selenium)");
        result.seleniumReport.forEach(scenario => {
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Scénario: ${scenario.name} (${scenario.status})`, 14, yPos);
            yPos += 5;
            autoTable(doc, {
                startY: yPos,
                head: [['Étape', 'Action', 'Attendu', 'Réel', 'Status']],
                body: scenario.steps.map(s => [s.stepNumber, s.action, s.expectedResult, s.actualResult, s.status]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [22, 163, 74] }, // Green tint
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        });
    }

    // 6. LOAD TEST (JMETER)
    if(result.jmeterReport) {
        addSectionHeader("6. Test de Charge (JMeter)");
        
        doc.text("Latence:", 14, yPos); yPos += 5;
        addImageToPdf('jmeterLatImg', 80);
        
        doc.text("Débit (Throughput):", 14, yPos); yPos += 5;
        addImageToPdf('jmeterThrImg', 80);
        
        const sum = result.jmeterReport.summary;
        autoTable(doc, {
            startY: yPos,
            head: [['Métrique', 'Valeur', 'Métrique', 'Valeur']],
            body: [
                ['Total Samples', sum.totalSamples, 'Throughput', `${sum.throughput}/s`],
                ['Avg Latency', `${sum.averageLatency}ms`, 'Max Latency', `${sum.maxLatency}ms`],
                ['Error Rate', `${sum.errorPct}%`, '99th %', `${sum.p99}ms`]
            ],
            headStyles: { fillColor: [234, 88, 12] }, // Orange tint
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // 7. TRAFFIC (WIRESHARK)
    if(result.packetCapture) {
        addSectionHeader("7. Analyse Trafic (Wireshark)");
        
        // Protocol Stats
        if (result.forensicsReport?.protocolStats) {
             autoTable(doc, {
                startY: yPos,
                head: [['Protocole', '%', 'Paquets']],
                body: result.forensicsReport.protocolStats.map(s => [s.protocol, `${s.percent}%`, s.packets]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246] }, // Blue
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // Packet List (Limit to first 30 for PDF size)
        doc.text("Extrait de capture (30 premiers paquets):", 14, yPos); yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['No', 'Time', 'Src', 'Dst', 'Proto', 'Info']],
            body: result.packetCapture.slice(0, 30).map(p => [p.no, p.time, p.source, p.destination, p.protocol, p.info.substring(0,40)]),
            styles: { fontSize: 7, font: 'courier' },
            headStyles: { fillColor: [15, 23, 42] },
        });
    }

    // Add Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} sur ${pageCount} - Généré par SecuScan Pro`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Rapport_Complet_${result.targetUrl}.pdf`);
    setIsExporting(false);
  };

  // Helper for Packet Protocol Colors
  const getPacketColor = (proto: string) => {
      const p = proto.toUpperCase();
      if (p.includes('TCP')) return 'text-green-400 bg-green-900/10 border-green-900/30';
      if (p.includes('UDP')) return 'text-blue-400 bg-blue-900/10 border-blue-900/30';
      if (p.includes('HTTP')) return 'text-emerald-400 bg-emerald-900/10 border-emerald-900/30';
      if (p.includes('TLS') || p.includes('SSL')) return 'text-purple-400 bg-purple-900/10 border-purple-900/30';
      if (p.includes('DNS')) return 'text-cyan-400 bg-cyan-900/10 border-cyan-900/30';
      return 'text-gray-300 bg-slate-800 border-slate-700';
  };

  // Helper for Selenium Icon
  const CheckCircle = ({size, className}: {size: number, className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  );

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Action Bar */}
      <div className="flex justify-end mb-4 space-x-4">
        <button
          onClick={handleShare}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-600 shadow-lg"
        >
          {isCopied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
          <span>{isCopied ? 'Lien copié !' : 'Partager'}</span>
        </button>

        <button 
          onClick={handleExportReport} 
          disabled={isExporting}
          className="flex items-center space-x-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
        >
          {isExporting ? <Activity className="animate-spin" size={18} /> : <FileText size={18} />}
          <span>{isExporting ? 'Génération du Rapport PDF...' : 'Exporter le rapport complet (PDF)'}</span>
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
          {['overview', 'infrastructure', 'network', 'topology', 'selenium', 'jmeter', 'traffic', 'ids'].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)} 
               className={`py-3 px-2 border-b-2 font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab 
                   ? 'border-primary text-primary' 
                   : 'border-transparent text-gray-400 hover:text-white'}`}
             >
               {tab === 'topology' ? 'Topologie' : 
                tab === 'selenium' ? 'Automatisation' : 
                tab === 'jmeter' ? 'Test de Charge' : 
                tab === 'traffic' ? 'Trafic Réseau' : 
                tab === 'ids' ? 'IDS / IPS' : 
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
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                        <Globe className="mr-2 text-blue-400" size={18} /> IPs & Actifs Connectés
                    </h3>
                    <a 
                        href={`https://iplocation.io/ip/${result.connectedAssets[0]?.ip || result.targetIp || ''}`}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-xs flex items-center text-secondary hover:text-white transition-colors"
                        title="Vérifier la géolocalisation sur IPLocation.io"
                    >
                        <ExternalLink size={12} className="mr-1" /> IPLocation.io
                    </a>
                </div>
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
              <div className="bg-surface border border-purple-500/30 p-6 rounded-xl shadow-lg relative" id="chart-performance">
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

      {/* IDS / IPS TAB (NEW) */}
      {activeTab === 'ids' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-semibold text-white flex items-center">
                      <Siren className="mr-3 text-red-500" size={24} /> 
                      Intrusion Detection System (Snort / Suricata)
                   </h3>
                   {result.idsReport && (
                       <div className="flex space-x-4">
                           <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded border border-red-500/20 text-sm font-bold">
                               {result.idsReport.alertsByPriority.high} High Priority
                           </span>
                           <span className="bg-slate-800 text-gray-300 px-3 py-1 rounded border border-slate-600 text-sm">
                               {result.idsReport.totalAlerts} Alerts Total
                           </span>
                       </div>
                   )}
                </div>

                {!result.idsReport ? (
                    <div className="text-center py-12">
                        <Siren size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400">Aucun rapport IDS disponible.</p>
                        <p className="text-sm text-gray-500 mt-2">Activez l'outil "Snort / Suricata" lors de la configuration.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold">Total Events</p>
                                    <p className="text-2xl font-bold text-white mt-1">{result.idsReport.totalAlerts}</p>
                                </div>
                                <Activity className="text-blue-500 opacity-50" />
                            </div>
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold">Blocked Attacks</p>
                                    <p className="text-2xl font-bold text-green-500 mt-1">{result.idsReport.blockedCount}</p>
                                </div>
                                <ShieldCheck className="text-green-500 opacity-50" />
                            </div>
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold">Critical Alerts</p>
                                    <p className="text-2xl font-bold text-red-500 mt-1">{result.idsReport.alertsByPriority.high}</p>
                                </div>
                                <AlertOctagon className="text-red-500 opacity-50" />
                            </div>
                        </div>

                        {/* Alerts Table */}
                        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-800 text-gray-400 font-mono text-xs uppercase">
                                        <tr>
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Pri</th>
                                            <th className="p-3">Signature / Classification</th>
                                            <th className="p-3">Source</th>
                                            <th className="p-3">Dest</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {result.idsReport.alerts.map((alert, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="p-3 text-gray-400 whitespace-nowrap font-mono text-xs">{alert.timestamp}</td>
                                                <td className="p-3">
                                                    <span className={`
                                                        w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                                                        ${alert.priority === 1 ? 'bg-red-500 text-white' : alert.priority === 2 ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}
                                                    `}>
                                                        {alert.priority}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-bold text-white text-xs md:text-sm">{alert.signature}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5 font-mono">{alert.classification} (SID: {alert.sid})</div>
                                                </td>
                                                <td className="p-3 font-mono text-xs text-gray-300">
                                                    {alert.sourceIp}:{alert.sourcePort}
                                                </td>
                                                <td className="p-3 font-mono text-xs text-gray-300">
                                                    {alert.destIp}:{alert.destPort}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                                                        alert.action === 'blocked' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                                        alert.action === 'allowed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                                        'bg-gray-700 text-gray-300 border-gray-600'
                                                    }`}>
                                                        {alert.action}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
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
                 <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg" id="chart-performance-details">
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
                          {result.connectedAssets.map((asset, idx) => {
                              const isEnriched = geoData && geoData.ip === asset.ip;
                              return (
                                  <div key={idx} className="p-4 bg-slate-900 rounded border border-slate-800 flex items-center justify-between hover:border-slate-600 transition-colors">
                                      <div>
                                          <p className="font-bold text-white text-sm">{asset.hostname}</p>
                                          <p className="text-xs text-secondary font-mono mt-1 flex items-center">
                                              {asset.ip}
                                              <a href={`https://iplocation.io/ip/${asset.ip}`} target="_blank" rel="noopener noreferrer" className="ml-2 opacity-50 hover:opacity-100 text-blue-400" title="Vérifier sur IPLocation.io">
                                                  <ExternalLink size={10} />
                                              </a>
                                          </p>
                                      </div>
                                      <div className="text-right">
                                          <span className={`text-[10px] uppercase px-2 py-1 rounded border ${
                                              asset.type === 'Primary' ? 'bg-primary/20 text-primary border-primary/30' : 
                                              asset.type === 'Database' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' :
                                              'bg-slate-800 text-gray-400 border-slate-700'
                                          }`}>
                                              {asset.type}
                                          </span>
                                          <div className="mt-2 flex flex-col items-end">
                                              {isEnriched ? (
                                                  <div className="text-right animate-in fade-in duration-500">
                                                      <p className="text-xs text-white font-bold flex items-center justify-end">
                                                          {geoData.flag?.img && <img src={geoData.flag.img} alt="flag" className="w-4 h-auto mr-1.5 shadow-sm" />}
                                                          {geoData.city}
                                                      </p>
                                                      <p className="text-[10px] text-gray-400">{geoData.region}, {geoData.country}</p>
                                                      {geoData.connection?.isp && <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{geoData.connection.isp}</p>}
                                                  </div>
                                              ) : (
                                                  <p className="text-[10px] text-gray-500 flex items-center justify-end">
                                                      <Map size={10} className="mr-1"/> {asset.location}
                                                  </p>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
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
                  <div id="chart-topology" className="relative h-64 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-around p-8 overflow-hidden">
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
                              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800" id="chart-jmeter-latency">
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
                              
                              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800" id="chart-jmeter-throughput">
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

      {/* TRAFFIC / WIRESHARK TAB */}
      {activeTab === 'traffic' && (
          <div className="space-y-6 animate-fade-in">
             
             {/* Forensics Toggle / Banner */}
             {result.forensicsReport && (
                 <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                     <div className="flex items-center space-x-3">
                         <AlertOctagon className="text-orange-500" size={24} />
                         <div>
                             <h4 className="font-bold text-white">Rapport Forensics Disponible</h4>
                             <p className="text-xs text-gray-400">Analyse approfondie (DPI), alertes expertes et reconstruction de flux.</p>
                         </div>
                     </div>
                     <button 
                         onClick={() => setShowForensics(!showForensics)}
                         className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center ${showForensics ? 'bg-primary text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                     >
                         {showForensics ? 'Masquer le rapport Forensics' : 'Voir le rapport Forensics'}
                     </button>
                 </div>
             )}

             {/* FORENSICS PANEL */}
             {showForensics && result.forensicsReport && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                     {/* Protocol Stats */}
                     <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                         <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center"><BarChart2 className="mr-2" size={16}/> Hiérarchie des Protocoles</h3>
                         <div className="space-y-3">
                             {result.forensicsReport.protocolStats.map((stat, i) => (
                                 <div key={i}>
                                     <div className="flex justify-between text-sm mb-1">
                                         <span className="text-white font-mono">{stat.protocol}</span>
                                         <span className="text-gray-400">{stat.percent}%</span>
                                     </div>
                                     <div className="w-full bg-slate-900 rounded-full h-2">
                                         <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stat.percent}%` }}></div>
                                     </div>
                                     <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                                         <span>{stat.packets} paquets</span>
                                         <span>{stat.bytes} octets</span>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>

                     {/* Expert Info */}
                     <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                         <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center"><AlertTriangle className="mr-2" size={16}/> Expert Information</h3>
                         <div className="space-y-2 max-h-[250px] overflow-y-auto">
                             {result.forensicsReport.expertIssues.map((issue, i) => (
                                 <div key={i} className="flex items-start space-x-3 p-3 bg-slate-900 rounded border border-slate-800">
                                     <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                         issue.severity === 'Error' ? 'bg-red-500' : 
                                         issue.severity === 'Warning' ? 'bg-yellow-500' : 'bg-blue-400'
                                     }`}></div>
                                     <div>
                                         <p className="text-xs font-bold text-white">{issue.summary}</p>
                                         <p className="text-[10px] text-gray-500">{issue.group} • {issue.protocol}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>

                     {/* Reconstructed Stream (Follow TCP Stream) */}
                     <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                         <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center"><AlignLeft className="mr-2" size={16}/> Reconstruction de Flux (Follow TCP Stream)</h3>
                         {result.forensicsReport.reconstructedStreams.map((stream, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex items-center justify-between">
                                     <span className="text-xs font-bold text-secondary">{stream.title}</span>
                                     <div className="flex gap-2">
                                         {stream.tags.map((tag, t) => (
                                             <span key={t} className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded uppercase font-bold border border-red-500/30">{tag}</span>
                                         ))}
                                     </div>
                                 </div>
                                 <pre className="bg-black/50 p-4 rounded text-xs font-mono text-green-400 overflow-x-auto border border-slate-800">
                                     {stream.content}
                                 </pre>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             <div className="bg-surface p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                    <Wifi className="mr-3 text-blue-400" size={24} /> 
                    Trafic Réseau (Capture de Paquets)
                </h3>

                {!result.packetCapture || result.packetCapture.length === 0 ? (
                    <div className="text-center py-12">
                        <Wifi size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400">Aucune capture de paquets disponible.</p>
                        <p className="text-sm text-gray-500 mt-2">Activez l'outil "Wireshark Analysis" pour simuler une capture.</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
                        {/* Packet List */}
                        <div className="lg:w-2/3 flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm font-mono">
                                    <thead className="bg-slate-800 text-gray-400 sticky top-0">
                                        <tr>
                                            <th className="p-2 w-12 border-r border-slate-700">No.</th>
                                            <th className="p-2 w-20 border-r border-slate-700">Time</th>
                                            <th className="p-2 w-32 border-r border-slate-700">Source</th>
                                            <th className="p-2 w-32 border-r border-slate-700">Destination</th>
                                            <th className="p-2 w-20 border-r border-slate-700">Proto</th>
                                            <th className="p-2 w-16 border-r border-slate-700">Len</th>
                                            <th className="p-2">Info</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {result.packetCapture.map((pkt) => (
                                            <tr 
                                                key={pkt.no} 
                                                onClick={() => setSelectedPacket(pkt)}
                                                className={`cursor-pointer hover:bg-slate-700 transition-colors ${
                                                    selectedPacket?.no === pkt.no ? 'bg-blue-600/30' : getPacketColor(pkt.protocol).replace('text-', 'bg-').split(' ')[1]
                                                }`}
                                            >
                                                <td className="p-2 border-r border-slate-700/50 text-gray-500">{pkt.no}</td>
                                                <td className="p-2 border-r border-slate-700/50 text-gray-400">{pkt.time}</td>
                                                <td className="p-2 border-r border-slate-700/50 text-white">{pkt.source}</td>
                                                <td className="p-2 border-r border-slate-700/50 text-white">{pkt.destination}</td>
                                                <td className={`p-2 border-r border-slate-700/50 font-bold ${getPacketColor(pkt.protocol).split(' ')[0]}`}>{pkt.protocol}</td>
                                                <td className="p-2 border-r border-slate-700/50 text-gray-400">{pkt.length}</td>
                                                <td className="p-2 text-gray-300 truncate max-w-xs">{pkt.info}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-slate-800 p-2 text-xs text-gray-400 border-t border-slate-700">
                                {result.packetCapture.length} packets displayed
                            </div>
                        </div>

                        {/* Packet Details */}
                        <div className="lg:w-1/3 bg-slate-900 rounded-lg border border-slate-800 overflow-y-auto p-4 font-mono text-sm">
                            <h4 className="text-gray-400 uppercase font-bold text-xs mb-4 border-b border-slate-700 pb-2">Packet Details</h4>
                            {selectedPacket ? (
                                <div className="space-y-4">
                                    {selectedPacket.details?.frame && (
                                        <div className="border border-slate-700 rounded bg-slate-800/50">
                                            <div className="bg-slate-800 px-3 py-2 text-xs font-bold text-gray-400 uppercase">Frame</div>
                                            <div className="p-3 text-gray-300 whitespace-pre-wrap">{selectedPacket.details.frame}</div>
                                        </div>
                                    )}
                                    {selectedPacket.details?.ethernet && (
                                        <div className="border border-slate-700 rounded bg-slate-800/50">
                                            <div className="bg-slate-800 px-3 py-2 text-xs font-bold text-gray-400 uppercase">Ethernet</div>
                                            <div className="p-3 text-gray-300 whitespace-pre-wrap">{selectedPacket.details.ethernet}</div>
                                        </div>
                                    )}
                                    {selectedPacket.details?.ip && (
                                        <div className="border border-slate-700 rounded bg-slate-800/50">
                                            <div className="bg-slate-800 px-3 py-2 text-xs font-bold text-gray-400 uppercase">Internet Protocol</div>
                                            <div className="p-3 text-gray-300 whitespace-pre-wrap">{selectedPacket.details.ip}</div>
                                        </div>
                                    )}
                                    {selectedPacket.details?.transport && (
                                        <div className="border border-slate-700 rounded bg-slate-800/50">
                                            <div className="bg-slate-800 px-3 py-2 text-xs font-bold text-gray-400 uppercase">Transport Layer</div>
                                            <div className="p-3 text-gray-300 whitespace-pre-wrap">{selectedPacket.details.transport}</div>
                                        </div>
                                    )}
                                    {selectedPacket.details?.application && (
                                        <div className="border border-slate-700 rounded bg-slate-800/50">
                                            <div className="bg-slate-800 px-3 py-2 text-xs font-bold text-gray-400 uppercase">Application Layer</div>
                                            <div className="p-3 text-emerald-400 whitespace-pre-wrap">{selectedPacket.details.application}</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-10">
                                    <FileCode size={32} className="mx-auto mb-3 opacity-30" />
                                    Select a packet to view details
                                </div>
                            )}
                        </div>
                    </div>
                )}
             </div>
          </div>
      )}

      {/* HIDDEN EXPORT ZONE FOR HIGH QUALITY PDF GENERATION */}
      {/* 
        This renders all charts off-screen with large dimensions (1200px) 
        and high contrast styling so html2canvas can capture them with maximum detail.
      */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1200px', visibility: 'visible', zIndex: -100 }}>
          
          <div id="export-chart-severity" style={{ width: 1200, height: 600, background: '#1e293b', padding: 40 }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                        data={pieData} 
                        cx="50%" cy="50%" 
                        innerRadius={100} 
                        outerRadius={160} 
                        paddingAngle={5} 
                        dataKey="value" 
                        isAnimationActive={false}
                        label={({name, value}) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name as Severity] || '#94a3b8'} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '20px', paddingTop: '20px' }} iconSize={20} />
                  </PieChart>
                </ResponsiveContainer>
          </div>

          <div id="export-chart-health" style={{ width: 1200, height: 500, background: '#1e293b', padding: 40, display: 'flex' }}>
              {result.serverHealth ? (
                 <>
                   <div style={{ width: '50%', height: '100%' }}>
                     <h4 style={{ color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 24 }}>CPU Usage</h4>
                     <ResponsiveContainer><PieChart><Pie data={cpuData} innerRadius={60} outerRadius={100} dataKey="value" startAngle={90} endAngle={-270} isAnimationActive={false} label><Cell fill="#3b82f6"/><Cell fill="#0f172a"/></Pie></PieChart></ResponsiveContainer>
                   </div>
                   <div style={{ width: '50%', height: '100%' }}>
                     <h4 style={{ color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 24 }}>RAM Usage</h4>
                     <ResponsiveContainer><PieChart><Pie data={ramData} innerRadius={60} outerRadius={100} dataKey="value" startAngle={90} endAngle={-270} isAnimationActive={false} label><Cell fill="#8b5cf6"/><Cell fill="#0f172a"/></Pie></PieChart></ResponsiveContainer>
                   </div>
                 </>
              ) : <div>No Data</div>}
          </div>

          <div id="export-chart-load" style={{ width: 1200, height: 600, background: '#1e293b', padding: 40 }}>
               {result.loadTestResults && (
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={result.loadTestResults}>
                         <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 14}} />
                         <YAxis stroke="#94a3b8" tick={{fontSize: 14}} label={{ value: 'Latence (ms)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16 }} />
                         <Legend wrapperStyle={{ fontSize: '18px', paddingTop: '10px' }} />
                         <Area type="monotone" dataKey="latency" stroke="#f97316" strokeWidth={3} fill="#f97316" fillOpacity={0.3} isAnimationActive={false} name="Latence (ms)" />
                         <Area type="monotone" dataKey="requestsPerSecond" stroke="#3b82f6" strokeWidth={3} fill="transparent" isAnimationActive={false} name="Req/Sec" />
                     </AreaChart>
                   </ResponsiveContainer>
               )}
          </div>

          <div id="export-chart-performance" style={{ width: 1200, height: 600, background: '#1e293b', padding: 40 }}>
               {perfChartData.length > 0 && (
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perfChartData}>
                         <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 14}} />
                         <YAxis stroke="#94a3b8" tick={{fontSize: 14}} />
                         <Legend wrapperStyle={{ fontSize: '18px' }} />
                         <Bar dataKey="duration" fill="#10b981" isAnimationActive={false} name="Durée (ms)" label={{ position: 'top', fill: '#fff', fontSize: 14 }} />
                      </BarChart>
                   </ResponsiveContainer>
               )}
          </div>

          <div id="export-chart-topology" className="relative bg-slate-900 flex items-center justify-around" style={{ width: 1200, height: 500, padding: 40 }}>
               <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-600 opacity-20 transform -translate-y-1/2"></div>
               {result.topology?.nodes.map((node, index) => (
                  <div key={index} className="flex flex-col items-center z-10 scale-150 transform origin-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${node.status === 'active' ? 'border-green-500/50 bg-slate-800' : 'border-red-500/50 bg-slate-900'}`}>
                          {node.type === 'internet' && <Globe className="text-blue-400" size={24} />}
                          {node.type === 'firewall' && <ShieldCheck className="text-primary" size={24} />}
                          {node.type === 'load_balancer' && <Network className="text-purple-400" size={24} />}
                          {node.type === 'server' && <Server className="text-secondary" size={24} />}
                          {node.type === 'database' && <Activity className="text-orange-400" size={24} />}
                      </div>
                      <p className="mt-3 text-[10px] font-bold text-gray-300 uppercase bg-slate-900 px-2 py-1 rounded">{node.label}</p>
                  </div>
               ))}
          </div>

          <div id="export-chart-jmeter-latency" style={{ width: 1200, height: 600, background: '#1e293b', padding: 40 }}>
             {result.jmeterReport && (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.jmeterReport.samples}>
                        <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{fontSize: 14}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 14}} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16 }} />
                        <Legend wrapperStyle={{ fontSize: '18px' }} />
                        <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={4} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
             )}
          </div>

          <div id="export-chart-jmeter-throughput" style={{ width: 1200, height: 600, background: '#1e293b', padding: 40 }}>
             {result.jmeterReport && (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.jmeterReport.samples}>
                        <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{fontSize: 14}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 14}} />
                        <Legend wrapperStyle={{ fontSize: '18px' }} />
                        <Area type="monotone" dataKey="throughput" stroke="#10b981" fillOpacity={1} fill="url(#colorThroughput)" name="Throughput (req/s)" />
                        <Line type="monotone" dataKey="activeThreads" stroke="#f59e0b" strokeDasharray="3 3" dot={false} name="Active Threads" />
                    </AreaChart>
                </ResponsiveContainer>
             )}
          </div>

      </div>

    </div>
  );
};

// Helper for Selenium Icon (CheckCircle used in code but imported manually to avoid collision)
const CheckCircle = ({size, className}: {size: number, className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  );

export default ResultsView;
