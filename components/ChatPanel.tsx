
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon } from './icons';

interface ChatPanelProps {
  localParticipantId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ localParticipantId, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="h-[calc(100vh-125px)] flex flex-col p-4 bg-zinc-800/50">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => {
          const isLocal = msg.senderId === localParticipantId;
          return (
            <div key={msg.id} className={`flex flex-col ${isLocal ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isLocal ? 'bg-brand-primary text-white rounded-br-none' : 'bg-zinc-700 text-zinc-200 rounded-bl-none'}`}>
                {!isLocal && <p className="text-xs font-bold text-brand-secondary mb-1">{msg.senderName}</p>}
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs text-right mt-1 opacity-60">{msg.timestamp}</p>
              </div>
            </div>
          );
        })}
         <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 bg-zinc-700 border border-zinc-600 rounded-full px-4 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <button type="submit" className="bg-brand-primary text-white p-2.5 rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50" disabled={!newMessage.trim()}>
          <SendIcon size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
