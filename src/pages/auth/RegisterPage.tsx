import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Input, SelectInput } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import { Badge } from "../../components/ui/badge";

const STEPS = [
  { label: "Credentials", description: "Email & Password" },
  { label: "Personal Info", description: "Demographics" },
  { label: "Confirm", description: "Review & Submit" },
];

// ─── Validation helpers ───────────────────────────────────────────────────────
const validateStep1 = (email: string, password: string, confirmPassword: string) => {
  const errs: Record<string, string> = {};
  if (!email) errs.email = "Email is required.";
  else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Please enter a valid email address.";
  if (!password) errs.password = "Password is required.";
  else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
  if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
  return errs;
};

const validateStep2 = (name: string, dob: string, gender: string, phone: string) => {
  const errs: Record<string, string> = {};
  if (!name.trim()) errs.fullName = "Full name is required.";
  if (!dob) errs.dateOfBirth = "Date of birth is required.";
  if (!gender) errs.gender = "Please select your gender.";
  if (!phone.trim()) errs.phone = "Phone number is required.";
  else if (!/^\+?[\d\s\-()]{8,}$/.test(phone)) errs.phone = "Please enter a valid phone number.";
  return errs;
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGoogleSignUp = async () => {
    setGlobalError("");
    setIsGoogleLoading(true);
    const result = await signInWithGoogle("PATIENT");
    setIsGoogleLoading(false);

    if (result.error) {
      setGlobalError(result.error);
      return;
    }

    navigate("/patient", { replace: true });
  };

  // Step 1 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 state
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");

  const nextStep = () => {
    setGlobalError("");
    if (step === 0) {
      const errs = validateStep1(email, password, confirmPassword);
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    }
    if (step === 1) {
      const errs = validateStep2(fullName, dateOfBirth, gender, phone);
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setGlobalError("");
    const result = await signUp({
      email,
      password,
      role: "PATIENT",
      fullName,
      dateOfBirth,
      gender,
      phone,
    });
    setIsLoading(false);

    if (result.error) {
      setGlobalError(result.error);
      setStep(0);
      return;
    }

    // Fix #7: route through phone OTP verification before reaching dashboard
    navigate("/verify-otp", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-100 p-4 py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="block text-2xl font-extrabold text-slate-800 tracking-tight">
                Patient Registration
              </span>
              <span className="block text-xs text-slate-400 font-medium tracking-wider uppercase">
                OPDFlow AI · Government Hospital
              </span>
            </div>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-glass overflow-hidden">
          {/* Stepper header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <Stepper steps={STEPS} currentStep={step} />
          </div>

          {/* Form body */}
          <div className="px-8 py-7 space-y-5 min-h-[340px]">

            {/* ── Step 0: Credentials ── */}
            {step === 0 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs uppercase tracking-wider shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer group"
                >
                  <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? "Connecting with Google..." : "Quick Sign Up with Google"}</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-mono uppercase text-slate-400">or register with email</span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  error={errors.email}
                  required
                  autoComplete="email"
                />
                <div className="space-y-2">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    error={errors.password}
                    required
                    rightElement={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  {/* Fix #8: Password strength indicator */}
                  {password && (() => {
                    const hasUpper = /[A-Z]/.test(password);
                    const hasDigit = /[0-9]/.test(password);
                    const hasSpecial = /[^A-Za-z0-9]/.test(password);
                    const level = password.length < 6 ? 1
                      : password.length >= 10 && hasUpper && hasDigit && hasSpecial ? 3
                      : 2;
                    const label = level === 1 ? "Weak" : level === 2 ? "Fair" : "Strong";
                    const color = level === 1 ? "bg-rose-500" : level === 2 ? "bg-amber-400" : "bg-emerald-500";
                    const textColor = level === 1 ? "text-rose-500" : level === 2 ? "text-amber-500" : "text-emerald-600";
                    return (
                      <div className="space-y-1 pt-1">
                        <div className="flex gap-1">
                          {[1, 2, 3].map(lvl => (
                            <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-300 ${level >= lvl ? color : "bg-slate-200"}`} />
                          ))}
                        </div>
                        <span className={`text-xs font-semibold ${textColor}`}>Password strength: {label}</span>
                      </div>
                    );
                  })()}
                </div>
                <Input
                  label="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.confirmPassword}
                  required
                  rightElement={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>
            )}


            {/* ── Step 1: Personal Info ── */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="As per government ID"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                  error={errors.fullName}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    icon={<Calendar className="h-4 w-4" />}
                    error={errors.dateOfBirth}
                    required
                  />
                  <SelectInput
                    label="Gender"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    error={errors.gender}
                    required
                  >
                    <option value="">Select…</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </SelectInput>
                </div>
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  icon={<Phone className="h-4 w-4" />}
                  helperText="Used for OTP verification and appointment reminders."
                  error={errors.phone}
                  required
                />
              </div>
            )}

            {/* ── Step 2: Review & Confirm ── */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    <span className="font-bold text-slate-800 text-sm">Review your details</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: "Email", value: email },
                      { label: "Full Name", value: fullName },
                      { label: "Date of Birth", value: dateOfBirth },
                      { label: "Gender", value: gender },
                      { label: "Phone", value: phone },
                      { label: "Account Role", value: <Badge variant="primary">Patient</Badge> },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[9px]">{label}</span>
                        <span className="block text-slate-800 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold mb-1">📋 Medical Disclaimer</p>
                  <p>
                    By registering you acknowledge that OPDFlow AI provides routing and queue management assistance only. It does not replace professional medical diagnosis, treatment, or emergency services.
                  </p>
                </div>

                {globalError && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{globalError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="px-8 pb-8 flex justify-between items-center gap-4 border-t border-slate-100 pt-5">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="ghost" type="button">
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Sign In Instead
                </Button>
              </Link>
            )}

            {step < 2 ? (
              <Button onClick={nextStep}>
                Continue <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={isLoading} className="shadow-md">
                Create My Account <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
