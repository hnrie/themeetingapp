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

  // Debug logging
  console.log('🏛️ Lobby render - stream:', !!stream, 'camera:', isCameraOn, 'mic:', isMicOn, 'error:', error);

  useEffect(() => {
    startStream();
    return () => {
      stopStream();
    };
  }, [startStream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('🎬 Setting video srcObject:', stream);
      videoRef.current.srcObject = stream;
      
      // Force video to play if it's not auto-playing
      videoRef.current.play().catch(err => {
        console.log('Video auto-play failed (this is normal in some browsers):', err);
      });
    } else if (videoRef.current && !stream) {
      console.log('🚫 No stream, clearing video srcObject');
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const handleJoinClick = () => {
    onJoin(name);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center">
        <div className="relative w-full md:w-1/2 aspect-video bg-zinc-900 rounded-lg overflow-hidden shadow-2xl">
          {error && (
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 p-4">
                <div className="text-center text-red-300">
                    <h3 className="font-semibold text-lg mb-2">Media Device Error</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOn && !error ? 'opacity-100' : 'opacity-0'}`}></video>
          {!isCameraOn && !error && (
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <CameraOffIcon size={48} />
                  <p>Camera is off</p>
                </div>
              </div>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
            <button onClick={toggleMic} disabled={!!error} className={`p-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isMicOn ? 'bg-zinc-700/80 hover:bg-zinc-600/80' : 'bg-brand-danger hover:bg-red-500'}`}>
              {isMicOn ? <MicrophoneOnIcon /> : <MicrophoneOffIcon />}
            </button>
            <button onClick={toggleCamera} disabled={!!error} className={`p-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isCameraOn ? 'bg-zinc-700/80 hover:bg-zinc-600/80' : 'bg-brand-danger hover:bg-red-500'}`}>
              {isCameraOn ? <CameraOnIcon /> : <CameraOffIcon />}
            </button>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
          <h1 className="text-4xl font-bold mb-2">Ready to join?</h1>
          <p className="text-zinc-400 mb-6">Enter your name to get started.</p>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-sm bg-zinc-800 border border-zinc-700 rounded-md px-4 py-3 mb-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <button
            onClick={handleJoinClick}
            disabled={!name.trim()}
            className="w-full max-w-sm bg-brand-primary text-white font-semibold py-3 rounded-md disabled:bg-brand-primary/50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
          >
            Join now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
