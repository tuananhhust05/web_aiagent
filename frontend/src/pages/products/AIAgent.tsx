import { useState, useEffect } from 'react'
import { 
  Brain, 
  Zap, 
  Users, 
  ArrowRight, 
  Play,
  CheckCircle,
  ChevronDown,
  Bot,
  MessageSquare,
  Settings,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'

export default function AIAgent() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Bot className="h-12 w-12" />,
      title: "Intelligent Conversations",
      description: "Natural language processing with context awareness and emotional intelligence",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <MessageSquare className="h-12 w-12" />,
      title: "Multi-Channel Support",
      description: "Voice, text, and video interactions across all your customer touchpoints",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <Settings className="h-12 w-12" />,
      title: "Customizable Personality",
      description: "Train your AI agent to match your brand voice and business requirements",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: <BarChart3 className="h-12 w-12" />,
      title: "Real-time Analytics",
      description: "Monitor performance, sentiment, and customer satisfaction in real-time",
      color: "from-purple-500 to-pink-600"
    }
  ]

  const capabilities = [
    "Natural Language Understanding",
    "Context-Aware Responses",
    "Multi-Language Support",
    "Emotion Recognition",
    "Intent Classification",
    "Conversation Memory",
    "API Integrations",
    "Custom Workflows"
  ]

  const useCases = [
    {
      title: "Customer Support",
      description: "24/7 automated support with human-like interactions",
      icon: <Users className="h-8 w-8" />
    },
    {
      title: "Sales Assistant",
      description: "Qualify leads and guide customers through the sales process",
      icon: <Zap className="h-8 w-8" />
    },
    {
      title: "Appointment Booking",
      description: "Schedule meetings and manage calendars automatically",
      icon: <MessageSquare className="h-8 w-8" />
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
              <Bot className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium">AI Agent Technology</span>
            </div>
            
            <h1 style={{ lineHeight: 1.4 }} className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              AI Agent
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Your intelligent virtual assistant that understands, learns, and delivers exceptional customer experiences with human-like interactions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="group inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Start Building Your AI Agent
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
              Powerful AI Capabilities
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built with cutting-edge AI technology to deliver the most natural and intelligent conversations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* Capabilities Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                Advanced AI Capabilities
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Our AI agent is equipped with state-of-the-art natural language processing and machine learning capabilities to deliver human-like interactions.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-2xl font-bold mb-2">Neural Network</h3>
                  <p className="text-gray-400">Advanced AI processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Perfect for Every Use Case
            </h2>
            <p className="text-xl text-gray-400">
              From customer support to sales automation, our AI agent adapts to your business needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="p-8 rounded-3xl border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 text-blue-400">
                  {useCase.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{useCase.title}</h3>
                <p className="text-gray-400 leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to Build Your AI Agent?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Start creating intelligent conversations that drive results for your business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Start Building Now
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
    </div>
  )
}
