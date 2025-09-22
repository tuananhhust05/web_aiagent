import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProductOpen, setIsProductOpen] = useState(false)
  const [isCompanyOpen, setIsCompanyOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AV</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AgentVoice
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Product Dropdown */}
            <div className="relative group">
              <button
                onClick={() => setIsProductOpen(!isProductOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span>Product</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {isProductOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    to="/products/ai-agent"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    onClick={() => setIsProductOpen(false)}
                  >
                    AI Agent
                  </Link>
                  <Link
                    to="/products/rag-client"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    onClick={() => setIsProductOpen(false)}
                  >
                    RAG Client
                  </Link>
                  <Link
                    to="/products/crm-integration"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    onClick={() => setIsProductOpen(false)}
                  >
                    CRM Integration
                  </Link>
                </div>
              )}
            </div>

            {/* Company Dropdown */}
            <div className="relative group">
              <button
                onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span>Company</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {isCompanyOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    to="/about"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    onClick={() => setIsCompanyOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/privacy"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    onClick={() => setIsCompanyOpen(false)}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/help"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    onClick={() => setIsCompanyOpen(false)}
                  >
                    Help Center
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/pricing"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Product
                </h3>
                <div className="space-y-2 pl-4">
                  <Link
                    to="/products/ai-agent"
                    className="block text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    AI Agent
                  </Link>
                  <Link
                    to="/products/rag-client"
                    className="block text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    RAG Client
                  </Link>
                  <Link
                    to="/products/crm-integration"
                    className="block text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    CRM Integration
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Company
                </h3>
                <div className="space-y-2 pl-4">
                  <Link
                    to="/about"
                    className="block text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/privacy"
                    className="block text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/help"
                    className="block text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Help Center
                  </Link>
                </div>
              </div>

              <Link
                to="/pricing"
                className="block text-gray-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to="/login"
                  className="block text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
