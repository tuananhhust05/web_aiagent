import { useState, useEffect } from 'react'
import { 
  Link, 
  Database, 
  ArrowRight, 
  Play,
  CheckCircle,
  ChevronDown,
  Workflow,
  BarChart3
} from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import Header from '../../components/Header'

export default function CRMIntegration() {
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
    // {
    //   icon: <Sync className="h-12 w-12" />,
    //   title: "Real-time Sync",
    //   description: "Bidirectional data synchronization with your CRM system in real-time",
    //   color: "from-blue-500 to-purple-600"
    // },
    {
      icon: <Workflow className="h-12 w-12" />,
      title: "Automated Workflows",
      description: "Create intelligent workflows that trigger actions across your CRM and AI systems",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <Database className="h-12 w-12" />,
      title: "Data Management",
      description: "Seamlessly import, export, and manage customer data across platforms",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: <BarChart3 className="h-12 w-12" />,
      title: "Unified Analytics",
      description: "Get comprehensive insights from your CRM and AI interactions in one dashboard",
      color: "from-purple-500 to-pink-600"
    }
  ]

  const capabilities = [
    "HubSpot Integration",
    "Salesforce Sync",
    "Pipedrive Connection",
    "Custom API Endpoints",
    "Data Mapping",
    "Field Synchronization",
    "Bulk Operations",
    "Real-time Updates"
  ]

  const integrations = [
    {
      name: "HubSpot",
      description: "Full integration with contacts, deals, and activities",
      logo: "H",
      color: "from-orange-500 to-red-500"
    },
    {
      name: "Salesforce",
      description: "Sync leads, opportunities, and customer data",
      logo: "S",
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "Pipedrive",
      description: "Connect your sales pipeline and activities",
      logo: "P",
      color: "from-green-500 to-emerald-500"
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-16">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-red-900 to-black" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className={`relative z-10 text-center max-w-6xl mx-auto px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <Link className="h-4 w-4 mr-2 text-orange-400" />
              <span className="text-sm font-medium">CRM Integration</span>
            </div>
            
            <h1 style={{ lineHeight: 1.4 }} className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-orange-200 to-red-200 bg-clip-text text-transparent">
              CRM Integration
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Seamlessly connect your AI voice agent with your CRM system. Sync data, automate workflows, and get unified insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <RouterLink
                to="/register"
                className="group inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Connect Your CRM
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </RouterLink>
              
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
              Powerful Integration Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Connect your CRM with AI voice technology for seamless customer relationship management.
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
      <section className="py-24 px-6 bg-gradient-to-r from-orange-900/20 to-red-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                Comprehensive CRM Support
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Our integration platform supports all major CRM systems with advanced data synchronization and workflow automation.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-orange-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  <Workflow className="h-16 w-16 mx-auto mb-4 text-orange-400" />
                  <h3 className="text-2xl font-bold mb-2">Workflow Engine</h3>
                  <p className="text-gray-400">Automated CRM processes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Supported CRM Platforms
            </h2>
            <p className="text-xl text-gray-400">
              Connect with the CRM systems your team already uses and loves.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {integrations.map((integration, index) => (
              <div key={index} className="p-8 rounded-3xl border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center mb-6 text-white text-2xl font-bold`}>
                  {integration.logo}
                </div>
                <h3 className="text-2xl font-bold mb-4">{integration.name}</h3>
                <p className="text-gray-400 leading-relaxed">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to Connect Your CRM?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Start syncing your customer data and automate your workflows today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <RouterLink
              to="/register"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
            >
              Start Integration Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
            
            <RouterLink
              to="/login"
              className="inline-flex items-center px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
            >
              Sign In
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  )
}
