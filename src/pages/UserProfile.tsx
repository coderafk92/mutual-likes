import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getMatchProfile, sendFriendRequest, followUser } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, Eye, MessageCircle, Phone, Video, Loader2, User, Briefcase, TrendingUp, Users, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useCall } from "@/contexts/CallContext";

const roleLabels: Record<string, { label: string; icon: any }> = {
  startup_founder: { label: "Startup Founder", icon: Briefcase },
  investor: { label: "Investor", icon: TrendingUp },
  employee: { label: "Professional", icon: Users },
};

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const p = await getMatchProfile(userId);
      setProfile(p);
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleFollow = async () => {
    if (!userId) return;
    try {
      await followUser(userId);
      toast.success(`Following ${profile?.name}!`);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) toast.info("Already following");
      else toast.error(err.message || "Failed to follow");
    }
  };

  const handleFriend = async () => {
    if (!userId) return;
    try {
      await sendFriendRequest(userId);
      toast.success(`Friend request sent to ${profile?.name}!`);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) toast.info("Already sent");
      else toast.error(err.message || "Failed");
    }
  };

  const { startCall } = useCall();

  const handleCall = async (type: "audio" | "video") => {
    if (!userId) return;
    await startCall(userId, type);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const photos = Array.isArray(profile.photos) ? profile.photos.map(String) : [];
  const roleInfo = roleLabels[profile.role] || roleLabels.employee;
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-card/80 backdrop-blur-lg border-b border-border">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-foreground">{profile.name}</h1>
        {profile.verified && <BadgeCheck className="w-5 h-5 text-primary" />}
      </div>

      {/* Photo */}
      <div className="relative aspect-square max-w-md mx-auto bg-muted">
        {photos.length > 0 ? (
          <img src={photos[0]} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-20 h-20 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
          <h2 className="text-3xl font-extrabold">
            {profile.name}{profile.age ? `, ${profile.age}` : ""}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <RoleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{roleInfo.label}</span>
          </div>
          {profile.gender && <p className="text-sm opacity-80 capitalize mt-0.5">{profile.gender}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleFriend} variant="outline" className="h-12 rounded-xl gap-2">
            <UserPlus className="w-4 h-4" /> Add Friend
          </Button>
          <Button onClick={handleFollow} variant="outline" className="h-12 rounded-xl gap-2">
            <Eye className="w-4 h-4" /> Follow
          </Button>
        </div>

        {/* Message button - prominent */}
        <Button
          onClick={() => navigate(`/dm/${userId}`)}
          className="w-full h-12 rounded-xl gradient-primary text-primary-foreground border-0 gap-2 text-base font-semibold"
        >
          <MessageCircle className="w-5 h-5" /> Message this user
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => handleCall("audio")} variant="outline" className="h-12 rounded-xl gap-2">
            <Phone className="w-4 h-4" /> Call
          </Button>
          <Button onClick={() => handleCall("video")} variant="outline" className="h-12 rounded-xl gap-2">
            <Video className="w-4 h-4" /> Video
          </Button>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="p-4 rounded-2xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">About</h3>
            <p className="text-foreground text-sm">{profile.bio}</p>
          </div>
        )}

        {/* More photos */}
        {photos.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(1).map((url: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden bg-muted"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;