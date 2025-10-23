import React, { useRef, useEffect } from 'react';
import type { Participant } from '../types';
import { MicrophoneOffIcon, ScreenShareIcon } from './icons';
import Avatar from './Avatar';

interface VideoTileProps {
  participant: Participant;
  isThumbnail?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({ participant, isThumbnail = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream } = participant;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        // Autoplay failure is common and expected, so we can ignore the error
      });
    }
  }, [stream]);

  const showVideo = (participant.isCameraOn || participant.isScreenSharing) && stream;

  return (
    <div className={`relative w-full h-full bg-zinc-800 rounded-xl overflow-hidden shadow-lg flex items-center justify-center transition-all duration-300
      ${participant.isSpeaking && !isThumbnail ? 'ring-4 ring-brand-secondary' : 'ring-0 ring-transparent'}
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
        <div className={`flex flex-col items-center justify-center text-zinc-400 gap-${isThumbnail ? '2' : '4'}`}>
            <Avatar name={participant.name} size={isThumbnail ? 48 : 96} />
            {!isThumbnail && <p>{participant.name}</p>}
        </div>
      )}
      
      <div className={`absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center gap-2 ${isThumbnail ? 'text-xs' : 'text-sm'}`}>
        {!participant.isMicOn && <MicrophoneOffIcon size={isThumbnail ? 12 : 16} className="text-brand-danger" />}
        <span>{participant.name}{participant.isLocal && !isThumbnail && ' (You)'}</span>
      </div>

      {participant.isScreenSharing && !isThumbnail && (
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
          <ScreenShareIcon size={14} />
          <span>Presenting</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(VideoTile);