import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CallState, CallType } from "@/hooks/useWebRTC";

interface CallScreenProps {
  callState: CallState;
  callType: CallType;
  callerName: string;
  callerPhoto?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const CallScreen = ({
  callState,
  callType,
  callerName,
  callerPhoto,
  isMuted,
  isVideoOff,
  callDuration,
  localVideoRef,
  remoteVideoRef,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
}: CallScreenProps) => {
  if (callState === "idle" || callState === "ended") return null;

  const isVideo = callType === "video";
  const isRinging = callState === "ringing";
  const isCalling = callState === "calling";
  const isConnected = callState === "connected";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
      >
        {/* Video feeds */}
        {isVideo && isConnected && (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-primary shadow-xl z-10"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </motion.div>
          </>
        )}

        {/* Overlay for audio calls or pre-connection state */}
        {(!isVideo || !isConnected) && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            {/* Animated rings for ringing/calling state */}
            {(isRinging || isCalling) && (
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary/30"
                  style={{ width: 120, height: 120, margin: "-10px" }}
                />
                <motion.div
                  animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  className="absolute inset-0 rounded-full bg-primary/20"
                  style={{ width: 120, height: 120, margin: "-10px" }}
                />
              </div>
            )}

            <div className="w-24 h-24 rounded-full bg-muted overflow-hidden border-2 border-primary/40 relative z-10">
              {callerPhoto ? (
                <img src={callerPhoto} alt={callerName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">{callerName}</h2>
              <p className="text-muted-foreground mt-1">
                {isCalling && "Calling..."}
                {isRinging && `Incoming ${callType} call`}
                {isConnected && formatDuration(callDuration)}
              </p>
            </div>
          </div>
        )}

        {/* Connected call duration overlay for video */}
        {isVideo && isConnected && (
          <div className="absolute top-12 left-0 right-0 flex justify-center z-10">
            <div className="bg-background/60 backdrop-blur-lg px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-foreground">
                {callerName} · {formatDuration(callDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="relative z-10 p-8">
          {/* Incoming call: accept/reject */}
          {isRinging && (
            <div className="flex justify-center gap-12">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={onReject}
                  className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <PhoneOff className="w-7 h-7" />
                </Button>
                <p className="text-xs text-center mt-2 text-muted-foreground">Decline</p>
              </motion.div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={onAccept}
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Phone className="w-7 h-7" />
                </Button>
                <p className="text-xs text-center mt-2 text-muted-foreground">Accept</p>
              </motion.div>
            </div>
          )}

          {/* In-call or calling controls */}
          {(isCalling || isConnected) && (
            <div className="flex justify-center gap-6">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={onToggleMute}
                  variant="outline"
                  className={`w-14 h-14 rounded-full ${isMuted ? "bg-destructive/20 border-destructive" : "bg-card"}`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
              </motion.div>

              {isVideo && (
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={onToggleVideo}
                    variant="outline"
                    className={`w-14 h-14 rounded-full ${isVideoOff ? "bg-destructive/20 border-destructive" : "bg-card"}`}
                  >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                  </Button>
                </motion.div>
              )}

              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={onEnd}
                  className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallScreen;
