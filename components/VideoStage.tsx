import React, { useEffect, useRef } from 'react';
import { ConnectionState } from '../types';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import clsx from 'clsx';

interface VideoStageProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  connectionState: ConnectionState;
}

const VideoStage: React.FC<VideoStageProps> = ({ videoRef, connectionState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple visualizer effect for idle state or overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    
    const draw = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() / 1000;
      
      if (connectionState === ConnectionState.CONNECTED) {
        // Subtle scanning line overlay
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.lineWidth = 2;
        const y = (Math.sin(time) + 1) / 2 * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [connectionState]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      {/* Connection Status Indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
        {connectionState === ConnectionState.CONNECTING && <Loader2 className="animate-spin text-neon-blue" size={14} />}
        {connectionState === ConnectionState.CONNECTED && <Wifi className="text-green-500" size={14} />}
        {(connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.FAILED) && <WifiOff className="text-red-500" size={14} />}
        <span className={clsx("text-xs font-mono uppercase", {
          "text-neon-blue": connectionState === ConnectionState.CONNECTING,
          "text-green-400": connectionState === ConnectionState.CONNECTED,
          "text-slate-400": connectionState === ConnectionState.DISCONNECTED,
          "text-red-400": connectionState === ConnectionState.FAILED,
        })}>
          {connectionState}
        </span>
      </div>

      {/* Video Element */}
      <video 
        ref={videoRef}
        className={clsx("w-full h-full object-cover transition-opacity duration-1000", {
          "opacity-100": connectionState === ConnectionState.CONNECTED,
          "opacity-0": connectionState !== ConnectionState.CONNECTED
        })}
        autoPlay 
        playsInline
      />

      {/* Overlay Canvas for VFX */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Placeholder / Loading State */}
      {connectionState !== ConnectionState.CONNECTED && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-700 animate-spin-slow"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-neon-blue/5 animate-pulse"></div>
            </div>
          </div>
          <p className="mt-8 text-slate-500 font-mono text-sm tracking-widest">AWAITING NEURAL LINK</p>
        </div>
      )}
    </div>
  );
};

export default VideoStage;
