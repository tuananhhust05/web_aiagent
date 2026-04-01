import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { authAPI } from '../../lib/api'
import { useLanguage } from '../../i18n/LanguageContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
          <img src="/images/forskale-logo.png" alt="ForSkale logo" className="w-32 h-auto mx-auto mb-8" />
          <h2
            className="text-3xl font-extrabold mb-4"
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
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative" style={{ background: "#0A1128" }}>
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/images/forskale-logo.png" alt="ForSkale logo" className="w-24 h-auto" />
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 100%)", boxShadow: "0 8px 24px rgba(126,211,33,0.3)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>

          {!sent ? (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t("forgotPasswordTitle")}
              </h1>
              <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("forgotPasswordDesc")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {t("enterEmail")}
                  </label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(78,205,196,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(126,211,33,0.3)" }}
                  onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)" }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)" }}
                >
                  {loading ? <LoadingSpinner size="sm" /> : t("sendResetLink")}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t("checkYourEmail")}
              </h1>
              <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("resetLinkSent")}
              </p>
              <div className="p-4 rounded-xl text-center text-sm" style={{ background: "rgba(78,205,196,0.08)", border: "1px solid rgba(78,205,196,0.25)", color: "#4ECDC4" }}>
                {email}
              </div>
            </>
          )}

          <div className="flex flex-col items-center gap-2 mt-8">
            <Link
              to="/login"
              className="text-sm font-medium flex items-center gap-1.5 transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#4ECDC4")}
              onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              ← {t("backToLogin")}
            </Link>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {t("alreadyAccount")}{" "}
              <Link to="/register" style={{ color: "#4ECDC4" }}>{t("signUpFree")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
