
import React from 'react';
import type { VideoQuality, DeviceInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuality: VideoQuality;
  onQualityChange: (quality: VideoQuality) => void;
  videoDevices: DeviceInfo[];
  audioDevices: DeviceInfo[];
  currentVideoDevice: string | null;
  currentAudioDevice: string | null;
  onDeviceChange: (kind: 'video' | 'audio', deviceId: string) => void;
}

export const qualityLevels: { value: VideoQuality; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: '360p', label: 'Standard Definition (360p)' },
    { value: '720p', label: 'High Definition (720p)' },
    { value: '1080p', label: 'Full HD (1080p)' },
    { value: '4k', label: '4K (Ultra HD)' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, 
    currentQuality, onQualityChange,
    videoDevices, audioDevices,
    currentVideoDevice, currentAudioDevice,
    onDeviceChange
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in-down"
      style={{ animationDuration: '0.3s' }}
      onClick={onClose}
    >
      <div 
        className="bg-zinc-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Settings</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="audio-device" className="block text-sm font-medium text-zinc-300 mb-2">
                    Microphone
                </label>
                <select
                    id="audio-device"
                    value={currentAudioDevice || ''}
                    onChange={(e) => onDeviceChange('audio', e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={audioDevices.length === 0}
                >
                    {audioDevices.map(({ deviceId, label }) => (
                        <option key={deviceId} value={deviceId}>{label}</option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="video-device" className="block text-sm font-medium text-zinc-300 mb-2">
                    Camera
                </label>
                <select
                    id="video-device"
                    value={currentVideoDevice || ''}
                    onChange={(e) => onDeviceChange('video', e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={videoDevices.length === 0}
                >
                    {videoDevices.map(({ deviceId, label }) => (
                        <option key={deviceId} value={deviceId}>{label}</option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="video-quality" className="block text-sm font-medium text-zinc-300 mb-2">
                    Video Send Quality
                </label>
                <select
                    id="video-quality"
                    value={currentQuality}
                    onChange={(e) => onQualityChange(e.target.value as VideoQuality)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                    {qualityLevels.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <p className="text-xs text-zinc-500 mt-2">
                    Higher quality uses more data and may affect performance.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
