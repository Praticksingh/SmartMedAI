import React from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Users, 
  Settings, 
  Tv, 
  Heart, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMockDB } from "../hooks/useMockDB";
import { useLanguage } from "../context/LanguageContext";

export const Landing: React.FC = () => {
  const db = useMockDB();
  const { t } = useLanguage();
  
  // Calculate dynamic stats
  const totalWaiting = db.departments.reduce((acc, dept) => acc + dept.waiting, 0);
  const totalTreating = db.departments.reduce((acc, dept) => acc + dept.treating, 0);
  const pausedCount = db.departments.filter(dept => dept.status === "PAUSED").length;
  const portals = [
    {
      title: "Patient Portal",
      description: "Start symptom assessment, receive priority triage recommendation, and check in via secure QR code.",
      path: "/patient",
      icon: User,
      buttonText: "Start Patient Flow",
      badgeText: "Patient Path",
      color: "teal"
    },
    {
      title: "Department Staff Hub",
      description: "Manage department queues, check patients in/out via scanner, and start clinician consultations.",
      path: "/staff",
      icon: Users,
      buttonText: "Open Staff Panel",
      badgeText: "Clinical Staff",
      color: "indigo"
    },
    {
      title: "Hospital Admin Portal",
      description: "Configure department capacities, monitor congestion events, view audit trails, and override priorities.",
      path: "/admin",
      icon: Settings,
      buttonText: "Open Admin Dashboard",
      badgeText: "Admin Control",
      color: "slate"
    },
    {
      title: "Public Queue Display",
      description: "Large TV screen display showing current tokens, calling patients to counters without exposing sensitive details.",
      path: "/public-display",
      icon: Tv,
      buttonText: "View Live Display",
      badgeText: "Patient Waiting Room",
      color: "emerald"
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold uppercase tracking-wider shadow-sm animate-pulse-subtle">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          <span>{t("landing.badge")}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
          {t("landing.title")}
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          {t("landing.subtitle")}
        </p>
      </div>

      {/* Hospital Metrics / Summary Grid (Visual Design system requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-100 rounded-lg p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-800">{totalWaiting} {t("landing.patientsWaiting")}</span>
            <span className="text-xs text-slate-500 font-medium">{t("landing.waitingDesc")}</span>
          </div>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-lg p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-800">{totalTreating} {t("landing.activeTreatments")}</span>
            <span className="text-xs text-slate-500 font-medium">{t("landing.treatmentsDesc")}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-lg p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-800">{pausedCount} Paused</span>
            <span className="text-xs text-slate-500 font-medium">Clinic Overload Warnings</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 max-w-5xl mx-auto" />

      {/* Portals Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 text-center tracking-tight">
          Select Your Workspace / Dashboard
        </h2>
        <p className="text-sm text-slate-500 text-center -mt-4">
          Choose a route to view the functional shell and mock features.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {portals.map((portal) => {
            const IconComponent = portal.icon;
            return (
              <Card key={portal.path} hoverLift={true} className="flex flex-col h-full hover:border-teal-500/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600 tracking-wider">
                      {portal.badgeText}
                    </span>
                    <IconComponent className="h-5 w-5 text-slate-400" />
                  </div>
                  <CardTitle className="mt-3 text-xl">{portal.title}</CardTitle>
                  <CardDescription>{portal.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-end pt-4">
                  <Link to={portal.path} className="w-full">
                    <Button variant="outline" className="w-full justify-between hover:bg-teal-600 hover:text-white transition-colors duration-300">
                      <span>{portal.buttonText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
