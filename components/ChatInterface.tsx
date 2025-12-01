import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ConnectionState } from '../types';
import { Send, Sparkles, Mic, StopCircle } from 'lucide-react';
import { generateConversationStarter, generateResponseSuggestion } from '../services/geminiService';
import clsx from 'clsx';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  connectionState: ConnectionState;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, connectionState }) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || connectionState !== ConnectionState.CONNECTED) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMagicSuggestion = async () => {
    setIsGenerating(true);
    try {
      let suggestion = "";
      if (messages.length === 0) {
        suggestion = await generateConversationStarter();
      } else {
        // Map internal message structure to service expectation
        const history = messages.slice(-5).map(m => ({ role: m.role, text: m.text }));
        suggestion = await generateResponseSuggestion(history);
      }
      setInputText(suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neon-surface/50 border-l border-white/5 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Communication Log</h3>
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-neon-blue animate-pulse"></div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 mt-20 text-sm italic">
            System initialized. Waiting for input...
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={clsx("flex flex-col max-w-[85%]", {
              "ml-auto items-end": msg.role === 'user',
              "mr-auto items-start": msg.role !== 'user'
            })}
          >
            <div className={clsx("px-4 py-2 rounded-lg text-sm leading-relaxed", {
              "bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-tr-none": msg.role === 'user',
              "bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none": msg.role === 'agent'
            })}>
              {msg.text}
            </div>
            <span className="text-[10px] text-slate-600 mt-1 px-1 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 border-t border-white/5">
        
        {/* AI Suggestion Tool */}
        <div className="mb-3 flex justify-end">
          <button 
            onClick={handleMagicSuggestion}
            disabled={isGenerating}
            className="flex items-center gap-2 text-xs text-neon-purple hover:text-white transition-colors disabled:opacity-50"
          >
            <Sparkles size={12} />
            {isGenerating ? "Gemini is thinking..." : "Ask Gemini for suggestion"}
          </button>
        </div>

        <div className="relative flex items-center">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connectionState === ConnectionState.CONNECTED ? "Type your message..." : "Connecting..."}
            disabled={connectionState !== ConnectionState.CONNECTED}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-blue transition-all disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || connectionState !== ConnectionState.CONNECTED}
            className="absolute right-2 p-2 bg-neon-blue text-black rounded-lg hover:bg-white transition-colors disabled:opacity-0 disabled:cursor-default"
          >
            <Send size={16} />
          </button>
        </div>
        
        <div className="mt-2 flex justify-center">
           <p className="text-[10px] text-slate-600 font-mono">
              {connectionState === ConnectionState.CONNECTED ? "SECURE CHANNEL ESTABLISHED" : "CHANNEL OFFLINE"}
           </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
