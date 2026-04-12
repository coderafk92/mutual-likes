import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebRTC, CallType } from "@/hooks/useWebRTC";
import { getMatchProfile } from "@/lib/supabase-helpers";
import CallScreen from "@/components/CallScreen";
import { toast } from "sonner";

interface CallContextType {
  startCall: (targetUserId: string, type: CallType) => Promise<void>;
  callState: string;
}

const CallContext = createContext<CallContextType>({
  startCall: async () => {},
  callState: "idle",
});

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [callerInfo, setCallerInfo] = useState<{ name: string; photo?: string }>({
    name: "Unknown",
  });

  const handleIncomingCall = useCallback(async (callerId: string, callType: CallType) => {
    try {
      const profile = await getMatchProfile(callerId);
      const photos = Array.isArray(profile?.photos) ? profile.photos.map(String) : [];
      setCallerInfo({
        name: profile?.name || "Unknown",
        photo: photos[0],
      });
    } catch {
      setCallerInfo({ name: "Unknown" });
    }
  }, []);

  const webrtc = useWebRTC({
    userId: user?.id || "",
    onIncomingCall: handleIncomingCall,
  });

  const startCall = useCallback(
    async (targetUserId: string, type: CallType) => {
      try {
        const profile = await getMatchProfile(targetUserId);
        const photos = Array.isArray(profile?.photos) ? profile.photos.map(String) : [];
        setCallerInfo({
          name: profile?.name || "Unknown",
          photo: photos[0],
        });

        // Also signal via the target user's personal channel
        const { supabase } = await import("@/integrations/supabase/client");
        const personalChannel = supabase.channel(`user-calls-${targetUserId}`, {
          config: { broadcast: { self: false } },
        });
        await personalChannel.subscribe();
        personalChannel.send({
          type: "broadcast",
          event: "incoming-call",
          payload: { from: user?.id, callType: type },
        });
        setTimeout(() => supabase.removeChannel(personalChannel), 2000);

        await webrtc.startCall(targetUserId, type);
      } catch (err: any) {
        toast.error(err?.message || "Failed to start call. Check microphone/camera permissions.");
      }
    },
    [webrtc, user?.id]
  );

  return (
    <CallContext.Provider value={{ startCall, callState: webrtc.callState }}>
      {children}
      <CallScreen
        callState={webrtc.callState}
        callType={webrtc.callType}
        callerName={callerInfo.name}
        callerPhoto={callerInfo.photo}
        isMuted={webrtc.isMuted}
        isVideoOff={webrtc.isVideoOff}
        callDuration={webrtc.callDuration}
        localVideoRef={webrtc.localVideoRef as any}
        remoteVideoRef={webrtc.remoteVideoRef as any}
        onAccept={webrtc.acceptCall}
        onReject={webrtc.rejectCall}
        onEnd={webrtc.endCall}
        onToggleMute={webrtc.toggleMute}
        onToggleVideo={webrtc.toggleVideo}
      />
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
