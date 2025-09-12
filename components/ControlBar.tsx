

import React from 'react';
import { MicrophoneOnIcon, MicrophoneOffIcon, CameraOnIcon, CameraOffIcon, EndCallIcon, ChatIcon, AssistantIcon } from './icons';

interface ControlBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isSidebarOpen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleSidebar: () => void;
  onLeave: () => void;
}

const ControlButton: React.FC<{
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, className, children }) => (
  <button onClick={onClick} className={`p-3 rounded-full transition-colors ${className}`}>
    {children}
  </button>
);

const ControlBar: React.FC<ControlBarProps> = ({
  isMicOn,
  isCameraOn,
  isSidebarOpen,
  onToggleMic,
  onToggleCamera,
  onToggleSidebar,
  onLeave,
}) => {
  return (
    <div className="bg-brand-dark/80 backdrop-blur-md p-4 flex justify-center items-center gap-4">
      <ControlButton
        onClick={onToggleMic}
        className={isMicOn ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-brand-danger hover:bg-red-500'}
      >
        {isMicOn ? <MicrophoneOnIcon /> : <MicrophoneOffIcon />}
      </ControlButton>
      
      <ControlButton
        onClick={onToggleCamera}
        className={isCameraOn ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-brand-danger hover:bg-red-500'}
      >
        {isCameraOn ? <CameraOnIcon /> : <CameraOffIcon />}
      </ControlButton>

      <ControlButton
        onClick={onLeave}
        className="bg-brand-danger hover:bg-red-500 px-6"
      >
        <EndCallIcon />
      </ControlButton>

       <div className="absolute right-4">
          <ControlButton
            onClick={onToggleSidebar}
            className={isSidebarOpen ? 'bg-brand-primary/20 text-brand-primary' : 'bg-zinc-700 hover:bg-zinc-600'}
          >
            <ChatIcon />
          </ControlButton>
       </div>
    </div>
  );
};

export default ControlBar;
