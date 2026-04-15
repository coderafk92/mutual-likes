import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowRight, Shield, Mail, Lock, UserPlus, LogIn, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸", label: "United States" },
  { code: "+1", country: "CA", flag: "🇨🇦", label: "Canada" },
  { code: "+44", country: "GB", flag: "🇬🇧", label: "United Kingdom" },
  { code: "+91", country: "IN", flag: "🇮🇳", label: "India" },
  { code: "+61", country: "AU", flag: "🇦🇺", label: "Australia" },
  { code: "+49", country: "DE", flag: "🇩🇪", label: "Germany" },
  { code: "+33", country: "FR", flag: "🇫🇷", label: "France" },
  { code: "+81", country: "JP", flag: "🇯🇵", label: "Japan" },
  { code: "+86", country: "CN", flag: "🇨🇳", label: "China" },
  { code: "+82", country: "KR", flag: "🇰🇷", label: "South Korea" },
  { code: "+55", country: "BR", flag: "🇧🇷", label: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", label: "Mexico" },
  { code: "+34", country: "ES", flag: "🇪🇸", label: "Spain" },
  { code: "+39", country: "IT", flag: "🇮🇹", label: "Italy" },
  { code: "+31", country: "NL", flag: "🇳🇱", label: "Netherlands" },
  { code: "+46", country: "SE", flag: "🇸🇪", label: "Sweden" },
  { code: "+47", country: "NO", flag: "🇳🇴", label: "Norway" },
  { code: "+45", country: "DK", flag: "🇩🇰", label: "Denmark" },
  { code: "+358", country: "FI", flag: "🇫🇮", label: "Finland" },
  { code: "+48", country: "PL", flag: "🇵🇱", label: "Poland" },
  { code: "+41", country: "CH", flag: "🇨🇭", label: "Switzerland" },
  { code: "+43", country: "AT", flag: "🇦🇹", label: "Austria" },
  { code: "+32", country: "BE", flag: "🇧🇪", label: "Belgium" },
  { code: "+351", country: "PT", flag: "🇵🇹", label: "Portugal" },
  { code: "+353", country: "IE", flag: "🇮🇪", label: "Ireland" },
  { code: "+64", country: "NZ", flag: "🇳🇿", label: "New Zealand" },
  { code: "+65", country: "SG", flag: "🇸🇬", label: "Singapore" },
  { code: "+60", country: "MY", flag: "🇲🇾", label: "Malaysia" },
  { code: "+66", country: "TH", flag: "🇹🇭", label: "Thailand" },
  { code: "+63", country: "PH", flag: "🇵🇭", label: "Philippines" },
  { code: "+62", country: "ID", flag: "🇮🇩", label: "Indonesia" },
  { code: "+84", country: "VN", flag: "🇻🇳", label: "Vietnam" },
  { code: "+90", country: "TR", flag: "🇹🇷", label: "Turkey" },
  { code: "+7", country: "RU", flag: "🇷🇺", label: "Russia" },
  { code: "+380", country: "UA", flag: "🇺🇦", label: "Ukraine" },
  { code: "+20", country: "EG", flag: "🇪🇬", label: "Egypt" },
  { code: "+27", country: "ZA", flag: "🇿🇦", label: "South Africa" },
  { code: "+234", country: "NG", flag: "🇳🇬", label: "Nigeria" },
  { code: "+254", country: "KE", flag: "🇰🇪", label: "Kenya" },
  { code: "+971", country: "AE", flag: "🇦🇪", label: "UAE" },
  { code: "+966", country: "SA", flag: "🇸🇦", label: "Saudi Arabia" },
  { code: "+972", country: "IL", flag: "🇮🇱", label: "Israel" },
  { code: "+92", country: "PK", flag: "🇵🇰", label: "Pakistan" },
  { code: "+880", country: "BD", flag: "🇧🇩", label: "Bangladesh" },
  { code: "+94", country: "LK", flag: "🇱🇰", label: "Sri Lanka" },
  { code: "+977", country: "NP", flag: "🇳🇵", label: "Nepal" },
  { code: "+95", country: "MM", flag: "🇲🇲", label: "Myanmar" },
  { code: "+855", country: "KH", flag: "🇰🇭", label: "Cambodia" },
  { code: "+56", country: "CL", flag: "🇨🇱", label: "Chile" },
  { code: "+57", country: "CO", flag: "🇨🇴", label: "Colombia" },
  { code: "+54", country: "AR", flag: "🇦🇷", label: "Argentina" },
  { code: "+51", country: "PE", flag: "🇵🇪", label: "Peru" },
  { code: "+593", country: "EC", flag: "🇪🇨", label: "Ecuador" },
  { code: "+58", country: "VE", flag: "🇻🇪", label: "Venezuela" },
  { code: "+506", country: "CR", flag: "🇨🇷", label: "Costa Rica" },
  { code: "+507", country: "PA", flag: "🇵🇦", label: "Panama" },
  { code: "+503", country: "SV", flag: "🇸🇻", label: "El Salvador" },
  { code: "+502", country: "GT", flag: "🇬🇹", label: "Guatemala" },
  { code: "+504", country: "HN", flag: "🇭🇳", label: "Honduras" },
  { code: "+852", country: "HK", flag: "🇭🇰", label: "Hong Kong" },
  { code: "+886", country: "TW", flag: "🇹🇼", label: "Taiwan" },
  { code: "+853", country: "MO", flag: "🇲🇴", label: "Macau" },
  { code: "+373", country: "MD", flag: "🇲🇩", label: "Moldova" },
  { code: "+374", country: "AM", flag: "🇦🇲", label: "Armenia" },
  { code: "+995", country: "GE", flag: "🇬🇪", label: "Georgia" },
  { code: "+994", country: "AZ", flag: "🇦🇿", label: "Azerbaijan" },
  { code: "+998", country: "UZ", flag: "🇺🇿", label: "Uzbekistan" },
  { code: "+7", country: "KZ", flag: "🇰🇿", label: "Kazakhstan" },
  { code: "+375", country: "BY", flag: "🇧🇾", label: "Belarus" },
  { code: "+370", country: "LT", flag: "🇱🇹", label: "Lithuania" },
  { code: "+371", country: "LV", flag: "🇱🇻", label: "Latvia" },
  { code: "+372", country: "EE", flag: "🇪🇪", label: "Estonia" },
  { code: "+40", country: "RO", flag: "🇷🇴", label: "Romania" },
  { code: "+359", country: "BG", flag: "🇧🇬", label: "Bulgaria" },
  { code: "+385", country: "HR", flag: "🇭🇷", label: "Croatia" },
  { code: "+381", country: "RS", flag: "🇷🇸", label: "Serbia" },
  { code: "+386", country: "SI", flag: "🇸🇮", label: "Slovenia" },
  { code: "+421", country: "SK", flag: "🇸🇰", label: "Slovakia" },
  { code: "+420", country: "CZ", flag: "🇨🇿", label: "Czech Republic" },
  { code: "+36", country: "HU", flag: "🇭🇺", label: "Hungary" },
  { code: "+30", country: "GR", flag: "🇬🇷", label: "Greece" },
  { code: "+357", country: "CY", flag: "🇨🇾", label: "Cyprus" },
  { code: "+356", country: "MT", flag: "🇲🇹", label: "Malta" },
  { code: "+354", country: "IS", flag: "🇮🇸", label: "Iceland" },
  { code: "+352", country: "LU", flag: "🇱🇺", label: "Luxembourg" },
];

type PhoneStep = "phone" | "otp";
type EmailMode = "login" | "signup";

const Auth = () => {
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("email");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const selectedCountry = countryCodes.find((c) => c.code === countryCode) || countryCodes[0];

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(`Failed to sign in with ${provider}: ${result.error.message}`);
      }
      if (result.redirected) return;
    } catch (err) {
      toast.error(`Something went wrong with ${provider} sign in`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 6) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    const formattedPhone = `${countryCode}${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setPhoneStep("otp");
      toast.success("OTP sent to your phone!");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    const formattedPhone = `${countryCode}${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged in successfully!");
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Logo */}
        <div className="text-center space-y-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary shadow-elevated"
          >
            <Briefcase className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-foreground">MyStartupFunds</h1>
          <p className="text-muted-foreground">Connect founders, investors & professionals</p>
        </div>

        {/* Auth Method Tabs */}
        <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "phone" | "email")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted">
            <TabsTrigger value="email" className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="phone" className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5">
              <Phone className="w-4 h-4" />
              Phone
            </TabsTrigger>
          </TabsList>

          {/* Email Auth */}
          <TabsContent value="email" className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={emailMode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-14 text-lg rounded-xl border-border bg-card"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 h-14 text-lg rounded-xl border-border bg-card"
                      />
                    </div>
                  </div>
                  {emailMode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="text-sm font-medium text-foreground">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-11 h-14 text-lg rounded-xl border-border bg-card"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <Button
                  onClick={emailMode === "login" ? handleEmailLogin : handleEmailSignup}
                  disabled={loading}
                  className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary text-primary-foreground border-0 shadow-elevated hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    emailMode === "login" ? "Signing in..." : "Creating account..."
                  ) : (
                    <>
                      {emailMode === "login" ? (
                        <>
                          <LogIn className="mr-2 w-5 h-5" />
                          Sign In
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 w-5 h-5" />
                          Create Account
                        </>
                      )}
                    </>
                  )}
                </Button>

                <button
                  onClick={() => {
                    setEmailMode(emailMode === "login" ? "signup" : "login");
                    setConfirmPassword("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {emailMode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>

                {emailMode === "login" && (
                  <Link
                    to="/forgot-password"
                    className="block w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Phone Auth */}
          <TabsContent value="phone" className="mt-4">
            <AnimatePresence mode="wait">
              {phoneStep === "phone" ? (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <div className="flex gap-2">
                      <Select value={`${countryCode}-${selectedCountry.country}`} onValueChange={(val) => setCountryCode(val.split("-")[0])}>
                        <SelectTrigger className="w-[120px] h-14 rounded-xl border-border bg-card text-base">
                          <SelectValue>
                            <span className="flex items-center gap-1.5">
                              <span>{selectedCountry.flag}</span>
                              <span className="text-sm">{countryCode}</span>
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {countryCodes.map((c) => (
                            <SelectItem key={`${c.code}-${c.country}`} value={`${c.code}-${c.country}`}>
                              <span className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span className="text-sm">{c.label}</span>
                                <span className="text-muted-foreground text-xs">{c.code}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="tel"
                        placeholder="Phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 h-14 text-lg rounded-xl border-border bg-card"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary text-primary-foreground border-0 shadow-elevated hover:opacity-90 transition-opacity"
                  >
                    {loading ? "Sending..." : (
                      <>
                        Send Code
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Verification Code</label>
                    <p className="text-xs text-muted-foreground">
                      Sent to {countryCode}{phone}
                    </p>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="pl-11 h-14 text-lg tracking-[0.5em] text-center rounded-xl border-border bg-card"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary text-primary-foreground border-0 shadow-elevated hover:opacity-90 transition-opacity"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </Button>

                  <button
                    onClick={() => setPhoneStep("phone")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change phone number
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("google")}
            disabled={!!socialLoading}
            className="flex-1 h-12 rounded-xl border-border bg-card hover:bg-muted gap-2 text-sm font-medium"
          >
            {socialLoading === "google" ? (
              "..."
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("apple")}
            disabled={!!socialLoading}
            className="flex-1 h-12 rounded-xl border-border bg-card hover:bg-muted gap-2 text-sm font-medium"
          >
            {socialLoading === "apple" ? (
              "..."
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;