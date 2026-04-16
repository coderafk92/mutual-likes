import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, X, UserPlus, Eye, MessageCircle, SkipForward, Briefcase, TrendingUp, Users, BadgeCheck } from "lucide-react";

const roleIcons: Record<string, any> = { startup_founder: Briefcase, investor: TrendingUp, employee: Users };
const roleLabels: Record<string, string> = { startup_founder: "Founder", investor: "Investor", employee: "Professional" };

interface Profile {
  id: string; name: string; age: number | null; gender: string | null; bio: string | null; photos: unknown;
  role?: string; verified?: boolean; startup_name?: string; industry?: string; startup_stage?: string;
  funding_needed?: number; short_pitch?: string; investment_range_min?: number; investment_range_max?: number;
  preferred_industries?: string[]; stage_preference?: string; skills?: string[]; experience?: string; interested_roles?: string[];
}

const formatCurrency = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
};

const SwipeCard = ({ profile, onSwipe, isTop }: { profile: Profile; onSwipe: (d: "left" | "right") => void; isTop: boolean }) => {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const photos = Array.isArray(profile.photos) ? profile.photos : [];
  const photoUrl = photos.length > 0 ? String(photos[0]) : null;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) onSwipe("right");
    else if (info.offset.x < -100) onSwipe("left");
  };

  const renderRoleInfo = () => {
    if (profile.role === "startup_founder") {
      return (
        <div className="mt-1.5 space-y-1">
          {profile.startup_name && <p className="text-sm font-semibold">{profile.startup_name}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            {profile.industry && <span className="text-xs px-2 py-0.5 rounded-full glass">{profile.industry}</span>}
            {profile.startup_stage && <span className="text-xs px-2 py-0.5 rounded-full glass">{profile.startup_stage}</span>}
            {profile.funding_needed && profile.funding_needed > 0 && <span className="text-xs px-2 py-0.5 rounded-full glass">{formatCurrency(profile.funding_needed)}</span>}
          </div>
          {profile.short_pitch && <p className="text-xs opacity-90 line-clamp-2 italic">"{profile.short_pitch}"</p>}
        </div>
      );
    }
    if (profile.role === "investor") {
      return (
        <div className="mt-1.5 space-y-1">
          {(profile.investment_range_min || profile.investment_range_max) && (
            <p className="text-xs">Invests: {profile.investment_range_min ? formatCurrency(profile.investment_range_min) : "₹0"} – {profile.investment_range_max ? formatCurrency(profile.investment_range_max) : "∞"}</p>
          )}
          {profile.preferred_industries && profile.preferred_industries.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {profile.preferred_industries.slice(0, 3).map((ind) => (
                <span key={ind} className="text-xs px-2 py-0.5 rounded-full glass">{ind}</span>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (profile.role === "employee") {
      return (
        <div className="mt-1.5">
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {profile.skills.slice(0, 3).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full glass">{s}</span>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="relative h-full w-full rounded-3xl overflow-hidden glass glow-cyan">
        <div className="absolute inset-0 bg-muted">
          {photoUrl ? (
            <img src={photoUrl} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-muted-foreground/30 font-display">
              {profile.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

        {isTop && (
          <>
            <motion.div className="absolute top-8 right-8 border-4 rounded-xl px-4 py-2 rotate-[-20deg]"
              style={{ borderColor: "hsl(142 71% 45%)", opacity: likeOpacity as any, boxShadow: "0 0 20px hsl(142 71% 45% / 0.4)" }}>
              <span className="text-3xl font-extrabold font-display" style={{ color: "hsl(142 71% 45%)" }}>LIKE</span>
            </motion.div>
            <motion.div className="absolute top-8 left-8 border-4 border-destructive rounded-xl px-4 py-2 rotate-[20deg]"
              style={{ opacity: nopeOpacity, boxShadow: "0 0 20px hsl(0 84% 60% / 0.4)" }}>
              <span className="text-destructive text-3xl font-extrabold font-display">NOPE</span>
            </motion.div>
          </>
        )}

        <button onClick={() => navigate(`/user/${profile.id}`)}
          className="absolute bottom-0 left-0 right-0 p-6 text-foreground text-left backdrop-blur-xl bg-background/30">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold font-display">
              {profile.name}{profile.age ? `, ${profile.age}` : ""}
            </h2>
            {profile.verified && <BadgeCheck className="w-6 h-6 text-primary" />}
          </div>
          {profile.role && (
            <div className="flex items-center gap-1.5 mt-1">
              {(() => { const Icon = roleIcons[profile.role] || Users; return <Icon className="w-4 h-4 text-primary" />; })()}
              <span className="text-sm font-medium">{roleLabels[profile.role] || "Professional"}</span>
            </div>
          )}
          {renderRoleInfo()}
          {!renderRoleInfo() && profile.bio && <p className="mt-1 text-sm opacity-90 line-clamp-2">{profile.bio}</p>}
        </button>
      </div>
    </motion.div>
  );
};

export default SwipeCard;

interface SwipeActionsProps {
  onLike: () => void; onPass: () => void; onAddFriend: () => void;
  onFollow: () => void; onMessage: () => void; onSkip: () => void;
}

export function SwipeActions({ onLike, onPass, onAddFriend, onFollow, onMessage, onSkip }: SwipeActionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <div className="flex items-center justify-center gap-6">
        <button onClick={onPass}
          className="w-14 h-14 rounded-full glass border-2 border-destructive flex items-center justify-center hover:scale-110 transition-transform hover:shadow-[0_0_20px_hsl(0_84%_60%_/_0.3)]"
          title="Pass">
          <X className="w-6 h-6 text-destructive" />
        </button>
        <button onClick={onLike}
          className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-elevated hover:scale-110 transition-transform hover:shadow-[0_0_30px_hsl(185_100%_50%_/_0.4)] animate-pulse"
          title="Like">
          <Heart className="w-8 h-8 text-primary-foreground" fill="currentColor" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-3">
        {[
          { fn: onAddFriend, icon: UserPlus, label: "Friend" },
          { fn: onFollow, icon: Eye, label: "Follow" },
          { fn: onMessage, icon: MessageCircle, label: "Message" },
        ].map(({ fn, icon: Icon, label }) => (
          <button key={label} onClick={fn}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full glass text-foreground text-xs font-semibold hover:glow-cyan transition-all" title={label}>
            <Icon className="w-4 h-4" /><span>{label}</span>
          </button>
        ))}
        <button onClick={onSkip}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full glass text-muted-foreground text-xs font-semibold hover:text-foreground transition-all" title="Skip">
          <SkipForward className="w-4 h-4" /><span>Skip</span>
        </button>
      </div>
    </div>
  );
}
