
import React, { useState, useEffect, useCallback } from 'react';
import Lobby from './components/Lobby';
import MeetingRoom from './components/MeetingRoom';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'lobby' | 'meeting'>('dashboard');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setMeetingId(hash);
        setView('lobby');
      } else {
        setMeetingId(null);
        setView('dashboard');
        setUserName('');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleCreateMeeting = useCallback(() => {
    const newMeetingId = `gem-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
    window.location.hash = newMeetingId;
  }, []);
  
  const handleJoinMeetingById = useCallback((id: string) => {
      if(id.trim()){
          window.location.hash = id.trim();
      }
  }, []);

  const handleJoinLobby = useCallback((name: string) => {
    if (name.trim() && meetingId) {
      setUserName(name.trim());
      setView('meeting');
    }
  }, [meetingId]);

  const handleLeaveMeeting = useCallback(() => {
    window.location.hash = '';
  }, []);

  const renderView = () => {
    switch (view) {
      case 'lobby':
        return <Lobby onJoin={handleJoinLobby} />;
      case 'meeting':
        if (!meetingId || !userName) {
          handleLeaveMeeting();
          return null;
        }
        return <MeetingRoom meetingId={meetingId} userName={userName} onLeave={handleLeaveMeeting} />;
      case 'dashboard':
      default:
        return <Dashboard onNewMeeting={handleCreateMeeting} onJoinMeeting={handleJoinMeetingById} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-brand-dark font-sans">
      {renderView()}
    </div>
  );
};

export default App;
