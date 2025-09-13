
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Participant, ChatMessage, VideoQuality, DeviceInfo } from '../types';
import { useCamera } from '../hooks/useCamera';
import { MeetingManager } from '../services/webrtcService';
import VideoTile from './VideoTile';
import ControlBar from './ControlBar';
import Sidebar from './Sidebar';
import MeetingIdDisplay from './MeetingIdDisplay';
import Notification from './Notification';
import SettingsModal from './SettingsModal';

interface MeetingRoomProps {
  meetingId: string;
  userName: string;
  onLeave: () => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ meetingId, userName, onLeave }) => {
  const media = useCamera();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUnmuteRequest, setShowUnmuteRequest] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const meetingManagerRef = useRef<MeetingManager | null>(null);

  useEffect(() => {
    media.startStream();
  }, [media.startStream]);

  useEffect(() => {
    if (!media.stream || meetingManagerRef.current) return;

    const manager = new MeetingManager(meetingId);
    meetingManagerRef.current = manager;

    const setupManagerEvents = () => {
        manager.on('participant-joined', ({ id, name }) => {
            console.log('Participant joined:', name, id);
            setParticipants(prev => {
                // Prevent adding duplicate participants
                if (prev.some(p => p.id === id)) {
                    return prev;
                }
                return [
                    ...prev,
                    { id, name, isCameraOn: true, isMicOn: true, isSpeaking: false, isScreenSharing: false, stream: null }
                ];
            });
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

        manager.on('speaking-status', ({ id, isSpeaking }) => {
            setParticipants(prev => prev.map(p => p.id === id ? { ...p, isSpeaking } : p));
        });

        manager.on('screen-share-status', ({ id, isScreenSharing }) => {
            setParticipants(prev => prev.map(p => p.id === id ? { ...p, isScreenSharing } : p));
        });

        manager.on('force-mute-triggered', () => {
            if (media.isMicOn) {
                media.toggleMic();
            }
        });

        manager.on('unmute-requested', () => {
            setShowUnmuteRequest(true);
        });
        
        manager.on('chat-message', (message) => {
            setChatMessages(prev => [...prev, message]);
        });
    };

    setupManagerEvents();

    const localParticipant: Participant = {
        id: manager.myId,
        name: userName,
        isLocal: true,
        isCameraOn: media.isCameraOn,
        isMicOn: media.isMicOn,
        stream: media.stream,
        isSpeaking: media.isSpeaking,
        isScreenSharing: media.isScreenSharing,
    };
    setParticipants([localParticipant]);
    manager.join(media.stream, userName);
    
    return () => {
        manager.leave();
        meetingManagerRef.current = null;
    };
  }, [media.stream, meetingId, userName]);

   useEffect(() => {
    setParticipants(prev => prev.map(p => p.isLocal ? { 
        ...p, 
        isCameraOn: media.isCameraOn, 
        isMicOn: media.isMicOn, 
        isSpeaking: media.isSpeaking,
        stream: media.stream 
    } : p));
  }, [media.isCameraOn, media.isMicOn, media.stream, media.isSpeaking]);
  
  const handleToggleCamera = () => {
      media.toggleCamera();
      meetingManagerRef.current?.toggleTrack('video', !media.isCameraOn);
  };
  
  const handleToggleMic = () => {
      media.toggleMic();
      meetingManagerRef.current?.toggleTrack('audio', !media.isMicOn);
  };
  
  const handleToggleScreenShare = async () => {
      let isSharing;
      if (media.isScreenSharing) {
          const cameraTrack = media.stopScreenShare();
          if (cameraTrack && meetingManagerRef.current) {
              await meetingManagerRef.current.replaceTrack(cameraTrack);
          }
          isSharing = false;
      } else {
          const screenTrack = await media.startScreenShare(() => handleToggleScreenShare());
          if (screenTrack && meetingManagerRef.current) {
              await meetingManagerRef.current.replaceTrack(screenTrack);
              isSharing = true;
          } else {
              setNotification("Screen share permission was denied.");
              isSharing = false;
          }
      }
      meetingManagerRef.current?.notifyScreenShareStatus(isSharing);
      setParticipants(prev => prev.map(p => p.isLocal ? { ...p, isScreenSharing: isSharing } : p));
  };
  
  const handleSendMessage = (message: string) => {
    meetingManagerRef.current?.sendChatMessage(message);
  };

  const handleMuteParticipant = (participantId: string) => {
    meetingManagerRef.current?.muteParticipant(participantId);
  };
  
  const handleUnmuteParticipant = (participantId: string) => {
    meetingManagerRef.current?.unmuteParticipant(participantId);
  };
  
  const handleAcceptUnmute = () => {
    if (!media.isMicOn) {
      handleToggleMic();
    }
    setShowUnmuteRequest(false);
  };

  const handleDeclineUnmute = () => {
    setShowUnmuteRequest(false);
  };

  const handleQualityChange = async (newQuality: VideoQuality) => {
    setNotification("Changing video quality..."); 
    await media.updateStreamQuality(newQuality);

    if (media.error) {
        setNotification(media.error);
    } else {
        setNotification("Video quality updated.");
    }
  };

  const handleDeviceChange = async (kind: 'video' | 'audio', deviceId: string) => {
      setNotification(`Switching ${kind} device...`);
      const newTrack = await media.switchDevice(kind, deviceId);
      if (newTrack && meetingManagerRef.current) {
          await meetingManagerRef.current.replaceTrack(newTrack);
          setNotification(`${kind === 'video' ? 'Camera' : 'Microphone'} updated.`);
      } else {
          setNotification(`Failed to switch ${kind} device.`);
      }
  };

  const localParticipant = participants.find(p => p.isLocal);
  const hostId = useMemo(() => participants.length > 0 ? [...participants].sort((a, b) => a.id.localeCompare(b.id))[0].id : null, [participants]);
  const isHost = localParticipant?.id === hostId;

  const screenSharer = useMemo(() => participants.find(p => p.isScreenSharing), [participants]);
  const otherParticipants = useMemo(() => participants.filter(p => p.id !== screenSharer?.id), [participants, screenSharer]);

  const getGridCols = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  }

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900">
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
      <main className="relative flex-1 flex overflow-hidden">
        <MeetingIdDisplay meetingId={meetingId} />
        <div className="flex-1 transition-all duration-300 p-4 flex justify-center items-center">
          <div className="w-full h-full max-w-7xl">
            {screenSharer ? (
              <div className="flex w-full h-full gap-4">
                <div className="flex-1 h-full">
                  <VideoTile participant={screenSharer} />
                </div>
                {otherParticipants.length > 0 && (
                  <div className="w-48 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                    {otherParticipants.map(p => (
                      <div key={p.id} className="w-full aspect-video rounded-lg overflow-hidden">
                        <VideoTile participant={p} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`grid ${getGridCols(participants.length)} gap-4 w-full h-full`}>
                {participants.map(participant => (
                  <VideoTile key={participant.id} participant={participant} />
                ))}
              </div>
            )}
          </div>
        </div>

        {showUnmuteRequest && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-zinc-800 p-6 rounded-lg shadow-xl text-center max-w-sm mx-4">
                    <h3 className="font-bold text-lg mb-2">The host would like you to unmute</h3>
                    <p className="text-zinc-400 text-sm mb-6">Do you want to unmute your microphone?</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={handleDeclineUnmute} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors font-semibold">Keep Muted</button>
                        <button onClick={handleAcceptUnmute} className="px-4 py-2 bg-brand-primary hover:bg-blue-500 rounded-md transition-colors font-semibold">Unmute</button>
                    </div>
                </div>
            </div>
        )}

        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentQuality={media.videoQuality}
            onQualityChange={handleQualityChange}
            videoDevices={media.videoDevices}
            audioDevices={media.audioDevices}
            currentVideoDevice={media.selectedVideoDeviceId}
            currentAudioDevice={media.selectedAudioDeviceId}
            onDeviceChange={handleDeviceChange}
        />

        <Sidebar 
            isOpen={isSidebarOpen} 
            localParticipantId={localParticipant?.id || ''}
            localUserName={userName} 
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            participants={participants}
            isHost={isHost}
            onMuteParticipant={handleMuteParticipant}
            onUnmuteParticipant={handleUnmuteParticipant}
            hostId={hostId}
        />
      </main>
      <footer className="w-full">
        <ControlBar 
            isCameraOn={media.isCameraOn}
            isMicOn={media.isMicOn}
            isScreenSharing={media.isScreenSharing}
            onToggleCamera={handleToggleCamera}
            onToggleMic={handleToggleMic}
            onToggleScreenShare={handleToggleScreenShare}
            onLeave={onLeave}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onToggleSettings={() => setIsSettingsOpen(true)}
        />
      </footer>
    </div>
  );
};

export default MeetingRoom;