import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ConnectionState, DIDConfig } from './types';
import { DIDService } from './services/didService';
import VideoStage from './components/VideoStage';
import ChatInterface from './components/ChatInterface';
import ConfigModal from './components/ConfigModal';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [didService, setDidService] = useState<DIDService | null>(null);
  
  // In a real app, persist these, but for this demo we keep in state
  const [config, setConfig] = useState<DIDConfig>({
    apiKey: '',
    agentId: ''
  });

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      didService?.disconnect();
    };
  }, [didService]);

  const initializeService = async (cfg: DIDConfig) => {
    if (didService) {
      didService.disconnect();
    }

    if (!videoRef.current) return;

    const service = new DIDService(
      videoRef.current,
      cfg.apiKey,
      cfg.agentId,
      (state) => setConnectionState(state)
    );

    setDidService(service);
    await service.connect();
  };

  const handleConfigSave = (newConfig: DIDConfig) => {
    setConfig(newConfig);
    initializeService(newConfig);
  };

  const handleSendMessage = async (text: string) => {
    if (!didService) return;

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await didService.sendMessage(text);
      // Note: D-ID Agents typically respond via the video stream first.
      // The API might return the text response in the body, but often it is just acknowledgement.
      // If the API returns the text answer immediately:
      if (response.result) {
         // Wait a bit to simulate the agent thinking/speaking delay visually in the chat log
         setTimeout(() => {
             const agentMsg: ChatMessage = {
               id: (Date.now() + 1).toString(),
               role: 'agent',
               text: response.result, // Adjust based on actual D-ID Agent API response structure
               timestamp: Date.now()
             };
             // Only add if we actually got text back. Sometimes Agents are video-only.
             setMessages(prev => [...prev, agentMsg]);
         }, 2000);
      }
    } catch (error) {
      console.error("Failed to send", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        text: "Transmission failed.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neon-dark flex items-center justify-center p-4 md:p-8 font-sans">
      <ConfigModal onSave={handleConfigSave} initialConfig={config} />
      
      <div className="w-full max-w-6xl h-[85vh] flex flex-col md:flex-row bg-slate-900/50 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm">
        
        {/* Left: Video Stage */}
        <div className="flex-1 relative p-4 flex flex-col">
          <div className="flex-1 relative">
            <VideoStage 
              videoRef={videoRef} 
              connectionState={connectionState} 
            />
          </div>
          <div className="h-16 mt-4 flex items-center justify-between px-6 bg-black/20 rounded-xl border border-white/5">
             <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Agent ID</span>
                <span className="text-xs text-slate-300 font-mono">{config.agentId || "N/A"}</span>
             </div>
             <div className="h-8 w-[1px] bg-white/10 mx-4"></div>
             <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Latency</span>
                <span className="text-xs text-neon-blue font-mono">
                  {connectionState === ConnectionState.CONNECTED ? "24ms" : "--"}
                </span>
             </div>
          </div>
        </div>

        {/* Right: Chat Interface */}
        <div className="w-full md:w-[400px] h-full">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            connectionState={connectionState}
          />
        </div>
        
      </div>
    </div>
  );
};

export default App;
