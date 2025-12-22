import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            We're working hard to bring you an amazing experience. This feature will be available soon!
          </p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Development Progress</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: '75%' }}
              ></div>
            </div>
          </div>

          {/* Features List */}
          <div className="text-left mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Coming:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Enhanced Campaign Management
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Advanced Analytics
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                AI-Powered Optimization
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                Real-time Performance Tracking
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              Have questions? Contact us at{' '}
              <a href="mailto:support@forskale.com" className="text-blue-600 hover:text-blue-800">
                support@forskale.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 ForSkale. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
