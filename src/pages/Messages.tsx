import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getMatches, getMatchProfile } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, MessageSquare, Clock, Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";

interface Conversation {
  id: string;
  type: "match" | "direct";
  userId: string;
  userName: string;
  userPhoto?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread?: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      try {
        // Get all matches
        const matches = await getMatches(user.id);
        const conversationList: Conversation[] = [];

        // Process matches
        for (const match of matches) {
          const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const profile = await getMatchProfile(otherId);

          if (profile) {
            conversationList.push({
              id: match.id,
              type: "match",
              userId: otherId,
              userName: profile.name || "Unknown",
              userPhoto: Array.isArray(profile.photos) ? String(profile.photos[0]) : undefined,
              lastMessage: "Match conversation",
              lastMessageTime: new Date(match.created_at).toLocaleDateString(),
            });
          }
        }

        // Get recent direct messages
        const { data: directMessages } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(100);

        const dmMap = new Map<string, any>();
        if (directMessages) {
          for (const msg of directMessages) {
            const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            if (!dmMap.has(otherId)) {
              dmMap.set(otherId, msg);
            }
          }
        }

        // Add direct messages to conversation list
        for (const [otherId, lastMsg] of dmMap.entries()) {
          const profile = await getMatchProfile(otherId);
          if (profile) {
            conversationList.push({
              id: `dm-${otherId}`,
              type: "direct",
              userId: otherId,
              userName: profile.name || "Unknown",
              userPhoto: Array.isArray(profile.photos) ? String(profile.photos[0]) : undefined,
              lastMessage: lastMsg.message || "No message",
              lastMessageTime: new Date(lastMsg.created_at).toLocaleDateString(),
            });
          }
        }

        // Sort by time (newest first)
        conversationList.sort(
          (a, b) =>
            new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );

        setConversations(conversationList);
      } catch (err) {
        console.error("Error loading conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = (conv: Conversation) => {
    if (conv.type === "match") {
      navigate(`/chat/${conv.id}`);
    } else {
      navigate(`/dm/${conv.userId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/")} className="text-foreground">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-muted border-0"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-md mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? "No conversations found" : "No conversations yet. Start a match or send a message!"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate("/discover")}
                className="mt-4 gradient-primary"
              >
                Discover People
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <motion.button
                key={conv.id}
                onClick={() => handleConversationClick(conv)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-3 rounded-xl bg-card hover:bg-card/80 border border-border/50 hover:border-border transition-all flex items-center gap-3 text-left group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {conv.userPhoto ? (
                    <img
                      src={conv.userPhoto}
                      alt={conv.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {conv.userName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {conv.userName}
                    </h3>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Type indicator */}
                {conv.type === "match" && (
                  <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Match
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="messages" />
    </div>
  );
};

export default Messages;
