
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations = {
  fr: {
    // Layout
    'dashboard': 'Tableau de bord',
    'new_scan': 'Nouveau Scan',
    'history': 'Historique',
    'tutorials': 'Tutoriels & Démo',
    'os_system': 'Système Opérationnel',
    
    // Dashboard
    'dashboard_title': 'Tableau de Bord',
    'scan_running': 'scan(s) en cours',
    'scan_completed': 'scans effectués',
    'start_analysis_title': 'Démarrer une analyse',
    'start_analysis_desc': 'Lancez un nouveau test de sécurité sur votre infrastructure.',
    'btn_new_scan': 'Nouveau Scan',
    'recent_activity': 'Activité Récente',
    'no_history': 'Aucun historique disponible.',
    'module_active': 'Actif',
    
    // Form
    'config_scan': 'Configurer le Scan',
    'project_name': 'Nom du Projet (Optionnel)',
    'project_placeholder': 'ex: Audit Client X - Q3',
    'target_label': 'Cible (URL ou Adresse IP)',
    'target_placeholder': 'ex: scanme.nmap.org ou 192.168.1.1',
    'modules_label': 'Modules d\'Analyse',
    'intensity_label': 'Intensité du scan',
    'intensity_quick': 'Rapide',
    'intensity_normal': 'Normal',
    'intensity_deep': 'Approfondi',
    'btn_start_scan': 'Lancer le Scan Complet',
    'btn_scanning': 'Analyse IA en cours...',
    
    // History
    'history_title': 'Historique des Scans',
    'table_target': 'Cible',
    'table_date': 'Date',
    'table_status': 'État',
    'table_ai': 'Analyse IA',
    'table_score': 'Score',
    'table_vulns': 'Failles',
    'table_actions': 'Actions',
    'status_completed': 'Terminé',
    'status_failed': 'Échoué',
    'status_running': 'En cours',
    'btn_report': 'Rapport',
    'tools_used': 'Outils Utilisés',
    'services_ports': 'Services & Ports',
    'crit_vulns': 'Vulnérabilités Critiques',
    'view_all': 'Voir tout',
    'no_vulns': 'Aucune vulnérabilité.',
    
    // Tool Descriptions
    'desc_nmap': 'Découverte réseau et ports ouverts',
    'desc_ids': 'Détection d\'intrusion, Signatures & Alertes',
    'desc_nikto': 'Scanner de serveur web et config',
    'desc_openvas': 'Gestion complète des vulnérabilités',
    'desc_owasp': 'Scanner web applicatif intégré',
    'desc_ssl': 'Analyse configuration SSL/TLS & Certificats',
    'desc_sqlmap': 'Détection d\'injections SQL',
    'desc_wpscan': 'Audit WordPress & Plugins',
    'desc_whatweb': 'Identification technologies',
    'desc_wappalyzer': 'Détection Frameworks',
    'desc_gobuster': 'Brute-force (Fichiers cachés)',
    'desc_lighthouse': 'Audit Performance Web (Web Vitals)',
    'desc_ping': 'Latence, DNS & Traceroute',
    'desc_headers': 'Analyse HSTS, CSP, X-Frame',
    'desc_server_health': 'Simul. CPU/RAM & Load Test',
    'desc_topology': 'Visualisation de l\'architecture',
    'desc_global_ping': 'Disponibilité mondiale & Latence',
    'desc_selenium': 'Automation E2E & Form Fuzzing',
    'desc_jmeter': 'Test de charge & Stress Test (Apache JMeter)',
    'desc_wireshark': 'Capture de paquets & Analyse protocolaire',
    'desc_forensics': 'Expert Info, Reconstruction de Flux & Stats',

    // Result Tabs
    'tab_overview': 'Vue d\'ensemble',
    'tab_infrastructure': 'Infrastructure',
    'tab_network': 'Réseau',
    'tab_topology': 'Topologie',
    'tab_selenium': 'Automatisation',
    'tab_jmeter': 'Test de Charge',
    'tab_traffic': 'Trafic Réseau',
    'tab_ids': 'IDS / IPS',
  },
  en: {
    // Layout
    'dashboard': 'Dashboard',
    'new_scan': 'New Scan',
    'history': 'History',
    'tutorials': 'Tutorials & Demo',
    'os_system': 'Operational System',
    
    // Dashboard
    'dashboard_title': 'Dashboard',
    'scan_running': 'scan(s) running',
    'scan_completed': 'scans completed',
    'start_analysis_title': 'Start Analysis',
    'start_analysis_desc': 'Launch a new security test on your infrastructure.',
    'btn_new_scan': 'New Scan',
    'recent_activity': 'Recent Activity',
    'no_history': 'No history available.',
    'module_active': 'Active',
    
    // Form
    'config_scan': 'Configure Scan',
    'project_name': 'Project Name (Optional)',
    'project_placeholder': 'e.g., Audit Client X - Q3',
    'target_label': 'Target (URL or IP Address)',
    'target_placeholder': 'e.g., scanme.nmap.org or 192.168.1.1',
    'modules_label': 'Analysis Modules',
    'intensity_label': 'Scan Intensity',
    'intensity_quick': 'Quick',
    'intensity_normal': 'Normal',
    'intensity_deep': 'Deep',
    'btn_start_scan': 'Start Full Scan',
    'btn_scanning': 'AI Analysis in progress...',
    
    // History
    'history_title': 'Scan History',
    'table_target': 'Target',
    'table_date': 'Date',
    'table_status': 'Status',
    'table_ai': 'AI Analysis',
    'table_score': 'Score',
    'table_vulns': 'Vulns',
    'table_actions': 'Actions',
    'status_completed': 'Completed',
    'status_failed': 'Failed',
    'status_running': 'Running',
    'btn_report': 'Report',
    'tools_used': 'Tools Used',
    'services_ports': 'Services & Ports',
    'crit_vulns': 'Critical Vulnerabilities',
    'view_all': 'View all',
    'no_vulns': 'No vulnerabilities.',
    
    // Tool Descriptions
    'desc_nmap': 'Network discovery and open ports',
    'desc_ids': 'Intrusion Detection, Signatures & Alerts',
    'desc_nikto': 'Web server scanner & config',
    'desc_openvas': 'Full vulnerability management',
    'desc_owasp': 'Integrated web app scanner',
    'desc_ssl': 'SSL/TLS config & Certificate analysis',
    'desc_sqlmap': 'SQL Injection detection',
    'desc_wpscan': 'WordPress & Plugins Audit',
    'desc_whatweb': 'Technology identification',
    'desc_wappalyzer': 'Framework detection',
    'desc_gobuster': 'Brute-force (Hidden files)',
    'desc_lighthouse': 'Web Performance Audit (Web Vitals)',
    'desc_ping': 'Latency, DNS & Traceroute',
    'desc_headers': 'HSTS, CSP, X-Frame Analysis',
    'desc_server_health': 'Simul. CPU/RAM & Load Test',
    'desc_topology': 'Architecture visualization',
    'desc_global_ping': 'Global Availability & Latency',
    'desc_selenium': 'E2E Automation & Form Fuzzing',
    'desc_jmeter': 'Load Testing & Stress Test (Apache JMeter)',
    'desc_wireshark': 'Packet Capture & Protocol Analysis',
    'desc_forensics': 'Expert Info, Stream Reconstruction & Stats',

    // Result Tabs
    'tab_overview': 'Overview',
    'tab_infrastructure': 'Infrastructure',
    'tab_network': 'Network',
    'tab_topology': 'Topology',
    'tab_selenium': 'Automation',
    'tab_jmeter': 'Load Test',
    'tab_traffic': 'Network Traffic',
    'tab_ids': 'IDS / IPS',
  },
  ar: {
    // Layout
    'dashboard': 'لوحة التحكم',
    'new_scan': 'فحص جديد',
    'history': 'سجل الفحوصات',
    'tutorials': 'شروحات وعرض توضيحي',
    'os_system': 'النظام التشغيلي',
    
    // Dashboard
    'dashboard_title': 'لوحة القيادة',
    'scan_running': 'فحوصات قيد التشغيل',
    'scan_completed': 'فحوصات مكتملة',
    'start_analysis_title': 'بدء تحليل جديد',
    'start_analysis_desc': 'ابدأ اختبار أمان جديد على البنية التحتية الخاصة بك.',
    'btn_new_scan': 'فحص جديد',
    'recent_activity': 'النشاط الأخير',
    'no_history': 'لا يوجد سجل متاح.',
    'module_active': 'نشط',
    
    // Form
    'config_scan': 'إعدادات الفحص',
    'project_name': 'اسم المشروع (اختياري)',
    'project_placeholder': 'مثال: تدقيق العميل س - الربع الثالث',
    'target_label': 'الهدف (رابط أو عنوان IP)',
    'target_placeholder': 'مثال: scanme.nmap.org أو 192.168.1.1',
    'modules_label': 'وحدات التحليل',
    'intensity_label': 'كثافة الفحص',
    'intensity_quick': 'سريع',
    'intensity_normal': 'عادي',
    'intensity_deep': 'عميق',
    'btn_start_scan': 'بدء الفحص الشامل',
    'btn_scanning': 'تحليل الذكاء الاصطناعي جارٍ...',
    
    // History
    'history_title': 'سجل الفحوصات الأمنية',
    'table_target': 'الهدف',
    'table_date': 'التاريخ',
    'table_status': 'الحالة',
    'table_ai': 'تحليل الذكاء الاصطناعي',
    'table_score': 'النتيجة',
    'table_vulns': 'الثغرات',
    'table_actions': 'إجراءات',
    'status_completed': 'مكتمل',
    'status_failed': 'فشل',
    'status_running': 'قيد التشغيل',
    'btn_report': 'التقرير',
    'tools_used': 'الأدوات المستخدمة',
    'services_ports': 'الخدمات والمنافذ',
    'crit_vulns': 'ثغرات أمنية حرجة',
    'view_all': 'عرض الكل',
    'no_vulns': 'لا توجد ثغرات.',
    
    // Tool Descriptions
    'desc_nmap': 'اكتشاف الشبكة والمنافذ المفتوحة',
    'desc_ids': 'كشف التسلل، التوقيعات والتنبيهات',
    'desc_nikto': 'فحص خادم الويب والتكوين',
    'desc_openvas': 'إدارة كاملة للثغرات الأمنية',
    'desc_owasp': 'فحص تطبيقات الويب المتكامل',
    'desc_ssl': 'تحليل تكوين SSL/TLS والشهادات',
    'desc_sqlmap': 'كشف حقن SQL',
    'desc_wpscan': 'تدقيق ووردبريس والإضافات',
    'desc_whatweb': 'تحديد التقنيات المستخدمة',
    'desc_wappalyzer': 'كشف أطر العمل (Frameworks)',
    'desc_gobuster': 'تخمين الملفات والمجلدات المخفية',
    'desc_lighthouse': 'تدقيق أداء الويب (Web Vitals)',
    'desc_ping': 'الكمون، DNS وتتبع المسار',
    'desc_headers': 'تحليل ترويسات الأمان (Headers)',
    'desc_server_health': 'محاكاة صحة الخادم (CPU/RAM)',
    'desc_topology': 'تصور هيكلية الشبكة',
    'desc_global_ping': 'التوافر العالمي والكمون',
    'desc_selenium': 'الأتمتة الشاملة واختبار النماذج',
    'desc_jmeter': 'اختبار الحمل والضغط (Apache JMeter)',
    'desc_wireshark': 'التقاط الحزم وتحليل البروتوكولات',
    'desc_forensics': 'معلومات الخبراء، إعادة بناء التدفق والإحصائيات',

    // Result Tabs
    'tab_overview': 'نظرة عامة',
    'tab_infrastructure': 'البنية التحتية',
    'tab_network': 'الشبكة',
    'tab_topology': 'الهيكلية',
    'tab_selenium': 'الأتمتة',
    'tab_jmeter': 'اختبار الحمل',
    'tab_traffic': 'حركة الشبكة',
    'tab_ids': 'IDS / IPS',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    // Update direction based on language
    const newDir = language === 'ar' ? 'rtl' : 'ltr';
    setDir(newDir);
    document.documentElement.dir = newDir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
