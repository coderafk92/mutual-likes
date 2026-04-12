import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getDiscoverableProfiles, handleSwipe, sendFriendRequest, followUser } from "@/lib/supabase-helpers";
import SwipeCard, { SwipeActions } from "@/components/SwipeCard";
import BottomNav from "@/components/BottomNav";
import { Briefcase, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]); // All discovered profiles for looping
  const [cycleCount, setCycleCount] = useState(0); // Track number of cycles

  const loadProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getDiscoverableProfiles(user.id);
    setAllProfiles(data); // Store all profiles
    setProfiles(data);
    setCycleCount(0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Shuffle function for randomization
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const onSwipe = async (direction: "left" | "right") => {
    if (swiping || profiles.length === 0) return;
    setSwiping(true);
    const currentProfile = profiles[0];
    
    try {
      const result = await handleSwipe(currentProfile.id, direction);
      if (result.matched) {
        toast.success(`It's a match with ${currentProfile.name}! 🎉`, { duration: 3000 });
      }
    } catch (err: any) {
      toast.error(err.message || "Swipe failed");
    }

    const remainingProfiles = profiles.slice(1);
    setSwiping(false);

    // If profiles list is getting low (≤ 2), trigger refill
    if (remainingProfiles.length <= 2) {
      // If all profiles are exhausted, start a new cycle (loop)
      if (remainingProfiles.length === 0 && allProfiles.length > 0) {
        const shuffledProfiles = shuffleArray(allProfiles);
        setProfiles(shuffledProfiles);
        setCycleCount((prev) => prev + 1);
        toast.info(`🔄 Starting cycle ${(cycleCount + 1 + 1)}...`, { duration: 2000 });
      } else {
        // Load more profiles from the database
        const data = await getDiscoverableProfiles(user!.id);
        setProfiles((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProfiles = data.filter((p: any) => !existingIds.has(p.id));
          
          // Update allProfiles with new ones for future cycles
          setAllProfiles((prevAll) => [...prevAll, ...newProfiles]);
          
          return [...prev, ...newProfiles];
        });
      }
    } else {
      setProfiles(remainingProfiles);
    }
  };

  const currentProfile = profiles[0];

  const handleAddFriend = async () => {
    if (!currentProfile) return;
    try {
      await sendFriendRequest(currentProfile.id);
      toast.success(`Friend request sent to ${currentProfile.name}!`);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) toast.info("Friend request already sent");
      else toast.error(err.message || "Failed to send request");
    }
  };

  const handleFollow = async () => {
    if (!currentProfile) return;
    try {
      await followUser(currentProfile.id);
      toast.success(`Following ${currentProfile.name}!`);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) toast.info("Already following");
      else toast.error(err.message || "Failed to follow");
    }
  };

  const handleMessage = () => {
    if (!currentProfile) return;
    navigate(`/dm/${currentProfile.id}`);
  };

  const handleSkip = () => {
    setProfiles((prev) => prev.slice(1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <div className="flex items-center justify-center p-4">
        <Briefcase className="w-6 h-6 text-primary mr-2" />
        <h1 className="text-xl font-extrabold text-foreground">MyStartupFunds</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-full max-w-sm aspect-[3/4]">
          <AnimatePresence>
            {profiles.slice(0, 2).map((profile, i) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipe={onSwipe}
                isTop={i === 0}
              />
            ))}
          </AnimatePresence>

          {profiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Briefcase className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Loading next cycle...</h3>
              <p className="text-muted-foreground mt-2">Profiles will refresh shortly! 🔄</p>
            </motion.div>
          )}
        </div>

        {profiles.length > 0 && (
          <SwipeActions
            onLike={() => onSwipe("right")}
            onPass={() => onSwipe("left")}
            onAddFriend={handleAddFriend}
            onFollow={handleFollow}
            onMessage={handleMessage}
            onSkip={handleSkip}
          />
        )}
      </div>

      <BottomNav active="discover" />
    </div>
  );
};

export default Discover;