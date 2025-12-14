
import React, { useState } from 'react';
import { Play, Loader2, CheckCircle2 } from 'lucide-react';
import { ToolType, ScanRequest } from '../types';

interface ScannerFormProps {
  onStartScan: (request: ScanRequest) => void;
  isScanning: boolean;
}

const toolsList = [
  // Network & Web Sec
  { id: ToolType.NMAP, name: 'Nmap', desc: 'Découverte réseau et ports ouverts' },
  { id: ToolType.NIKTO, name: 'Nikto', desc: 'Scanner de serveur web et config' },
  { id: ToolType.OPENVAS, name: 'OpenVAS', desc: 'Gestion complète des vulnérabilités' },
  { id: ToolType.OWASP_ZAP, name: 'OWASP ZAP', desc: 'Scanner web applicatif intégré' },
  { id: ToolType.SSL_LABS, name: 'SSL Labs', desc: 'Analyse configuration SSL/TLS & Certificats' },
  
  // App Specific
  { id: ToolType.SQLMAP, name: 'SQLMap', desc: 'Détection d\'injections SQL' },
  { id: ToolType.WPSCAN, name: 'WpScan', desc: 'Audit WordPress & Plugins' },
  
  // Recon & Fingerprinting
  { id: ToolType.WHATWEB, name: 'WhatWeb', desc: 'Identification technologies' },
  { id: ToolType.WAPPALYZER, name: 'Wappalyzer', desc: 'Détection Frameworks' },
  { id: ToolType.GOBUSTER, name: 'Gobuster', desc: 'Brute-force (Fichiers cachés)' },
  
  // Performance & Infrastructure
  { id: ToolType.LIGHTHOUSE, name: 'Lighthouse', desc: 'Audit Performance Web (Web Vitals)' },
  { id: ToolType.PING, name: 'Ping / Network', desc: 'Latence, DNS & Traceroute' },
  { id: ToolType.HEADERS, name: 'Security Headers', desc: 'Analyse HSTS, CSP, X-Frame' },
  { id: ToolType.SERVER_HEALTH, name: 'Server Health', desc: 'Simul. CPU/RAM & Load Test' },
  
  // New: Advanced Topology
  { id: ToolType.TOPOLOGY, name: 'Network Topology', desc: 'Visualisation de l\'architecture' },
  { id: ToolType.GLOBAL_PING, name: 'Global Ping', desc: 'Disponibilité mondiale & Latence' },
  
  // New: Functional & Load Testing
  { id: ToolType.SELENIUM, name: 'Selenium Tests', desc: 'Automation E2E & Form Fuzzing' },
  { id: ToolType.JMETER, name: 'Apache JMeter', desc: 'Test de charge & Stress Test' },
  
  // Wireshark & Forensics
  { id: ToolType.WIRESHARK, name: 'Wireshark Analysis', desc: 'Capture de paquets & Analyse protocolaire' },
  { id: ToolType.FORENSICS, name: 'Network Forensics / DPI', desc: 'Expert Info, Reconstruction de Flux & Stats' },
];

const ScannerForm: React.FC<ScannerFormProps> = ({ onStartScan, isScanning }) => {
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
      ToolType.FORENSICS
  ]);
  const [intensity, setIntensity] = useState<ScanRequest['intensity']>('normal');

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
    onStartScan({ target, tools: selectedTools, intensity, projectName });
  };

  return (
    <div className="bg-surface rounded-xl border border-slate-700 p-6 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
        <Play className="mr-3 text-primary" size={24} />
        Configurer le Scan
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Project Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Nom du Projet (Optionnel)
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="ex: Audit Client X - Q3"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-600"
            disabled={isScanning}
          />
        </div>

        {/* Target Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Cible (URL ou Adresse IP)
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="ex: scanme.nmap.org ou 192.168.1.1"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-600"
            disabled={isScanning}
          />
        </div>

        {/* Tools Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Modules d'Analyse
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
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0 ml-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Intensité du scan
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
                {mode === 'quick' ? 'Rapide' : mode === 'normal' ? 'Normal' : 'Approfondi'}
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
                <Loader2 className="animate-spin mr-3" />
                Analyse IA en cours...
              </>
            ) : (
              'Lancer le Scan Complet'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScannerForm;
