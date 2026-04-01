import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/forskale-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login with:", email, password);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "hsl(210 33% 96%)" }}
      >
        <div className="absolute rounded-full" style={{ width: 400, height: 400, background: "radial-gradient(circle, hsla(90 73% 48% / 0.12) 0%, transparent 70%)", filter: "blur(80px)", top: -80, left: -100 }} />
        <div className="absolute rounded-full" style={{ width: 350, height: 350, background: "radial-gradient(circle, hsla(176 58% 55% / 0.12) 0%, transparent 70%)", filter: "blur(80px)", bottom: -50, right: -80 }} />
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
          <div
            className="mt-10 rounded-xl p-4"
            style={{ background: "hsla(0 0% 100% / 0.6)", border: "1px solid hsla(176 58% 55% / 0.25)" }}
          >
            <p className="text-xs" style={{ color: "hsl(215 16% 47%)" }}>
              {t("loginLeftPanelNote")}
            </p>
          </div>
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

          <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t("logIn")}
          </h1>

          <div className="space-y-3 mb-6">
            {[
              {
                label: t("logInGoogle"),
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                ),
              },
              {
                label: t("logInMicrosoft"),
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z" />
                    <path fill="#7FBA00" d="M13 1h10v10H13z" />
                    <path fill="#00A4EF" d="M1 13h10v10H1z" />
                    <path fill="#FFB900" d="M13 13h10v10H13z" />
                  </svg>
                ),
              },
              {
                label: t("signInApple"),
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.65-2.2.46-3.06-.4C3.79 16.17 4.36 9.44 8.7 9.2c1.25.07 2.12.72 2.87.75.99-.2 1.94-.78 3-.84 1.66-.08 2.92.59 3.72 1.74-3.4 2.03-2.6 6.54.68 7.8-.54 1.42-1.22 2.8-2.92 3.63zM12.03 9.15c-.15-2.39 1.79-4.42 4.05-4.62.33 2.72-2.46 4.77-4.05 4.62z" />
                  </svg>
                ),
              },
            ].map((btn) => (
              <button
                key={btn.label}
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

          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
            <span className="px-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t("or")}</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{t("workEmail")}</label>
              <input
                type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(78,205,196,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{t("password")}</label>
              <input
                type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(78,205,196,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-bold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(126,211,33,0.3)" }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {t("logIn")}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: "#4ECDC4" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{t("keepSignedIn")}</span>
            </label>
            <Link to="/forgot-password" className="text-xs font-medium" style={{ color: "#4ECDC4" }}>{t("forgotPassword")}</Link>
          </div>

          <p className="text-sm mt-8 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
            {t("noAccount")}{" "}
            <Link to="/signup" className="font-semibold" style={{ color: "#4ECDC4" }}>{t("signUp")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
