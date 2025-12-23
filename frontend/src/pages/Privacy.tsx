import Header from '../components/Header'
import { Shield, Lock, Eye, Database, Globe, Mail, Trash2, Clock } from 'lucide-react'

export default function Privacy() {
  const sections = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'What we collect',
      content: [
        'Gmail data you explicitly authorize: email content, sender/recipient/cc/bcc addresses, subject, and timestamps.',
        'Basic account information (name, email, company) and campaign settings you configure.',
        'Sending logs containing only metadata (recipient, subject, time, delivery status).',
      ],
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: 'How we use it',
      content: [
        'Generate and send automatic replies based on emails you receive.',
        'Send email marketing and customer communication campaigns on your behalf to the lists you provide.',
        'Operate, secure, and improve the product; we do not use Gmail data for ads or resale.',
      ],
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Storage & retention',
      content: [
        'Temporary caches used to generate replies are deleted immediately after processing.',
        'Sending logs (metadata only) are kept for up to 90 days by default; you can request shorter retention or deletion.',
        'We do not keep full email bodies/attachments long term unless you explicitly save templates/drafts, which you can delete at any time.',
      ],
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Sharing',
      content: [
        'We do not sell or rent your Gmail data.',
        'We share data only with infrastructure providers needed to run the service, under strict confidentiality and security obligations.',
        'We may disclose data when required by law or to prevent fraud/abuse.',
      ],
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Security',
      content: [
        'Encryption in transit (HTTPS/TLS) and encryption of tokens at rest.',
        'Least-privilege access controls and audit logging.',
        'Periodic security reviews and documented incident response procedures.',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explains how we use Gmail read/send access to power automatic replies and email marketing on your behalf.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              For Skale only accesses your Gmail account after you explicitly grant consent, and solely to operate the features you choose to use: reading emails to generate/send automatic replies, and sending email campaigns on your behalf. We do not use your Gmail data for advertising, profiling, or resale.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              You can revoke access at any time from your Google Security settings; once revoked, we immediately stop accessing your Gmail data and delete related tokens/caches.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center mb-5 text-white">
                  {section.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
                <ul className="space-y-2 text-gray-700 leading-relaxed">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Gmail permission scope</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We request only the minimum scopes needed to operate the features: <code>gmail.readonly</code> (or a narrower metadata/modify scope where sufficient) to read emails for automatic replies, and <code>gmail.send</code> to send messages on your behalf.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Access occurs only when you use the features (for example, enabling auto-reply or creating a campaign). We do not continuously scan your mailbox in the background without a feature-driven reason.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Data deletion & revocation</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You can request deletion of your data at any time by contacting <a href="mailto:privacy@forskale.com" className="text-blue-600 underline">privacy@forskale.com</a>. Upon request, we delete caches, tokens and sending logs unless we are legally required to retain them.
            </p>
            <p className="text-gray-700 leading-relaxed">
              When you revoke OAuth access in Google Security, we immediately stop accessing your Gmail data and invalidate any remaining tokens on our side.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Cookies & analytics</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use essential cookies for authentication and product functionality, and optional analytics cookies to understand how the product is used. You can control cookies via your browser settings.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We do not use third-party tracking cookies to build advertising profiles.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your rights</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
              <li>Access and receive a copy of data we hold about you.</li>
              <li>Correct, delete, or restrict processing of your personal data.</li>
              <li>Withdraw consent and revoke OAuth access at any time.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">
            Questions about privacy?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Contact our team if you need help with data deletion or have any questions about how we use your Gmail data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:privacy@forskale.com"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="mr-2 h-5 w-5" />
              privacy@forskale.com
            </a>
            <a
              href="/help"
              className="inline-flex items-center px-8 py-4 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Help Center
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 text-sm text-blue-100">
            <div className="inline-flex items-center gap-2 justify-center">
              <Trash2 className="h-4 w-4" />
              \"Delete my data\" requests supported
            </div>
            <div className="inline-flex items-center gap-2 justify-center">
              <Lock className="h-4 w-4" />
              Revoke OAuth access in Google Security at any time
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
