
import React, { useState } from 'react';
import { Play, Loader2, CheckCircle2, Shield, Network, Zap, BarChart3, Database } from 'lucide-react';
import { ToolType, ScanRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ScannerFormProps {
  onStartScan: (request: ScanRequest) => void;
  isScanning: boolean;
}

const ScannerForm: React.FC<ScannerFormProps> = ({ onStartScan, isScanning }) => {
  const { t, language } = useLanguage();
  const [projectName, setProjectName] = useState('');
  const [target, setTarget] = useState('');
  const [selectedTools, setSelectedTools] = useState<ToolType[]>([
      ToolType.NMAP, 
      ToolType.LIGHTHOUSE, 
      ToolType.SERVER_HEALTH, 
      ToolType.HEADERS,
      ToolType.TOPOLOGY,
      ToolType.GLOBAL_PING,
      ToolType.SELENIUM,
      ToolType.JMETER,
      ToolType.WIRESHARK,
      ToolType.FORENSICS,
      ToolType.SNORT_SURICATA
  ]);
  const [intensity, setIntensity] = useState<ScanRequest['intensity']>('normal');

  const categories = [
    {
      name: 'Security & Vulnerability',
      icon: <Shield size={16} className="text-primary" />,
      tools: [
        { id: ToolType.NMAP, name: 'Nmap', desc: t('desc_nmap') },
        { id: ToolType.NIKTO, name: 'Nikto', desc: t('desc_nikto') },
        { id: ToolType.OPENVAS, name: 'OpenVAS', desc: t('desc_openvas') },
        { id: ToolType.OWASP_ZAP, name: 'OWASP ZAP', desc: t('desc_owasp') },
        { id: ToolType.SSL_LABS, name: 'SSL Labs', desc: t('desc_ssl') },
        { id: ToolType.SQLMAP, name: 'SQLMap', desc: t('desc_sqlmap') },
        { id: ToolType.SNORT_SURICATA, name: 'Snort / Suricata (IDS)', desc: t('desc_ids') },
      ]
    },
    {
      name: 'Network Intelligence (DPI)',
      icon: <Network size={16} className="text-secondary" />,
      tools: [
        { id: ToolType.FORENSICS, name: 'Network Forensics / DPI', desc: t('desc_forensics') },
        { id: ToolType.WIRESHARK, name: 'Wireshark Analysis', desc: t('desc_wireshark') },
        { id: ToolType.TOPOLOGY, name: 'Network Topology', desc: t('desc_topology') },
        { id: ToolType.GLOBAL_PING, name: 'Global Ping', desc: t('desc_global_ping') },
        { id: ToolType.TRACEROUTE, name: 'Traceroute', desc: t('desc_ping') },
      ]
    },
    {
      name: 'Performance & App Audit',
      icon: <Zap size={16} className="text-yellow-400" />,
      tools: [
        { id: ToolType.LIGHTHOUSE, name: 'Lighthouse', desc: t('desc_lighthouse') },
        { id: ToolType.HEADERS, name: 'Security Headers', desc: t('desc_headers') },
        { id: ToolType.WHATWEB, name: 'WhatWeb Fingerprinting', desc: t('desc_whatweb') },
        { id: ToolType.SERVER_HEALTH, name: 'Server Health Simulation', desc: t('desc_server_health') },
      ]
    },
    {
      name: 'Automation & Load Testing',
      icon: <BarChart3 size={16} className="text-purple-400" />,
      tools: [
        { id: ToolType.SELENIUM, name: 'Selenium Automation', desc: t('desc_selenium') },
        { id: ToolType.JMETER, name: 'Apache JMeter', desc: t('desc_jmeter') },
      ]
    }
  ];

  const handleToolToggle = (tool: ToolType) => {
    setSelectedTools(prev => 
      prev.includes(tool) 
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || selectedTools.length === 0) return;
    onStartScan({ target, tools: selectedTools, intensity, projectName, language });
  };

  return (
    <div className="bg-surface rounded-2xl border border-slate-700 p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-30 animate-pulse"></div>
      
      <h2 className="text-2xl font-black mb-8 text-white flex items-center tracking-tighter">
        <Play className={`text-primary ${language === 'ar' ? 'ml-3' : 'mr-3'} fill-primary/20 animate-pulse`} size={24} />
        {t('config_scan')}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest px-1 group-focus-within:text-primary transition-colors">
              {t('project_name')}
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('project_placeholder')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-gray-600 shadow-inner group-hover:border-slate-600"
              disabled={isScanning}
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest px-1 group-focus-within:text-secondary transition-colors">
              {t('target_label')}
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={t('target_placeholder')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all placeholder-gray-600 shadow-inner group-hover:border-slate-600"
              disabled={isScanning}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em] text-center">
            {t('modules_label')}
          </label>
          
          <div className="space-y-10">
            {categories.map((cat, cIdx) => (
              <div key={cIdx} className="space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
                  <div className="p-1.5 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">{cat.icon}</div>
                  <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{cat.name}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.tools.map((tool) => (
                    <div 
                      key={tool.id}
                      onClick={() => !isScanning && handleToolToggle(tool.id)}
                      className={`
                        relative p-5 rounded-xl border transition-all duration-300 group cursor-pointer
                        ${selectedTools.includes(tool.id) 
                          ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]' 
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-500 hover:bg-slate-800 hover:-translate-y-1'}
                        ${isScanning ? 'opacity-40 cursor-wait' : 'active:scale-95'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-black text-xs uppercase tracking-tight transition-colors ${selectedTools.includes(tool.id) ? 'text-primary' : 'text-gray-300 group-hover:text-white'}`}>
                            {tool.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed group-hover:text-gray-400 transition-colors">{tool.desc}</p>
                        </div>
                        {selectedTools.includes(tool.id) && (
                          <div className="bg-primary p-1 rounded-full text-slate-900 shadow-md shadow-primary/20 animate-in zoom-in">
                             <CheckCircle2 size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 transition-all hover:border-slate-700">
          <label className="block text-[10px] font-black text-gray-500 mb-4 uppercase tracking-widest text-center px-1">
            {t('intensity_label')}
          </label>
          <div className="flex justify-center space-x-4">
            {(['quick', 'normal', 'deep'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setIntensity(mode)}
                disabled={isScanning}
                className={`
                  flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border
                  ${intensity === mode 
                    ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20 scale-105' 
                    : 'bg-slate-950 text-gray-500 border-slate-800 hover:border-slate-600 hover:text-gray-300 active:scale-95'}
                `}
              >
                {mode === 'quick' ? t('intensity_quick') : mode === 'normal' ? t('intensity_normal') : t('intensity_deep')}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isScanning || !target || selectedTools.length === 0}
            className={`
              w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center transition-all duration-300 shadow-xl
              ${isScanning 
                ? 'bg-slate-800 text-gray-500 cursor-wait border border-slate-700' 
                : 'bg-primary hover:bg-emerald-500 text-white shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99]'}
            `}
          >
            {isScanning ? (
              <>
                <Loader2 className={`animate-spin ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                {t('btn_scanning')}
              </>
            ) : (
              <>
                <Shield className="mr-3 group-hover:rotate-12 transition-transform" size={18} />
                {t('btn_start_scan')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScannerForm;
