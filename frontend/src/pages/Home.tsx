import { useState, useEffect } from 'react'
import { 
  Mic, 
  Brain, 
  Zap, 
  Shield, 
  Users, 
  Globe, 
  ArrowRight, 
  Play,
  Star,
  CheckCircle,
  ChevronDown,
  Workflow
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Mic className="h-12 w-12" />,
      title: "Voice-First AI",
      description: "Natural conversations with advanced voice recognition and synthesis",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <Brain className="h-12 w-12" />,
      title: "Intelligent Learning",
      description: "Adapts to your business needs and improves over time",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <Zap className="h-12 w-12" />,
      title: "Lightning Fast",
      description: "Real-time responses with minimal latency for seamless interactions",
      color: "from-orange-500 to-red-600"
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
      role: "CEO, TechFlow",
      content: "AgentVoice transformed our customer service. Response time improved by 80%.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO, InnovateCorp",
      content: "The voice AI is incredibly natural. Our customers love the human-like experience.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Head of Operations, GrowthCo",
      content: "Implementation was smooth and ROI was immediate. Highly recommended!",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-16">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className={`relative z-10 text-center max-w-6xl mx-auto px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <Mic className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium">AI-Powered Voice Technology</span>
            </div>
            
            <h1 style={{ lineHeight: 1.4 }} className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              AgentVoice
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The future of customer interaction. Meet your AI voice agent that understands, learns, and delivers exceptional experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="group inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
              >
                Sign In
              </Link>
              
              <Link
                to="/workflow-builder"
                className="inline-flex items-center px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
              >
                <Workflow className="mr-2 h-5 w-5" />
                Try Workflow Builder
              </Link>
              
              <button className="inline-flex items-center px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-md">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/60" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Why Choose AgentVoice?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built with cutting-edge technology to deliver the most natural and intelligent voice AI experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-3xl border border-white/10 backdrop-blur-md transition-all duration-500 ${
                  activeFeature === index ? 'scale-105 bg-white/5' : 'hover:scale-105'
                }`}
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">50+</div>
              <div className="text-gray-400">Languages</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">10M+</div>
              <div className="text-gray-400">Conversations</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">24/7</div>
              <div className="text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Builder Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                Visual Workflow Builder
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Create powerful automation workflows with our intuitive drag-and-drop interface. 
                Build complex business processes without coding - just like n8n, but integrated with AgentVoice.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Drag & Drop Interface</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Pre-built Node Library</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Real-time Execution</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Conditional Logic</span>
                </div>
              </div>
              
              <Link
                to="/workflow-builder"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                <Workflow className="mr-2 h-5 w-5" />
                Try Workflow Builder
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  <Workflow className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-2xl font-bold mb-2">Visual Automation</h3>
                  <p className="text-gray-400">Build workflows with ease</p>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <Brain className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                Enterprise-Grade Features
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Built for businesses that demand excellence. AgentVoice provides the tools you need to deliver exceptional customer experiences at scale.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-2xl font-bold mb-2">Secure & Compliant</h3>
                  <p className="text-gray-400">SOC 2, GDPR, HIPAA compliant</p>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <Users className="h-8 w-8 text-green-400" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <Globe className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Loved by Businesses
            </h2>
            <p className="text-xl text-gray-400">
              See what our customers say about AgentVoice
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-8 rounded-3xl border border-white/10 backdrop-blur-md bg-white/5">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of businesses already using AgentVoice to deliver exceptional customer experiences.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center mb-6">
            <Mic className="h-8 w-8 mr-3 text-blue-400" />
            <span className="text-2xl font-bold">AgentVoice</span>
          </div>
          <p className="text-gray-400 mb-6">
            © 2024 AgentVoice. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
