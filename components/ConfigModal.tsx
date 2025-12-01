import React, { useState } from 'react';
import { DIDConfig } from '../types';
import { Settings, Key, User } from 'lucide-react';

interface ConfigModalProps {
  onSave: (config: DIDConfig) => void;
  initialConfig: DIDConfig;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ onSave, initialConfig }) => {
  const [apiKey, setApiKey] = useState(initialConfig.apiKey);
  const [agentId, setAgentId] = useState(initialConfig.agentId);
  const [isOpen, setIsOpen] = useState(!initialConfig.apiKey || !initialConfig.agentId);

  const handleSave = () => {
    if (apiKey && agentId) {
      onSave({ apiKey, agentId });
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-50 p-2 bg-neon-surface/80 border border-neon-blue/30 rounded-full hover:bg-neon-blue/20 transition-colors text-neon-blue"
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neon-surface border border-neon-blue/30 rounded-xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,243,255,0.1)]">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="text-neon-blue" />
          System Configuration
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          To initialize the neural link, please provide your D-ID Agents API credentials. 
          The Gemini API key is handled internally via environment variables.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neon-blue mb-1 uppercase tracking-wider">D-ID API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your D-ID API Key"
                className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neon-purple mb-1 uppercase tracking-wider">Agent ID</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="text" 
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="agt_..."
                className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={!apiKey || !agentId}
            className="bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-black font-bold py-2 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Initialize System
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
