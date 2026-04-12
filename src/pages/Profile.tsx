import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentProfile, updateProfile } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { LogOut, Save, Loader2, Camera, X, Plus, Briefcase, TrendingUp, Users, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const roleOptions = [
  { value: "startup_founder", label: "Startup Founder", icon: Briefcase },
  { value: "investor", label: "Investor", icon: TrendingUp },
  { value: "employee", label: "Professional", icon: Users },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const p = await getCurrentProfile();
      if (p) {
        setProfile(p);
        setName(p.name || "");
        setBio(p.bio || "");
        setAge(p.age?.toString() || "");
        setGender(p.gender || "");
        setRole((p as any).role || "employee");
        setPhotos(Array.isArray(p.photos) ? p.photos.map(String) : []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
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
    } catch {
      toast.error("Failed to upload photo");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !name.trim()) { toast.error("Name is required"); return; }
    const ageNum = age ? parseInt(age) : null;
    if (age && (isNaN(ageNum!) || ageNum! < 18 || ageNum! > 120)) {
      toast.error("Age must be between 18 and 120"); return;
    }
    setSaving(true);
    try {
      await updateProfile(user.id, {
        name: name.trim(),
        bio: bio.trim(),
        age: ageNum,
        gender: gender || null,
        role: role || "employee",
        photos,
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-foreground">Profile Settings</h1>
          {(profile as any)?.verified && (
            <div className="flex items-center gap-1 text-primary">
              <BadgeCheck className="w-5 h-5" />
              <span className="text-xs font-medium">Verified</span>
            </div>
          )}
        </div>

        {/* Photos grid */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Photos</label>
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
            {photos.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px]">Add</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        {/* Fields */}
        <div className="space-y-4 max-w-sm mx-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-12 rounded-xl bg-card border-border">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-card border-border"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px] rounded-xl bg-card border-border resize-none"
              maxLength={500}
              placeholder="Tell people about yourself..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Age</label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="h-12 rounded-xl bg-card border-border"
                min={18}
                max={120}
                placeholder="18+"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Gender</label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-12 rounded-xl bg-card border-border">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground border-0 font-semibold shadow-elevated hover:opacity-90 transition-opacity"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Save Changes
          </Button>

          <div className="border-t border-border pt-4">
            <Button variant="outline" onClick={signOut} className="w-full h-12 rounded-xl">
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
};

export default Profile;