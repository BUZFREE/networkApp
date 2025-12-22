
export enum Severity {
  CRITICAL = 'CRITIQUE',
  HIGH = 'ÉLEVÉE',
  MEDIUM = 'MOYENNE',
  LOW = 'FAIBLE',
  INFO = 'INFO'
}

export enum DeviceStatus {
  ACTIVE = 'Active',
  OFFLINE = 'Offline',
  STAGING = 'Staging',
  RESERVED = 'Reserved',
  DECOMMISSIONED = 'Decommissioned',
  FAILED = 'Failed',
  INVENTORY = 'Inventory'
}

export enum DeviceRole {
  CORE_SWITCH = 'Core Switch',
  ACCESS_SWITCH = 'Access Switch',
  DISTRIBUTION_SWITCH = 'Distribution Switch',
  ROUTER = 'Router',
  FIREWALL = 'Firewall',
  SERVER = 'Server',
  IOT = 'IoT Device',
  WORKSTATION = 'Workstation',
  PDU = 'PDU',
  CONSOLE_SERVER = 'Console Server'
}

export interface NetworkDevice {
  id: string;
  name: string;
  primaryIp: string;
  macAddress: string;
  status: DeviceStatus;
  role: DeviceRole;
  site: string;
  location?: string;
  rack?: string;
  manufacturer: string;
  deviceType: string;
  platform?: string;
  lastSeen: string;
  serial?: string;
}

export interface IPPrefix {
  id: string;
  prefix: string;
  status: 'active' | 'reserved' | 'container' | 'deprecated';
  vlan?: number;
  vrf?: string;
  role?: string;
  site?: string;
  description: string;
  utilization: number;
}

export interface IPAddress {
  id: string;
  address: string;
  status: 'active' | 'reserved' | 'deprecated' | 'dhcp';
  dnsName?: string;
  description?: string;
  assignedTo?: string; // Device ID or VM ID
}

export interface VLAN {
  id: string;
  vid: number;
  name: string;
  status: 'active' | 'reserved' | 'deprecated';
  site?: string;
  group?: string;
  description?: string;
}

export interface VirtualMachine {
  id: string;
  name: string;
  status: DeviceStatus;
  cluster: string;
  role: DeviceRole;
  vcpus?: number;
  memoryGb?: number;
  diskGb?: number;
  primaryIp: string;
  site: string;
}

export interface Site {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'planned' | 'retired';
  region?: string;
  facility?: string;
  deviceCount: number;
  vmCount: number;
  prefixCount: number;
}

export enum ToolType {
  NMAP = 'Nmap',
  NIKTO = 'Nikto',
  OPENVAS = 'OpenVAS',
  OWASP_ZAP = 'OWASP ZAP',
  SQLMAP = 'SQLMap',
  WPSCAN = 'WpScan',
  SSL_LABS = 'SSL Labs',
  WHATWEB = 'WhatWeb',
  WAPPALYZER = 'Wappalyzer',
  GOBUSTER = 'Gobuster',
  LIGHTHOUSE = 'Google Lighthouse',
  PING = 'Ping / Latency',
  TRACEROUTE = 'Traceroute',
  WHOIS = 'Whois Info',
  HEADERS = 'Security Headers',
  SERVER_HEALTH = 'Server Health (Simulated)',
  TOPOLOGY = 'Network Topology',
  GLOBAL_PING = 'Global Ping / Outage',
  SELENIUM = 'Selenium Automation',
  JMETER = 'Apache JMeter',
  WIRESHARK = 'Wireshark Traffic Analysis',
  FORENSICS = 'Network Forensics / DPI',
  SNORT_SURICATA = 'Snort / Suricata (IDS/IPS)'
}

export interface Vulnerability {
  id: string;
  name: string;
  severity: Severity;
  description: string;
  remediation: string;
  toolDetected: string;
}

export interface OpenPort {
  port: number;
  service: string;
  version?: string;
  state: 'open' | 'filtered' | 'closed';
}

export interface ConnectedAsset {
  ip: string;
  hostname: string;
  type: 'Primary' | 'Subdomain' | 'Mail Server' | 'Load Balancer' | 'CDN' | 'Database';
  location: string;
}

export interface PerformanceReport {
  overallScore: number;
  metrics: PerformanceMetric[];
  opportunities: PerformanceOpportunity[];
}

export interface PerformanceMetric {
  name: string;
  value: string;
  score: 'good' | 'needs-improvement' | 'poor';
  description: string;
}

export interface PerformanceOpportunity {
  title: string;
  savings: string;
  description: string;
}

export interface ServerHealth {
  cpuUsage: number;
  ramUsage: number;
  uptime: string;
  os: string;
}

export interface NetworkStats {
  ping: number;
  packetLoss: number;
  dnsProvider: string;
  traceroute: string[];
}

export interface SecurityHeader {
  name: string;
  value: string;
  status: 'secure' | 'insecure' | 'missing';
  recommendation?: string;
}

export interface LoadTestPoint {
  time: string;
  requestsPerSecond: number;
  latency: number;
  errors: number;
}

export interface TopologyNode {
  id: string;
  label: string;
  type: 'internet' | 'firewall' | 'load_balancer' | 'server' | 'database';
  status: 'active' | 'inactive';
}

export interface TopologyLink {
  source: string;
  target: string;
}

export interface DeviceFingerprint {
  os: string;
  osFamily: 'linux' | 'windows' | 'ios' | 'android' | 'other';
  deviceType: 'server' | 'firewall' | 'router' | 'iot';
  confidence: number;
  details: string;
}

export interface GlobalPingRegion {
  region: string;
  location: string;
  latency: number;
  status: 'online' | 'degraded' | 'offline';
}

export interface SeleniumScenario {
  name: string;
  description: string;
  duration: string;
  status: 'pass' | 'fail';
  steps: SeleniumStep[];
}

export interface SeleniumStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  actualResult: string;
  status: 'pass' | 'fail' | 'warning';
}

export interface JMeterReport {
    testPlanName: string;
    duration: string;
    summary: JMeterSummary;
    samples: JMeterSample[];
}

export interface JMeterSummary {
    totalSamples: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    stdDev: number;
    errorPct: number;
    throughput: number;
    p90: number;
    p95: number;
    p99: number;
}

export interface JMeterSample {
    timestamp: string;
    activeThreads: number;
    latency: number;
    throughput: number;
    errorRate: number;
}

export interface NetworkPacket {
    no: number;
    time: string;
    source: string;
    destination: string;
    protocol: string;
    length: number;
    info: string;
    details?: any;
}

export interface ForensicsReport {
    protocolStats: any[];
    expertIssues: any[];
    reconstructedStreams: any[];
}

export interface IdsReport {
    totalAlerts: number;
    alertsByPriority: { high: number, medium: number, low: number };
    blockedCount: number;
    alerts: any[];
}

export interface ScanResult {
  id: string;
  projectName?: string;
  targetUrl: string;
  targetIp: string;
  timestamp: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  overallScore: number;
  toolsUsed: ToolType[];
  openPorts: OpenPort[];
  connectedAssets: ConnectedAsset[];
  vulnerabilities: Vulnerability[];
  aiAnalysis: string;
  performanceReport?: PerformanceReport;
  serverHealth?: ServerHealth;
  networkStats?: NetworkStats;
  securityHeaders?: SecurityHeader[];
  loadTestResults?: LoadTestPoint[];
  topology?: { nodes: TopologyNode[], links: TopologyLink[] };
  deviceFingerprint?: DeviceFingerprint;
  globalPing?: GlobalPingRegion[];
  seleniumReport?: SeleniumScenario[];
  jmeterReport?: JMeterReport;
  packetCapture?: NetworkPacket[];
  forensicsReport?: ForensicsReport;
  idsReport?: IdsReport;
}

export interface ScanRequest {
  projectName?: string;
  target: string;
  tools: ToolType[];
  intensity: 'quick' | 'normal' | 'deep';
  language: 'fr' | 'en' | 'ar';
}
