import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/forskale-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder for password reset logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: t("resetEmailSent") });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel — identical to Login */}
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
          {/* Back to Login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-opacity hover:opacity-80"
            style={{ color: "#4ECDC4" }}
          >
            <ArrowLeft size={16} />
            {t("backToLogin")}
          </Link>

          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="ForSkale logo" className="w-24 h-auto" />
          </div>

          <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t("forgotPasswordTitle")}
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            {t("resetEmailSent")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{t("workEmail")}</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(78,205,196,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(126,211,33,0.3)" }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {loading ? "..." : t("sendResetLink")}
            </button>
          </form>

          <p className="text-sm mt-8 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
            {t("rememberPassword")}{" "}
            <Link to="/login" className="font-semibold" style={{ color: "#4ECDC4" }}>{t("signInHere")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
