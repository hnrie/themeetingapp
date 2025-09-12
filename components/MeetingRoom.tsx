
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Participant, ChatMessage } from '../types';
import { useCamera } from '../hooks/useCamera';
import { MeetingManager } from '../services/webrtcService';
import VideoTile from './VideoTile';
import ControlBar from './ControlBar';
import Sidebar from './Sidebar';

interface MeetingRoomProps {
  meetingId: string;
  userName: string;
  onLeave: () => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ meetingId, userName, onLeave }) => {
  const { stream, startStream, isCameraOn, isMicOn, toggleCamera, toggleMic } = useCamera();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const meetingManagerRef = useRef<MeetingManager | null>(null);

  useEffect(() => {
    startStream();
  }, [startStream]);

  useEffect(() => {
    if (!stream || meetingManagerRef.current) return;

    const manager = new MeetingManager(meetingId);
    meetingManagerRef.current = manager;

    manager.on('participant-joined', ({ id, name }) => {
      console.log('Participant joined:', name, id);
      setParticipants(prev => [
        ...prev, 
        { id, name, isCameraOn: true, isMicOn: true, stream: null }
      ]);
    });
    
    manager.on('participant-left', ({ id }) => {
      console.log('Participant left:', id);
      setParticipants(prev => prev.filter(p => p.id !== id));
    });

    manager.on('stream-added', ({ id, stream }) => {
        console.log('Stream added for:', id);
        setParticipants(prev => prev.map(p => p.id === id ? { ...p, stream } : p));
    });

    manager.on('track-toggled', ({ id, kind, enabled }) => {
        setParticipants(prev => prev.map(p => {
            if (p.id === id) {
                return kind === 'video' ? { ...p, isCameraOn: enabled } : { ...p, isMicOn: enabled };
            }
            return p;
        }));
    });
    
    manager.on('chat-message', (message) => {
        setChatMessages(prev => [...prev, message]);
    });

    const localParticipant: Participant = {
        id: manager.myId,
        name: userName,
        isLocal: true,
        isCameraOn: isCameraOn,
        isMicOn: isMicOn,
        stream: stream,
    };
    setParticipants([localParticipant]);
    manager.join(stream, userName);
    
    return () => {
        manager.leave();
        meetingManagerRef.current = null;
    };
  }, [stream, meetingId, userName]);

   useEffect(() => {
    meetingManagerRef.current?.toggleTrack('video', isCameraOn);
    setParticipants(prev => prev.map(p => p.isLocal ? { ...p, isCameraOn, isMicOn, stream } : p));
  }, [isCameraOn, isMicOn, stream]);
  
  const handleToggleCamera = () => {
      toggleCamera();
      meetingManagerRef.current?.toggleTrack('video', !isCameraOn);
  };
  
  const handleToggleMic = () => {
      toggleMic();
      meetingManagerRef.current?.toggleTrack('audio', !isMicOn);
  };
  
  const handleSendMessage = (message: string) => {
    meetingManagerRef.current?.sendChatMessage(message);
  };

  const localParticipant = participants.find(p => p.isLocal);

  const getGridCols = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  }

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900">
      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-1 transition-all duration-300 p-4 flex items-center justify-center`}>
            <div className={`grid ${getGridCols(participants.length)} gap-4 w-full h-full max-w-7xl`}>
                {participants.map(participant => (
                    <VideoTile 
                        key={participant.id} 
                        participant={participant} 
                    />
                ))}
            </div>
        </div>
        <Sidebar 
            isOpen={isSidebarOpen} 
            localParticipantId={localParticipant?.id || ''}
            localUserName={userName} 
            messages={chatMessages}
            onSendMessage={handleSendMessage}
        />
      </main>
      <footer className="w-full">
        <ControlBar 
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            onToggleCamera={handleToggleCamera}
            onToggleMic={handleToggleMic}
            onLeave={onLeave}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </footer>
    </div>
  );
};

export default MeetingRoom;