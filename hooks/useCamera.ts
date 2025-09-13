
import { useState, useCallback, useRef, useEffect } from 'react';
import type { VideoQuality, DeviceInfo } from '../types';

const qualityToConstraints: Record<VideoQuality, MediaStreamConstraints['video']> = {
    'auto': true,
    '360p': { height: { ideal: 360 } },
    '720p': { height: { ideal: 720 } },
    '1080p': { height: { ideal: 1080 } },
    '4k': { height: { ideal: 2160 } },
};

export const useCamera = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [videoQuality, setVideoQuality] = useState<VideoQuality>('auto');
    const [error, setError] = useState<string | null>(null);

    const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
    const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null);
    const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const audioMonitorRef = useRef<{ context: AudioContext, analyser: AnalyserNode, intervalId: number } | null>(null);

    const getDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevs = devices.filter(d => d.kind === 'videoinput').map(d => ({ deviceId: d.deviceId, label: d.label, kind: d.kind }));
            const audioDevs = devices.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label, kind: d.kind }));
            setVideoDevices(videoDevs);
            setAudioDevices(audioDevs);
            if (!selectedVideoDeviceId && videoDevs.length > 0) setSelectedVideoDeviceId(videoDevs[0].deviceId);
            if (!selectedAudioDeviceId && audioDevs.length > 0) setSelectedAudioDeviceId(audioDevs[0].deviceId);
        } catch (err) {
            console.error("Error enumerating devices:", err);
        }
    }, [selectedAudioDeviceId, selectedVideoDeviceId]);

    const startLocalAudioMonitor = useCallback(() => {
        if (!streamRef.current || audioMonitorRef.current) return;
        try {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (!audioTrack) return;

            const context = new AudioContext();
            const source = context.createMediaStreamSource(new MediaStream([audioTrack]));
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const intervalId = setInterval(() => {
                analyser.getByteTimeDomainData(dataArray);
                const rms = Math.sqrt(dataArray.reduce((acc, val) => acc + ((val / 128.0) - 1.0) ** 2, 0) / bufferLength);
                const speaking = rms * 100 > 5; // Speaking threshold
                setIsSpeaking(speaking);
            }, 200);

            audioMonitorRef.current = { context, analyser, intervalId };

        } catch (err) {
            console.error("Failed to start local audio monitor", err);
        }
    }, []);

    const stopLocalAudioMonitor = useCallback(() => {
        if (audioMonitorRef.current) {
            clearInterval(audioMonitorRef.current.intervalId);
            audioMonitorRef.current.context.close();
            audioMonitorRef.current = null;
            setIsSpeaking(false);
        }
    }, []);

    const startStream = useCallback(async () => {
        setError(null);
        try {
            const hasPermissions = (await navigator.mediaDevices.enumerateDevices()).some(d => d.label);
            if (!hasPermissions) {
                 await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            }
            await getDevices();

            // FIX: The spread operator `...` cannot be used on a boolean value (like for 'auto' quality),
            // which was causing a "Spread types may only be created from object types" error.
            // This logic now correctly handles both object and boolean types for quality constraints.
            const qualityConstraint = qualityToConstraints[videoQuality];
            const videoConstraints = selectedVideoDeviceId
                ? {
                    deviceId: { exact: selectedVideoDeviceId },
                    ...(typeof qualityConstraint === 'object' ? qualityConstraint : {}),
                  }
                : qualityConstraint;
            const audioConstraints = selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true;
           
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: audioConstraints,
            });
            
            streamRef.current = mediaStream;
            cameraStreamRef.current = mediaStream;
            setStream(mediaStream);
            setIsCameraOn(mediaStream.getVideoTracks().length > 0 && mediaStream.getVideoTracks()[0].enabled);
            setIsMicOn(mediaStream.getAudioTracks().length > 0 && mediaStream.getAudioTracks()[0].enabled);
            startLocalAudioMonitor();

        } catch (err) {
            console.error('Error accessing media devices.', err);
             if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    setError('Permission to use camera and/or microphone was denied. Please enable access in your browser settings.');
                } else if (err.name === 'NotFoundError') {
                     setError('No camera or microphone found that matches the request. Please connect a device.');
                } else {
                    setError(`An error occurred while accessing media devices: ${err.name}`);
                }
            } else {
                 setError('An unknown error occurred while accessing media devices.');
            }
        }
    }, [getDevices, selectedAudioDeviceId, selectedVideoDeviceId, videoQuality, startLocalAudioMonitor]);
    
    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            setStream(null);
            streamRef.current = null;
        }
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        stopLocalAudioMonitor();
        setIsCameraOn(false);
        setIsMicOn(false);
        setIsScreenSharing(false);
    }, [stopLocalAudioMonitor]);

    const toggleCamera = useCallback(() => {
        if (cameraStreamRef.current && !isScreenSharing) {
            const videoTrack = cameraStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        }
    }, [isScreenSharing]);

    const toggleMic = useCallback(() => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    }, []);

    const startScreenShare = useCallback(async (onStop: () => void): Promise<MediaStreamTrack | null> => {
        if (isScreenSharing) return null;
        try {
            const screenMedia = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenMedia.getVideoTracks()[0];
            if (!screenTrack) return null;

            screenStreamRef.current = screenMedia;
            setIsScreenSharing(true);
            setIsCameraOn(false); 
            screenTrack.onended = onStop;
            
            return screenTrack;
        } catch (err) {
            console.error("Screen share error:", err);
            return null;
        }
    }, [isScreenSharing]);

    const stopScreenShare = useCallback((): MediaStreamTrack | null => {
        if (!isScreenSharing || !cameraStreamRef.current) return null;
        
        screenStreamRef.current?.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        setIsCameraOn(true);
        
        return cameraStreamRef.current.getVideoTracks()[0];
    }, [isScreenSharing]);
    
    const updateStreamQuality = useCallback(async (newQuality: VideoQuality): Promise<void> => {
        setError(null);
        if (!cameraStreamRef.current || isScreenSharing) {
            const message = 'Cannot change quality while screen sharing.';
            setError(message);
            return;
        }

        const videoTrack = cameraStreamRef.current.getVideoTracks()[0];
        if (!videoTrack) {
            const message = 'No active video track to update.';
            setError(message);
            return;
        }

        try {
            const constraints = qualityToConstraints[newQuality];
            await videoTrack.applyConstraints(typeof constraints === 'object' ? constraints : {});
            setVideoQuality(newQuality);
        } catch (err) {
            console.error('Error applying constraints', err);
            setError('Failed to change video quality. Your camera might not support this resolution.');
        }
    }, [isScreenSharing]);

    const switchDevice = useCallback(async (kind: 'video' | 'audio', deviceId: string): Promise<MediaStreamTrack | null> => {
        if (!streamRef.current) return null;

        const oldTrack = kind === 'video' ? streamRef.current.getVideoTracks()[0] : streamRef.current.getAudioTracks()[0];
        
        try {
            const constraints = { [kind]: { deviceId: { exact: deviceId } } };
            const newMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newTrack = newMediaStream.getTracks()[0];

            if (oldTrack) {
                streamRef.current.removeTrack(oldTrack);
                oldTrack.stop();
            }
            streamRef.current.addTrack(newTrack);
            
            if (kind === 'video') {
                cameraStreamRef.current = streamRef.current; // update camera ref
                setSelectedVideoDeviceId(deviceId);
            } else {
                setSelectedAudioDeviceId(deviceId);
                stopLocalAudioMonitor(); // Restart monitor with new audio track
                startLocalAudioMonitor();
            }

            return newTrack;
        } catch (err) {
            console.error(`Error switching ${kind} device:`, err);
            if (oldTrack) streamRef.current.addTrack(oldTrack); // Re-add old track on failure
            setError(`Failed to switch ${kind} device.`);
            return null;
        }
    }, [startLocalAudioMonitor, stopLocalAudioMonitor]);

    useEffect(() => {
        return () => { stopStream(); };
    }, [stopStream]);

    return {
        stream,
        startStream,
        stopStream,
        isCameraOn,
        isMicOn,
        isSpeaking,
        toggleCamera,
        toggleMic,
        error,
        isScreenSharing,
        startScreenShare,
        stopScreenShare,
        videoQuality,
        updateStreamQuality,
        videoDevices,
        audioDevices,
        selectedVideoDeviceId,
        selectedAudioDeviceId,
        switchDevice
    };
};
