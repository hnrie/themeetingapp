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
    
    private socket: WebSocket | null = null;

    private localStream: MediaStream | null = null;
    private currentVideoTrack: MediaStreamTrack | null = null;
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

        const url = (window as any).__SIGNALING_URL__ || import.meta.env.VITE_SIGNALING_URL || `ws://${location.hostname}:3001/ws`;
        try {
            this.socket = new WebSocket(url);
            this.socket.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(String(ev.data));
                    this.handleSocketMessage(msg);
                } catch (e) {
                    console.error('Bad signaling message', e);
                }
            };
            this.socket.onopen = () => {
                // noop; join will be sent when local stream is set
            };
            this.socket.onclose = () => {
                console.warn('Signaling socket closed');
            };
        } catch (e) {
            console.error('Failed to connect to signaling server', e);
        }
    }

    private sendSignal(type: string, payload: any, to?: string) {
        if (!this.socket || this.socket.readyState !== this.socket.OPEN) return;
        const message = { type, room: this.meetingId, from: this.myId, to, payload };
        this.socket.send(JSON.stringify(message));
    }

    private async handleSocketMessage(msg: any) {
        try {
            const { type, payload } = msg;
            const { from, sdp, candidate, name } = payload || {};

            // Ignore messages from ourselves or those not intended for us
            if (from === this.myId || (to && to !== this.myId)) return;
            
            switch (type) {
                case 'peers':
                    // Initial peer list on join
                    (payload.peers || []).forEach((p: any) => {
                        this.emit('participant-joined', { id: p.id, name: p.name });
                        this.createPeerConnection(p.id, p.name, true);
                    });
                    break;
                case 'join':
                    this.emit('participant-joined', { id: from, name });
                    this.createPeerConnection(from, name, true);
                    break;
                case 'offer':
                    // Received by a new peer from an existing peer.
                    // Announce the existing peer and answer the offer.
                    this.emit('participant-joined', { id: from, name });
                    const pc = this.createPeerConnection(from, name, false); // New peer is the receiver
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    this.sendSignal('answer', { sdp: answer }, from);
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
            // Add the audio track from the original source stream
            this.localStream.getAudioTracks().forEach(track => {
                pc.addTrack(track, this.localStream!);
            });
            // Add the currently active video track (camera or screen share)
            if (this.currentVideoTrack) {
                pc.addTrack(this.currentVideoTrack, this.localStream);
            }
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal('candidate', { candidate: event.candidate }, remoteId);
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
                    this.sendSignal('offer', { name: this.myName, sdp: pc.localDescription }, remoteId);
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
        this.currentVideoTrack = stream.getVideoTracks()[0] || null;
        this.myName = userName;
        // If socket not yet open, wait for connection before sending join
        const sendJoin = () => this.sendSignal('join', { name: userName });
        if (this.socket && this.socket.readyState === this.socket.OPEN) {
            sendJoin();
        } else if (this.socket) {
            const onOpen = () => { sendJoin(); this.socket?.removeEventListener('open', onOpen as any); };
            this.socket.addEventListener('open', onOpen as any);
        }
    }

    public leave() {
        try {
            this.sendSignal('leave', { from: this.myId });
        } catch {}

        // Close all peer connections and clear speaking monitors
        this.peers.forEach((_, id) => this.closePeerConnection(id));

        // Clear any remaining analyser intervals
        this.analysers.forEach(({ intervalId }) => {
            clearInterval(intervalId);
        });
        this.analysers.clear();

        // Close shared AudioContext used for remote audio monitors
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (e) {
                console.warn('Failed to close AudioContext on leave:', e);
            }
            this.audioContext = null;
        }

        // Close signaling channel
        // Close signaling socket
        try {
            if (this.socket && this.socket.readyState === this.socket.OPEN) {
                this.socket.close();
            }
        } catch {}

        // Release local references
        this.localStream = null;
        this.currentVideoTrack = null;
    }
    
    public toggleTrack(kind: 'video' | 'audio', enabled: boolean) {
        this.sendSignal('track-toggled', { kind, enabled });
    }

    public async replaceTrack(track: MediaStreamTrack): Promise<void> {
        const kind = track.kind;
        const replacementPromises = Array.from(this.peers.values()).map(({ pc }) => {
            const sender = pc.getSenders().find(s => s.track?.kind === kind);
            if (sender) {
                return sender.replaceTrack(track).catch(err => {
                    console.error(`Failed to replace track for peer:`, err);
                });
            }
            return Promise.resolve();
        });

        await Promise.all(replacementPromises);

        if (kind === 'video') {
            this.currentVideoTrack = track;
        }
    }
    
    public notifyScreenShareStatus(isScreenSharing: boolean) {
        this.sendSignal('screen-share-status', { isScreenSharing });
    }

    public muteParticipant(participantId: string) {
        this.sendSignal('force-mute', {}, participantId);
    }
    
    public unmuteParticipant(participantId: string) {
        this.sendSignal('request-unmute', {}, participantId);
    }

    public sendChatMessage(message: string) {
        const chatMessage: Partial<ChatMessage> = {
            id: `${this.myId}-${Date.now()}`,
            message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: this.myName,
        };
        this.emit('chat-message', { ...chatMessage, senderId: this.myId });
        this.sendSignal('chat-message', { ...chatMessage });
    }
}