import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CallType = "audio" | "video";
export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

interface UseWebRTCOptions {
  userId: string;
  onIncomingCall?: (callerId: string, callType: CallType) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC({ userId, onIncomingCall }: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("audio");
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const durationInterval = useRef<number | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  // Generate a unique channel name for two users (sorted so both get the same channel)
  const getChannelName = useCallback((uid1: string, uid2: string) => {
    const sorted = [uid1, uid2].sort();
    return `call-${sorted[0]}-${sorted[1]}`;
  }, []);

  const startDurationTimer = useCallback(() => {
    setCallDuration(0);
    durationInterval.current = window.setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    remoteStream.current = null;
    peerConnection.current?.close();
    peerConnection.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    stopDurationTimer();
    iceCandidatesQueue.current = [];
    setCallState("idle");
    setRemoteUserId(null);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [stopDurationTimer]);

  const setupPeerConnection = useCallback(async (type: CallType) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    // Remote stream setup
    const remote = new MediaStream();
    remoteStream.current = remote;
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remote.addTrack(track);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
      }
    };

    // Get local media
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localStream.current = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return pc;
  }, []);

  const setupSignaling = useCallback(
    (targetUserId: string, isInitiator: boolean) => {
      const channelName = getChannelName(userId, targetUserId);
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.from === userId) return;
          const pc = peerConnection.current;
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          // Flush queued ICE candidates
          for (const c of iceCandidatesQueue.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          iceCandidatesQueue.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "answer",
            payload: { from: userId, sdp: answer },
          });
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.from === userId) return;
          const pc = peerConnection.current;
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          for (const c of iceCandidatesQueue.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          iceCandidatesQueue.current = [];
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (payload.from === userId) return;
          const pc = peerConnection.current;
          if (!pc || !pc.remoteDescription) {
            iceCandidatesQueue.current.push(payload.candidate);
          } else {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        })
        .on("broadcast", { event: "call-signal" }, ({ payload }) => {
          if (payload.from === userId) return;
          if (payload.action === "incoming" && !isInitiator) {
            setRemoteUserId(payload.from);
            setCallType(payload.callType);
            setCallState("ringing");
            onIncomingCall?.(payload.from, payload.callType);
          }
          if (payload.action === "accepted") {
            setCallState("connected");
            startDurationTimer();
          }
          if (payload.action === "rejected" || payload.action === "ended") {
            cleanup();
          }
        })
        .subscribe();

      channelRef.current = channel;

      // Setup ICE candidate forwarding
      if (peerConnection.current) {
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            channel.send({
              type: "broadcast",
              event: "ice-candidate",
              payload: { from: userId, candidate: event.candidate.toJSON() },
            });
          }
        };

        peerConnection.current.onconnectionstatechange = () => {
          if (peerConnection.current?.connectionState === "disconnected" || 
              peerConnection.current?.connectionState === "failed") {
            cleanup();
          }
        };
      }

      return channel;
    },
    [userId, getChannelName, onIncomingCall, cleanup, startDurationTimer]
  );

  // Initiate a call
  const startCall = useCallback(
    async (targetUserId: string, type: CallType) => {
      try {
        setCallType(type);
        setRemoteUserId(targetUserId);
        setCallState("calling");

        const pc = await setupPeerConnection(type);
        const channel = setupSignaling(targetUserId, true);

        // Send call signal
        await new Promise((r) => setTimeout(r, 500)); // Wait for channel subscription
        channel?.send({
          type: "broadcast",
          event: "call-signal",
          payload: { from: userId, action: "incoming", callType: type },
        });

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel?.send({
          type: "broadcast",
          event: "offer",
          payload: { from: userId, sdp: offer },
        });
      } catch (err) {
        console.error("Failed to start call:", err);
        cleanup();
        throw err;
      }
    },
    [userId, setupPeerConnection, setupSignaling, cleanup]
  );

  // Accept an incoming call
  const acceptCall = useCallback(async () => {
    if (!remoteUserId) return;
    try {
      await setupPeerConnection(callType);
      setupSignaling(remoteUserId, false);

      setCallState("connected");
      startDurationTimer();

      channelRef.current?.send({
        type: "broadcast",
        event: "call-signal",
        payload: { from: userId, action: "accepted" },
      });
    } catch (err) {
      console.error("Failed to accept call:", err);
      cleanup();
    }
  }, [remoteUserId, callType, userId, setupPeerConnection, setupSignaling, cleanup, startDurationTimer]);

  // Reject or end call
  const endCall = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "call-signal",
      payload: { from: userId, action: "ended" },
    });
    cleanup();
  }, [userId, cleanup]);

  const rejectCall = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "call-signal",
      payload: { from: userId, action: "rejected" },
    });
    cleanup();
  }, [userId, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    localStream.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    localStream.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoOff((v) => !v);
  }, []);

  // Listen for incoming calls globally
  useEffect(() => {
    if (!userId) return;
    // Subscribe to a personal channel for incoming call signals
    const personalChannel = supabase.channel(`user-calls-${userId}`, {
      config: { broadcast: { self: false } },
    });

    personalChannel
      .on("broadcast", { event: "incoming-call" }, ({ payload }) => {
        if (callState !== "idle") return; // Already in a call
        setRemoteUserId(payload.from);
        setCallType(payload.callType);
        setCallState("ringing");
        // Setup signaling for the incoming call
        setupSignaling(payload.from, false);
        onIncomingCall?.(payload.from, payload.callType);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(personalChannel);
    };
  }, [userId, callState, setupSignaling, onIncomingCall]);

  return {
    callState,
    callType,
    remoteUserId,
    isMuted,
    isVideoOff,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    endCall,
    rejectCall,
    toggleMute,
    toggleVideo,
  };
}
