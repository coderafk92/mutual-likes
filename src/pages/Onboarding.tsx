import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, User, Calendar, Smile, Briefcase, TrendingUp, Users, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import FloatingParticles from "@/components/FloatingParticles";

const roles = [
  { value: "startup_founder", label: "Startup Founder", icon: Briefcase, desc: "I'm building a startup" },
  { value: "investor", label: "Investor", icon: TrendingUp, desc: "I invest in startups" },
  { value: "employee", label: "Professional", icon: Users, desc: "I work in the industry" },
];

const genders = ["Male", "Female", "Non-binary", "Other"];

const industries = [
  "FinTech", "HealthTech", "EdTech", "SaaS", "E-Commerce", "AI/ML",
  "CleanTech", "AgriTech", "Gaming", "Social Media", "Logistics", "Real Estate", "Other",
];

const stages = ["Idea", "MVP", "Revenue", "Growth", "Scale"];

const skillOptions = [
  "Tech/Engineering", "Marketing", "Sales", "Design", "Operations",
  "Finance", "Legal", "HR", "Product Management", "Data Science",
];

const inputClass = "h-12 rounded-xl bg-muted/40 backdrop-blur-sm border-[hsl(185_100%_50%_/_0.12)] focus:border-[hsl(185_100%_50%_/_0.4)] text-foreground";
const textareaClass = "rounded-xl bg-muted/40 backdrop-blur-sm border-[hsl(185_100%_50%_/_0.12)] focus:border-[hsl(185_100%_50%_/_0.4)] text-foreground resize-none";

const chipActive = "gradient-primary text-primary-foreground shadow-elevated glow-cyan";
const chipInactive = "glass text-foreground hover:border-[hsl(185_100%_50%_/_0.3)]";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");

  const [startupName, setStartupName] = useState("");
  const [industry, setIndustry] = useState("");
  const [startupStage, setStartupStage] = useState("");
  const [fundingNeeded, setFundingNeeded] = useState("");
  const [shortPitch, setShortPitch] = useState("");
  const [pitchDeckUploading, setPitchDeckUploading] = useState(false);
  const [pitchDeckUrl, setPitchDeckUrl] = useState("");

  const [investmentMin, setInvestmentMin] = useState("");
  const [investmentMax, setInvestmentMax] = useState("");
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);
  const [stagePreference, setStagePreference] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [interestedRoles, setInterestedRoles] = useState<string[]>([]);

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  const handlePitchDeckUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setPitchDeckUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/pitch-deck.${ext}`;
      const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
      setPitchDeckUrl(urlData.publicUrl);
      toast.success("Pitch deck uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    setPitchDeckUploading(false);
  };

  const handleComplete = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    const ageNum = parseInt(age);
    if (!ageNum || ageNum < 18 || ageNum > 120) { toast.error("Please enter a valid age (18+)"); return; }
    if (!gender) { toast.error("Please select your gender"); return; }

    setLoading(true);
    try {
      const updates: Record<string, unknown> = { name: name.trim(), age: ageNum, gender, bio: bio.trim(), role };
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
      navigate("/discover");
    } catch { toast.error("Failed to save profile"); }
    setLoading(false);
  };

  const commonSteps = [
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "What describes you best?",
      content: (
        <div className="space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            const selected = role === r.value;
            return (
              <button key={r.value} onClick={() => setRole(r.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                  selected ? "gradient-primary text-primary-foreground shadow-elevated glow-cyan" : "glass text-foreground hover:border-[hsl(185_100%_50%_/_0.3)]"
                }`}>
                <Icon className="w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{r.label}</div>
                  <div className={`text-xs ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{r.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      ),
      valid: role.length > 0,
    },
    {
      icon: <User className="w-8 h-8" />,
      title: "What's your name?",
      content: <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} h-14 text-lg`} maxLength={50} />,
      valid: name.trim().length > 0,
    },
  ];

  const founderSteps = [
    {
      icon: <Briefcase className="w-8 h-8" />, title: "Tell us about your startup",
      content: (
        <div className="space-y-4">
          <Input placeholder="Startup Name" value={startupName} onChange={(e) => setStartupName(e.target.value)} className={inputClass} maxLength={100} />
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className={inputClass}><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={startupStage} onValueChange={setStartupStage}>
            <SelectTrigger className={inputClass}><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ),
      valid: startupName.trim().length > 0 && industry.length > 0 && startupStage.length > 0,
    },
    {
      icon: <TrendingUp className="w-8 h-8" />, title: "Funding & Pitch",
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Funding Needed (₹)</label>
            <Input type="number" placeholder="e.g. 5000000" value={fundingNeeded} onChange={(e) => setFundingNeeded(e.target.value)} className={inputClass} />
          </div>
          <Textarea placeholder="Your startup pitch in 1-2 lines..." value={shortPitch} onChange={(e) => setShortPitch(e.target.value)} className={`${textareaClass} min-h-[80px]`} maxLength={200} />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Pitch Deck (optional)</label>
            <label className={`flex items-center gap-2 p-3 rounded-xl border border-dashed glass cursor-pointer hover:border-[hsl(185_100%_50%_/_0.3)] transition-colors ${pitchDeckUploading ? "opacity-50" : ""}`}>
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{pitchDeckUrl ? "Uploaded ✓" : "Upload PDF"}</span>
              <input type="file" accept=".pdf,.pptx,.ppt" className="hidden" onChange={handlePitchDeckUpload} disabled={pitchDeckUploading} />
            </label>
          </div>
        </div>
      ),
      valid: true,
    },
  ];

  const investorSteps = [
    {
      icon: <TrendingUp className="w-8 h-8" />, title: "Your Investment Preferences",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Min (₹)</label>
              <Input type="number" placeholder="100000" value={investmentMin} onChange={(e) => setInvestmentMin(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Max (₹)</label>
              <Input type="number" placeholder="10000000" value={investmentMax} onChange={(e) => setInvestmentMax(e.target.value)} className={inputClass} />
            </div>
          </div>
          <Select value={stagePreference} onValueChange={setStagePreference}>
            <SelectTrigger className={inputClass}><SelectValue placeholder="Preferred Stage" /></SelectTrigger>
            <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ),
      valid: true,
    },
    {
      icon: <Briefcase className="w-8 h-8" />, title: "Industries You're Interested In",
      content: (
        <div className="flex flex-wrap gap-2">
          {industries.map((ind) => (
            <button key={ind} onClick={() => toggleArrayItem(preferredIndustries, ind, setPreferredIndustries)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${preferredIndustries.includes(ind) ? chipActive : chipInactive}`}>{ind}</button>
          ))}
        </div>
      ),
      valid: true,
    },
  ];

  const professionalSteps = [
    {
      icon: <Users className="w-8 h-8" />, title: "Your Skills",
      content: (
        <div className="flex flex-wrap gap-2">
          {skillOptions.map((s) => (
            <button key={s} onClick={() => toggleArrayItem(skills, s, setSkills)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${skills.includes(s) ? chipActive : chipInactive}`}>{s}</button>
          ))}
        </div>
      ),
      valid: skills.length > 0,
    },
    {
      icon: <Briefcase className="w-8 h-8" />, title: "Experience & Interests",
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Experience</label>
            <Textarea placeholder="Tell us about your work experience..." value={experience} onChange={(e) => setExperience(e.target.value)} className={`${textareaClass} min-h-[80px]`} maxLength={500} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Roles you're looking for</label>
            <div className="flex flex-wrap gap-2">
              {["Co-founder", "CTO", "CMO", "Developer", "Designer", "Advisor", "Intern"].map((r) => (
                <button key={r} onClick={() => toggleArrayItem(interestedRoles, r, setInterestedRoles)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${interestedRoles.includes(r) ? chipActive : chipInactive}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      ),
      valid: true,
    },
  ];

  const roleSpecificSteps = role === "startup_founder" ? founderSteps : role === "investor" ? investorSteps : role === "employee" ? professionalSteps : [];
  const endSteps = [
    {
      icon: <Calendar className="w-8 h-8" />, title: "How old are you?",
      content: <Input type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} className={`${inputClass} h-14 text-lg`} min={18} max={120} />,
      valid: parseInt(age) >= 18 && parseInt(age) <= 120,
    },
    {
      icon: <Smile className="w-8 h-8" />, title: "I identify as...",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {genders.map((g) => (
            <button key={g} onClick={() => setGender(g)}
              className={`p-4 rounded-xl text-sm font-semibold transition-all ${gender === g ? "gradient-primary text-primary-foreground shadow-elevated glow-cyan" : "glass text-foreground hover:border-[hsl(185_100%_50%_/_0.3)]"}`}>{g}</button>
          ))}
        </div>
      ),
      valid: gender.length > 0,
    },
    {
      icon: <Smile className="w-8 h-8" />, title: "Tell us about yourself",
      content: (
        <Textarea
          placeholder={role === "startup_founder" ? "I'm building a SaaS product that..." : role === "investor" ? "I focus on early-stage startups in..." : "I'm passionate about tech and..."}
          value={bio} onChange={(e) => setBio(e.target.value)}
          className={`${textareaClass} min-h-[120px] text-base`} maxLength={500} />
      ),
      valid: true,
    },
  ];

  const steps = [...commonSteps, ...roleSpecificSteps, ...endSteps];
  const currentStep = steps[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <FloatingParticles />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm space-y-8 relative z-10">
        {/* Progress bar */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "gradient-primary glow-cyan" : "bg-muted/50"}`} />
          ))}
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-6 glow-cyan">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <div className="text-primary">{currentStep.icon}</div>
                <h2 className="text-2xl font-bold text-foreground font-display">{currentStep.title}</h2>
              </div>
              {currentStep.content}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="h-14 px-6 rounded-xl glass border-[hsl(185_100%_50%_/_0.2)]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            onClick={() => { if (step < steps.length - 1) { if (currentStep.valid) setStep(step + 1); } else { handleComplete(); } }}
            disabled={!currentStep.valid || loading}
            className="flex-1 h-14 text-lg font-semibold rounded-xl gradient-primary text-primary-foreground border-0 shadow-elevated hover:shadow-[0_0_30px_hsl(185_100%_50%_/_0.35)] transition-shadow"
          >
            {step === steps.length - 1 ? (loading ? "Saving..." : "Get Started") : "Next"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
