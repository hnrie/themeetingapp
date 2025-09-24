import React, { useEffect, useRef, useState } from 'react';

const CameraDebug: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('Not started');

  const startCamera = async () => {
    setStatus('Starting camera...');
    setError('');
    
    try {
      console.log('🔍 Debug: Starting camera test...');
      
      // Test basic media support
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices not supported');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      
      setStatus('Requesting camera permission...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('✅ Debug: Got stream:', mediaStream);
      console.log('📹 Video tracks:', mediaStream.getVideoTracks());
      console.log('🎤 Audio tracks:', mediaStream.getAudioTracks());
      
      setStream(mediaStream);
      setStatus('Camera started successfully!');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        console.log('🎬 Debug: Video element playing');
      }
      
    } catch (err) {
      console.error('❌ Debug: Camera error:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setStatus('Failed to start camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Debug: Stopped track:', track.kind);
      });
      setStream(null);
      setStatus('Camera stopped');
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="p-4 bg-zinc-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Camera Debug Tool</h3>
      
      <div className="mb-4">
        <p className="mb-2">Status: <span className="font-mono">{status}</span></p>
        {error && <p className="text-red-400 mb-2">Error: {error}</p>}
      </div>
      
      <div className="mb-4">
        <button 
          onClick={startCamera}
          className="mr-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
        >
          Start Camera
        </button>
        <button 
          onClick={stopCamera}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded"
        >
          Stop Camera
        </button>
      </div>
      
      <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>
      
      {stream && (
        <div className="mt-4 text-sm">
          <p>Stream ID: <span className="font-mono">{stream.id}</span></p>
          <p>Video tracks: {stream.getVideoTracks().length}</p>
          <p>Audio tracks: {stream.getAudioTracks().length}</p>
        </div>
      )}
    </div>
  );
};

export default CameraDebug;