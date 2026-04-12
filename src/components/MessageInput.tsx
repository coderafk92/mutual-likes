import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😘", "😜", "😎", "🤔",
  "❤️", "💔", "💕", "✨", "🔥", "👍", "👌", "🙌",
  "🎉", "🎊", "🥳", "😻", "🐶", "🦁", "💩", "👻",
];

const GIFS = [
  "https://media.giphy.com/media/l0HlTy9x-Zp2O9VNpA/giphy.gif",
  "https://media.giphy.com/media/fvkuchQfKVwFWcqc9U/giphy.gif",
  "https://media.giphy.com/media/g9GUuSDQqV6Dr6BmXE/giphy.gif",
  "https://media.giphy.com/media/Y8HaiEgHnL0oa1LoP5/giphy.gif",
  "https://media.giphy.com/media/3o7TKt0knseCz4g098/giphy.gif",
  "https://media.giphy.com/media/l0HlUChtVIWiF2gKc/giphy.gif",
  "https://media.giphy.com/media/WoJ3bCZxqy50/giphy.gif",
  "https://media.giphy.com/media/26uf1EUQtxLEcs6R2/giphy.gif",
];

interface MessageInputMenuProps {
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
  onClose: () => void;
}

export const MessageInputMenu = ({
  onEmojiSelect,
  onGifSelect,
  onClose,
}: MessageInputMenuProps) => {
  const [activeTab, setActiveTab] = useState<"emoji" | "gif">("emoji");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-2xl shadow-xl p-3"
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-3 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("emoji")}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "emoji"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Smile className="w-4 h-4 inline mr-1" />
          Emoji
        </button>
        <button
          onClick={() => setActiveTab("gif")}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "gif"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Gift className="w-4 h-4 inline mr-1" />
          GIF
        </button>
      </div>

      {/* Emoji Grid */}
      {activeTab === "emoji" && (
        <div className="grid grid-cols-6 gap-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onEmojiSelect(emoji);
                onClose();
              }}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* GIF Grid */}
      {activeTab === "gif" && (
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {GIFS.map((gif, i) => (
            <button
              key={i}
              onClick={() => {
                onGifSelect(gif);
                onClose();
              }}
              className="h-20 rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
            >
              <img
                src={gif}
                alt="gif"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

interface MessageReactionProps {
  messageId: string;
  reactions: Record<string, string[]>; // emoji -> user ids
  onReact: (messageId: string, emoji: string) => void;
  currentUserId: string;
}

export const MessageReactions = ({
  messageId,
  reactions,
  onReact,
  currentUserId,
}: MessageReactionProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const reactionEmojis = Object.keys(reactions);

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reactionEmojis.map((emoji) => {
        const count = reactions[emoji]?.length || 0;
        const hasReacted = reactions[emoji]?.includes(currentUserId);

        return (
          <button
            key={emoji}
            onClick={() => onReact(messageId, emoji)}
            className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
              hasReacted
                ? "bg-primary/30 text-primary border border-primary"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {emoji} {count > 1 && count}
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-2 py-1 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
        >
          +
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-xl shadow-xl p-2 mb-10"
            >
              <div className="grid grid-cols-6 gap-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(messageId, emoji);
                      setShowPicker(false);
                    }}
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
