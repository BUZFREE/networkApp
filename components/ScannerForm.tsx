
import React, { useState } from 'react';
import { Play, Loader2, CheckCircle2 } from 'lucide-react';
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

  const toolsList = [
    // Network & Web Sec
    { id: ToolType.NMAP, name: 'Nmap', desc: t('desc_nmap') },
    { id: ToolType.NIKTO, name: 'Nikto', desc: t('desc_nikto') },
    { id: ToolType.OPENVAS, name: 'OpenVAS', desc: t('desc_openvas') },
    { id: ToolType.OWASP_ZAP, name: 'OWASP ZAP', desc: t('desc_owasp') },
    { id: ToolType.SSL_LABS, name: 'SSL Labs', desc: t('desc_ssl') },
    
    // App Specific
    { id: ToolType.SQLMAP, name: 'SQLMap', desc: t('desc_sqlmap') },
    { id: ToolType.WPSCAN, name: 'WpScan', desc: t('desc_wpscan') },
    
    // Recon & Fingerprinting
    { id: ToolType.WHATWEB, name: 'WhatWeb', desc: t('desc_whatweb') },
    { id: ToolType.WAPPALYZER, name: 'Wappalyzer', desc: t('desc_wappalyzer') },
    { id: ToolType.GOBUSTER, name: 'Gobuster', desc: t('desc_gobuster') },
    
    // Performance & Infrastructure
    { id: ToolType.LIGHTHOUSE, name: 'Lighthouse', desc: t('desc_lighthouse') },
    { id: ToolType.PING, name: 'Ping / Network', desc: t('desc_ping') },
    { id: ToolType.HEADERS, name: 'Security Headers', desc: t('desc_headers') },
    { id: ToolType.SERVER_HEALTH, name: 'Server Health', desc: t('desc_server_health') },
    
    // New: Advanced Topology
    { id: ToolType.TOPOLOGY, name: 'Network Topology', desc: t('desc_topology') },
    { id: ToolType.GLOBAL_PING, name: 'Global Ping', desc: t('desc_global_ping') },
    
    // New: Functional & Load Testing
    { id: ToolType.SELENIUM, name: 'Selenium Tests', desc: t('desc_selenium') },
    { id: ToolType.JMETER, name: 'Apache JMeter', desc: t('desc_jmeter') },
    
    // Wireshark & Forensics & IDS
    { id: ToolType.WIRESHARK, name: 'Wireshark Analysis', desc: t('desc_wireshark') },
    { id: ToolType.FORENSICS, name: 'Network Forensics / DPI', desc: t('desc_forensics') },
    { id: ToolType.SNORT_SURICATA, name: 'Snort / Suricata (IDS)', desc: t('desc_ids') },
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
    <div className="bg-surface rounded-xl border border-slate-700 p-6 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
        <Play className={`text-primary ${language === 'ar' ? 'ml-3' : 'mr-3'}`} size={24} />
        {t('config_scan')}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Project Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {t('project_name')}
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t('project_placeholder')}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-600"
            disabled={isScanning}
          />
        </div>

        {/* Target Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {t('target_label')}
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={t('target_placeholder')}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-600"
            disabled={isScanning}
          />
        </div>

        {/* Tools Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            {t('modules_label')}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {toolsList.map((tool) => (
              <div 
                key={tool.id}
                onClick={() => !isScanning && handleToolToggle(tool.id)}
                className={`
                  relative p-4 rounded-lg border cursor-pointer transition-all
                  ${selectedTools.includes(tool.id) 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-slate-900 border-slate-700 hover:border-slate-500'}
                  ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-semibold text-sm ${selectedTools.includes(tool.id) ? 'text-primary' : 'text-gray-300'}`}>
                      {tool.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 leading-tight">{tool.desc}</p>
                  </div>
                  {selectedTools.includes(tool.id) && (
                    <CheckCircle2 size={16} className={`text-primary flex-shrink-0 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            {t('intensity_label')}
          </label>
          <div className="flex space-x-4">
            {(['quick', 'normal', 'deep'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setIntensity(mode)}
                disabled={isScanning}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors
                  ${intensity === mode 
                    ? 'bg-secondary text-white' 
                    : 'bg-slate-900 text-gray-400 border border-slate-700 hover:text-white'}
                `}
              >
                {mode === 'quick' ? t('intensity_quick') : mode === 'normal' ? t('intensity_normal') : t('intensity_deep')}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isScanning || !target || selectedTools.length === 0}
            className={`
              w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center transition-all
              ${isScanning 
                ? 'bg-slate-700 text-gray-400 cursor-wait' 
                : 'bg-primary hover:bg-emerald-600 text-white shadow-lg shadow-primary/20'}
            `}
          >
            {isScanning ? (
              <>
                <Loader2 className={`animate-spin ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                {t('btn_scanning')}
              </>
            ) : (
              t('btn_start_scan')
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScannerForm;
