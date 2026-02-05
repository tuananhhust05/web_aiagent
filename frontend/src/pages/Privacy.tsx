import Header from '../components/Header'
import { Shield, Lock, Eye, Database, Globe, Mail, Clock, FileText, Users, Building2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'

export default function Privacy() {
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
            Privacy Policy of ForSkale
          </h1>
          <p className="text-sm text-gray-500 mt-4">
            Last modified: December 23, 2025
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="text-lg mb-6">
              This privacy policy establishes how personal data is collected and processed through the website https://forskale.com and the ForSkale platform (hereinafter the "Platform") in order to fulfill the obligation of information and transparency in the processing of personal data provided by users in accordance with the provisions of Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data (hereinafter "GDPR") and Legislative Decree 30 June 2003, n. 196 (Code regarding the protection of personal data), as amended by D.Lgs. 101/2018.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section 1: Data Controller */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">1. Data Controller</h2>
            </div>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p><strong>Name:</strong> ForSkale S.r.l.</p>
              <p><strong>VAT/CF:</strong> 05443490759</p>
              <p><strong>Registered office:</strong> Via 47° Reggimento Fanteria 40, 73100 Lecce (LE)</p>
              <p><strong>Email:</strong> <a href="mailto:amministrazione@forskale.com" className="text-blue-600 underline">amministrazione@forskale.com</a></p>
              <p><strong>PEC:</strong> forskale@pec.it</p>
              <p className="mt-4">
                ForSkale S.r.l. is the Data Controller of the personal data collected through the Platform. The Controller manages data protection internally and ensures compliance with current regulations on privacy and protection of personal data.
              </p>
            </div>
          </div>

          {/* Section 2: Necessity of Providing Personal Data */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">2. Necessity of Providing Personal Data</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The use of certain services or features of the Platform requires providing some personal data and implies their processing for the purposes and on the legal basis indicated in this Privacy Policy, unless otherwise indicated. The refusal to provide the requested data in these cases may make it impossible to provide certain services or features or to process requests or contracts made, particularly in cases where they are identified as mandatory.
            </p>
          </div>

          {/* Section 3: Purposes and Legal Basis */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">3. Purposes and Legal Basis of Processing</h2>
            </div>
            <div className="space-y-6 text-gray-700">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold mb-2">Purpose: Management of registration as a user on the Platform</p>
                <p className="mb-2"><strong>Legal basis:</strong> Your consent and execution of the contractual relationship. You can revoke your consent at any time by sending an email to <a href="mailto:amministrazione@forskale.com" className="text-blue-600 underline">amministrazione@forskale.com</a>.</p>
                <p className="text-sm text-gray-600"><strong>Categories of data:</strong> Identification data, Contact data, Data relating to personal characteristics</p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="font-semibold mb-2">Purpose: Development, fulfillment and execution of the purchase or service provision contract entered into on the Platform</p>
                <p className="mb-2"><strong>Legal basis:</strong> Execution of the contractual relationship.</p>
                <p className="text-sm text-gray-600"><strong>Categories of data:</strong> Identification data, Economic or financial data</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold mb-2">Purpose: Prevention of fraud in registration to avoid anomalous practices that could cause economic damage</p>
                <p className="mb-2"><strong>Legal basis:</strong> Legitimate interest</p>
                <p className="text-sm text-gray-600"><strong>Categories of data:</strong> Identification data, Contact data</p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="font-semibold mb-2">Purpose: Provide a quote for ForSkale products and services</p>
                <p className="mb-2"><strong>Legal basis:</strong> Your consent. You can revoke your consent at any time by sending an email to <a href="mailto:andrea.marino@forskale.com" className="text-blue-600 underline">andrea.marino@forskale.com</a>.</p>
                <p className="text-sm text-gray-600"><strong>Categories of data:</strong> Identification data, Contact data</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold mb-2">Purpose: Schedule an appointment with ForSkale for a real-time demonstration of ForSkale software</p>
                <p className="mb-2"><strong>Legal basis:</strong> Your consent. You can revoke your consent at any time by sending an email to <a href="mailto:andrea.marino@forskale.com" className="text-blue-600 underline">andrea.marino@forskale.com</a>.</p>
                <p className="text-sm text-gray-600"><strong>Categories of data:</strong> Identification data, Contact data</p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="font-semibold mb-2">Purpose: Analysis and improvement of the Platform through processing of aggregated and anonymous data</p>
                <p className="mb-2"><strong>Legal basis:</strong> Legitimate interest of the Controller to improve its services</p>
                <p className="text-sm text-gray-600"><strong>Categories of data:</strong> Platform usage data (aggregated and anonymous), Behavioral data (aggregated and anonymous)</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold mb-2">Purpose: B2B commercial prospecting directed at companies and business professionals</p>
                <p className="mb-2"><strong>Legal basis:</strong> Legitimate interest of the Data Controller to carry out direct marketing activities in a business-to-business context, pursuant to Article 6(1)(f) of the GDPR</p>
                <p className="text-sm text-gray-600"><strong>Categories of data:</strong> Professional contact data, such as business email addresses</p>
              </div>
            </div>
          </div>

          {/* Section 4: Data Retention */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Clock className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">4. Retention of Personal Data</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              The personal data processed will be retained for the time necessary to fulfill the indicated purposes. We also inform you that, in addition to the above periods, we will retain your personal data for the mandatory limitation periods for the fulfillment of our legal obligations and for the exercise of our legal rights (for the exercise or defense, if applicable, of a legal action). In addition, the provisions of corporate legislation on archiving and retention periods apply.
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Contractual data:</strong> 10 years from the termination of the contractual relationship (for tax and accounting purposes)</p>
              <p><strong>Marketing data:</strong> until consent is revoked or for a maximum of 24 months from the last interaction</p>
              <p><strong>B2B commercial prospecting data:</strong> maximum 24 months from the last interaction with the data subject or until an objection is raised, whichever occurs first</p>
              <p><strong>Navigation data:</strong> maximum 12 months</p>
            </div>
          </div>

          {/* Section 5: Data Recipients */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">5. Data Recipients</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Your personal data may be communicated to Public Bodies and Administrations, Courts, or Police Forces when it is necessary to fulfill a legal obligation. In addition, in the event that ForSkale uses third parties for the provision of services, such as software and technology companies that help us carry out our services efficiently and in compliance with the legal framework, these may access your personal data when necessary to fulfill the purposes indicated above.
              </p>
              <p className="font-semibold mb-2">Your personal data will be communicated to the following subjects that provide ForSkale with essential services for the operation of the Platform:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cloud and hosting service providers: for data storage and management on the Platform</li>
                <li>Payment processors: for transaction management (e.g. Stripe)</li>
                <li>Communication service providers: for sending transactional emails and service communications</li>
              </ul>
              <p className="mt-4">
                In any case, ForSkale guarantees that this access will be carried out in compliance with data protection regulations and in respect of all technical and organizational measures necessary to ensure the security and confidentiality of your personal information.
              </p>
              <p>
                In the event that the user is redirected to third-party websites (to make payments for products and services or to request an appointment with ForSkale for a real-time demonstration of the Software), the user will be subject to the Privacy Policy and Terms and Conditions of such third parties.
              </p>
            </div>
          </div>

          {/* Section 6: International Transfers */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Globe className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">6. International Transfers</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                ForSkale does not transfer personal data to recipients located in countries outside the European Economic Area. All data is stored and processed exclusively within the European Union, ensuring full compliance with the protection standards provided by the GDPR.
              </p>
              <p>
                In the event that the intervention of any of the suppliers involved in the provision of services should involve an international transfer of data, the same will be adequately regulated by adopting the appropriate guarantees for its execution, in accordance with articles 44 and following of the GDPR.
              </p>
            </div>
          </div>

          {/* Section 7: Data Subject Rights */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">7. Data Subject Rights</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              The user, as a data subject, may, by sending an e-mail to <a href="mailto:amministrazione@forskale.com" className="text-blue-600 underline">amministrazione@forskale.com</a> and providing sufficient information to identify themselves, exercise the following rights:
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Right of Access</h3>
                <p className="text-gray-700 text-sm">
                  You have the right to be informed by the Data Controller whether your personal data are or are not subject to processing and, if so, to have access to such data and to receive information on the purposes for which they are processed, the categories of data affected by the processing, the recipients to whom your personal data have been communicated and the expected period of data retention, among other information.
                </p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Right of Rectification</h3>
                <p className="text-gray-700 text-sm">
                  At any time you may request the Data Controller to rectify without undue delay any inaccurate personal data concerning you, as well as to complete the data subject to processing.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Right to Withdraw Consent</h3>
                <p className="text-gray-700 text-sm">
                  You may withdraw the consents granted at any time and without the need for any justification. The withdrawal does not affect the lawfulness of the processing previously carried out.
                </p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Right to Object in Whole or in Part to Processing</h3>
                <p className="text-gray-700 text-sm">
                  You have the right to object to the processing of your personal data in certain circumstances and for reasons related to your particular situation. In such cases, the Data Controller will cease processing personal data unless it can demonstrate legitimate reasons for processing that prevail over your interests, rights and freedoms, or for the formulation, exercise or defense of claims.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Right to Data Portability</h3>
                <p className="text-gray-700 text-sm">
                  You have the right to receive the personal data you have provided in a structured, commonly used and machine-readable format and to be able to transmit them to another data controller without the data controller to whom you provided them preventing you from doing so, in the cases legally provided for this purpose.
                </p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Right to Restriction of Processing</h3>
                <p className="text-gray-700 text-sm">
                  In certain circumstances (for example, in the event that you contest the accuracy of your data while the accuracy of your data is being verified), you may request to restrict the processing of your personal data, which will be processed only for the exercise or defense of claims.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Right to Erasure</h3>
                <p className="text-gray-700 text-sm">
                  You have the right to request the erasure of your personal data, provided that the applicable legal requirements are met, including, inter alia, that they are no longer necessary for the purposes for which they were collected.
                </p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mt-6">
              If you believe that any of your rights regarding the protection of personal data have been violated, you may file a complaint with the Italian Data Protection Authority (Garante per la Protezione dei Dati Personali) at <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1">www.garanteprivacy.it <ExternalLink className="h-3 w-3" /></a>.
            </p>
          </div>

          {/* Section 8: Security */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">8. Security</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              The personal data collected through this Website are stored in databases under the responsibility of ForSkale, assuming all technical, organizational and security measures that guarantee the confidentiality, integrity and quality of the information contained therein in accordance with the provisions of the GDPR and Italian legislation on data protection.
            </p>
            <p className="font-semibold text-gray-900 mb-2">ForSkale implements adequate security measures, including:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Access controls and authentication</li>
              <li>Continuous security monitoring</li>
              <li>Regular data backups</li>
              <li>Staff training on data protection</li>
            </ul>
          </div>

          {/* Section 9: Links */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <ExternalLink className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">9. Links</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The website may include hyperlinks to other sites that are not managed or controlled by ForSkale. Therefore, ForSkale does not guarantee and is not responsible for the legality, reliability, usefulness, accuracy or timeliness of the content of such websites or their privacy practices.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Before providing your personal information to these third-party websites, please be aware that their privacy practices may differ from ours.
            </p>
          </div>

          {/* Section 10: Google Workspace API */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Database className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">10. Use of Google Workspace APIs</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Any user data obtained through Google Workspace APIs will not be used to develop, improve or train generalized AI and/or ML models. This is in compliance with Google's policy to ensure that user data is managed appropriately and securely.
            </p>
          </div>

          {/* Section 11: Cookie Policy */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Eye className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">11. Cookie Policy</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The ForSkale Platform uses cookies and similar technologies to ensure the proper functioning of the site, improve the user experience and analyze the use of the Platform. For detailed information on the use of cookies, please consult our Cookie Policy available on the Platform.
            </p>
          </div>

          {/* Section 12: Changes to Privacy Policy */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">12. Changes to the Privacy Policy</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              ForSkale reserves the right to modify this Privacy Policy at any time. Any changes will be published on this page with the indication of the date of the last modification. It is recommended to consult this page periodically to be informed of any updates.
            </p>
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
            Contact our team if you need help with data deletion or have any questions about how we process your personal data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:amministrazione@forskale.com"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="mr-2 h-5 w-5" />
              amministrazione@forskale.com
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
