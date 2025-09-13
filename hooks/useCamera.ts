
import { useState, useCallback, useRef, useEffect } from 'react';
import type { VideoQuality } from '../types';

const qualityToConstraints: Record<VideoQuality, MediaStreamConstraints> = {
    'auto': { video: true },
    '360p': { video: { height: { ideal: 360 } } },
    '720p': { video: { height: { ideal: 720 } } },
    '1080p': { video: { height: { ideal: 1080 } } },
    '4k': { video: { height: { ideal: 2160 } } },
};

export const useCamera = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [videoQuality, setVideoQuality] = useState<VideoQuality>('auto');
    const [error, setError] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    const startStream = useCallback(async () => {
        setError(null);
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(device => device.kind === 'videoinput');
            const hasAudio = devices.some(device => device.kind === 'audioinput');

            if (!hasVideo && !hasAudio) {
                setError("No camera or microphone found. Please connect a device and grant permissions.");
                return;
            }

            const initialQuality = 'auto';
            const constraints: MediaStreamConstraints = {
                video: hasVideo ? qualityToConstraints[initialQuality].video : false,
                audio: hasAudio,
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            streamRef.current = mediaStream;
            cameraStreamRef.current = mediaStream; // Keep a reference to the original camera stream
            setStream(mediaStream);
            setIsCameraOn(hasVideo && mediaStream.getVideoTracks().length > 0 && mediaStream.getVideoTracks()[0].enabled);
            setIsMicOn(hasAudio && mediaStream.getAudioTracks().length > 0 && mediaStream.getAudioTracks()[0].enabled);
            setVideoQuality(initialQuality);

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
    }, []);
    
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
        setIsCameraOn(false);
        setIsMicOn(false);
        setIsScreenSharing(false);
    }, []);

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
            setIsCameraOn(false); // Camera is not "on" while sharing

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
            console.warn(message);
            setError(message);
            return;
        }

        const videoTrack = cameraStreamRef.current.getVideoTracks()[0];
        if (!videoTrack) {
            const message = 'No active video track to update.';
            console.warn(message);
            setError(message);
            return;
        }

        try {
            const constraints = qualityToConstraints[newQuality];
            if (typeof constraints.video === 'object') {
                await videoTrack.applyConstraints(constraints.video);
                setVideoQuality(newQuality);
            } else if (constraints.video === true) {
                // For 'auto', we can't apply `true`. We can just clear constraints by applying an empty object.
                await videoTrack.applyConstraints({});
                setVideoQuality('auto');
            }
        } catch (err) {
            console.error('Error applying constraints', err);
            setError('Failed to change video quality. Your camera might not support this resolution.');
        }
    }, [isScreenSharing]);

    useEffect(() => {
        return () => {
            stopStream();
        };
    }, [stopStream]);

    return {
        stream,
        startStream,
        stopStream,
        isCameraOn,
        isMicOn,
        toggleCamera,
        toggleMic,
        error,
        isScreenSharing,
        startScreenShare,
        stopScreenShare,
        videoQuality,
        updateStreamQuality,
    };
};
