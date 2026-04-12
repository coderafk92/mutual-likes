import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, User, Calendar, Smile, Briefcase, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

const roles = [
  { value: "startup_founder", label: "Startup Founder", icon: Briefcase, desc: "I'm building a startup" },
  { value: "investor", label: "Investor", icon: TrendingUp, desc: "I invest in startups" },
  { value: "employee", label: "Professional", icon: Users, desc: "I work in the industry" },
];

const genders = ["Male", "Female", "Non-binary", "Other"];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    if (!role) { toast.error("Please select your role"); return; }
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    const ageNum = parseInt(age);
    if (!ageNum || ageNum < 18 || ageNum > 120) { toast.error("Please enter a valid age (18+)"); return; }
    if (!gender) { toast.error("Please select your gender"); return; }

    setLoading(true);
    try {
      await updateProfile(user.id, {
        name: name.trim(),
        age: ageNum,
        gender,
        bio: bio.trim(),
        role,
      });
      navigate("/discover");
    } catch {
      toast.error("Failed to save profile");
    }
    setLoading(false);
  };

  const steps = [
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "What describes you best?",
      content: (
        <div className="space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                  role === r.value
                    ? "gradient-primary text-primary-foreground shadow-elevated"
                    : "bg-card border border-border text-foreground hover:border-primary"
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{r.label}</div>
                  <div className={`text-xs ${role === r.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{r.desc}</div>
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
      content: (
        <Input
          placeholder="Your first name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-14 text-lg rounded-xl bg-card border-border"
          maxLength={50}
        />
      ),
      valid: name.trim().length > 0,
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "How old are you?",
      content: (
        <Input
          type="number"
          placeholder="25"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="h-14 text-lg rounded-xl bg-card border-border"
          min={18}
          max={120}
        />
      ),
      valid: parseInt(age) >= 18 && parseInt(age) <= 120,
    },
    {
      icon: <Smile className="w-8 h-8" />,
      title: "I identify as...",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {genders.map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`p-4 rounded-xl text-sm font-semibold transition-all ${
                gender === g
                  ? "gradient-primary text-primary-foreground shadow-elevated"
                  : "bg-card border border-border text-foreground hover:border-primary"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      ),
      valid: gender.length > 0,
    },
    {
      icon: <Smile className="w-8 h-8" />,
      title: "Tell us about yourself",
      content: (
        <Textarea
          placeholder={role === "startup_founder" ? "I'm building a SaaS product that..." : role === "investor" ? "I focus on early-stage startups in..." : "I'm passionate about tech and..."}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="min-h-[120px] text-base rounded-xl bg-card border-border resize-none"
          maxLength={500}
        />
      ),
      valid: true,
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "gradient-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="text-primary">{currentStep.icon}</div>
              <h2 className="text-2xl font-bold text-foreground">{currentStep.title}</h2>
            </div>
            {currentStep.content}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="h-14 px-6 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            onClick={() => {
              if (step < steps.length - 1) {
                if (currentStep.valid) setStep(step + 1);
              } else {
                handleComplete();
              }
            }}
            disabled={!currentStep.valid || loading}
            className="flex-1 h-14 text-lg font-semibold rounded-xl gradient-primary text-primary-foreground border-0 shadow-elevated hover:opacity-90 transition-opacity"
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