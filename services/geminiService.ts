
import { GoogleGenAI, Type } from "@google/genai";
import { ScanRequest, ScanResult, Severity, ToolType } from "../types";

// Note: In a real app, this key should not be exposed on the client side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-2.0-flash-exp as a stable fallback to avoid 404 errors with preview models
const modelName = "gemini-2.0-flash-exp";

// Helper to fetch real network data from public APIs
const fetchRealNetworkData = async (target: string) => {
  try {
    // 1. Resolve DNS to IP using Google DNS over HTTPS
    const dnsUrl = `https://dns.google/resolve?name=${target}&type=A`;
    const dnsRes = await fetch(dnsUrl);
    const dnsData = await dnsRes.json();
    const realIp = dnsData.Answer?.[0]?.data || "192.168.1.100";

    // 2. Get Geo/ISP info using IpWhoIs (Free, no key)
    let geoData: any = {};
    if (realIp && realIp !== "192.168.1.100") {
        try {
            const geoRes = await fetch(`https://ipwho.is/${realIp}`);
            geoData = await geoRes.json();
        } catch(e) { console.warn("Geo fetch failed", e); }
    }

    return { realIp, geoData };
  } catch (error) {
    console.warn("Network fetch error", error);
    return { realIp: "Unknown", geoData: {} };
  }
};

export const performSimulatedScan = async (request: ScanRequest): Promise<Partial<ScanResult>> => {
  const toolsString = request.tools.join(", ");
  
  // Step 1: Fetch Real Data (Hybrid Approach)
  const { realIp, geoData } = await fetchRealNetworkData(request.target);

  const langInstruction = request.language === 'ar' 
    ? "IMPORTANT: Provide all text content (aiAnalysis, description, remediation, vulnerability names) in ARABIC. Use professional cybersecurity terminology in Arabic."
    : request.language === 'fr'
    ? "IMPORTANT: Provide all text content (aiAnalysis, description, remediation) in FRENCH."
    : "IMPORTANT: Provide all text content in ENGLISH.";

  const systemInstruction = `
    You are 'SecuScan Pro', an elite cybersecurity and infrastructure monitoring engine, inspired by the NetBox data model (DCIM/IPAM).
    Your goal is to generate a JSON report that simulates a deep technical audit of a target: ${request.target}.
    
    ${langInstruction}
    
    REAL DATA DETECTED (USE THIS):
    - Resolved IP: ${realIp}
    - Location: ${geoData.city || 'Unknown'}, ${geoData.country || 'Unknown'}
    - ISP: ${geoData.connection?.isp || 'Unknown'}

    The user has selected these tools: ${toolsString}.

    GENERATE DATA FOR THE FOLLOWING SECTIONS BASED ON SELECTED TOOLS:

    1. SECURITY (Nmap, Nikto, OpenVAS):
       - Find realistic open ports and vulnerabilities.
       - If 'OpenVAS' is selected, include at least 3-5 vulnerabilities.
       - Provide remediation steps that follow NIST/OWASP standards.

    2. INFRASTRUCTURE & HEALTH (Server Health):
       - Generate 'serverHealth' object (CPU/RAM).
       - ALWAYS Generate 'loadTestResults' array for charts (latency vs req/sec).

    3. NETWORK & TOPOLOGY (NetBox-style):
       - Generate 'topology' object.
       - Generate 'deviceFingerprint' (OS, Device Type).
       - Generate 'connectedAssets'.
       - IMPORTANT: In the AI analysis, suggest where these assets would fit in a NetBox inventory (e.g. "Asset X should be placed in Site HQ, VLAN 100, Rack A12").

    4. FUNCTIONAL & AUTOMATION:
       - If 'Selenium' selected: Generate 'seleniumReport'.
       - If 'JMeter' selected: Generate 'jmeterReport'.

    5. PACKET ANALYSIS & FORENSICS (WIRESHARK & DPI):
       - Generate packetCapture and forensicsReport if tools selected.
       - Use Deep Packet Inspection (DPI) signatures to identify specific software versions.

    6. INTRUSION DETECTION (SNORT / SURICATA):
       - Generate idsReport with realistic alerts if tool selected.

    IMPORTANT: Be technical, concise, and realistic. Return ONLY raw JSON.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      targetIp: { type: Type.STRING },
      overallScore: { type: Type.NUMBER },
      aiAnalysis: { type: Type.STRING },
      openPorts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            port: { type: Type.NUMBER },
            service: { type: Type.STRING },
            version: { type: Type.STRING },
            state: { type: Type.STRING, enum: ["open", "filtered"] }
          }
        }
      },
      vulnerabilities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ["CRITIQUE", "ÉLEVÉE", "MOYENNE", "FAIBLE", "INFO"] },
            description: { type: Type.STRING },
            remediation: { type: Type.STRING },
            toolDetected: { type: Type.STRING }
          }
        }
      },
      connectedAssets: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ip: { type: Type.STRING },
            hostname: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Primary', 'Subdomain', 'Mail Server', 'Load Balancer', 'CDN', 'Database'] },
            location: { type: Type.STRING }
          }
        }
      },
      performanceReport: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          overallScore: { type: Type.NUMBER },
          metrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.STRING }, score: { type: Type.STRING }, description: { type: Type.STRING } } } }
        }
      },
      serverHealth: {
        type: Type.OBJECT,
        nullable: true,
        properties: { cpuUsage: { type: Type.NUMBER }, ramUsage: { type: Type.NUMBER }, uptime: { type: Type.STRING }, os: { type: Type.STRING } }
      },
      networkStats: {
        type: Type.OBJECT,
        nullable: true,
        properties: { ping: { type: Type.NUMBER }, packetLoss: { type: Type.NUMBER }, dnsProvider: { type: Type.STRING }, traceroute: { type: Type.ARRAY, items: { type: Type.STRING } } }
      },
      securityHeaders: { type: Type.ARRAY, nullable: true, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.STRING }, status: { type: Type.STRING, enum: ["secure", "insecure", "missing"] } } } },
      loadTestResults: { type: Type.ARRAY, nullable: true, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, requestsPerSecond: { type: Type.NUMBER }, latency: { type: Type.NUMBER }, errors: { type: Type.NUMBER } } } },
      topology: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
            nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, type: { type: Type.STRING }, status: { type: Type.STRING } } } },
            links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, target: { type: Type.STRING } } } }
        }
      },
      globalPing: { type: Type.ARRAY, nullable: true, items: { type: Type.OBJECT, properties: { region: { type: Type.STRING }, location: { type: Type.STRING }, latency: { type: Type.NUMBER }, status: { type: Type.STRING } } } },
      deviceFingerprint: { type: Type.OBJECT, nullable: true, properties: { os: { type: Type.STRING }, deviceType: { type: Type.STRING }, confidence: { type: Type.NUMBER } } },
      seleniumReport: { type: Type.ARRAY, nullable: true, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, status: { type: Type.STRING }, steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { action: { type: Type.STRING }, status: { type: Type.STRING } } } } } } },
      jmeterReport: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
              summary: { type: Type.OBJECT, properties: { totalSamples: { type: Type.NUMBER }, averageLatency: { type: Type.NUMBER }, throughput: { type: Type.NUMBER } } },
              samples: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.STRING }, latency: { type: Type.NUMBER } } } }
          }
      },
      packetCapture: { type: Type.ARRAY, nullable: true, items: { type: Type.OBJECT, properties: { no: { type: Type.NUMBER }, source: { type: Type.STRING }, protocol: { type: Type.STRING }, info: { type: Type.STRING } } } },
      forensicsReport: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
              protocolStats: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { protocol: { type: Type.STRING }, percent: { type: Type.NUMBER } } } },
              expertIssues: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { severity: { type: Type.STRING }, summary: { type: Type.STRING } } } },
              reconstructedStreams: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } } } }
          }
      },
      idsReport: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
              totalAlerts: { type: Type.NUMBER },
              alerts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { signature: { type: Type.STRING }, priority: { type: Type.NUMBER }, action: { type: Type.STRING } } } }
          }
      }
    },
    required: ["targetIp", "overallScore", "aiAnalysis", "openPorts", "vulnerabilities"]
  };

  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: `Perform scan on ${request.target} using tools: ${toolsString}. Real IP: ${realIp}. Suggest NetBox DCIM/IPAM mapping.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4
      }
    });

    const jsonText = result.text;
    if (!jsonText) throw new Error("No response from AI");

    // Robust parsing in case of markdown wrapping
    const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);
    
    const vulnerabilitiesWithIds = (parsedData.vulnerabilities || []).map((v: any, index: number) => ({
      ...v,
      id: `vuln-${Date.now()}-${index}`
    }));

    return {
      ...parsedData,
      connectedAssets: parsedData.connectedAssets || [],
      vulnerabilities: vulnerabilitiesWithIds,
      loadTestResults: parsedData.loadTestResults || [],
      securityHeaders: parsedData.securityHeaders || [],
      globalPing: parsedData.globalPing || [],
      packetCapture: parsedData.packetCapture || [],
      forensicsReport: parsedData.forensicsReport || undefined,
      idsReport: parsedData.idsReport || undefined
    };

  } catch (error) {
    console.error("Error generating scan simulation:", error);
    throw error;
  }
};
