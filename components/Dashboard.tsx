
import React, { useState } from 'react';
import { PlusIcon, ClockIcon } from './icons';

interface DashboardProps {
    onNewMeeting: () => void;
    onJoinMeeting: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewMeeting, onJoinMeeting }) => {
    const [meetingCode, setMeetingCode] = useState('');
    
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
            <header className="w-full max-w-5xl mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-white">Gemini Meet</h1>
                <p className="text-zinc-400">Your intelligent meeting space</p>
            </header>
            
            <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={onNewMeeting}
                        className="flex items-center justify-center gap-2 w-full bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors shadow-lg"
                    >
                        <PlusIcon size={20} />
                        <span>New Meeting</span>
                    </button>
                    <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter a code or link"
                          value={meetingCode}
                          onChange={(e) => setMeetingCode(e.target.value)}
                          className="flex-grow bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <button
                          onClick={() => onJoinMeeting(meetingCode)}
                          disabled={!meetingCode.trim()}
                          className="bg-zinc-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors"
                        >
                          Join
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                    <h2 className="text-xl font-semibold mb-4">Upcoming Today</h2>
                    <div className="text-center py-8 px-4 border-2 border-dashed border-zinc-700 rounded-lg h-full flex flex-col justify-center">
                        <ClockIcon size={32} className="mx-auto text-zinc-600 mb-2" />
                        <p className="text-zinc-500 font-medium">Your scheduled meetings will appear here.</p>
                        <p className="text-xs text-zinc-600 mt-1">This feature isn't connected to a calendar yet.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
