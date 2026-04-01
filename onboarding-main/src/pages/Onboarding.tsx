import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/forskale-logo.png";
import StepIndicator from "@/components/onboarding/StepIndicator";
import SelectField from "@/components/onboarding/SelectField";
import StepGoals from "@/components/onboarding/StepGoals";
import StepFamiliarity from "@/components/onboarding/StepFamiliarity";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";

const MEETING_LANG_KEYS = [
  { key: "langEnUS" as const, value: "en-US" },
  { key: "langEnAU" as const, value: "en-AU" },
  { key: "langEnIN" as const, value: "en-IN" },
  { key: "langEnGB" as const, value: "en-GB" },
  { key: "langEsES" as const, value: "es-ES" },
  { key: "langEsMX" as const, value: "es-MX" },
  { key: "langItIT" as const, value: "it-IT" },
];

import { TranslationKey } from "@/i18n/translations";

const DEPT_KEYS: TranslationKey[] = ["deptSales", "deptHR", "deptMarketing", "deptStrategy", "deptOther"];

const JOB_TITLE_KEYS: Record<string, TranslationKey[]> = {
  deptSales: ["jobSDR", "jobSalesExec", "jobMgrSalesOps", "jobMgrSales", "jobSalesIntern", "jobOtherSales"],
  deptHR: ["jobRecruiter", "jobTalent", "jobHRManager", "jobOtherHR"],
  deptMarketing: ["jobMktManager", "jobGrowth", "jobContent", "jobOtherMkt"],
  deptStrategy: ["jobStrategyConsultant", "jobBizDev", "jobStrategyManager", "jobOtherStrategy"],
  deptOther: ["jobFounder", "jobCEO", "jobCOO", "jobConsultant", "jobAdvisor", "jobFreelancer", "jobStudent", "jobOther"],
};

const TOTAL_STEPS = 3;

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  const [language, setLanguage] = useState("en-US");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [noCompanyWebsite, setNoCompanyWebsite] = useState(false);
  const [source, setSource] = useState("");
  const [sourceDetail, setSourceDetail] = useState("");

  const teamSizeOptions = [t("onlyMe"), t("team2to3"), t("team4to10"), t("team11to20"), t("team21to50"), t("teamOver50")];
  const sourceOptions = [t("referred"), t("searchEngine"), t("socialMedia"), t("community"), t("other")];

  const handleDepartmentChange = (val: string) => {
    setDepartment(val);
    setJobTitle("");
  };

  const handleFinish = (familiarity: string) => {
    console.log("Onboarding complete:", { language, department, jobTitle, teamSize, source, sourceDetail, familiarity });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 onboarding-bg" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Floating orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* Top bar: logo left, language switcher right */}
      <div className="flex items-center justify-between w-full relative z-20 mb-8">
        <div className="logo-circle">
          <img src={logo} alt="ForSkale logo" className="w-[72px] h-auto" />
        </div>
        <LanguageSwitcher variant="dark" />
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-3xl">
          <div className="glass-card px-10 py-8">
            <StepIndicator current={step} total={TOTAL_STEPS} />

            {step === 0 && (
              <div className="animate-fade-in">
                <h2 className="text-lg font-medium mb-3" style={{ color: "hsl(215 16% 47%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {t("tellAboutYourself")}
                </h2>

                <div className="flex items-center gap-2 mb-3 flex-nowrap">
                  <h3 className="text-2xl font-semibold whitespace-nowrap" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("iMostlySpeak")}</h3>
                  <div className="min-w-[140px]">
                    <SelectField bold value={language} onChange={setLanguage} options={MEETING_LANG_KEYS.map(l => ({ label: t(l.key), value: l.value }))} placeholder={t("selectLanguage")} />
                  </div>
                  <h3 className="text-2xl font-semibold whitespace-nowrap" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("inMeetings")}</h3>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <h3 className="text-2xl font-semibold whitespace-nowrap" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("iWorkIn")}</h3>
                  <div className="min-w-[120px]">
                    <SelectField bold value={department} onChange={handleDepartmentChange} options={DEPT_KEYS.map(k => ({ label: t(k), value: k }))} placeholder={t("yourDepartment")} />
                  </div>
                  <h3 className="text-2xl font-semibold whitespace-nowrap" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("asA")}</h3>
                  <div className="min-w-[140px]">
                    <SelectField bold value={jobTitle} onChange={setJobTitle} options={department ? (JOB_TITLE_KEYS[department] || []).map(k => ({ label: t(k), value: k })) : []} placeholder={t("yourJobTitle")} />
                  </div>
                  <h3 className="text-2xl font-semibold whitespace-nowrap" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("inATeamOf")}</h3>
                  <div className="min-w-[100px]">
                    <SelectField bold value={teamSize} onChange={setTeamSize} options={teamSizeOptions} placeholder={t("yourTeamSize")} />
                  </div>
                  <h3 className="text-2xl font-semibold" style={{ color: "hsl(0 0% 10%)" }}>.</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-xl font-semibold whitespace-nowrap" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("iFoundForSkale")}</h3>
                      <div className="min-w-[140px]">
                        <SelectField bold value={source} onChange={setSource} options={sourceOptions} placeholder={t("howYouHeard")} />
                      </div>
                    </div>
                    {source && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <h3 className="text-xl font-semibold whitespace-nowrap" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("moreExactly")}</h3>
                        <input
                          type="text" value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)}
                          placeholder={t("pleaseSpecify")}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold outline-none transition-all flex-1"
                          style={{ background: "hsla(0 0% 100% / 0.6)", border: "1px solid hsl(214 32% 91%)", color: "hsl(0 0% 10%)" }}
                          onFocus={(e) => { e.target.style.borderColor = "hsla(176 58% 55% / 0.6)"; e.target.style.boxShadow = "0 4px 12px hsla(176 58% 55% / 0.15)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "hsl(214 32% 91%)"; e.target.style.boxShadow = "none"; }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: "hsl(215 16% 47%)" }}>{t("companyWebsite")}</h3>
                    <input
                      type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder={t("companyWebsitePlaceholder")} disabled={noCompanyWebsite}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none transition-all"
                      style={{ background: "hsla(0 0% 100% / 0.6)", border: "1px solid hsl(214 32% 91%)", color: "hsl(0 0% 10%)", opacity: noCompanyWebsite ? 0.5 : 1 }}
                      onFocus={(e) => { e.target.style.borderColor = "hsla(176 58% 55% / 0.6)"; e.target.style.boxShadow = "0 4px 12px hsla(176 58% 55% / 0.15)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "hsl(214 32% 91%)"; e.target.style.boxShadow = "none"; }}
                    />
                    <p className="text-xs mt-0.5" style={{ color: "hsl(215 16% 47%)" }}>{t("companyWebsiteHelp")}</p>
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input type="checkbox" checked={noCompanyWebsite} onChange={(e) => { setNoCompanyWebsite(e.target.checked); if (e.target.checked) setCompanyWebsite(""); }} className="w-3.5 h-3.5 rounded accent-[#4ECDC4]" />
                      <span className="text-xs" style={{ color: "hsl(215 20% 40%)" }}>{t("noCompanyWebsite")}</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="btn-continue px-8 py-3 text-sm mt-1"
                >
                  {t("continue")}
                </button>
              </div>
            )}

            {step === 1 && <StepGoals onContinue={() => setStep(2)} onBack={() => setStep(0)} />}
            {step === 2 && <StepFamiliarity onContinue={handleFinish} onBack={() => setStep(1)} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
