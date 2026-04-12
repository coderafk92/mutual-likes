import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentProfile } from "@/lib/supabase-helpers";
import { Briefcase, Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    
    getCurrentProfile().then((profile) => {
      if (!profile || !profile.name) {
        navigate("/onboarding");
      } else if (profile.status === "pending_deletion") {
        navigate("/auth");
      } else {
        navigate("/discover");
      }
    });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Briefcase className="w-12 h-12 text-primary animate-pulse" />
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
};

export default Index;