import Header from '../components/Header'
import { FileText, ShieldCheck, MailCheck, AlertTriangle, Clock, HeartHandshake, Lock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Terms() {
  const serviceItems = [
    {
      title: 'Services provided',
      points: [
        'Automatic email replies: use authorized Gmail data to generate and send replies on your behalf.',
        'Email marketing and customer communication: send campaigns to contact lists that you provide.',
        'We do not use Gmail data for advertising or resale.',
      ],
      icon: <MailCheck className="h-6 w-6" />,
    },
    {
      title: 'User responsibilities',
      points: [
        'Ensure that all emails you send comply with applicable anti-spam laws and that recipients have given appropriate consent.',
        'Do not use the service for spam, phishing, malware distribution, harassment, or any illegal activity.',
        'You are responsible for the accuracy and lawfulness of customer data and mailing lists you upload or configure.',
      ],
      icon: <AlertTriangle className="h-6 w-6" />,
    },
    {
      title: 'Data & privacy',
      points: [
        'We process data in line with our Privacy Policy and do not sell or rent Gmail data.',
        'You can revoke OAuth access at Google Security and request data deletion at any time.',
        'We retain sending metadata (recipient, subject, time, status) for up to 90 days, or less on request.',
      ],
      icon: <Lock className="h-6 w-6" />,
    },
    {
      title: 'Service availability & liability',
      points: [
        'Service may be interrupted due to maintenance or limitations of Google APIs.',
        'The service is provided “as is” without guarantees of being error-free or uninterrupted.',
        'Our liability is limited to the total fees you paid for the service in the last 3 months (if any).',
      ],
      icon: <Clock className="h-6 w-6" />,
    },
    {
      title: 'Compliance & enforcement',
      points: [
        'We may suspend or terminate accounts when we detect abuse, security risk, or legal violations.',
        'We cooperate with authorities when legally required.',
        'We may request additional proof of consent for large marketing sends.',
      ],
      icon: <ShieldCheck className="h-6 w-6" />,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20">
            <FileText className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Governs how Gmail read/send access is used to provide automatic replies and email marketing on your behalf.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Summary cards */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Gmail scopes requested</h3>
            </div>
            <ul className="space-y-2 text-gray-700 leading-relaxed">
              <li>• `gmail.readonly` (or a narrower metadata/modify scope where sufficient) to read emails for auto-replies.</li>
              <li>• `gmail.send` to send replies and campaigns on your behalf.</li>
              <li>• Access is feature-driven only; we do not crawl your mailbox in the background without purpose.</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <HeartHandshake className="h-6 w-6 text-emerald-600" />
              <h3 className="text-xl font-semibold text-gray-900">User control</h3>
            </div>
            <ul className="space-y-2 text-gray-700 leading-relaxed">
              <li>• Revoke OAuth access at Google Security at any time; we then stop access and delete tokens/caches.</li>
              <li>• Request data deletion via `privacy@forskale.com` or through in-product settings.</li>
              <li>• Configure retention for sending logs; default is 90 days but can be shortened or set to delete immediately.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-6">
          {serviceItems.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              </div>
              <ul className="space-y-2 text-gray-700 leading-relaxed">
                {item.points.map((point, pIdx) => (
                  <li key={pIdx}>• {point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Legal footer */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-700 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Governing law & dispute resolution</h2>
          <p>
            You may adapt this section to the jurisdiction where your company is registered. We recommend specifying the governing law, competent courts or arbitration body, and the language of the contract.
          </p>
          <p>
            For any legal questions, contact <a href="mailto:legal@forskale.com" className="text-blue-600 underline">legal@forskale.com</a>.
          </p>
          <div className="pt-2">
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              View Privacy Policy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

