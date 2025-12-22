
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Play, Loader2, Video, CheckCircle, AlertTriangle, Youtube, Sparkles, ShieldCheck, Key } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const VideoGenerator: React.FC = () => {
  const { t, language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [hasKey, setHasKey] = useState<boolean>(false);

  const loadingMessages = [
    "Initialisation du moteur de rendu cybernétique...",
    "Modélisation des interfaces SecuScan Pro...",
    "Génération des effets de boucliers numériques...",
    "Analyse des flux de données visuels...",
    "Optimisation du rendu pour YouTube...",
    "Intégration de l'appel à l'action @issaadhassani...",
    "Finalisation de la séquence cinématographique..."
  ];

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const generatePromoVideo = async () => {
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    
    let messageIndex = 0;
    const interval = setInterval(() => {
      setProgressMessage(loadingMessages[messageIndex % loadingMessages.length]);
      messageIndex++;
    }, 4000);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `A cinematic, professional 16:9 trailer for a cybersecurity software called SecuScan Pro. 
      The video shows high-tech digital shields, code flowing through security tunnels, AI neural network animations, and a sleek modern dashboard interface with glowing charts. 
      Dynamic lighting in emerald green and deep blue. 
      The video ends with a stylish animated text appearing on a dark tech background saying 'Abonnez-vous à @issaadhassani pour plus de tutos!' in white and primary green colors.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } else {
        throw new Error("Aucun lien de téléchargement reçu.");
      }

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        setError("Erreur de clé API : Veuillez sélectionner une clé valide d'un projet GCP payant.");
      } else {
        setError("Une erreur est survenue lors de la génération. Veuillez réessayer.");
      }
    } finally {
      setIsGenerating(false);
      clearInterval(interval);
    }
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-surface rounded-3xl border border-slate-700 p-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
          <Key className="text-primary" size={40} />
        </div>
        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Clé API Requise</h2>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
          Pour utiliser le moteur de génération vidéo <b>Veo 3.1</b>, vous devez sélectionner une clé API liée à un projet Google Cloud avec facturation activée.
        </p>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs text-secondary hover:underline mb-6 block font-bold uppercase tracking-widest"
        >
          En savoir plus sur la facturation API
        </a>
        <button 
          onClick={handleSelectKey}
          className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 uppercase tracking-widest text-xs"
        >
          <Sparkles size={16} />
          <span>Sélectionner ma clé API</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-500">
          <Video size={150} />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter italic">Showcase Creator</h1>
          <p className="text-gray-400 max-w-2xl mb-8 font-medium">
            Générez une vidéo de présentation professionnelle pour <b>SecuScan Pro</b>. Parfait pour vos réseaux sociaux et pour promouvoir la chaîne <span className="text-red-500">@issaadhassani</span>.
          </p>

          {!isGenerating && !videoUrl && (
            <button 
              onClick={generatePromoVideo}
              className="px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-4 uppercase tracking-[0.2em] text-sm"
            >
              <Video size={20} />
              <span>Générer le Trailer (Veo 3.1)</span>
            </button>
          )}

          {isGenerating && (
            <div className="bg-slate-950/50 p-10 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-6">
              <Loader2 className="text-primary animate-spin" size={48} />
              <div className="space-y-2">
                <p className="text-white font-black uppercase tracking-widest animate-pulse">{progressMessage}</p>
                <p className="text-gray-600 text-xs font-bold uppercase">Cela peut prendre 2 à 3 minutes. Ne fermez pas cette page.</p>
              </div>
              <div className="w-full max-w-md bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-progress-indeterminate"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl flex items-center space-x-3 text-danger mb-6">
              <AlertTriangle size={20} />
              <p className="text-sm font-bold uppercase">{error}</p>
            </div>
          )}
        </div>
      </div>

      {videoUrl && (
        <div className="bg-surface p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center">
              <CheckCircle className="text-primary mr-3" /> Vidéo Générée avec Succès
            </h3>
            <div className="flex items-center space-x-4">
               <a 
                href={videoUrl} 
                download="SecuScanPro_Promo.mp4"
                className="text-xs font-black uppercase text-gray-400 hover:text-white transition-colors"
               >
                 Télécharger MP4
               </a>
               <button 
                onClick={generatePromoVideo}
                className="text-xs font-black uppercase text-secondary hover:text-white transition-colors"
               >
                 Régénérer
               </button>
            </div>
          </div>
          
          <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner group relative">
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl flex items-center justify-between group hover:bg-red-500/10 transition-all">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-500 group-hover:scale-110 transition-transform">
                <Youtube size={24} />
              </div>
              <div>
                <p className="text-white font-black uppercase text-sm">Prêt pour YouTube</p>
                <p className="text-gray-500 text-xs font-bold">L'appel à l'action @issaadhassani est inclus à la fin de la vidéo.</p>
              </div>
            </div>
            <a 
              href="https://www.youtube.com/@issaadhassani" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-red-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all"
            >
              Visiter la chaîne
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
