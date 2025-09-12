
import type { ChatMessage } from '../types';

type EventCallback = (data: any) => void;

// A simple event emitter class
class EventEmitter {
    private events: { [key: string]: EventCallback[] } = {};

    on(event: string, callback: EventCallback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event: string, data: any) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

export class MeetingManager extends EventEmitter {
    public myId: string;
    private meetingId: string;
    private peers: Map<string, { pc: RTCPeerConnection, name: string }> = new Map();
    private channel: BroadcastChannel;
    private localStream: MediaStream | null = null;
    private myName: string = '';

    private configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    constructor(meetingId: string) {
        super();
        this.myId = `id-${Math.random().toString(36).substr(2, 9)}`;
        this.meetingId = meetingId;
        this.channel = new BroadcastChannel(`gemini-meet-${this.meetingId}`);
        this.channel.onmessage = this.handleSignalingMessage.bind(this);
    }

    private sendSignal(type: string, payload: any) {
        this.channel.postMessage(JSON.stringify({ type, payload }));
    }

    private async handleSignalingMessage(event: MessageEvent) {
        try {
            const { type, payload } = JSON.parse(event.data);
            const { from, to, sdp, candidate, name } = payload;

            // Ignore messages not intended for us or from ourselves
            if (from === this.myId || (to && to !== this.myId)) return;
            
            switch (type) {
                case 'join':
                    this.emit('participant-joined', { id: from, name });
                    this.createPeerConnection(from, name, true);
                    break;
                case 'offer':
                    this.emit('participant-joined', { id: from, name });
                    const pc = this.createPeerConnection(from, name, false);
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    this.sendSignal('answer', { from: this.myId, to: from, sdp: answer });
                    break;
                case 'answer':
                    await this.peers.get(from)?.pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    break;
                case 'candidate':
                     await this.peers.get(from)?.pc.addIceCandidate(new RTCIceCandidate(candidate));
                    break;
                case 'track-toggled':
                    this.emit('track-toggled', { id: from, kind: payload.kind, enabled: payload.enabled });
                    break;
                case 'chat-message':
                     this.emit('chat-message', {
                         id: payload.id,
                         senderId: from,
                         senderName: this.peers.get(from)?.name || payload.senderName,
                         message: payload.message,
                         timestamp: payload.timestamp
                     });
                    break;
                case 'leave':
                    this.closePeerConnection(from);
                    break;
            }
        } catch (error) {
            console.error("Error handling signal message:", error);
        }
    }
    
    private createPeerConnection(remoteId: string, remoteName: string, isInitiator: boolean): RTCPeerConnection {
        if (this.peers.has(remoteId)) {
            return this.peers.get(remoteId)!.pc;
        }
        
        const pc = new RTCPeerConnection(this.configuration);
        this.peers.set(remoteId, { pc, name: remoteName });

        // Add local tracks to the new connection
        this.localStream?.getTracks().forEach(track => pc.addTrack(track, this.localStream!));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal('candidate', { from: this.myId, to: remoteId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            this.emit('stream-added', { id: remoteId, stream: event.streams[0] });
        };
        
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
                this.closePeerConnection(remoteId);
            }
        };

        if (isInitiator) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    this.sendSignal('offer', { from: this.myId, to: remoteId, name: this.myName, sdp: pc.localDescription });
                });
        }
        
        return pc;
    }
    
    private closePeerConnection(remoteId: string) {
        const peer = this.peers.get(remoteId);
        if (peer) {
            peer.pc.close();
            this.peers.delete(remoteId);
            this.emit('participant-left', { id: remoteId });
        }
    }
    
    public join(stream: MediaStream, userName: string) {
        this.localStream = stream;
        this.myName = userName;
        this.sendSignal('join', { from: this.myId, name: userName });
    }

    public leave() {
        this.sendSignal('leave', { from: this.myId });
        this.peers.forEach((_, id) => this.closePeerConnection(id));
        this.channel.close();
    }
    
    public toggleTrack(kind: 'video' | 'audio', enabled: boolean) {
        this.localStream?.getTracks().forEach(track => {
            if (track.kind === kind) {
                track.enabled = enabled;
            }
        });
        this.sendSignal('track-toggled', { from: this.myId, kind, enabled });
    }
    
    public sendChatMessage(message: string) {
        const chatMessage: Partial<ChatMessage> = {
            id: `${this.myId}-${Date.now()}`,
            message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: this.myName,
        };
        this.emit('chat-message', { ...chatMessage, senderId: this.myId }); // Show own message immediately
        this.sendSignal('chat-message', { ...chatMessage, from: this.myId });
    }
}
