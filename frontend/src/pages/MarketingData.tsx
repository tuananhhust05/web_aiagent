import {
    BarChart3,
    TrendingUp,
    Users,
    Target,
    Calendar,
    Zap,
    ArrowRight,
    Clock,
    Sparkles
} from 'lucide-react';

export default function MarketingData() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                        <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Marketing Data Analytics</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Advanced analytics and insights for your marketing campaigns
                </p>
            </div>

            {/* Coming Soon Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8 mb-8">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-2 bg-purple-100 rounded-full">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        We're working hard to bring you comprehensive marketing data analytics. 
                        This feature will provide deep insights into your campaign performance, 
                        customer behavior, and ROI metrics.
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Expected Release: Q2 2024
                    </div>
                </div>
            </div>

            {/* Feature Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Campaign Analytics */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Campaign Analytics</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Track campaign performance with detailed metrics, conversion rates, and engagement analytics.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Click-through rates
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Conversion funnels
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            A/B test results
                        </div>
                    </div>
                </div>

                {/* Customer Insights */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Customer Insights</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Understand customer behavior patterns and preferences with advanced segmentation.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Customer journey mapping
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Behavioral analytics
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Lifetime value analysis
                        </div>
                    </div>
                </div>

                {/* ROI Tracking */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">ROI Tracking</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Measure and optimize your marketing spend with comprehensive ROI analytics.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Cost per acquisition
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Revenue attribution
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Channel performance
                        </div>
                    </div>
                </div>

                {/* Predictive Analytics */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Predictive Analytics</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Leverage AI-powered predictions to optimize your marketing strategies.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Churn prediction
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Lead scoring
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Optimal timing
                        </div>
                    </div>
                </div>

                {/* Real-time Dashboards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Zap className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Real-time Dashboards</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Monitor your marketing performance in real-time with interactive dashboards.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Live campaign metrics
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Custom widgets
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Automated alerts
                        </div>
                    </div>
                </div>

                {/* Reporting & Export */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">Reporting & Export</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Generate comprehensive reports and export data for further analysis.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Scheduled reports
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            PDF/Excel export
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Custom templates
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Want to be notified when Marketing Data Analytics is available? 
                    Subscribe to our newsletter for the latest updates and feature announcements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Subscribe
                    </button>
                </div>
            </div>
        </div>
    );
}
