
import React, { useRef, useEffect } from 'react';
import type { Participant } from '../types';
import { UserIcon, MicrophoneOffIcon } from './icons';

interface VideoTileProps {
  participant: Participant;
}

const VideoTile: React.FC<VideoTileProps> = ({ participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream } = participant;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showVideo = participant.isCameraOn && stream;

  return (
    <div className="relative w-full h-full aspect-video bg-zinc-800 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
      {showVideo ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={participant.isLocal} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
            <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center">
                <UserIcon size={48} />
            </div>
            <p>{participant.name}</p>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-sm px-2 py-1 rounded-md flex items-center gap-2">
        {!participant.isMicOn && <MicrophoneOffIcon size={16} className="text-brand-danger" />}
        <span>{participant.name}{participant.isLocal && ' (You)'}</span>
      </div>
    </div>
  );
};

export default VideoTile;
