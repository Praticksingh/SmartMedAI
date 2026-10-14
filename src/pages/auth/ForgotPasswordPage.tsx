import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { mockRequestPasswordReset, mockResetPassword } from "../../utils/mockAuth";
import { firebaseSendPasswordReset } from "../../firebase/authService";

type Step = "email" | "reset" | "done";

const getPasswordStrength = (pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
  if (!pw) return { level: 0, label: "", color: "" };
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  if (pw.length < 6) return { level: 1, label: "Weak", color: "bg-rose-500" };
  if (pw.length < 10 && !(hasUpper && hasDigit)) return { level: 2, label: "Fair", color: "bg-amber-400" };
  if (pw.length >= 10 && hasUpper && hasDigit && hasSpecial) return { level: 3, label: "Strong", color: "bg-emerald-500" };
  return { level: 2, label: "Fair", color: "bg-amber-400" };
};

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const strength = getPasswordStrength(newPassword);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address."); return; }

    setIsLoading(true);
    const fbRes = await firebaseSendPasswordReset(email);
    if (fbRes.ok) {
      setIsLoading(false);
      setSuccessMessage("Password reset email sent! Please check your inbox for the reset link.");
      setStep("done");
      setTimeout(() => navigate("/login"), 3500);
      return;
    }

    // Fallback for offline hackathon/demo mode
    const result = mockRequestPasswordReset(email);
    setIsLoading(false);

    if ("error" in result) {
      setError(fbRes.error || result.error);
      return;
    }
    setStep("reset");
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newPassword) { setError("Please enter a new password."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = mockResetPassword(email, newPassword);
    setIsLoading(false);

    if ("error" in result) { setError(result.error); return; }
    setStep("done");
    setTimeout(() => navigate("/login"), 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-100 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <Activity className="h-8 w-8 text-white" />
            </div>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-glass overflow-hidden">

          {/* Step: Email */}
          {step === "email" && (
            <div className="p-8 space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reset Password</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Enter your account email to continue. We'll verify it exists and let you set a new password.
                </p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  error={error}
                  required
                  autoComplete="email"
                />
                <Button type="submit" isLoading={isLoading} className="w-full shadow-md">
                  Continue <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
              <p className="text-center text-xs text-slate-400">
                <Link to="/login" className="inline-flex items-center gap-1 text-teal-600 font-semibold hover:underline">
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </Link>
              </p>
            </div>
          )}

          {/* Step: New password */}
          {step === "reset" && (
            <div className="p-8 space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Set New Password</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Creating new password for <span className="font-semibold text-slate-600">{email}</span>
                </p>
              </div>
              <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Input
                    label="New Password"
                    type={showPw ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    required
                    rightElement={
                      <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  {/* Password strength bar */}
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(lvl => (
                          <div
                            key={lvl}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              strength.level >= lvl ? strength.color : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-semibold ${
                        strength.level === 1 ? "text-rose-500" :
                        strength.level === 2 ? "text-amber-500" :
                        "text-emerald-600"
                      }`}>{strength.label}</span>
                    </div>
                  )}
                </div>
                <Input
                  label="Confirm New Password"
                  type={showPw ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
                {error && (
                  <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-lg px-4 py-2.5">
                    ⚠ {error}
                  </p>
                )}
                <Button type="submit" isLoading={isLoading} className="w-full shadow-md">
                  Reset Password <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-9 w-9 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {successMessage ? "Reset Link Sent!" : "Password Updated!"}
              </h2>
              <p className="text-sm text-slate-500">
                {successMessage || "Your password has been reset. Redirecting you to sign in…"}
              </p>
            </div>
          )}

          <div className="px-8 pb-5 border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Encrypted · Demo-safe reset
          </div>
        </div>
      </div>
    </div>
  );
};
