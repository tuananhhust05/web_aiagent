import Header from '../components/Header'
import { FileText, ShieldCheck, AlertTriangle, Clock, HeartHandshake, Lock, ArrowRight, Building2, Users, CreditCard, Database, ExternalLink, CheckCircle, Scale, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Terms() {
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
            Terms and Conditions of Service of the ForSkale Platform
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
              The following General Terms and Conditions are entered into between ForSkale S.r.l., an Italian company with registered office at Via 47° Reggimento Fanteria 40, 73100 Lecce (LE), VAT No. 05443490759, registered in the Lecce Companies Register under No. REA LE-392584, with share capital of € 1,000.00 fully paid up, and the party identified as the Client on the ForSkale Platform.
            </p>
            <p className="text-lg mb-6">
              The following Terms and Conditions establish the legal framework for the use of the ForSkale Platform. It is recommended to read them carefully, as together with the Privacy Policy to which reference will be made, they constitute the rules governing its use.
            </p>
            <p className="text-lg">
              To complete registration, access and use of the ForSkale Platform, it is necessary to expressly accept the following Terms and Conditions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section 1: Our Data */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">1. Our Data</h2>
            </div>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                The use of the ForSkale platform and the software available on it is authorized in accordance with these Terms and Conditions of Use by ForSkale S.r.l., an Italian company with registered office at Via 47° Reggimento Fanteria 40, 73100 Lecce (LE), VAT/CF 05443490759, registered in the Lecce Companies Register under No. REA LE-392584, with share capital of € 1,000.00 fully paid up (hereinafter, "ForSkale", "We", "Us"), with email address: <a href="mailto:amministrazione@forskale.com" className="text-blue-600 underline">amministrazione@forskale.com</a> and PEC: forskale@pec.it.
              </p>
              <p>
                For the purposes of these General Conditions, "ForSkale" means ForSkale S.r.l., as well as any subsidiaries of such entity, within the meaning of Article 2359 of the Civil Code (hereinafter, the "Subsidiaries").
              </p>
            </div>
          </div>

          {/* Section 2: Binding Terms */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">2. Binding Terms and Conditions of Use</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                These Terms and Conditions of Use of the ForSkale platform (hereinafter, the "Terms and Conditions of Use" or "Terms of Use") are binding and govern the conditions of use, access and use of the ForSkale platform and ForSkale software available on the ForSkale platform, which can be accessed through authorized websites and applications owned by ForSkale (hereinafter collectively the "Platform" or the "ForSkale Platform").
              </p>
              <p>
                Access to the ForSkale Platform confers user status on anyone who uses it (hereinafter, the "Client", "User", "You") and implies full and complete acceptance of these Terms and Conditions, as well as ForSkale's Privacy Policy. Use of the Platform requires full and unconditional acceptance of these Terms of Use. You declare that you have read, understood and accepted these Terms of Use in their entirety. If you do not accept these Terms and Conditions, please do not access or use the ForSkale Platform or ForSkale's proprietary software.
              </p>
              <p className="font-semibold text-gray-900">You are not authorized to use the Platform if:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are a minor, have not yet reached the legal age to work and/or do not have the legal capacity to contract; or</li>
                <li>You have been prohibited by a judicial or administrative authority from accessing and/or using such services in your jurisdiction, in the place where you reside or in the place where you access the Platform.</li>
            </ul>
              <p>
                Use of the Platform also implies acceptance of all notices, rules of use and instructions that ForSkale will make known to you after acceptance of these Terms and Conditions of Use.
              </p>
              <p>
                The Client guarantees that the person who accepts these Terms and Conditions of Use on behalf of the Client does so as a duly authorized legal representative and has sufficient legal capacity to enter into the contract.
              </p>
            </div>
          </div>

          {/* Section 3: Description of Services */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Database className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">3. Description of ForSkale Services</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                ForSkale provides its services through a "SaaS" (Software as a Service) model configuration, making its Platform accessible. The services offered by ForSkale consist of an All-in-One artificial intelligence platform for revenue generation that integrates:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>AI Voice Caller:</strong> Automated calling system driven by neuroscientific principles for contacting and qualifying prospects</li>
                <li><strong>AI Copilot for Negotiation:</strong> Intelligent assistant that supports sales managers during commercial negotiations, providing real-time suggestions based on behavioral analysis</li>
                <li><strong>AI Retention & Expansion Copilot:</strong> Predictive tool for customer base management, churn prevention and identification of upselling and cross-selling opportunities</li>
                <li><strong>AI Go-To-Market Intelligence:</strong> Data unification and analysis system for psychographic segmentation and orchestration of multichannel campaigns</li>
                <li><strong>Multichannel workflow automation:</strong> Integration and automation of communications through phone, WhatsApp, Telegram, LinkedIn, email and AI Video Pre-sales</li>
              </ul>
              <p>
                The Client is responsible for accessing and using the Platform at their sole risk.
              </p>
              <p className="font-semibold text-gray-900">The following are expressly excluded from the Services and will be borne by the Client:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The acquisition, installation and maintenance of the router and computer equipment from which the Client makes the Internet connection to access the Platform;</li>
                <li>The provision, contracting, installation and maintenance of the lines necessary to access the Platform; and</li>
                <li>The management of content and information derived from the Services.</li>
            </ul>
          </div>
        </div>

          {/* Section 4: Registration */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">4. Registration</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                To access the Platform, it is necessary to: (i) provide certain information during the registration procedure (for example, first name, last name, company name, email address and telephone number); and (ii) accept these Terms of Use and ForSkale's privacy policy. To continue using the Platform, the User expressly accepts and undertakes to provide accurate, truthful, updated and complete information, where necessary, at the time of registration on the Platform and at any other time when this may be required during use of the Platform ("Registration Data"). The User undertakes to keep their Registration Data updated.
              </p>
              <p>
                ForSkale reserves the right to deny access and use of the Platform and other services if it detects or has reasonable grounds to believe that the Client has provided inaccurate, false or fraudulent data, if there is a court order to that effect or if there are reasonable suspicions that the Client is involved in fraudulent, unlawful or illegal activities that could harm ForSkale (or its affiliates), including those related to money laundering or international sanctions.
              </p>
              <div className="border-l-4 border-blue-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Free Trial Period</p>
                <p>
                  ForSkale may offer at its discretion, and the Client may test, the Services and the Platform during a free trial period of 30 (thirty) calendar days from the activation of the Services, which ends: (a) at the conclusion of the free trial period; or (b) at the start of paid subscription to the Service by entering into the relevant contract between Client and ForSkale (the "Free Trial"). However, ForSkale reserves the right, at its sole discretion and at any time, to grant different and/or new Free Trial periods to its Clients for the Platform, features and/or new characteristics, which will be promptly communicated to the Client.
                </p>
              </div>
              <p className="mt-4">
                At the time of registration, you will be asked, among other things, to provide an email address and a password. You understand and accept that you are responsible: (i) for maintaining the confidentiality of your data; and (ii) for updating and frequently checking your password. Consequently, you release ForSkale from any liability and acknowledge and accept that ForSkale is not responsible for any problems arising from or relating to your account that arise from your failure to protect or adopt reasonably adequate measures to protect your data. In case of reasonable suspicion that a user's credentials have been compromised, and in order to ensure the security and operability of the ForSkale Platform, we reserve the right to temporarily block such compromised accounts. This action will be taken to protect the integrity of the Platform and the data of all users.
              </p>
            </div>
          </div>

          {/* Section 5: Authorization to Use */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">5. Authorization to Use</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The ForSkale Platform is made available to the User directly through ForSkale and its affiliates (or indirectly through distributors, partners or resellers subject to a use license). In this sense, the Client acknowledges that ForSkale holds ownership or has sufficient and necessary rights to grant use of the Platform and/or other ForSkale software. In no case shall it be understood that ownership rights to the Platform have been granted to the Client and in no case shall it be considered a sale.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Subject to and conditional upon compliance with these Terms and Conditions of Use, compliance with the General Contract Conditions and payment of the price by the Client, ForSkale grants the Client, for the entire duration of the Contract Period, a non-exclusive, time-limited, non-transferable, non-assignable and revocable license to access and use the Platform for the Client's internal professional use and never for commercial purposes or for sale to third parties (the "License"). ForSkale reserves all rights to the Platform not expressly granted to the Client under the License.
            </p>
                </div>

          {/* Section 6: Use of Platform */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">6. Use of the Platform</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The User may use the Platform as a web application or other system compatible with the Platform.
              </p>
              <p>
                The User must use the Platform exclusively for the purpose for which it is intended, in good faith, in compliance with current legislation, morality and generally accepted customs, public order and these Conditions of Use, at all times respecting the intellectual and industrial property rights held by ForSkale.
              </p>
              <p className="font-semibold text-gray-900">It is strictly forbidden for any User to use the Platform, as well as ForSkale software and/or any content of the Platform, for purposes or effects that are (or may be) unlawful, prohibited, harmful to the rights and interests of third parties, as well as to perform any action that damages or may damage, render unusable, overload or deteriorate the Platform and/or cause damage or alterations of any kind not permitted by ForSkale to the Platform, its content or other Users. In particular, by way of example and not limitation, the Client and any User may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Circumvent, disable or otherwise interfere with the security features of the Platform. It is also not permitted to interfere, interrupt or create excessive load on the Platform or the Services connected to it.</li>
                <li>Access or attempt to access any other user's account on the Platform.</li>
                <li>Cheat or defraud ForSkale or other Users, in particular in an attempt to learn sensitive information about other Users' accounts or passwords, or impersonate another User or person, or use another User's name.</li>
                <li>Create or compile, directly or indirectly, a collection, compilation, database or directory owned by ForSkale or carry out data mining activities without ForSkale's prior written consent.</li>
                <li>Misuse our support services or make false reports of abuse or misconduct.</li>
                <li>Sell, share or otherwise transfer your profile or credentials.</li>
                <li>Use any information obtained from the Platform to coerce, intimidate, threaten, abuse or harm another person, including other Users or ForSkale employees.</li>
                <li>Upload or transmit (or attempt to upload or transmit) viruses, worms, trojan horses or any other malware that interferes or may interfere with any User's use and enjoyment of the Platform.</li>
                <li>Use or provide the Services in any way that modifies, compromises, interrupts, alters or interferes with the use, features, functions, operation and/or maintenance of the Platform.</li>
                <li>Violate ForSkale's intellectual property rights, including, without limitation, rights to databases, software (source code and object code), interfaces and trademarks (registered or unregistered).</li>
                <li>Act in violation of applicable anti-money laundering regulations and provide all necessary supporting documentation requested by ForSkale.</li>
                <li>Be subject to any type of international sanctions, both as a legal entity and as an individual.</li>
                <li>Use of the ForSkale Platform from prohibited countries or subject to any type of international sanctions by the United Nations, the European Union and/or any of the EU Member States.</li>
              </ul>
            </div>
          </div>

          {/* Section 7: Access and Security */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">7. Access and Security</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                To access and use the Platform, a compatible device, certain software and Internet access are required, which may involve additional costs for the User depending on the chosen tariff plan, as well as occasional updates and upgrades. The User expressly acknowledges and accepts that ForSkale is in no way responsible for: (i) the availability and/or speed of their Internet connection or the costs that the Internet connection may entail; and (ii) the availability, compatibility, performance and renewal of the User's software licenses necessary to use the Platform and the cost of such licenses.
              </p>
              <p>
                Since hardware, software and Internet access are necessary to use the Platform, the ability to use the Platform may be affected by the performance of these elements.
              </p>
              <p>
                ForSkale will do its best to ensure that the Platform functions without interruptions or errors. However, in some cases brief interruptions may occur during the execution of maintenance work, updates or the implementation of security fixes necessary to avoid compromising the security of the Platform. ForSkale must apply certain security fixes, such as patches or fixes to connections to integrations or APIs, among others.
              </p>
              <p>
                Please also note that if you choose to access the Platform through third-party account authentication and verification services, such as Google or Microsoft login services, the respective terms and conditions of such providers may also apply.
              </p>
            </div>
          </div>

          {/* Section 8: Price and Payment */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <CreditCard className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">8. Price and Payment Conditions</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The Price of the Services and use of the Platform, as well as the number of users and the type of plan (monthly, annual or other specified and approved by ForSkale), are indicated in the contract or order signed by the Client.
              </p>
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Available Plans</p>
                <p className="mb-2">ForSkale offers the following types of subscription:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Monthly Plan:</strong> monthly billing with automatic renewal</li>
                  <li><strong>Annual Plan:</strong> annual advance billing with favorable economic conditions compared to the monthly plan</li>
                  <li><strong>Free Trial:</strong> 30-day trial period without commitment</li>
                </ul>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Payment Methods</p>
                <p className="mb-2">ForSkale accepts payments via:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Credit/debit card</li>
                  <li>SEPA bank transfer</li>
                  <li>Other payment systems authorized by ForSkale</li>
                </ul>
                <p className="mt-2 text-sm">Credit card payments are processed through certified third-party payment service providers (e.g. Stripe), which guarantee transaction security according to PCI-DSS standards.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Billing</p>
                <p>Invoices will be issued in electronic format and sent to the Client's email address registered on the Platform. The Client is responsible for keeping their billing email address updated.</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Automatic Renewal</p>
                <p>Unless the Client communicates cancellation within the terms provided, the subscription will automatically renew at expiry for a period equal to that of the initial contract.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Non-Payment</p>
                <p>In case of non-payment, ForSkale reserves the right to suspend access to the Platform until full payment of the amount due. After 30 days of non-payment, ForSkale may terminate the contract and delete the Client's account.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Price Modification</p>
                <p>ForSkale reserves the right to modify the prices of its services with at least 30 days' notice. Changes will apply to the next subscription renewal. If the Client does not accept the new economic conditions, they may withdraw from the contract within the notice period without penalties.</p>
              </div>
            </div>
          </div>

          {/* Section 9: Duration and Withdrawal */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Clock className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">9. Duration and Withdrawal</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Duration</p>
                <p>The contract has a duration equal to the subscription period chosen by the Client (monthly or annual) and automatically renews for subsequent periods of equal duration, unless cancelled by the Client within the terms provided.</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Client Withdrawal</p>
                <p className="mb-2">The Client may withdraw from the contract at any time, with at least 30 days' notice before the expiry date of the current subscription, by sending written communication via email to <a href="mailto:amministrazione@forskale.com" className="text-blue-600 underline">amministrazione@forskale.com</a> or PEC: forskale@pec.it.</p>
                <p className="mb-2">In case of withdrawal:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Monthly Plan:</strong> the service will remain active until the end of the already paid period, without right to proportional refund</li>
                  <li><strong>Annual Plan:</strong> the service will remain active until the end of the already paid year, without right to proportional refund</li>
                </ul>
                <p className="mt-2">The Client may also exercise the right of withdrawal within 14 days from the conclusion of the contract, in accordance with articles 52 and following of the Consumer Code (D.Lgs. 206/2005), where applicable. In such case, they will be entitled to a full refund of what has been paid, subject to return of any services already used.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Suspension and Termination by ForSkale</p>
                <p>ForSkale reserves the right to suspend or terminate the contract with immediate effect, without notice and without right to refund, in the following cases:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Violation of these Terms and Conditions of Use</li>
                  <li>Fraudulent or unlawful use of the Platform</li>
                  <li>Non-payment of due fees for more than 30 days</li>
                  <li>Behaviors that harm ForSkale, other Clients or third parties</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 10: Intellectual Property */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">10. Intellectual Property Rights</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                ForSkale is the full and exclusive owner and/or holder of all intellectual property rights to the Services and the Platform, as well as any updates, improvements, revisions, extensions, modifications, adaptations, corrections, translations or new versions (updates and upgrades) that may be made by ForSkale at its sole discretion and on a voluntary basis.
              </p>
              <p>
                Except for the License to use the Platform, the Client acknowledges and accepts that no ownership right, right of use or license of any kind on the trade names, trademarks, logos, domain names or any other distinctive sign of ForSkale or on ForSkale's intellectual property rights to the Platform and Services is granted or recognized in their favor by these Terms and Conditions of Use.
              </p>
              <p>
                The Client undertakes to respect and maintain the intellectual property rights of the Platform and other services, as well as the documentation and complementary information that ForSkale makes available to them in compliance with the provisions of these Conditions of Use.
              </p>
              <p>
                The Client acknowledges that reproduction, modification, distribution, marketing, decompilation, disassembly, use of reverse engineering techniques or any other means to obtain the source code, transformation or publication of any result of unauthorized benchmark testing of any of the elements and utilities integrated into the Platform are prohibited and constitute a violation of ForSkale's intellectual property rights and, consequently, undertakes not to perform any of the above-mentioned actions.
              </p>
              <div className="border-l-4 border-blue-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Feedback and Suggestions</p>
                <p>ForSkale may solicit or collect and/or the Client may provide suggestions, feedback or written comments in the context of the Client's and other Users' use of the Services and Platform ("Feedback"). The Client acknowledges and accepts that such Feedback will be considered the property of ForSkale and that ForSkale will hold exclusively all known and future intellectual property rights to the Feedback on an aggregated basis indefinitely, and will have the right to use the Feedback for any purpose, commercial or otherwise, without any compensation to the provider of the Feedback.</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Use of Client Name and Logo</p>
                <p>ForSkale also reserves the right to include the Client's standard name and logo in its public client lists, press releases, newsletters, websites, advertising campaigns and the like, unless the Client expressly objects in writing.</p>
              </div>
            </div>
          </div>

          {/* Section 11: Data Protection */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">11. Data Protection and Confidentiality</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The Parties undertake to comply with data protection regulations, in particular Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on general data protection ("GDPR") and Legislative Decree 30 June 2003, No. 196 (Code regarding the protection of personal data), as amended by D.Lgs. 101/2018.
              </p>
              <p>
                In this regard, the Parties inform each other that the personal data entered by the Client for registration on the Platform, including those relating to the legal representatives of the signing parties, will be processed respectively by each of the parties solely for the purpose of carrying out the management, development, fulfillment and control of the contractual relationship, this being the legal basis that legitimizes the processing of personal data.
              </p>
              <p>
                The Parties will process and retain the data for the entire duration of this relationship and, once this relationship has ended, the data will be appropriately blocked solely for the purpose of meeting any legal obligations that may arise from the existing relationship. No communication of the aforementioned personal data is envisaged other than those provided for by current legislation and those necessary for the management, execution, fulfillment and control of the contractual relationship.
              </p>
              <p>
                Similarly, the Parties inform each other of the possibility of exercising, among others, the rights of access, rectification, opposition, erasure, restriction and portability, by contacting the registered office indicated in this Contract. In this regard, if one of the Parties or the subjects involved in the signing of this Contract do not obtain a satisfactory response and wish to file a complaint or obtain further information on any of these rights, they may contact the Italian Data Protection Authority (www.garanteprivacy.it).
              </p>
              <p>
                The correct execution of these conditions implies that ForSkale (Data Processor) processes personal data on behalf of the Client (Data Controller), who is responsible for it under the Data Processing Agreement available on the Platform and signed between the parties.
              </p>
            </div>
          </div>

          {/* Section 12: Liability */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">12. Liability</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                To the extent permitted by applicable law, ForSkale provides the Platform "as is" and "as available" without any promise or warranty, express or implied of any kind, and does not issue any warranty or statement regarding the validity, accuracy, adequacy, reliability or availability of the Platform or its content.
              </p>
              <p>
                ForSkale makes the Platform and/or its Services available to the Client through the Client's Internet services 24 hours a day, 7 days a week, and undertakes to keep the Platform in conditions suitable for its use.
              </p>
              <div className="border-l-4 border-red-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Limitations of Liability</p>
                <p className="mb-2">To the extent permitted by applicable law, ForSkale will not be liable for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Any alteration or loss (direct or indirect) of data and/or information that is not attributable to a direct or sufficiently proven violation by ForSkale in accordance with data protection regulations;</li>
                  <li>Any indirect, incidental, consequential, moral, special, exemplary, punitive damage or loss of profits regardless of the cause, or legal expenses or unnecessary expenses incurred, damage to reputation;</li>
                  <li>Failures that may cause slowness, poor quality, unavailability of the Platform or other services, or even prevent uninterrupted service delivery that are outside ForSkale's control;</li>
                  <li>Indirect losses that were not reasonably foreseeable by ForSkale and the Client at the time the Client began using the Platform and Services;</li>
                  <li>Force majeure events.</li>
                </ul>
                <p className="mt-4">
                  In any case, ForSkale's total liability may not exceed a maximum amount equal to the total amount paid by the Client to ForSkale in the twelve (12) months preceding the harmful event. This amount, pursuant to art. 1382 of the civil code, replaces, with the express consent of the user, any other compensation for damage.
                </p>
                <p className="mt-2">
                  Furthermore, ForSkale will not be liable to the Client for any harmful event unless the Client has notified ForSkale in writing of their request within twenty (20) calendar days from the time they became aware of it. This provision does not prejudice cases where liability cannot be excluded or limited due to mandatory provisions of applicable law.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Indemnification Obligation</p>
                <p className="mb-2">Furthermore, the Client, as well as any user who uses the Platform, accepts to indemnify, defend and hold harmless ForSkale from and against all losses, liabilities, damages, claims (including any legal expenses, reasonable attorney and solicitor fees and court costs), arising from or in connection with:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Any violation or alleged violation of these Terms and Conditions by the Client or its Users;</li>
                  <li>The violation by the Client or its Users of any law and/or the rights of third parties that concern ForSkale;</li>
                  <li>The Client's or its Users' failure to promptly and completely install updates, upgrades or patches for any software provided by ForSkale;</li>
                  <li>Claims relating to the Client's data and/or claims relating to any data transferred by the Client to third-party applications, whether this causes damage to ForSkale or third parties.</li>
                </ul>
                <p className="mt-2">
                  ForSkale may withdraw from the License or any other right granted to the Client or User, without notice and without the Client having the right to request any type of compensation for damages.
                </p>
              </div>
            </div>
          </div>

          {/* Section 13: Links and Third-Party Resources */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <ExternalLink className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">13. Links and Third-Party Resources</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Where the ForSkale website or Platform contains links to other sites and resources provided by third parties, such links are provided for informational purposes only. ForSkale has no control or direction over, nor does it monitor, the content of such sites or resources, and these Terms and Conditions and our Privacy Policy apply exclusively to the use of our Services. When using third-party products or services, the use of such products or services will be governed by their respective terms and conditions and privacy policies. It is recommended to carefully read the respective terms and conditions of use and privacy policies to understand how personal data and other relevant information are collected and processed.
              </p>
              <p>
                ForSkale assumes no type of liability, direct, indirect or subsidiary, for any damages and/or prejudices that may arise from acts of third parties such as access, maintenance, use, quality, legality, reliability and usefulness of content, information, communications, opinions, statements, products and/or services existing or offered on third-party websites.
              </p>
              <p>
                Similarly, if Users have actual knowledge that activities carried out through such third-party websites are illegal or contrary to morality and/or public order, they must immediately notify ForSkale so that the link to access them can be deactivated.
              </p>
              <p>
                ForSkale reserves the right to remove all links and resources to third-party sites from its website and Platform, at its discretion and at any time.
              </p>
            </div>
          </div>

          {/* Section 14: Integrations */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Database className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">14. Integrations, Partners and Third-Party Services</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The ForSkale Platform facilitates the exchange of data with systems and/or services of third parties (hereinafter, "Integrations", "Partners" or "Collaborators"). All these Integrations are provided under the sole responsibility of such third parties or third-party providers over which ForSkale has no authority or control, regardless of whether they are invoiced by the third party or directly by ForSkale. The scope of services provided by these third parties and the instructions necessary to configure the integration may be provided on the Platform and on the third-party provider's website.
              </p>
              <p>
                Third-Party Integrations do not constitute services provided by ForSkale, nor services for which ForSkale has any authority to direct, control or be directly responsible. ForSkale only provides technical access to such services. The scope of service, prices, third-party privacy, duties, obligations and commitments of such third-party providers, timing and any other terms of use for the provision of the Integration, including support, are based on the terms and conditions of use and privacy policies that govern the contractual relationship between the Client and such third-party providers.
              </p>
              <div className="border-l-4 border-blue-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">Main Integrations</p>
                <p className="mb-2">The ForSkale Platform integrates with the following third-party services:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>LinkedIn:</strong> for contact automation and professional messaging</li>
                  <li><strong>WhatsApp:</strong> for instant communications with prospects and customers</li>
                  <li><strong>Telegram:</strong> for instant communications with prospects and customers</li>
                  <li><strong>Google Workspace:</strong> for authentication and email management</li>
                  <li><strong>CRM Systems:</strong> for synchronization of commercial data and sales pipeline</li>
                  <li><strong>Payment processors:</strong> for transaction management (e.g. Stripe)</li>
                </ul>
              </div>
              <p className="mt-4">
                The User must read the terms and conditions of use and privacy policies of third parties, partners or external providers to understand how their personal data and other relevant information are collected and processed.
              </p>
              <p>
                ForSkale has no control or responsibility over third-party integrations and, consequently, assumes no liability or warranty for third-party integrations that Clients choose to use. ForSkale reserves the right to make changes, remove or replace available integrations, particularly in cases where they are modified or discontinued by the third-party provider and/or partner. The existence of integrations does not imply any relationship or association of any kind between ForSkale and the third-party owner of the system that integrates with the platform. ForSkale disclaims any liability arising from integrations, particularly with regard to the accuracy, reliability and security of integrations.
              </p>
            </div>
          </div>

          {/* Section 15: AI Act Compliance */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">15. Regulatory Compliance and AI Act</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                ForSkale is committed to developing and providing its services in full compliance with European regulations on artificial intelligence, including Regulation (EU) 2024/1689 (AI Act).
              </p>
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">AI Ethics and Transparency Principles</p>
                <p className="mb-2">The artificial intelligence systems implemented in the ForSkale Platform are designed according to the following principles:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Transparency:</strong> users are always informed when interacting with AI systems</li>
                  <li><strong>Human oversight:</strong> critical commercial decisions always remain under human control</li>
                  <li><strong>Accuracy and robustness:</strong> models are constantly monitored and updated</li>
                  <li><strong>Privacy by design:</strong> data minimization and integrated protection</li>
                </ul>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">AI System Classification</p>
                <p className="mb-2">The AI systems used by ForSkale fall into the following risk categories according to the AI Act:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>AI Voice Caller:</strong> system with high level of human supervision, used exclusively for B2B commercial activities with the explicit consent of the Client</li>
                  <li><strong>AI Copilot:</strong> decision support system that provides suggestions but does not replace human judgment</li>
                  <li><strong>Predictive analysis:</strong> used for commercial optimization on an aggregated and anonymized basis</li>
                </ul>
              </div>
              <p className="mt-4">
                ForSkale is committed to continuously updating its practices to ensure full compliance with the evolution of AI regulations.
              </p>
            </div>
          </div>

          {/* Section 16: Modifications */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">16. Modifications</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                ForSkale (and its affiliates) reserve the right to periodically update these Terms and Conditions of Use as deemed necessary or to adapt them to regulatory, technical, product/service-related, strategic changes, clarifications and/or to provide better service. Any changes to these Terms and Conditions of Use will be published in the same manner in which they appear here (public website).
              </p>
              <p>
                It is the Client's responsibility to periodically review these Terms and Conditions of Use. Continued access and use of the Platform and/or ForSkale software after a change to these Terms and Conditions of Use will be considered as acceptance of such change.
              </p>
              <p>
                In case of substantial changes that affect economic conditions or fundamental rights of the Client, ForSkale will send a communication via email with at least 30 days' notice. The Client will have the right to withdraw from the contract within such term if they do not accept the new conditions.
              </p>
            </div>
          </div>

          {/* Section 17: Contact */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">17. Contact</h2>
            </div>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>The User may contact ForSkale at the following addresses:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">ForSkale S.r.l.</p>
                <p>Via 47° Reggimento Fanteria 40</p>
                <p>73100 Lecce (LE)</p>
                <p>VAT/CF: 05443490759</p>
                <p>REA: LE-392584</p>
                <p>Share capital: € 1,000.00 i.v.</p>
                <p>Email: <a href="mailto:amministrazione@forskale.com" className="text-blue-600 underline">amministrazione@forskale.com</a></p>
                <p>PEC: forskale@pec.it</p>
                <p>Website: <a href="https://forskale.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://forskale.com</a></p>
              </div>
              <p>
                Communications via certified email (pursuant to Regulation (EU) No. 910/2014 of the European Parliament eIDAS) will be fully formal and legally valid in all respects. The Client acknowledges that the email address provided to ForSkale is correct and valid for receiving formal/legal communications.
              </p>
            </div>
          </div>

          {/* Section 18: Jurisdiction */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Scale className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">18. Jurisdiction and Applicable Law</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                These Terms and Conditions will be governed and interpreted in accordance with the rules of Italian law.
              </p>
              <p>
                For any issue that may arise from the interpretation, fulfillment and execution of these Terms and Conditions, the User and ForSkale submit to the jurisdiction and competence of the Courts of the city of Lecce, expressly waiving any other jurisdiction to which they may be entitled by law, except for different provisions of applicable non-dispositive regulations.
              </p>
              <p>
                In the event that the Client is a consumer within the meaning of the Consumer Code (D.Lgs. 206/2005), the mandatory provisions for the protection of consumers provided for by Italian and European legislation will apply.
              </p>
            </div>
          </div>

          {/* Section 19: Alternative Dispute Resolution */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">19. Alternative Dispute Resolution</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              In accordance with Regulation (EU) No. 524/2013, the European Commission has established an online platform for the alternative resolution of disputes between consumers and professionals (ODR - Online Dispute Resolution), available at the following address: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1">https://ec.europa.eu/consumers/odr <ExternalLink className="h-3 w-3" /></a>
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Consumer Clients may use this platform for the out-of-court resolution of any disputes arising from online contracts.
            </p>
          </div>

          {/* Section 20: Miscellaneous */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">20. Miscellaneous Provisions</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Waiver of Rights</p>
                <p>The failure by ForSkale to exercise any provision of these Terms and Conditions of Use, or the failure by ForSkale to comply with any provision of these Terms and Conditions of Use, will not constitute a present or future waiver of such provisions nor will it in any way prejudice ForSkale's right to enforce them subsequently. The failure to exercise a right by ForSkale will not constitute a waiver of such right. The express waiver by ForSkale of any provision, condition or requirement of these Terms and Conditions will not constitute a waiver of any future obligation to comply with such provision, condition or requirement.</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Anti-Money Laundering</p>
                <p>In accordance with Italian regulations on money laundering prevention (D.Lgs. 231/2007), ForSkale will collect documentation attesting to the identification of the Client, whether a natural or legal person, in the latter case identifying the real owner of the company or legal structure. The Client undertakes to provide the supporting documentation that ForSkale requests for this purpose, guaranteeing the validity, accuracy, completeness and reliability of the information, data and documents made available to ForSkale, even if coming from third parties.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Partial Nullity</p>
                <p>If, by court order, binding decision or provision of any authority or of any other nature, any of the non-essential provisions of these Conditions of Use is declared invalid or ineffective, in whole or in part, such invalidity or ineffectiveness will not extend to the remaining provisions of these Conditions of Use, which will remain in force and continue to be fully effective. ForSkale and the User undertake to replace any clause that becomes invalid or ineffective with another valid and effective clause, seeking to ensure that the effect of the latter is as similar as possible to that of the former.</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Entire Agreement</p>
                <p>These Terms and Conditions of Use, together with the Privacy Policy and any specific agreements entered into between the Parties, constitute the entire agreement between the Client and ForSkale regarding the use of the Platform and replace all previous agreements, understandings, statements and negotiations, written or oral, relating to the subject matter of this contract.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">Assignment</p>
                <p>The Client may not assign, transfer or delegate their rights and obligations arising from these Terms and Conditions without ForSkale's prior written consent. ForSkale may assign or transfer its rights and obligations to subsidiaries, parent companies or companies under common control, subject to communication to the Client.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Contact Footer */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">
            Questions about our Terms?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Contact our team if you need help or have any questions about our Terms and Conditions.
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
          <div className="pt-8">
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 text-white hover:text-blue-100 font-medium"
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

