import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getMatches, getMatchProfile } from "@/lib/supabase-helpers";
import BottomNav from "@/components/BottomNav";
import { MessageCircle, Loader2, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface MatchWithProfile {
  matchId: string;
  profile: {
    id: string;
    name: string;
    age: number | null;
    photos: unknown;
    bio: string | null;
  };
}

const Matches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const matchData = await getMatches(user.id);
      const enriched = await Promise.all(
        matchData.map(async (m: any) => {
          const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
          const profile = await getMatchProfile(otherId);
          return profile ? { matchId: m.id, profile } : null;
        })
      );
      setMatches(enriched.filter(Boolean) as MatchWithProfile[]);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-extrabold text-foreground">Matches</h1>
        <p className="text-sm text-muted-foreground mt-1">Chat with your matches</p>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No matches yet</h3>
          <p className="text-muted-foreground mt-1">Keep swiping to find your match!</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {matches.map((m, i) => {
            const photos = Array.isArray(m.profile.photos) ? m.profile.photos : [];
            const photoUrl = photos.length > 0 ? String(photos[0]) : null;

            return (
              <motion.button
                key={m.matchId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/chat/${m.matchId}`)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow text-left"
              >
                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt={m.profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {m.profile.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">
                    {m.profile.name}{m.profile.age ? `, ${m.profile.age}` : ""}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {m.profile.bio || "Say hello! 👋"}
                  </p>
                </div>
                <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      )}

      <BottomNav active="messages" />
    </div>
  );
};

export default Matches;
