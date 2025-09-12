
import React, { useState } from 'react';
import { getMeetingSummary } from '../services/geminiService';
import type { MeetingSummary } from '../types';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
    </div>
);

const AssistantPanel: React.FC = () => {
    const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState<MeetingSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSummary = async () => {
        if (!transcript.trim()) {
            setError('Please paste a transcript first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSummary(null);

        try {
            const result = await getMeetingSummary(transcript);
            setSummary(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-[calc(100vh-125px)] flex flex-col p-4 bg-zinc-800/50">
            <div className="flex-1 overflow-y-auto pr-2">
                <h3 className="font-bold text-lg mb-2">Meeting Assistant</h3>
                <p className="text-sm text-zinc-400 mb-4">
                    Paste the meeting transcript below to generate a title, summary, key points, and action items.
                </p>
                
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste your meeting transcript here..."
                    className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerateSummary}
                    disabled={isLoading || !transcript.trim()}
                    className="w-full mt-2 bg-brand-secondary text-white font-semibold py-2 rounded-md disabled:bg-green-500/50 disabled:cursor-not-allowed hover:bg-green-500 transition-colors"
                >
                    {isLoading ? 'Generating...' : 'Generate Summary'}
                </button>

                {isLoading && <LoadingSpinner />}
                
                {error && <div className="mt-4 p-3 bg-red-900/50 border border-brand-danger rounded-md text-sm text-red-200">{error}</div>}

                {summary && (
                    <div className="mt-6 space-y-4 text-sm">
                        <div>
                            <h4 className="font-bold text-brand-primary text-base mb-1">{summary.title}</h4>
                            <p className="text-zinc-300">{summary.summary}</p>
                        </div>
                        <div>
                            <h5 className="font-semibold text-zinc-200 mb-2">Key Points</h5>
                            <ul className="list-disc list-inside space-y-1 text-zinc-300">
                                {summary.keyPoints.map((point, i) => <li key={i}>{point}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h5 className="font-semibold text-zinc-200 mb-2">Action Items</h5>
                            <ul className="space-y-2 text-zinc-300">
                                {summary.actionItems.map((item, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="font-semibold text-brand-secondary">{item.owner}:</span> 
                                        <span>{item.task}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssistantPanel;
