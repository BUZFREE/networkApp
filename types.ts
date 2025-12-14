

export enum Severity {
  CRITICAL = 'CRITIQUE',
  HIGH = 'ÉLEVÉE',
  MEDIUM = 'MOYENNE',
  LOW = 'FAIBLE',
  INFO = 'INFO'
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

// Performance & Web Vitals
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

export interface PerformanceReport {
  overallScore: number;
  metrics: PerformanceMetric[];
  opportunities: PerformanceOpportunity[];
}

// Infrastructure & Monitoring Interfaces
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
  whoisRegistrar?: string;
  whoisDate?: string;
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

// New: Topology & Fingerprinting
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
  os: string; // e.g., "Ubuntu 22.04 LTS"
  osFamily: 'linux' | 'windows' | 'ios' | 'android' | 'other';
  deviceType: 'server' | 'firewall' | 'router' | 'iot';
  confidence: number; // 0-100
  details: string;
}

export interface GlobalPingRegion {
  region: string; // e.g., "North America"
  location: string; // e.g., "New York, USA"
  latency: number;
  status: 'online' | 'degraded' | 'offline';
}

// Selenium / Functional Testing
export interface SeleniumStep {
  stepNumber: number;
  action: string; // e.g., "Click Login Button"
  expectedResult: string;
  actualResult: string;
  status: 'pass' | 'fail' | 'warning';
  screenshotStub?: boolean; // To simulate a screenshot placeholder
}

export interface SeleniumScenario {
  name: string; // e.g. "User Login Flow"
  description: string;
  duration: string;
  status: 'pass' | 'fail';
  steps: SeleniumStep[];
}

// Apache JMeter Data
export interface JMeterSample {
    timestamp: string; // relative time e.g. "0s", "10s"
    activeThreads: number;
    latency: number; // ms
    throughput: number; // req/sec
    errorRate: number; // percentage
}

export interface JMeterSummary {
    totalSamples: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    stdDev: number;
    errorPct: number;
    throughput: number;
    p90: number; // 90th percentile
    p95: number;
    p99: number;
}

export interface JMeterReport {
    testPlanName: string;
    duration: string;
    summary: JMeterSummary;
    samples: JMeterSample[];
}

// Wireshark / Network Packets
export interface NetworkPacket {
    no: number;
    time: string;
    source: string;
    destination: string;
    protocol: string; // TCP, UDP, HTTP, TLSv1.3, DNS
    length: number;
    info: string;
    hexDump?: string; // Simulated raw data
    details?: {
        frame: string;
        ethernet: string;
        ip: string;
        transport: string; // TCP/UDP segment info
        application?: string; // HTTP/DNS info
    };
}

// New: DPI / Forensics
export interface ProtocolStat {
    protocol: string;
    percent: number;
    packets: number;
    bytes: number;
}

export interface ExpertInfo {
    severity: 'Chat' | 'Note' | 'Warning' | 'Error';
    group: string; // e.g. Sequence, Checksum
    protocol: string;
    summary: string;
}

export interface ReconstructedStream {
    id: string;
    title: string; // e.g. "Stream #4 (HTTP POST)"
    content: string; // ASCII content
    tags: string[]; // e.g. ["SQLi Detected", "Plaintext"]
}

export interface ForensicsReport {
    protocolStats: ProtocolStat[];
    expertIssues: ExpertInfo[];
    reconstructedStreams: ReconstructedStream[];
}

// New: IDS / IPS (Snort/Suricata)
export interface IdsAlert {
    timestamp: string;
    sid: string; // Signature ID e.g. "1:2001219"
    signature: string; // e.g. "ET POLICY PE EXE or DLL Windows file download"
    classification: string; // e.g. "Potential Corporate Privacy Violation"
    priority: number; // 1 (High), 2 (Medium), 3 (Low)
    protocol: string;
    sourceIp: string;
    sourcePort: number;
    destIp: string;
    destPort: number;
    action: 'allowed' | 'blocked' | 'logged';
}

export interface IdsReport {
    totalAlerts: number;
    alertsByPriority: { high: number, medium: number, low: number };
    blockedCount: number;
    alerts: IdsAlert[];
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
  
  // Optional Modules
  performanceReport?: PerformanceReport;
  serverHealth?: ServerHealth;
  networkStats?: NetworkStats;
  securityHeaders?: SecurityHeader[];
  loadTestResults?: LoadTestPoint[];
  
  // New Modules
  topology?: { nodes: TopologyNode[], links: TopologyLink[] };
  deviceFingerprint?: DeviceFingerprint;
  globalPing?: GlobalPingRegion[];
  seleniumReport?: SeleniumScenario[];
  jmeterReport?: JMeterReport;
  packetCapture?: NetworkPacket[];
  
  // Forensics
  forensicsReport?: ForensicsReport;
  
  // IDS/IPS
  idsReport?: IdsReport;
}

export interface ScanRequest {
  projectName?: string;
  target: string;
  tools: ToolType[];
  intensity: 'quick' | 'normal' | 'deep';
}
