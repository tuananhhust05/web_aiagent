import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/forskale-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "hsl(210 33% 96%)" }}
      >
        <div
          className="absolute rounded-full"
          style={{ width: 400, height: 400, background: "radial-gradient(circle, hsla(90 73% 48% / 0.12) 0%, transparent 70%)", filter: "blur(80px)", top: -80, left: -100 }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: 350, height: 350, background: "radial-gradient(circle, hsla(176 58% 55% / 0.12) 0%, transparent 70%)", filter: "blur(80px)", bottom: -50, right: -80 }}
        />
        <div className="relative z-10 text-center px-12 max-w-xl">
          <img src={logo} alt="ForSkale logo" className="w-32 h-auto mx-auto mb-8" />
          <h2
            className="text-3xl font-extrabold mb-4 whitespace-nowrap"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("leftPanelTitle")}
          </h2>
          <p className="text-base whitespace-pre-line" style={{ color: "hsl(215 20% 40%)", lineHeight: 1.7 }}>
            {t("leftPanelDesc")}
          </p>
          <p className="mt-10 text-sm italic text-center" style={{ color: "hsl(215 16% 47%)" }}>
            {t("loginLeftPanelNote")}
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative" style={{ background: "#0A1128" }}>
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="ForSkale logo" className="w-24 h-auto" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t("signUpTitle")}{" "}
            <span style={{ background: "linear-gradient(90deg, #7ED321, #4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("freeForever")}
            </span>
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>{t("howCanHelp")}</p>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>{t("verifyEmail")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder={t("enterEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(78,205,196,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-bold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(126,211,33,0.3)" }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {t("signUpFree")}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
            <span className="px-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t("or")}</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          </div>

          <div className="space-y-3">
            {[
              { label: t("signUpGoogle"), icon: (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )},
              { label: t("signUpMicrosoft"), icon: (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z" />
                  <path fill="#7FBA00" d="M13 1h10v10H13z" />
                  <path fill="#00A4EF" d="M1 13h10v10H1z" />
                  <path fill="#FFB900" d="M13 13h10v10H13z" />
                </svg>
              )},
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => navigate("/onboarding")}
                className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-3 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(78,205,196,0.4)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>

          <p className="text-xs mt-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            {t("termsAgree")}{" "}
            <a href="#" className="underline" style={{ color: "rgba(78,205,196,0.8)" }}>{t("termsOfService")}</a>{" "}
            {t("and")}{" "}
            <a href="#" className="underline" style={{ color: "rgba(78,205,196,0.8)" }}>{t("privacyPolicy")}</a>
          </p>

          <p className="text-sm mt-6 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
            {t("alreadyAccount")}{" "}
            <Link to="/login" className="font-semibold" style={{ color: "#4ECDC4" }}>{t("logIn")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
