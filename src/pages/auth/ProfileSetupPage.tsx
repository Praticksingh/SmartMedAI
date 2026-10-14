import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircle2,
  User,
  Phone,
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Input, SelectInput } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || user?.email?.split("@")[0] || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth && profile.dateOfBirth !== "1995-01-01" ? profile.dateOfBirth : ""
  );
  const [gender, setGender] = useState(
    profile?.gender && profile.gender !== "Unspecified" ? profile.gender : ""
  );
  const [phone, setPhone] = useState(
    profile?.phone && !profile.phone.includes("0000") && !profile.phone.includes("1111") ? profile.phone : ""
  );
  const [knownConditions, setKnownConditions] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (profile?.fullName && !fullName) setFullName(profile.fullName);
    if (profile?.dateOfBirth && profile.dateOfBirth !== "1995-01-01" && !dateOfBirth) setDateOfBirth(profile.dateOfBirth);
    if (profile?.gender && profile.gender !== "Unspecified" && !gender) setGender(profile.gender);
    if (profile?.phone && !profile.phone.includes("0000") && !phone) setPhone(profile.phone);
  }, [profile]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!dateOfBirth) errs.dateOfBirth = "Date of birth is required.";
    if (!gender) errs.gender = "Please select your gender.";
    if (!phone.trim()) errs.phone = "Phone number is required.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);

    const result = await updateProfile({ fullName, dateOfBirth, gender, phone });
    setIsLoading(false);

    if (result.error) {
      setGlobalError(result.error);
      return;
    }
    navigate("/patient", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-100 p-4 py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg z-10">
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-glass overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                <UserCircle2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-teal-200" />
                  <span className="text-teal-200 text-xs font-semibold uppercase tracking-widest">One last step</span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">Complete Your Profile</h1>
                <p className="text-teal-100 text-sm mt-1">
                  Signed in as <strong>{user?.email}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            <p className="text-sm text-slate-500 leading-relaxed">
              Your profile helps us accurately route your care. This information is stored securely and never shared publicly.
            </p>

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

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Known Conditions / Medications{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={knownConditions}
                onChange={e => setKnownConditions(e.target.value)}
                placeholder="e.g. Hypertension, Diabetes Type 2, Metformin 500mg..."
                rows={3}
                className="block w-full rounded-md border border-slate-300 bg-white text-sm text-slate-900 px-3.5 py-2.5 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              />
              <p className="text-xs text-slate-400">Helps speed up future triage sessions.</p>
            </div>

            {globalError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                ⚠ {globalError}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 gap-4">
              <button
                type="button"
                onClick={() => { signOut(); navigate("/login", { replace: true }); }}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Sign out instead
              </button>
              <Button type="submit" isLoading={isLoading} className="shadow-md">
                Save Profile & Continue <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
