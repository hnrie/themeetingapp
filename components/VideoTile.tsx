import React, { useRef, useEffect } from 'react';
import type { Participant } from '../types';
import { MicrophoneOffIcon } from './icons';
import Avatar from './Avatar';

interface VideoTileProps {
  participant: Participant;
}

const VideoTile: React.FC<VideoTileProps> = ({ participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream } = participant;

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('🎬 VideoTile setting srcObject for', participant.name, stream);
      videoRef.current.srcObject = stream;
      
      // Ensure video plays
      videoRef.current.play().catch(err => {
        console.log('VideoTile auto-play failed (normal):', err);
      });
    } else if (videoRef.current && !stream) {
      console.log('🚫 VideoTile clearing srcObject for', participant.name);
      videoRef.current.srcObject = null;
    }
  }, [stream, participant.name]);

  const showVideo = (participant.isCameraOn || participant.isScreenSharing) && stream;

  return (
    <div className={`relative w-full h-full bg-zinc-800 rounded-lg overflow-hidden shadow-lg flex items-center justify-center transition-all duration-300
      ${participant.isSpeaking ? 'ring-4 ring-brand-secondary animate-pulse' : 'ring-0 ring-transparent'}
    `}>
      {showVideo ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={participant.isLocal} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-zinc-400 gap-4">
            <Avatar name={participant.name} size={96} />
            <p>{participant.name}</p>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-sm px-2 py-1 rounded-md flex items-center gap-2">
        {!participant.isMicOn && <MicrophoneOffIcon size={16} className="text-brand-danger" />}
        <span>{participant.name}{participant.isLocal && ' (You)'}{participant.isScreenSharing && ' (Presenting)'}</span>
      </div>
    </div>
  );
};

export default React.memo(VideoTile);