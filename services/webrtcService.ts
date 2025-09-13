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

    private audioContext: AudioContext | null = null;
    private analysers: Map<string, { intervalId: number }> = new Map();
    private speakingThreshold = 5; // Sensitivity for speaking detection

    private configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    constructor(meetingId: string) {
        super();
        this.myId = `id-${Math.random().toString(36).substr(2, 9)}`;
        this.meetingId = meetingId;
        
        this.channel = new BroadcastChannel(this.meetingId);
        this.channel.onmessage = this.handleSignalingMessage.bind(this);
    }

    private sendSignal(type: string, payload: any) {
        const message = { type, payload };
        this.channel.postMessage(message);
    }

    private async handleSignalingMessage(event: MessageEvent) {
        try {
            const { type, payload } = event.data;
            const { from, to, sdp, candidate, name } = payload;

            // Ignore messages from ourselves or those not intended for us
            if (from === this.myId || (to && to !== this.myId)) return;
            
            switch (type) {
                case 'join':
                    // An existing peer receives 'join' from a new peer.
                    // Add the new peer to the UI and send a 'welcome' signal back.
                    this.emit('participant-joined', { id: from, name });
                    this.sendSignal('welcome', { from: this.myId, to: from, name: this.myName });
                    break;
                case 'welcome':
                    // The new peer receives 'welcome' from an existing peer.
                    // Add the existing peer to the UI and initiate the connection.
                    this.emit('participant-joined', { id: from, name });
                    this.createPeerConnection(from, name, true); // true = isInitiator
                    break;
                case 'offer':
                    // A peer receives an offer. The participant should have been added via the join/welcome handshake.
                    const pc = this.createPeerConnection(from, name, false); // The receiver is never the initiator.
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
                case 'screen-share-status':
                    this.emit('screen-share-status', { id: from, isScreenSharing: payload.isScreenSharing });
                    break;
                case 'force-mute':
                    this.emit('force-mute-triggered', {});
                    break;
                case 'request-unmute':
                    this.emit('unmute-requested', {});
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

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream!);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal('candidate', { from: this.myId, to: remoteId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            this.emit('stream-added', { id: remoteId, stream: event.streams[0] });
            if (event.track.kind === 'audio') {
                this.monitorAudioLevel(remoteId, event.streams[0]);
            }
        };
        
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' && isInitiator) {
                console.warn(`Connection failed for peer ${remoteId}. Attempting ICE restart.`);
                pc.createOffer({ iceRestart: true })
                   .then(offer => pc.setLocalDescription(offer))
                   .then(() => {
                       this.sendSignal('offer', { from: this.myId, to: remoteId, name: this.myName, sdp: pc.localDescription });
                   }).catch(e => console.error("ICE restart offer failed:", e));
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
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
            if (this.analysers.has(remoteId)) {
                clearInterval(this.analysers.get(remoteId)!.intervalId);
                this.analysers.delete(remoteId);
            }
        }
    }

    private monitorAudioLevel(remoteId: string, stream: MediaStream) {
        try {
            if (!this.audioContext) this.audioContext = new AudioContext();
            const source = this.audioContext.createMediaStreamSource(stream);
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            source.connect(analyser);

            let isSpeaking = false;
            const intervalId = setInterval(() => {
                analyser.getByteTimeDomainData(dataArray);
                let sumSquares = 0.0;
                for (const amplitude of dataArray) {
                    const normalized = (amplitude / 128.0) - 1.0;
                    sumSquares += normalized * normalized;
                }
                const rms = Math.sqrt(sumSquares / dataArray.length);

                const currentlySpeaking = rms * 100 > this.speakingThreshold;
                if (currentlySpeaking !== isSpeaking) {
                    isSpeaking = currentlySpeaking;
                    this.emit('speaking-status', { id: remoteId, isSpeaking });
                }
            }, 200);

            this.analysers.set(remoteId, { intervalId });
        } catch (error) {
            console.error('Failed to monitor audio level:', error);
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

    public replaceTrack(track: MediaStreamTrack) {
        const kind = track.kind;
        this.peers.forEach(({ pc }) => {
            const sender = pc.getSenders().find(s => s.track?.kind === kind);
            if (sender) {
                sender.replaceTrack(track);
            }
        });
        if (kind === 'video') {
            const localVideoTrack = this.localStream?.getVideoTracks()[0];
            if (localVideoTrack) {
                this.localStream?.removeTrack(localVideoTrack);
            }
            this.localStream?.addTrack(track);
        }
    }
    
    public notifyScreenShareStatus(isScreenSharing: boolean) {
        this.sendSignal('screen-share-status', { from: this.myId, isScreenSharing });
    }

    public muteParticipant(participantId: string) {
        this.sendSignal('force-mute', { from: this.myId, to: participantId });
    }
    
    public unmuteParticipant(participantId: string) {
        this.sendSignal('request-unmute', { from: this.myId, to: participantId });
    }

    public sendChatMessage(message: string) {
        const chatMessage: Partial<ChatMessage> = {
            id: `${this.myId}-${Date.now()}`,
            message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: this.myName,
        };
        this.emit('chat-message', { ...chatMessage, senderId: this.myId });
        this.sendSignal('chat-message', { ...chatMessage, from: this.myId });
    }
}