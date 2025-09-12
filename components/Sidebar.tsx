

import React, { useState } from 'react';
import { ChatIcon, AssistantIcon } from './icons';
import ChatPanel from './ChatPanel';
import AssistantPanel from './AssistantPanel';
import type { ChatMessage } from '../types';

interface SidebarProps {
  isOpen: boolean;
  localUserName: string;
  localParticipantId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

type ActiveTab = 'chat' | 'assistant';

const Sidebar: React.FC<SidebarProps> = ({ isOpen, localUserName, localParticipantId, messages, onSendMessage }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  const TabButton: React.FC<{
    tabName: ActiveTab;
    children: React.ReactNode;
  }> = ({ tabName, children }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
        activeTab === tabName
          ? 'text-brand-primary border-brand-primary'
          : 'text-zinc-400 border-transparent hover:text-white hover:border-zinc-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <aside className={`flex flex-col bg-zinc-900 border-l border-zinc-700/50 transition-all duration-300 ease-in-out ${isOpen ? 'w-full max-w-sm' : 'w-0'}`} style={{ overflow: isOpen ? 'visible' : 'hidden'}}>
      <div className="flex-shrink-0 w-full max-w-sm" style={{ minWidth: '384px'}}>
        <div className="border-b border-zinc-700/50">
          <nav className="flex">
            <TabButton tabName="chat">
              <ChatIcon size={18} /> Chat
            </TabButton>
            <TabButton tabName="assistant">
              <AssistantIcon size={18} /> Assistant
            </TabButton>
          </nav>
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chat' && (
            <ChatPanel 
                localParticipantId={localParticipantId}
                messages={messages}
                onSendMessage={onSendMessage}
            />
          )}
          {activeTab === 'assistant' && <AssistantPanel />}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
