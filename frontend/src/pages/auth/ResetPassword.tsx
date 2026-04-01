import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { authAPI } from '../../lib/api'
import { useLanguage } from '../../i18n/LanguageContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authAPI.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "rgba(78,205,196,0.6)")
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")

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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          {!token ? (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t("invalidResetLink")}
              </h1>
              <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                This password reset link is invalid or has expired.
              </p>
              <Link
                to="/forgot-password"
                className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                style={{ background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(126,211,33,0.3)" }}
              >
                {t("requestNewLink")}
              </Link>
            </>
          ) : success ? (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🎉 {t("passwordResetSuccess").split('!')[0]}!
              </h1>
              <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                Redirecting to login…
              </p>
              <div className="flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t("resetPasswordTitle")}
              </h1>
              <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("resetPasswordDesc")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {t("newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} required value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-lg text-sm outline-none transition-all"
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {t("confirmPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"} required value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-lg text-sm outline-none transition-all"
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(126,211,33,0.3)" }}
                  onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)" }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)" }}
                >
                  {loading ? <LoadingSpinner size="sm" /> : t("resetPasswordBtn")}
                </button>
              </form>
            </>
          )}

          <div className="flex justify-center mt-8">
            <Link
              to="/login"
              className="text-sm transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#4ECDC4")}
              onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              ← {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
