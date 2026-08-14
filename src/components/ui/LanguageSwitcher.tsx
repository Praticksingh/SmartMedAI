import React from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLanguage, type Language } from "../../context/LanguageContext";

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor="language-select" className="sr-only">
        {t("lang.toggle")}
      </label>
      <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-sm hover:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all">
        <Globe className="h-4 w-4 text-teal-600 mr-2 shrink-0" aria-hidden="true" />
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          aria-label="Select Language / भाषा चुनें"
          className="bg-transparent text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none pr-4 appearance-none"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 -ml-3 pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );
};
