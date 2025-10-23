import React, { useState, useEffect, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';
import { CameraOnIcon, CameraOffIcon, MicrophoneOnIcon, MicrophoneOffIcon } from './icons';

interface LobbyProps {
  onJoin: (name: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const { stream, startStream, stopStream, isCameraOn, isMicOn, toggleCamera, toggleMic, error } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    startStream();
    return () => {
      // Keep stream running when moving to meeting room
      // stopStream();
    };
  }, [startStream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Video auto-play failed:", err);
      });
    }
  }, [stream]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 bg-zinc-900 text-white">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Video Preview */}
        <div className="relative aspect-video bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/50">
          {error && (
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 p-4">
                <div className="text-center text-red-400">
                    <h3 className="font-semibold text-lg mb-2">Camera or Mic Error</h3>
                    <p className="text-sm max-w-xs">{error}</p>
                </div>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOn && !error ? 'opacity-100' : 'opacity-0'}`}
          />
          {!isCameraOn && !error && (
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <CameraOffIcon size={48} />
                  <span>Camera is off</span>
                </div>
              </div>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-black/30 backdrop-blur-sm p-3 rounded-full">
            <button
                onClick={toggleMic}
                disabled={!!error}
                className={`p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isMicOn ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-brand-danger hover:bg-red-500'}`}
                aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            >
              {isMicOn ? <MicrophoneOnIcon /> : <MicrophoneOffIcon />}
            </button>
            <button
                onClick={toggleCamera}
                disabled={!!error}
                className={`p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isCameraOn ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-brand-danger hover:bg-red-500'}`}
                aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ? <CameraOnIcon /> : <CameraOffIcon />}
            </button>
          </div>
        </div>

        {/* Right Side: Join Form */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">Ready to join?</h1>
          <p className="text-zinc-400 mb-8">Enter your name to get started.</p>
          <form onSubmit={handleJoinSubmit} className="w-full max-w-sm flex flex-col gap-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-brand-primary text-white font-bold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50"
            >
              Join now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
