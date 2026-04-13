import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getDirectMessages, sendDirectMessage, getMatchProfile } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import { useCall } from "@/contexts/CallContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2, Phone, Video, Smile, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MessageInputMenu, MessageReactions } from "@/components/MessageInput";

const DirectChat = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startCall } = useCall();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [callInitiating, setCallInitiating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || !user) return;

    const load = async () => {
      const [msgs, profile] = await Promise.all([
        getDirectMessages(userId),
        getMatchProfile(userId),
      ]);
      setMessages(msgs);
      setOtherUser(profile);
      setLoading(false);
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`dm-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload: any) => {
          const msg = payload.new;
          if (
            (msg.sender_id === user.id && msg.receiver_id === userId) ||
            (msg.sender_id === userId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !userId || !user || sending) return;
    setSending(true);
    try {
      await sendDirectMessage(userId, newMsg.trim());
      setNewMsg("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
    setSending(false);
  };

  const handleCall = async (type: "audio" | "video") => {
    if (!userId || callInitiating) return;
    setCallInitiating(true);
    try {
      await startCall(userId, type);
    } catch (err: any) {
      toast.error(err.message || `Failed to initiate ${type} call`);
    } finally {
      setCallInitiating(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMsg((prev) => prev + emoji);
  };

  const handleGifSelect = (gifUrl: string) => {
    if (!userId || !user || sending) return;
    setSending(true);
    sendDirectMessage(userId, gifUrl)
      .then(() => setNewMsg(""))
      .catch((err) => toast.error("Failed to send GIF"))
      .finally(() => setSending(false));
  };

  const handleAddReaction = async (_messageId: string, _emoji: string) => {
    toast.error("Reactions coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
          {otherUser && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                {Array.isArray(otherUser.photos) && otherUser.photos.length > 0 ? (
                  <img src={String(otherUser.photos[0])} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {otherUser.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-bold text-foreground">{otherUser.name}</span>
            </div>
          )}
        </div>

        {/* Call buttons */}
        {otherUser && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleCall("audio")}
              disabled={callInitiating}
              size="sm"
              variant="outline"
              className="h-9 w-9 p-0 rounded-lg"
              title="Audio call"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handleCall("video")}
              disabled={callInitiating}
              size="sm"
              variant="outline"
              className="h-9 w-9 p-0 rounded-lg"
              title="Video call"
            >
              <Video className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.id;
          const isGif = msg.message?.includes(".gif");
          return (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
            >
              <div className={`max-w-[75%]`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm ${
                    isMine
                      ? "gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md"
                  }`}
                >
                  {isGif ? (
                    <img
                      src={msg.message}
                      alt="gif"
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    msg.message
                  )}
                </div>
                
                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <MessageReactions
                    messageId={msg.id}
                    reactions={msg.reactions}
                    onReact={handleAddReaction}
                    currentUserId={user?.id || ""}
                  />
                )}
              </div>

              {/* Reaction button on hover */}
              <button
                onClick={() => handleAddReaction(msg.id, "❤️")}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-muted rounded-lg text-sm"
                title="React"
              >
                👍
              </button>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-lg relative">
        <div className="flex gap-2 max-w-lg mx-auto items-end">
          {/* Emoji/GIF Menu */}
          <div className="relative">
            <Button
              onClick={() => setShowMenu(!showMenu)}
              size="sm"
              variant="outline"
              className="h-12 w-12 p-0 rounded-xl"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <AnimatePresence>
              {showMenu && (
                <MessageInputMenu
                  onEmojiSelect={handleEmojiSelect}
                  onGifSelect={handleGifSelect}
                  onClose={() => setShowMenu(false)}
                />
              )}
            </AnimatePresence>
          </div>

          <Input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 h-12 rounded-xl bg-muted border-0"
            maxLength={1000}
          />
          <Button
            onClick={handleSend}
            disabled={!newMsg.trim() || sending}
            className="h-12 w-12 rounded-xl gradient-primary text-primary-foreground border-0 p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DirectChat;
