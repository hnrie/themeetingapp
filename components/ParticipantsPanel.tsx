
import React from 'react';
import type { Participant } from '../types';
import { MicrophoneOnIcon, MicrophoneOffIcon } from './icons';
import Avatar from './Avatar';

interface ParticipantsPanelProps {
  participants: Participant[];
  localParticipantId: string;
  isHost: boolean;
  onMuteParticipant: (participantId: string) => void;
  onUnmuteParticipant: (participantId: string) => void;
  hostId: string | null;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ participants, localParticipantId, isHost, onMuteParticipant, onUnmuteParticipant, hostId }) => {
  const sortedParticipants = React.useMemo(() =>
    [...participants].sort((a, b) => {
        const aIsLocal = a.id === localParticipantId;
        const bIsLocal = b.id === localParticipantId;
        const aIsHost = a.id === hostId;
        const bIsHost = b.id === hostId;

        if (aIsLocal) return -1;
        if (bIsLocal) return 1;
        if (aIsHost) return -1;
        if (bIsHost) return 1;

        return a.name.localeCompare(b.name);
    }), [participants, localParticipantId, hostId]);

  return (
    <div className="h-[calc(100vh-125px)] flex flex-col p-4 bg-zinc-800/50 text-white">
        <h3 className="font-bold text-lg mb-4">In this meeting ({participants.length})</h3>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {sortedParticipants.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar name={p.name} size={36} />
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{p.name}</span>
                          {p.isLocal && <span className="text-xs bg-zinc-600 text-zinc-200 px-1.5 py-0.5 rounded-full">You</span>}
                          {p.id === hostId && <span className="text-xs bg-blue-900/50 text-brand-primary font-semibold px-1.5 py-0.5 rounded-full">Host</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {p.isMicOn ? <MicrophoneOnIcon size={20} /> : <MicrophoneOffIcon size={20} className="text-brand-danger" />}
                        
                        {isHost && !p.isLocal && (
                            p.isMicOn ? (
                                <button
                                    onClick={() => onMuteParticipant(p.id)}
                                    className="text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-full px-3 py-1 transition-colors w-16 text-center"
                                    title={`Mute ${p.name}`}
                                >
                                    Mute
                                </button>
                            ) : (
                                <button
                                    onClick={() => onUnmuteParticipant(p.id)}
                                    className="text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-full px-3 py-1 transition-colors w-16 text-center"
                                    title={`Ask ${p.name} to unmute`}
                                >
                                    Unmute
                                </button>
                            )
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default ParticipantsPanel;