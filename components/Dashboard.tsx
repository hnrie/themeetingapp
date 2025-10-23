
import React, { useState } from 'react';
import { PlusIcon, VideoCameraIcon } from './icons';

interface DashboardProps {
    onNewMeeting: () => void;
    onJoinMeeting: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewMeeting, onJoinMeeting }) => {
    const [meetingCode, setMeetingCode] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (meetingCode.trim()) {
            onJoinMeeting(meetingCode);
        }
    };
    
    return (
        <div className="relative flex flex-col items-center justify-center h-full p-4 md:p-8 overflow-hidden">
            {/* Background decorative element */}
            <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl" />

            <main className="w-full max-w-md bg-zinc-900/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-zinc-800/50">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">Gemini Meet</h1>
                    <p className="text-zinc-400 mt-2">Your intelligent meeting space</p>
                </header>

                <div className="flex flex-col gap-4">
                    <button 
                        onClick={onNewMeeting}
                        className="flex items-center justify-center gap-3 w-full bg-brand-primary text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-500 transition-transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50"
                    >
                        <PlusIcon size={22} />
                        <span className="text-lg">New Meeting</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <hr className="w-full border-zinc-700" />
                        <span className="text-zinc-500 text-xs font-semibold">OR</span>
                        <hr className="w-full border-zinc-700" />
                    </div>

                    <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Enter a code or link"
                          value={meetingCode}
                          onChange={(e) => setMeetingCode(e.target.value)}
                          className="flex-grow bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!meetingCode.trim()}
                          className="flex items-center justify-center gap-2 bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors focus:outline-none focus:ring-4 focus:ring-zinc-600/50"
                        >
                          <VideoCameraIcon size={20}/>
                          <span>Join</span>
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
