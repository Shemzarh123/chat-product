import React, { useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { useAuth, useChat } from '../context/AuthContext'; // Adjust import
import io from 'socket.io-client';

const VideoCall = ({ meetingId, isHost = false }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();
  const socketRef = useRef();
  const { user, token } = useAuth();
  const { joinMeeting } = useChat(); // From enhanced ChatContext

  useEffect(() => {
    socketRef.current = io('http://localhost:3001');
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      localVideoRef.current.srcObject = stream;
      
      socketRef.current.emit('joinMeeting', meetingId);
      
      socketRef.current.on('participantJoined', ({ userId }) => {
        createPeer(userId, stream, isHost);
      });

      socketRef.current.on('callStarted', ({ hostId }) => {
        createPeer(hostId, stream, !isHost);
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [meetingId, isHost]);

  const createPeer = useCallback((userToSignal, stream, caller) => {
    const peer = new Peer({
      initiator: caller,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', signal => {
      // Send offer/answer via socket
      socketRef.current.emit('offerOrAnswer', { signal, userId: userToSignal, meetingId });
    });

    peer.on('stream', remoteStream => {
      remoteVideoRef.current.srcObject = remoteStream;
    });

    peerRef.current = peer;
  }, []);

  socketRef.current?.on('offerOrAnswer', ({ signal, from }) => {
    const peer = peerRef.current || new Peer({ trickle: false });
    peer.signal(signal);
    peerRef.current = peer;
  });

  const toggleCamera = () => {
    const stream = localVideoRef.current.srcObject;
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
  };

  const toggleMic = () => {
    const stream = localVideoRef.current.srcObject;
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      localVideoRef.current.srcObject = screenStream;
      peerRef.current.replaceStream(screenStream);
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  return (
    <div className="video-call">
      <div className="video-container">
        <video ref={localVideoRef} autoPlay muted className="local-video" />
        <video ref={remoteVideoRef} autoPlay className="remote-video" />
      </div>
      <div className="call-controls">
        <button onClick={toggleCamera} title="Toggle Camera">
          📹
        </button>
        <button onClick={toggleMic} title="Toggle Microphone">
          🔇
        </button>
        <button onClick={shareScreen} title="Share Screen">
          🖥️
        </button>
        <button onClick={() => socketRef.current.emit('callStarted', meetingId)} disabled={!isHost}>
          🚀 Start Call
        </button>
      </div>
      <div className="participants">
        <p>Meeting ID: {meetingId}</p>
        {/* Participants list from socket */}
      </div>
    </div>
  );
};

export default VideoCall;

