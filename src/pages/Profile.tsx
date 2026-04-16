import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentProfile, updateProfile } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import FloatingParticles from "@/components/FloatingParticles";
import { LogOut, Save, Loader2, X, Plus, Briefcase, TrendingUp, Users, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

const roleOptions = [
  { value: "startup_founder", label: "Startup Founder", icon: Briefcase },
  { value: "investor", label: "Investor", icon: TrendingUp },
  { value: "employee", label: "Professional", icon: Users },
];

const industries = ["FinTech","HealthTech","EdTech","SaaS","E-Commerce","AI/ML","CleanTech","AgriTech","Gaming","Social Media","Logistics","Real Estate","Other"];
const stages = ["Idea","MVP","Revenue","Growth","Scale"];
const skillOptions = ["Tech/Engineering","Marketing","Sales","Design","Operations","Finance","Legal","HR","Product Management","Data Science"];

const inputClass = "h-12 rounded-xl bg-muted/40 backdrop-blur-sm border-[hsl(185_100%_50%_/_0.12)] focus:border-[hsl(185_100%_50%_/_0.4)] text-foreground";
const chipActive = "gradient-primary text-primary-foreground glow-cyan";
const chipInactive = "glass text-muted-foreground hover:text-foreground";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [verified, setVerified] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const [startupName, setStartupName] = useState("");
  const [industry, setIndustry] = useState("");
  const [startupStage, setStartupStage] = useState("");
  const [fundingNeeded, setFundingNeeded] = useState("");
  const [shortPitch, setShortPitch] = useState("");
  const [pitchDeckUrl, setPitchDeckUrl] = useState("");

  const [investmentMin, setInvestmentMin] = useState("");
  const [investmentMax, setInvestmentMax] = useState("");
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);
  const [stagePreference, setStagePreference] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [interestedRoles, setInterestedRoles] = useState<string[]>([]);

  const toggleArr = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  useEffect(() => {
    const load = async () => {
      const p = await getCurrentProfile();
      if (p) {
        setName(p.name || ""); setBio(p.bio || ""); setAge(p.age?.toString() || "");
        setGender(p.gender || ""); setRole((p as any).role || "employee");
        setPhotos(Array.isArray(p.photos) ? p.photos.map(String) : []);
        setVerified(!!(p as any).verified);
        setStartupName((p as any).startup_name || ""); setIndustry((p as any).industry || "");
        setStartupStage((p as any).startup_stage || ""); setFundingNeeded((p as any).funding_needed?.toString() || "");
        setShortPitch((p as any).short_pitch || ""); setPitchDeckUrl((p as any).pitch_deck_url || "");
        setInvestmentMin((p as any).investment_range_min?.toString() || "");
        setInvestmentMax((p as any).investment_range_max?.toString() || "");
        setPreferredIndustries((p as any).preferred_industries || []);
        setStagePreference((p as any).stage_preference || "");
        setSkills((p as any).skills || []); setExperience((p as any).experience || "");
        setInterestedRoles((p as any).interested_roles || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("profile-photos").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
      setPhotos((prev) => [...prev, urlData.publicUrl]);
      toast.success("Photo uploaded!");
    } catch { toast.error("Failed to upload"); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!user || !name.trim()) { toast.error("Name is required"); return; }
    const ageNum = age ? parseInt(age) : null;
    if (age && (isNaN(ageNum!) || ageNum! < 18 || ageNum! > 120)) { toast.error("Age must be 18-120"); return; }
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        name: name.trim(), bio: bio.trim(), age: ageNum, gender: gender || null, role: role || "employee", photos,
      };
      if (role === "startup_founder") {
        updates.startup_name = startupName.trim(); updates.industry = industry;
        updates.startup_stage = startupStage; updates.funding_needed = fundingNeeded ? parseFloat(fundingNeeded) : 0;
        updates.short_pitch = shortPitch.trim(); updates.pitch_deck_url = pitchDeckUrl;
      } else if (role === "investor") {
        updates.investment_range_min = investmentMin ? parseFloat(investmentMin) : 0;
        updates.investment_range_max = investmentMax ? parseFloat(investmentMax) : 0;
        updates.preferred_industries = preferredIndustries; updates.stage_preference = stagePreference;
      } else {
        updates.skills = skills; updates.experience = experience.trim(); updates.interested_roles = interestedRoles;
      }
      await updateProfile(user.id, updates);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      <FloatingParticles />
      <div className="p-4 space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold font-display text-gradient">Profile Settings</h1>
          {verified && (
            <div className="flex items-center gap-1 text-primary glow-cyan rounded-full px-2 py-1">
              <BadgeCheck className="w-5 h-5" /><span className="text-xs font-medium">Verified</span>
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="glass rounded-2xl p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">Photos</label>
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
            {photos.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden glass">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-[hsl(185_100%_50%_/_0.2)] flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-[hsl(185_100%_50%_/_0.4)] transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /><span className="text-[10px]">Add</span></>}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          <div className="glass rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>{roleOptions.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={50} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[100px] rounded-xl bg-muted/40 backdrop-blur-sm border-[hsl(185_100%_50%_/_0.12)] resize-none text-foreground" maxLength={500} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Age</label>
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} min={18} max={120} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Founder fields */}
          {role === "startup_founder" && (
            <div className="glass rounded-2xl p-4 space-y-3 glow-cyan">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-display"><Briefcase className="w-4 h-4 text-primary" /> Startup Info</h3>
              <Input placeholder="Startup Name" value={startupName} onChange={(e) => setStartupName(e.target.value)} className={inputClass} />
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Industry" /></SelectTrigger>
                <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={startupStage} onValueChange={setStartupStage}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Stage" /></SelectTrigger>
                <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Funding Needed (₹)" value={fundingNeeded} onChange={(e) => setFundingNeeded(e.target.value)} className={inputClass} />
              <Textarea placeholder="Short Pitch" value={shortPitch} onChange={(e) => setShortPitch(e.target.value)} className="min-h-[60px] rounded-xl bg-muted/40 backdrop-blur-sm border-[hsl(185_100%_50%_/_0.12)] resize-none text-foreground" maxLength={200} />
            </div>
          )}

          {/* Investor fields */}
          {role === "investor" && (
            <div className="glass rounded-2xl p-4 space-y-3 glow-purple">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-display"><TrendingUp className="w-4 h-4 text-primary" /> Investment Preferences</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Min (₹)" value={investmentMin} onChange={(e) => setInvestmentMin(e.target.value)} className={inputClass} />
                <Input type="number" placeholder="Max (₹)" value={investmentMax} onChange={(e) => setInvestmentMax(e.target.value)} className={inputClass} />
              </div>
              <Select value={stagePreference} onValueChange={setStagePreference}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Preferred Stage" /></SelectTrigger>
                <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Industries</label>
                <div className="flex flex-wrap gap-1.5">
                  {industries.map((ind) => (
                    <button key={ind} onClick={() => toggleArr(preferredIndustries, ind, setPreferredIndustries)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${preferredIndustries.includes(ind) ? chipActive : chipInactive}`}>{ind}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Professional fields */}
          {role === "employee" && (
            <div className="glass rounded-2xl p-4 space-y-3 glow-cyan">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-display"><Users className="w-4 h-4 text-primary" /> Professional Info</h3>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {skillOptions.map((s) => (
                    <button key={s} onClick={() => toggleArr(skills, s, setSkills)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${skills.includes(s) ? chipActive : chipInactive}`}>{s}</button>
                  ))}
                </div>
              </div>
              <Textarea placeholder="Experience" value={experience} onChange={(e) => setExperience(e.target.value)} className="min-h-[60px] rounded-xl bg-muted/40 backdrop-blur-sm border-[hsl(185_100%_50%_/_0.12)] resize-none text-foreground" maxLength={500} />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Interested Roles</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Co-founder","CTO","CMO","Developer","Designer","Advisor","Intern"].map((r) => (
                    <button key={r} onClick={() => toggleArr(interestedRoles, r, setInterestedRoles)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${interestedRoles.includes(r) ? chipActive : chipInactive}`}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground border-0 font-semibold shadow-elevated hover:shadow-[0_0_30px_hsl(185_100%_50%_/_0.35)] transition-shadow">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} Save Changes
          </Button>

          <div className="border-t border-[hsl(185_100%_50%_/_0.1)] pt-4">
            <Button variant="outline" onClick={signOut} className="w-full h-12 rounded-xl glass border-[hsl(185_100%_50%_/_0.2)]">
              <LogOut className="w-5 h-5 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
      <BottomNav active="profile" />
    </div>
  );
};

export default Profile;
