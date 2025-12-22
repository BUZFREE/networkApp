
import React, { useState } from 'react';
import { 
  Search, Filter, Plus, MoreVertical, Server, Laptop, Router, ShieldAlert, Cpu, 
  MapPin, Database, Activity, LayoutGrid, List, Globe, Hash, Info, Layers, 
  HardDrive, Monitor, Zap, Cloud, Home, ChevronRight, Menu, Wrench, Settings, 
  Radio, Share2, Network, Tag, Users, Cable, Box, Package, Key, RefreshCcw, Link2, CheckCircle, XCircle
} from 'lucide-react';
import { NetworkDevice, DeviceStatus, DeviceRole, IPPrefix, IPAddress, VLAN, VirtualMachine, Site } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const InventoryManager: React.FC = () => {
  const { t, language, dir } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'organization' | 'dcim' | 'ipam' | 'virtualization' | 'circuits' | 'discovery' | 'integrations'>('dashboard');
  const [activeSubMenu, setActiveSubMenu] = useState<string>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- MOCK DATA ---
  const [sites] = useState<Site[]>([
    { id: '1', name: 'HQ Paris', slug: 'hq-paris', status: 'active', region: 'Europe', facility: 'Equinix PA4', deviceCount: 24, vmCount: 12, prefixCount: 4 },
    { id: '2', name: 'Branch Lyon', slug: 'br-lyon', status: 'active', region: 'Europe', facility: 'Internal DC', deviceCount: 8, vmCount: 4, prefixCount: 2 },
  ]);

  const [devices] = useState<NetworkDevice[]>([
    { id: '1', name: 'CORE-SW-01', primaryIp: '10.0.0.1', macAddress: '00:1A:2B:3C:4D:5E', status: DeviceStatus.ACTIVE, role: DeviceRole.CORE_SWITCH, site: 'HQ Paris', manufacturer: 'Cisco', deviceType: 'Nexus 9300', platform: 'NX-OS', lastSeen: new Date().toISOString(), rack: 'Rack 1A' },
    { id: '2', name: 'SRV-PROD-SQL-01', primaryIp: '10.0.1.50', macAddress: '00:50:56:94:00:11', status: DeviceStatus.ACTIVE, role: DeviceRole.SERVER, site: 'HQ Paris', manufacturer: 'Dell', deviceType: 'PowerEdge R740', platform: 'Ubuntu 22.04', lastSeen: new Date().toISOString(), rack: 'Rack 1B' },
    { id: '3', name: 'FW-PERIMETER-01', primaryIp: '192.168.1.1', macAddress: 'BC:FE:D9:88:77:66', status: DeviceStatus.ACTIVE, role: DeviceRole.FIREWALL, site: 'HQ Paris', manufacturer: 'Fortinet', deviceType: 'FortiGate 100F', platform: 'FortiOS', lastSeen: new Date().toISOString(), rack: 'Rack 1A' },
  ]);

  const [prefixes] = useState<IPPrefix[]>([
    { id: 'p1', prefix: '10.0.0.0/24', status: 'active', vlan: 10, description: 'Core Network', utilization: 85, site: 'HQ Paris' },
    { id: 'p2', prefix: '10.0.1.0/24', status: 'active', vlan: 20, description: 'Server VLAN', utilization: 42, site: 'HQ Paris' },
    { id: 'p3', prefix: '10.0.5.0/24', status: 'active', vlan: 50, description: 'IoT Devices', utilization: 12, site: 'Branch Lyon' },
  ]);

  const [vms] = useState<VirtualMachine[]>([
    { id: 'v1', name: 'WEB-FRONT-01', status: DeviceStatus.ACTIVE, cluster: 'K8S-Prod-01', role: DeviceRole.SERVER, vcpus: 4, memoryGb: 8, diskGb: 40, primaryIp: '10.0.1.10', site: 'HQ Paris' },
    { id: 'v2', name: 'AUTH-API-NODE', status: DeviceStatus.ACTIVE, cluster: 'K8S-Prod-01', role: DeviceRole.SERVER, vcpus: 2, memoryGb: 4, diskGb: 20, primaryIp: '10.0.1.11', site: 'HQ Paris' },
  ]);

  const [integrations] = useState([
    { id: 'netbox', name: 'NetBox Labs API', status: 'connected', type: 'IPAM/DCIM', lastSync: '10 min ago' },
    { id: 'vmware', name: 'VMware vCenter', status: 'connected', type: 'Virtualization', lastSync: '1 hour ago' },
    { id: 'aws', name: 'AWS Cloud Explorer', status: 'degraded', type: 'Cloud', lastSync: 'Yesterday' },
    { id: 'snort', name: 'Snort IDS Agent', status: 'connected', type: 'Security', lastSync: 'Real-time' },
  ]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (['active', 'online', 'connected'].includes(s)) return 'bg-green-500/10 text-green-500 border-green-500/20 shadow-sm shadow-green-500/5';
    if (['offline', 'failed', 'retired', 'disconnected'].includes(s)) return 'bg-red-500/10 text-red-500 border-red-500/20 shadow-sm shadow-red-500/5';
    if (['staging', 'planned', 'degraded'].includes(s)) return 'bg-blue-500/10 text-blue-400 border-blue-400/20 shadow-sm shadow-blue-400/5';
    return 'bg-slate-700 text-gray-400 border-slate-600';
  };

  const SidebarItem = ({ id, label, icon, subItems }: { id: any, label: string, icon: any, subItems?: string[] }) => (
    <div className="space-y-1 animate-in slide-in-from-left duration-300">
      <button 
        onClick={() => { setActiveMenu(id); setActiveSubMenu(subItems ? subItems[0] : 'overview'); }}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-black group active:scale-95 ${
          activeMenu === id 
            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
            : 'text-gray-500 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center space-x-3">
          <span className={`transition-transform duration-300 ${activeMenu === id ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>{icon}</span>
          <span className="tracking-tighter uppercase">{label}</span>
        </div>
        {subItems && <ChevronRight size={14} className={`transition-transform duration-300 ${activeMenu === id ? 'rotate-90 scale-125' : 'group-hover:translate-x-1'}`} />}
      </button>
      {activeMenu === id && subItems && (
        <div className={`ml-8 mt-1 border-l-2 border-slate-800 space-y-0.5 ${dir === 'rtl' ? 'mr-8 ml-0 border-r-2 border-l-0' : ''}`}>
          {subItems.map(sub => (
            <button 
              key={sub}
              onClick={() => setActiveSubMenu(sub)}
              className={`w-full text-left px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all relative group/sub ${
                activeSubMenu === sub ? 'text-primary' : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              {activeSubMenu === sub && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary animate-pulse"></span>}
              <span className="transition-transform group-hover/sub:translate-x-1 inline-block">{sub.replace('-', ' ')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-140px)] bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl animate-fade-in">
      
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-slate-800 bg-slate-900/30">
          <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center">
            <Layers size={14} className="mr-3 text-primary animate-pulse" />
            NetBox Explorer
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <SidebarItem id="dashboard" label="Dashboard" icon={<LayoutGrid size={18} />} />
          <SidebarItem id="organization" label="Org" icon={<Globe size={18} />} subItems={['sites', 'regions', 'locations']} />
          <SidebarItem id="dcim" label="DCIM" icon={<Server size={18} />} subItems={['devices', 'racks', 'manufacturers']} />
          <SidebarItem id="ipam" label="IPAM" icon={<Hash size={18} />} subItems={['prefixes', 'addresses', 'vlans']} />
          <SidebarItem id="virtualization" label="Virtual" icon={<Cloud size={18} />} subItems={['virtual-machines', 'clusters']} />
          <SidebarItem id="integrations" label="Integrations" icon={<Settings size={18} />} subItems={['endpoints', 'tokens', 'sync-jobs']} />
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
           <span className="text-[9px] text-gray-600 font-black font-mono uppercase tracking-widest">v2.4.1-STABLE</span>
           <div className="flex space-x-3">
             <button className="text-gray-600 hover:text-primary transition-all hover:scale-110 active:scale-90"><Tag size={12} /></button>
             <button className="text-gray-600 hover:text-primary transition-all hover:scale-110 active:scale-90"><RefreshCcw size={12} className="hover:rotate-180 transition-transform duration-500" /></button>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
        
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-8">
          <div className="flex items-center space-x-3 text-xs">
            <Home size={14} className="text-gray-600" />
            <span className="text-gray-800">/</span>
            <span className="text-primary font-black uppercase tracking-widest">{activeMenu}</span>
            {activeSubMenu !== 'overview' && (
                <>
                <span className="text-gray-800">/</span>
                <span className="text-white font-black uppercase tracking-widest">{activeSubMenu.replace('-', ' ')}</span>
                </>
            )}
          </div>
          <div className="flex items-center space-x-5">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Global Search..." 
                className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-72 shadow-inner transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-primary hover:bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-110 active:scale-90 transition-all">
                <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-900/50">
          
          {activeMenu === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Devices', count: devices.length, color: 'text-primary', icon: <Server /> },
                  { label: 'Prefixes', count: prefixes.length, color: 'text-secondary', icon: <Hash /> },
                  { label: 'Sites', count: sites.length, color: 'text-pink-400', icon: <Globe /> },
                  { label: 'VMs', count: vms.length, color: 'text-warning', icon: <Cloud /> },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between group hover:border-slate-500 transition-all hover:-translate-y-1 active:scale-[0.98] cursor-pointer">
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                      <p className={`text-4xl font-black mt-2 transition-transform group-hover:scale-110 group-hover:translate-x-1 ${stat.color}`}>{stat.count}</p>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl group-hover:bg-slate-800 transition-all group-hover:rotate-12">
                      {React.cloneElement(stat.icon as React.ReactElement<any>, { className: stat.color, size: 28 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'integrations' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-xl">
                        <h3 className="text-xs font-black text-white mb-8 uppercase flex items-center tracking-[0.3em]">
                            <Link2 size={18} className="mr-3 text-primary" /> Connected Systems
                        </h3>
                        <div className="space-y-5">
                            {integrations.map(int => (
                                <div key={int.id} className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-between group hover:bg-slate-800 hover:border-slate-600 transition-all hover:scale-[1.02] cursor-pointer">
                                    <div className="flex items-center space-x-5">
                                        <div className={`p-3 rounded-xl transition-all group-hover:rotate-6 ${int.status === 'connected' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white shadow-lg shadow-primary/20' : 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white shadow-lg shadow-warning/20'}`}>
                                            {int.id === 'netbox' && <Database size={20} />}
                                            {int.id === 'vmware' && <Cloud size={20} />}
                                            {int.id === 'aws' && <Globe size={20} />}
                                            {int.id === 'snort' && <ShieldAlert size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm uppercase tracking-tight">{int.name}</p>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">{int.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest ${getStatusBadge(int.status)}`}>{int.status}</span>
                                        <p className="text-[10px] text-gray-700 font-mono mt-2">{int.lastSync}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-xl">
                        <h3 className="text-xs font-black text-white mb-8 uppercase flex items-center tracking-[0.3em]">
                            <Key size={18} className="mr-3 text-secondary" /> Secure Credentials
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-3 group/field">
                                <label className="text-[10px] text-gray-600 uppercase font-black px-1 group-focus-within/field:text-primary transition-colors tracking-widest">NetBox API Token</label>
                                <div className="flex space-x-3">
                                    <input type="password" value="********************************" readOnly className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-gray-500 focus:outline-none focus:border-primary transition-all shadow-inner" />
                                    <button className="bg-slate-800 p-3 rounded-xl text-gray-500 hover:text-white hover:bg-slate-700 transition-all border border-slate-700 hover:scale-110 active:scale-90"><RefreshCcw size={18} /></button>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2 group/field">
                                <label className="text-[10px] text-gray-600 uppercase font-black px-1 group-focus-within/field:text-secondary transition-colors tracking-widest">Automation Hook</label>
                                <div className="flex space-x-3">
                                    <input type="text" value="https://secuscan.local/v1/hook" readOnly className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-mono text-secondary focus:outline-none focus:border-secondary transition-all shadow-inner" />
                                    <button className="bg-slate-800 p-3 rounded-xl text-gray-500 hover:text-white hover:bg-slate-700 transition-all border border-slate-700 hover:scale-110 active:scale-90"><Link2 size={18} /></button>
                                </div>
                            </div>
                            <button className="w-full mt-6 bg-primary text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Update Data Vault
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950 p-12 rounded-[2.5rem] border border-slate-800 shadow-2xl text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <Activity className="mx-auto text-slate-800 mb-6 group-hover:text-primary transition-colors group-hover:scale-110" size={64} />
                    <h4 className="text-white font-black uppercase text-lg tracking-[0.25em] mb-4">Inventory Engine Active</h4>
                    <p className="text-gray-500 text-xs max-w-xl mx-auto leading-loose tracking-tight font-medium">
                        Your network inventory is synced every <span className="text-primary font-black">15 minutes</span> with your distributed infrastructure. 
                        Security deviations are automatically indexed in the <span className="text-secondary font-black underline">Discovery Logs</span>.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-10">
                        <div className="flex items-center space-x-3 group/stat transition-transform hover:scale-110"><CheckCircle size={16} className="text-primary" /><span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Active Agents: 12</span></div>
                        <div className="flex items-center space-x-3 group/stat transition-transform hover:scale-110"><XCircle size={16} className="text-danger" /><span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Sync Failures: 0</span></div>
                        <button className="flex items-center space-x-3 group/stat bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 hover:border-primary transition-all hover:scale-110 active:scale-95"><RefreshCcw size={14} className="text-secondary group-hover/stat:rotate-180 transition-transform duration-700" /><span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Queue Status: Idle</span></button>
                    </div>
                </div>
            </div>
          )}

          {activeMenu === 'dcim' && activeSubMenu === 'devices' && (
            <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in slide-in-from-right duration-500">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/50 text-gray-600 font-black uppercase tracking-[0.2em] border-b border-slate-800">
                  <tr>
                    <th className="p-6">Device Identity</th>
                    <th className="p-6">State</th>
                    <th className="p-6">Role</th>
                    <th className="p-6">Primary IPv4</th>
                    <th className="p-6">DC Site</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {devices.map(dev => (
                    <tr key={dev.id} className="hover:bg-slate-900/30 transition-all duration-200 group">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-black text-white text-sm group-hover:text-primary cursor-pointer transition-colors uppercase tracking-tight">{dev.name}</span>
                          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">{dev.manufacturer} {dev.deviceType}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${getStatusBadge(dev.status)} group-hover:brightness-110`}>{dev.status}</span>
                      </td>
                      <td className="p-6 font-black text-gray-500 uppercase text-[10px] tracking-tighter">{dev.role}</td>
                      <td className="p-6 font-mono text-secondary font-black text-sm group-hover:scale-105 origin-left transition-transform">{dev.primaryIp}</td>
                      <td className="p-6 text-gray-600 font-black uppercase text-[10px] tracking-widest">{dev.site}</td>
                      <td className="p-6 text-right">
                        <button className="text-gray-700 hover:text-white transition-all p-2 hover:bg-slate-800 rounded-xl active:scale-90"><MoreVertical size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!['dashboard', 'dcim', 'integrations'].includes(activeMenu) && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 animate-in zoom-in duration-300">
                <div className="w-32 h-32 bg-slate-950 border border-slate-800 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl text-slate-800 group hover:border-primary/30 transition-all">
                   <Box size={50} className="group-hover:scale-110 group-hover:text-primary transition-all duration-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter italic">Module indexing in progress</h3>
                <p className="text-gray-600 max-w-sm text-xs font-bold uppercase tracking-widest leading-relaxed">
                   Sub-module <span className="text-primary">{activeSubMenu}</span> is currently syncing via NetBox API.
                </p>
                <button className="mt-10 px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 uppercase tracking-[0.2em] text-[10px]">
                   <RefreshCcw size={16} strokeWidth={3} className="hover:rotate-180 transition-transform duration-500" />
                   <span>Manual Pulse</span>
                </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default InventoryManager;
