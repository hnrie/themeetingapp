
export interface Participant {
  id: string;
  name: string;
  isLocal?: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  stream: MediaStream | null;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
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

export type VideoQuality = 'auto' | '360p' | '720p' | '1080p' | '4k';

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}
