import { useState, useEffect } from 'react'
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Send, 
  Linkedin, 
  ArrowRight, 
  Star,
  CheckCircle,
  ChevronDown,
  Zap,
  Shield,
  BarChart3,
  Workflow
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: <Phone className="h-8 w-8" />,
      title: "Voice Calls",
      description: "Automated voice calls with AI-powered conversations to reach your customers instantly",
    },
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Email Marketing",
      description: "Send personalized email campaigns to engage and convert your audience effectively",
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "WhatsApp & Telegram",
      description: "Connect with customers through popular messaging platforms for instant communication",
    },
    {
      icon: <Linkedin className="h-8 w-8" />,
      title: "LinkedIn Integration",
      description: "Leverage LinkedIn's professional network to expand your reach and generate leads",
    }
  ]

  const benefits = [
    "24/7 Customer Support",
    "Multi-language Support",
    "Custom Voice Branding",
    "Advanced Analytics",
    "Seamless Integration",
    "Enterprise Security"
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Marketing Director, TechFlow",
      content: "For Skale transformed our marketing. We can now reach customers across all channels from one platform. Campaign efficiency increased by 85%.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Growth Manager, InnovateCorp",
      content: "The multi-channel approach is game-changing. Voice calls, emails, WhatsApp—all working together seamlessly.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Head of Marketing, GrowthCo",
      content: "Implementation was smooth and ROI was immediate. Our conversion rates doubled in the first quarter!",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-emerald-50/30" />
        
        {/* Content */}
        <div className={`relative z-10 max-w-6xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-8">
              <Zap className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">All-in-One Marketing Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-semibold mb-6 text-gray-900 tracking-tight leading-tight">
              For Skale
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              The complete marketing solution. Reach your audience through voice calls, email, WhatsApp, Telegram, and LinkedIn—all in one powerful platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-gray-200 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 transition-all duration-200"
              >
                Sign In
              </Link>
              
              <Link
                to="/workflow-builder"
                className="inline-flex items-center px-8 py-4 border-2 border-gray-200 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 transition-all duration-200"
              >
                <Workflow className="mr-2 h-5 w-5" />
                Try Workflow Builder
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-gray-400" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-semibold mb-6 text-gray-900 tracking-tight">
              Multi-Channel Marketing Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Connect with your audience across all major platforms from one unified dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-3xl border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center mb-6 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl md:text-6xl font-semibold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600 font-light">Uptime</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-semibold text-emerald-500 mb-2">50+</div>
              <div className="text-gray-600 font-light">Languages</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-semibold text-blue-600 mb-2">10M+</div>
              <div className="text-gray-600 font-light">Conversations</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-semibold text-emerald-500 mb-2">24/7</div>
              <div className="text-gray-600 font-light">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Channels Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-semibold mb-8 text-gray-900 tracking-tight">
                Reach Customers Everywhere
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed font-light">
                Manage all your marketing channels from one platform. Send voice calls, emails, WhatsApp messages, Telegram campaigns, and LinkedIn outreach seamlessly.
              </p>
              
              <div className="space-y-4 mb-8">
                {['Unified Dashboard', 'Multi-Channel Campaigns', 'Real-time Analytics', 'Automated Workflows'].map((item, i) => (
                  <div key={i} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 font-light">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link
                to="/register"
                className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-3xl border border-gray-100 flex items-center justify-center shadow-xl">
                <div className="grid grid-cols-2 gap-4 p-8 w-full">
                  <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
                    <Phone className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Voice Calls</span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
                    <Mail className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Email</span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
                    <MessageCircle className="h-8 w-8 text-emerald-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
                    <Linkedin className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-semibold mb-8 text-gray-900 tracking-tight">
                Powerful Analytics & Insights
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed font-light">
                Track performance across all channels. Get detailed analytics, conversion rates, and insights to optimize your marketing campaigns.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 font-light">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-3xl border border-gray-100 flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-2xl font-semibold mb-2 text-gray-900">Real-Time Analytics</h3>
                  <p className="text-gray-600 font-light">Track all channels in one dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-semibold mb-6 text-gray-900 tracking-tight">
              Loved by Marketers
            </h2>
            <p className="text-xl text-gray-600 font-light">
              See what our customers say about For Skale
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-8 rounded-3xl border border-gray-100 bg-white hover:shadow-xl transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed font-light">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-500 text-sm font-light">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-semibold mb-6 text-gray-900 tracking-tight">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8 font-light">
            Join thousands of marketers already using For Skale to reach customers across all channels and scale their campaigns.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-200 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center mr-3">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">For Skale</span>
          </div>
          <p className="text-gray-500 mb-6 font-light">
            © 2024 For Skale. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500 font-light">
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
            <Link to="/help" className="hover:text-gray-900 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
