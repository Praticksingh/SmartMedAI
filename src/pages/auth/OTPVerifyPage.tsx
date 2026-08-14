import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, RefreshCw, CheckCircle2, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { Button } from "../../components/ui/button";

const RESEND_COOLDOWN = 30; // seconds

export const OTPVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Fix #10: resend cooldown state
  const [cooldown, setCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the complete 6-digit code."); return; }

    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsVerifying(false);
    setVerified(true);
    setTimeout(() => navigate("/patient", { replace: true }), 1500);
  };

  // Fix #10: resend with cooldown + feedback message
  const handleResend = () => {
    if (cooldown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setResendMessage("A new code has been sent to your phone.");
    setCooldown(RESEND_COOLDOWN);
    inputs.current[0]?.focus();
    // Clear the success message after 4s
    setTimeout(() => setResendMessage(""), 4000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-100 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm z-10">
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-glass p-8 text-center">
          {!verified ? (
            <>
              <div className="h-16 w-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-5">
                <Smartphone className="h-8 w-8 text-teal-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 mb-1">Verify Your Phone</h1>
              <p className="text-sm text-slate-400 mb-6">
                We sent a 6-digit code to your registered mobile number.
                <span className="block mt-1 text-xs text-teal-600 font-semibold">
                  (Demo: enter any 6 digits to verify)
                </span>
              </p>

              {/* OTP input boxes */}
              <div className="flex items-center justify-center gap-2.5 mb-5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className={`
                      h-12 w-11 rounded-lg border-2 text-center text-lg font-bold text-slate-800
                      focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100
                      transition-all duration-150 bg-white
                      ${digit ? "border-teal-400 bg-teal-50/30" : "border-slate-300"}
                      ${error ? "border-rose-400" : ""}
                    `}
                    aria-label={`OTP digit ${idx + 1}`}
                  />
                ))}
              </div>

              {error && <p className="text-xs text-rose-600 font-medium mb-4">⚠ {error}</p>}

              {/* Resend success message */}
              {resendMessage && (
                <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold animate-in fade-in duration-200">
                  ✓ {resendMessage}
                </div>
              )}

              <Button onClick={handleVerify} isLoading={isVerifying} className="w-full mb-4">
                Verify Code <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>

              {/* Fix #10: resend with cooldown timer */}
              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  cooldown > 0
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-500 hover:text-teal-600"
                }`}
              >
                {cooldown > 0 ? (
                  <>
                    <Clock className="h-3 w-3" />
                    Resend in {cooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    Resend code
                  </>
                )}
              </button>
            </>
          ) : (
            /* Success state */
            <div className="animate-in fade-in zoom-in-75 duration-300 py-4">
              <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-9 w-9 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Phone Verified!</h2>
              <p className="text-sm text-slate-400">Redirecting you to your dashboard…</p>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Encrypted · HIPAA-aware architecture
          </div>
        </div>
      </div>
    </div>
  );
};
