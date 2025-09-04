import { useState } from 'react'
import Header from '../components/Header'
import { Search, BookOpen, MessageCircle, Video, FileText, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <BookOpen className="h-6 w-6" />,
      articles: [
        { title: 'Quick Start Guide', url: '#', popular: true },
        { title: 'Setting Up Your First Voice Agent', url: '#' },
        { title: 'Understanding Voice AI Basics', url: '#' },
        { title: 'Account Setup and Configuration', url: '#' }
      ]
    },
    {
      id: 'voice-agents',
      title: 'Voice Agents',
      icon: <MessageCircle className="h-6 w-6" />,
      articles: [
        { title: 'Creating Custom Voice Agents', url: '#', popular: true },
        { title: 'Training Your AI Agent', url: '#' },
        { title: 'Voice Customization Options', url: '#' },
        { title: 'Agent Performance Optimization', url: '#' }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: <ExternalLink className="h-6 w-6" />,
      articles: [
        { title: 'CRM Integration Guide', url: '#', popular: true },
        { title: 'API Documentation', url: '#' },
        { title: 'Webhook Setup', url: '#' },
        { title: 'Third-party Tools', url: '#' }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <FileText className="h-6 w-6" />,
      articles: [
        { title: 'Common Issues and Solutions', url: '#', popular: true },
        { title: 'Voice Quality Problems', url: '#' },
        { title: 'Connection Issues', url: '#' },
        { title: 'Performance Optimization', url: '#' }
      ]
    }
  ]

  const popularArticles = [
    { title: 'How to Set Up Your First Voice Agent', category: 'Getting Started', readTime: '5 min read' },
    { title: 'Best Practices for Voice AI Training', category: 'Voice Agents', readTime: '8 min read' },
    { title: 'Integrating with Salesforce CRM', category: 'Integrations', readTime: '6 min read' },
    { title: 'Troubleshooting Voice Recognition Issues', category: 'Troubleshooting', readTime: '4 min read' }
  ]

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const filteredCategories = categories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            How Can We Help?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Find answers to your questions, learn best practices, and get the most out of AgentVoice.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, guides, and tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white">
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Documentation</h3>
              <p className="text-blue-100 mb-4">Comprehensive guides and API references</p>
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Browse Docs
              </button>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl text-white">
              <Video className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Video Tutorials</h3>
              <p className="text-green-100 mb-4">Step-by-step video guides</p>
              <button className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Watch Videos
              </button>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl text-white">
              <MessageCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Live Support</h3>
              <p className="text-orange-100 mb-4">Get help from our support team</p>
              <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Popular Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {popularArticles.map((article, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-blue-600 font-medium">{article.category}</span>
                  <span className="text-sm text-gray-500">{article.readTime}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                  {article.title}
                </h3>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Read Article →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Browse by Category
          </h2>
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full p-6 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                      <div className="text-white">
                        {category.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                  </div>
                  {expandedCategories[category.id] ? (
                    <ChevronDown className="h-6 w-6 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-6 w-6 text-gray-500" />
                  )}
                </button>
                
                {expandedCategories[category.id] && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {category.articles.map((article, articleIndex) => (
                        <div key={articleIndex} className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center">
                            {article.popular && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                            )}
                            <span className="text-gray-900">{article.title}</span>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Read →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Still Need Help?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Our support team is here to help you succeed with AgentVoice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@agentvoice.com"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Email Support
            </a>
            <a
              href="/contact"
              className="inline-flex items-center px-8 py-4 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Contact Sales
            </a>
          </div>
          
          <div className="mt-12 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">&lt;2h</div>
              <div className="text-blue-100">Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">99%</div>
              <div className="text-blue-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
