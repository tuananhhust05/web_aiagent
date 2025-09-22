import { useState, useEffect } from 'react'
import { 
  Search, 
  Database, 
  FileText, 
  ArrowRight, 
  Play,
  CheckCircle,
  ChevronDown,
  BookOpen,
  Brain,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'

export default function RAGClient() {
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
      icon: <Search className="h-12 w-12" />,
      title: "Intelligent Search",
      description: "Semantic search across your knowledge base with context-aware results",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <Database className="h-12 w-12" />,
      title: "Knowledge Management",
      description: "Organize and index your documents, FAQs, and knowledge sources",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <Brain className="h-12 w-12" />,
      title: "Context Understanding",
      description: "Advanced RAG technology that understands context and provides accurate answers",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: <BarChart3 className="h-12 w-12" />,
      title: "Analytics & Insights",
      description: "Track search performance and optimize your knowledge base",
      color: "from-purple-500 to-pink-600"
    }
  ]

  const capabilities = [
    "Document Processing",
    "Vector Embeddings",
    "Semantic Search",
    "Context Retrieval",
    "Multi-Format Support",
    "Real-time Indexing",
    "API Integrations",
    "Custom Models"
  ]

  const useCases = [
    {
      title: "Customer Support",
      description: "Instant answers from your knowledge base for customer queries",
      icon: <FileText className="h-8 w-8" />
    },
    {
      title: "Internal Knowledge",
      description: "Quick access to company policies, procedures, and documentation",
      icon: <BookOpen className="h-8 w-8" />
    },
    {
      title: "Research Assistant",
      description: "Intelligent research and information retrieval for your team",
      icon: <Search className="h-8 w-8" />
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-16">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-teal-900 to-black" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className={`relative z-10 text-center max-w-6xl mx-auto px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <Search className="h-4 w-4 mr-2 text-green-400" />
              <span className="text-sm font-medium">RAG Technology</span>
            </div>
            
            <h1 style={{ lineHeight: 1.4 }} className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-green-200 to-teal-200 bg-clip-text text-transparent">
              RAG Client
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your knowledge base into an intelligent search system. Get accurate, context-aware answers from your documents and data.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="group inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Start Building Your RAG System
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
              Advanced RAG Capabilities
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built with state-of-the-art retrieval-augmented generation technology for intelligent information access.
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
      <section className="py-24 px-6 bg-gradient-to-r from-green-900/20 to-teal-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                Powerful RAG Features
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Our RAG client combines the power of large language models with your specific knowledge base for accurate, contextual responses.
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
              <div className="w-full h-96 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-3xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  <Database className="h-16 w-16 mx-auto mb-4 text-green-400" />
                  <h3 className="text-2xl font-bold mb-2">Vector Database</h3>
                  <p className="text-gray-400">Intelligent document indexing</p>
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
              Perfect for Every Knowledge Need
            </h2>
            <p className="text-xl text-gray-400">
              From customer support to internal documentation, RAG makes your knowledge accessible and intelligent.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="p-8 rounded-3xl border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center mb-6 text-green-400">
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
            Ready to Build Your RAG System?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Transform your knowledge base into an intelligent search and answer system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-full hover:from-green-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
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
