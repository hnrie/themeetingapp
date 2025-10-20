
import React from 'react';
import { MicrophoneOnIcon, MicrophoneOffIcon, CameraOnIcon, CameraOffIcon, EndCallIcon, ChatIcon, ScreenShareOnIcon, ScreenShareOffIcon, SettingsIcon } from './icons';

interface ControlBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isSidebarOpen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleSidebar: () => void;
  onToggleSettings: () => void;
  onLeave: () => void;
}

// FIX: Extended props to include standard HTML button attributes (like `title`)
// and spread them onto the button element.
const ControlButton: React.FC<{
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ onClick, className, children, ...props }) => (
  <button onClick={onClick} className={`p-3 rounded-full transition-colors ${className}`} {...props}>
    {children}
  </button>
);

const ControlBar: React.FC<ControlBarProps> = ({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  isSidebarOpen,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleSidebar,
  onToggleSettings,
  onLeave,
}) => {
  return (
    <div className="bg-brand-dark/80 backdrop-blur-md p-4 flex justify-center items-center gap-4">
      <ControlButton
        onClick={onToggleMic}
        className={isMicOn ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-brand-danger hover:bg-red-500'}
        aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isMicOn ? <MicrophoneOnIcon /> : <MicrophoneOffIcon />}
      </ControlButton>
      
      <ControlButton
        onClick={onToggleCamera}
        className={isCameraOn ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-brand-danger hover:bg-red-500'}
        aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCameraOn ? <CameraOnIcon /> : <CameraOffIcon />}
      </ControlButton>

      <ControlButton
        onClick={onToggleScreenShare}
        className={isScreenSharing ? 'bg-brand-primary text-white' : 'bg-zinc-700 hover:bg-zinc-600'}
        aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
      >
        {isScreenSharing ? <ScreenShareOffIcon /> : <ScreenShareOnIcon />}
      </ControlButton>

      <ControlButton
        onClick={onLeave}
        className="bg-brand-danger hover:bg-red-500 px-6"
        aria-label="Leave meeting"
      >
        <EndCallIcon />
      </ControlButton>

       <div className="absolute right-4 flex gap-2">
            <ControlButton
                onClick={onToggleSettings}
                className="bg-zinc-700 hover:bg-zinc-600"
                title="Settings"
            >
                <SettingsIcon />
            </ControlButton>
            <ControlButton
                onClick={onToggleSidebar}
                className={isSidebarOpen ? 'bg-brand-primary/20 text-brand-primary' : 'bg-zinc-700 hover:bg-zinc-600'}
                title="Chat & Participants"
            >
                <ChatIcon />
            </ControlButton>
       </div>
    </div>
  );
};

export default ControlBar;
