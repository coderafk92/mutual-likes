import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getDiscoverableProfiles, handleSwipe, sendFriendRequest, followUser, getCurrentProfile } from "@/lib/supabase-helpers";
import SwipeCard, { SwipeActions } from "@/components/SwipeCard";
import BottomNav from "@/components/BottomNav";
import { Briefcase, Loader2, Filter, TrendingUp, Users, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [cycleCount, setCycleCount] = useState(0);
  const [myRole, setMyRole] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [data, profile] = await Promise.all([
      getDiscoverableProfiles(user.id),
      getCurrentProfile(),
    ]);
    setMyRole(profile?.role || "employee");
    setAllProfiles(data);
    setProfiles(data);
    setCycleCount(0);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const filteredProfiles = profiles.filter((p) => {
    if (filterRole !== "all" && p.role !== filterRole) return false;
    if (filterIndustry !== "all") {
      if (p.role === "startup_founder" && p.industry !== filterIndustry) return false;
      if (p.role === "investor" && (!p.preferred_industries || !p.preferred_industries.includes(filterIndustry))) return false;
    }
    if (filterStage !== "all") {
      if (p.role === "startup_founder" && p.startup_stage !== filterStage) return false;
      if (p.role === "investor" && p.stage_preference !== filterStage) return false;
    }
    return true;
  });

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const onSwipe = async (direction: "left" | "right") => {
    if (swiping || filteredProfiles.length === 0) return;
    setSwiping(true);
    const currentProfile = filteredProfiles[0];
    try {
      const result = await handleSwipe(currentProfile.id, direction);
      if (result.matched) toast.success(`It's a match with ${currentProfile.name}! 🎉`, { duration: 3000 });
    } catch (err: any) {
      toast.error(err.message || "Swipe failed");
    }
    const remaining = profiles.filter((p) => p.id !== currentProfile.id);
    setSwiping(false);
    if (remaining.length === 0 && allProfiles.length > 0) {
      setProfiles(shuffleArray(allProfiles));
      setCycleCount((prev) => prev + 1);
      toast.info(`🔄 Starting cycle ${cycleCount + 2}...`, { duration: 2000 });
    } else {
      setProfiles(remaining);
    }
  };

  const currentProfile = filteredProfiles[0];

  const handleAddFriend = async () => {
    if (!currentProfile) return;
    try { await sendFriendRequest(currentProfile.id); toast.success(`Friend request sent!`); }
    catch (err: any) { if (err.message?.includes("duplicate")) toast.info("Already sent"); else toast.error(err.message || "Failed"); }
  };

  const handleFollow = async () => {
    if (!currentProfile) return;
    try { await followUser(currentProfile.id); toast.success(`Following ${currentProfile.name}!`); }
    catch (err: any) { if (err.message?.includes("duplicate")) toast.info("Already following"); else toast.error(err.message || "Failed"); }
  };

  const handleMessage = () => { if (currentProfile) navigate(`/dm/${currentProfile.id}`); };
  const handleSkip = () => { setProfiles((prev) => prev.filter((p) => p.id !== filteredProfiles[0]?.id)); };

  const getDashboardTitle = () => {
    if (myRole === "startup_founder") return "Discover Investors & Talent";
    if (myRole === "investor") return "Discover Startups";
    return "Discover Opportunities";
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
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-extrabold text-foreground">MyStartupFunds</h1>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl transition-colors ${showFilters ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <p className="px-4 text-sm text-muted-foreground font-medium">{getDashboardTitle()}</p>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4">
            <div className="py-3 space-y-3">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="h-10 rounded-xl bg-card border-border"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="startup_founder">Founders</SelectItem>
                  <SelectItem value="investor">Investors</SelectItem>
                  <SelectItem value="employee">Professionals</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                  <SelectTrigger className="h-10 rounded-xl bg-card border-border text-sm"><SelectValue placeholder="Industry" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {["FinTech","HealthTech","EdTech","SaaS","E-Commerce","AI/ML","CleanTech","AgriTech","Gaming","Social Media","Logistics","Real Estate"].map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger className="h-10 rounded-xl bg-card border-border text-sm"><SelectValue placeholder="Stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {["Idea","MVP","Revenue","Growth","Scale"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          <span>{filteredProfiles.length} profiles</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-full max-w-sm aspect-[3/4]">
          <AnimatePresence>
            {filteredProfiles.slice(0, 2).map((profile, i) => (
              <SwipeCard key={profile.id} profile={profile} onSwipe={onSwipe} isTop={i === 0} />
            ))}
          </AnimatePresence>

          {filteredProfiles.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Briefcase className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No profiles found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your filters 🔄</p>
            </motion.div>
          )}
        </div>

        {filteredProfiles.length > 0 && (
          <SwipeActions onLike={() => onSwipe("right")} onPass={() => onSwipe("left")}
            onAddFriend={handleAddFriend} onFollow={handleFollow}
            onMessage={handleMessage} onSkip={handleSkip} />
        )}
      </div>

      <BottomNav active="discover" />
    </div>
  );
};

export default Discover;
