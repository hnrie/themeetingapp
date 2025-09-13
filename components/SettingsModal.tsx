
import React from 'react';
import type { VideoQuality } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuality: VideoQuality;
  onQualityChange: (quality: VideoQuality) => void;
}

export const qualityLevels: { value: VideoQuality; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: '360p', label: 'Standard Definition (360p)' },
    { value: '720p', label: 'High Definition (720p)' },
    { value: '1080p', label: 'Full HD (1080p)' },
    { value: '4k', label: '4K (Ultra HD)' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentQuality, onQualityChange }) => {
  if (!isOpen) return null;

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onQualityChange(e.target.value as VideoQuality);
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in-down"
      style={{ animationDuration: '0.3s' }}
      onClick={onClose}
    >
      <div 
        className="bg-zinc-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Settings</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div>
            <label htmlFor="video-quality" className="block text-sm font-medium text-zinc-300 mb-2">
                Video Quality
            </label>
            <select
                id="video-quality"
                value={currentQuality}
                onChange={handleQualityChange}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                {qualityLevels.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                ))}
            </select>
            <p className="text-xs text-zinc-500 mt-2">
                Higher quality uses more data and may affect performance. The change will restart your camera.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
