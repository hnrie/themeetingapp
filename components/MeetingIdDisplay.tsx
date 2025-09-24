
import React, { useState } from 'react';
import { CopyIcon } from './icons';

interface MeetingIdDisplayProps {
  meetingId: string;
}

const MeetingIdDisplay: React.FC<MeetingIdDisplayProps> = ({ meetingId }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${meetingId}`;
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (e) {
      // Fallback: copy just the meetingId if full URL copy fails
      try {
        await navigator.clipboard.writeText(meetingId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (_) {
        // noop
      }
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg flex items-center gap-3 shadow-lg">
      <span className="font-mono" title="Meeting ID">{meetingId}</span>
      <button onClick={handleCopy} className="text-zinc-300 hover:text-white transition-colors" title={isCopied ? "Copied" : "Copy meeting link"}>
        {isCopied ? (
          <span className="text-brand-secondary text-xs font-semibold">Copied!</span>
        ) : (
          <CopyIcon size={16} />
        )}
      </button>
    </div>
  );
};

export default MeetingIdDisplay;
