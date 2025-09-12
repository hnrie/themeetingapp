import { useState, useCallback, useRef, useEffect } from 'react';

export const useCamera = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

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

            const constraints = {
                video: hasVideo,
                audio: hasAudio,
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            streamRef.current = mediaStream;
            setStream(mediaStream);
            setIsCameraOn(hasVideo && mediaStream.getVideoTracks().length > 0 && mediaStream.getVideoTracks()[0].enabled);
            setIsMicOn(hasAudio && mediaStream.getAudioTracks().length > 0 && mediaStream.getAudioTracks()[0].enabled);

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
            setIsCameraOn(false);
            setIsMicOn(false);
        }
    }, []);

    const toggleCamera = useCallback(() => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        }
    }, []);

    const toggleMic = useCallback(() => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    }, []);
    
    // Cleanup on unmount
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
    };
};
