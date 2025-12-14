
import { GoogleGenAI, Type } from "@google/genai";
import { ScanRequest, ScanResult, Severity, ToolType } from "../types";

// Note: In a real app, this key should not be exposed on the client side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

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

  const systemInstruction = `
    You are 'SecuScan Pro', an elite cybersecurity and infrastructure monitoring engine.
    Your goal is to generate a JSON report that simulates a deep technical audit of a target: ${request.target}.
    
    REAL DATA DETECTED (USE THIS):
    - Resolved IP: ${realIp}
    - Location: ${geoData.city || 'Unknown'}, ${geoData.country || 'Unknown'}
    - ISP: ${geoData.connection?.isp || 'Unknown'}

    The user has selected these tools: ${toolsString}.

    GENERATE DATA FOR THE FOLLOWING SECTIONS BASED ON SELECTED TOOLS:

    1. SECURITY (Nmap, Nikto, OpenVAS):
       - Find realistic open ports and vulnerabilities.
       - If 'OpenVAS' is selected, include at least 3-5 vulnerabilities.

    2. INFRASTRUCTURE & HEALTH (Server Health):
       - ALWAYS Generate 'serverHealth' object (CPU/RAM).
       - ALWAYS Generate 'loadTestResults' array with at least 10 data points showing time (0s, 10s... 60s), latency (ms), and req/sec. This is CRITICAL for the charts.
       - Simulate a curve: Latency should increase as Req/Sec increases.

    3. NETWORK & TOPOLOGY:
       - Generate 'topology' object with nodes (Internet -> Firewall -> Server -> DB) and links.
       - Generate 'globalPing' array with latencies from 5 continents.
       - Generate 'deviceFingerprint' (OS, Device Type).
       - Generate 'connectedAssets' list (Subdomains, IPs).

    4. FUNCTIONAL & AUTOMATION (SELENIUM):
       - If 'Selenium Automation' is selected, Generate 'seleniumReport'.
       - Create 2-3 scenarios (Login, Search, Contact).
       - Include specific steps with Status 'pass' or 'fail'.

    5. LOAD TESTING (APACHE JMETER):
       - If 'Apache JMeter' is selected, YOU MUST Generate 'jmeterReport'.
       - 'summary': Provide realistic stats (Throughput ~500-2000/s, Avg Latency ~50-200ms).
       - 'samples': Generate array of 10-15 time-series samples matching the summary.

    6. HTTP HEADERS & PERFORMANCE:
       - If 'Security Headers' selected: Generate 'securityHeaders'.
       - If 'Lighthouse' selected: Generate 'performanceReport'.

    7. PACKET ANALYSIS & FORENSICS (WIRESHARK & DPI):
       - If 'Wireshark Analysis' is selected, Generate 'packetCapture' array (approx 15-20 packets). Sequence: DNS -> TCP Handshake -> HTTP GET -> TLS Handshake.
       - If 'Network Forensics / DPI' is selected, YOU MUST Generate 'forensicsReport'.
          - 'protocolStats': Realistic distribution (e.g. TCP 40%, TLS 30%, HTTP 20%, DNS 10%).
          - 'expertIssues': Generate Wireshark-style Expert Infos (e.g. "TCP Retransmission", "Suspected SQL Injection", "Zero Window").
          - 'reconstructedStreams': Generate a text block representing a reconstructed TCP stream (Follow TCP Stream). Make it look like a raw HTTP request/response. Example: "POST /login HTTP/1.1\nHost: ${request.target}\n\nusername=admin&password=' OR 1=1--".

    IMPORTANT: ensure all arrays (loadTestResults, jmeterReport.samples, globalPing, packetCapture, forensicsReport.reconstructedStreams) are populated with data if tool selected.
    Be realistic.
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
      // Connected Assets (IP Tracking)
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
      // Performance Report
      performanceReport: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          overallScore: { type: Type.NUMBER },
          metrics: {
            type: Type.ARRAY,
            items: {
               type: Type.OBJECT,
               properties: {
                 name: { type: Type.STRING },
                 value: { type: Type.STRING },
                 score: { type: Type.STRING },
                 description: { type: Type.STRING }
               }
            }
          },
          opportunities: {
            type: Type.ARRAY,
            items: {
               type: Type.OBJECT,
               properties: {
                 title: { type: Type.STRING },
                 savings: { type: Type.STRING },
                 description: { type: Type.STRING }
               }
            }
          }
        }
      },
      // Server Health
      serverHealth: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          cpuUsage: { type: Type.NUMBER },
          ramUsage: { type: Type.NUMBER },
          uptime: { type: Type.STRING },
          os: { type: Type.STRING }
        }
      },
      // Network Stats
      networkStats: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          ping: { type: Type.NUMBER },
          packetLoss: { type: Type.NUMBER },
          dnsProvider: { type: Type.STRING },
          traceroute: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      // Security Headers
      securityHeaders: {
        type: Type.ARRAY,
        nullable: true,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["secure", "insecure", "missing"] },
            recommendation: { type: Type.STRING }
          }
        }
      },
      // Load Test
      loadTestResults: {
        type: Type.ARRAY,
        nullable: true,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            requestsPerSecond: { type: Type.NUMBER },
            latency: { type: Type.NUMBER },
            errors: { type: Type.NUMBER }
          }
        }
      },
      // Topology
      topology: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
            nodes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['internet', 'firewall', 'load_balancer', 'server', 'database'] },
                        status: { type: Type.STRING, enum: ['active', 'inactive'] }
                    }
                }
            },
            links: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.STRING },
                        target: { type: Type.STRING }
                    }
                }
            }
        }
      },
      // Global Ping
      globalPing: {
          type: Type.ARRAY,
          nullable: true,
          items: {
              type: Type.OBJECT,
              properties: {
                  region: { type: Type.STRING },
                  location: { type: Type.STRING },
                  latency: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: ['online', 'degraded', 'offline'] }
              }
          }
      },
      // Device Fingerprint
      deviceFingerprint: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
              os: { type: Type.STRING },
              osFamily: { type: Type.STRING, enum: ['linux', 'windows', 'ios', 'android', 'other'] },
              deviceType: { type: Type.STRING, enum: ['server', 'firewall', 'router', 'iot'] },
              confidence: { type: Type.NUMBER },
              details: { type: Type.STRING }
          }
      },
      // Selenium Report
      seleniumReport: {
          type: Type.ARRAY,
          nullable: true,
          items: {
              type: Type.OBJECT,
              properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['pass', 'fail'] },
                  steps: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              stepNumber: { type: Type.NUMBER },
                              action: { type: Type.STRING },
                              expectedResult: { type: Type.STRING },
                              actualResult: { type: Type.STRING },
                              status: { type: Type.STRING, enum: ['pass', 'fail', 'warning'] }
                          }
                      }
                  }
              }
          }
      },
      // JMeter Report
      jmeterReport: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
              testPlanName: { type: Type.STRING },
              duration: { type: Type.STRING },
              summary: {
                  type: Type.OBJECT,
                  properties: {
                      totalSamples: { type: Type.NUMBER },
                      averageLatency: { type: Type.NUMBER },
                      minLatency: { type: Type.NUMBER },
                      maxLatency: { type: Type.NUMBER },
                      stdDev: { type: Type.NUMBER },
                      errorPct: { type: Type.NUMBER },
                      throughput: { type: Type.NUMBER },
                      p90: { type: Type.NUMBER },
                      p95: { type: Type.NUMBER },
                      p99: { type: Type.NUMBER }
                  }
              },
              samples: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          timestamp: { type: Type.STRING },
                          activeThreads: { type: Type.NUMBER },
                          latency: { type: Type.NUMBER },
                          throughput: { type: Type.NUMBER },
                          errorRate: { type: Type.NUMBER }
                      }
                  }
              }
          }
      },
      // Wireshark Packet Capture
      packetCapture: {
          type: Type.ARRAY,
          nullable: true,
          items: {
              type: Type.OBJECT,
              properties: {
                  no: { type: Type.NUMBER },
                  time: { type: Type.STRING },
                  source: { type: Type.STRING },
                  destination: { type: Type.STRING },
                  protocol: { type: Type.STRING },
                  length: { type: Type.NUMBER },
                  info: { type: Type.STRING },
                  details: {
                      type: Type.OBJECT,
                      properties: {
                          frame: { type: Type.STRING },
                          ethernet: { type: Type.STRING },
                          ip: { type: Type.STRING },
                          transport: { type: Type.STRING },
                          application: { type: Type.STRING }
                      }
                  }
              }
          }
      },
      // Forensics Report
      forensicsReport: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
              protocolStats: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          protocol: { type: Type.STRING },
                          percent: { type: Type.NUMBER },
                          packets: { type: Type.NUMBER },
                          bytes: { type: Type.NUMBER }
                      }
                  }
              },
              expertIssues: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          severity: { type: Type.STRING, enum: ['Chat', 'Note', 'Warning', 'Error'] },
                          group: { type: Type.STRING },
                          protocol: { type: Type.STRING },
                          summary: { type: Type.STRING }
                      }
                  }
              },
              reconstructedStreams: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          content: { type: Type.STRING },
                          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                  }
              }
          }
      }
    },
    required: ["targetIp", "overallScore", "aiAnalysis", "openPorts", "vulnerabilities"]
  };

  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: `Perform scan on ${request.target} using tools: ${toolsString}. Real IP: ${realIp}.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4
      }
    });

    const jsonText = result.text;
    if (!jsonText) throw new Error("No response from AI");

    const parsedData = JSON.parse(jsonText);
    
    const vulnerabilitiesWithIds = parsedData.vulnerabilities.map((v: any, index: number) => ({
      ...v,
      id: `vuln-${Date.now()}-${index}`
    }));

    return {
      ...parsedData,
      connectedAssets: parsedData.connectedAssets || [],
      vulnerabilities: vulnerabilitiesWithIds,
      // Ensure arrays are initialized if missing from AI response but tools were selected
      loadTestResults: parsedData.loadTestResults || [],
      securityHeaders: parsedData.securityHeaders || [],
      globalPing: parsedData.globalPing || [],
      packetCapture: parsedData.packetCapture || [],
      forensicsReport: parsedData.forensicsReport || undefined
    };

  } catch (error) {
    console.error("Error generating scan simulation:", error);
    throw error;
  }
};
