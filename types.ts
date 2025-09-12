
export interface Participant {
  id: string;
  name: string;
  isLocal?: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  stream: MediaStream | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface MeetingSummary {
    title: string;
    summary: string;
    keyPoints: string[];
    actionItems: {
        owner: string;
        task: string;
    }[];
}
