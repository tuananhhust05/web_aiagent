import React from 'react'
import { X, Edit, Trash2, User, Calendar, DollarSign, Target, Mail, Phone, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Deal {
  id: string
  name: string
  description?: string
  contact_id: string
  campaign_id?: string
  start_date?: string
  end_date?: string
  status: 'new' | 'contacted' | 'negotiation'
  cost: number
  revenue: number
  created_at: string
  updated_at: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  campaign_name?: string
}

interface DealDetailModalProps {
  isOpen: boolean
  onClose: () => void
  deal: Deal | null
  onEdit: () => void
  onDelete: () => void
}

const DealDetailModal: React.FC<DealDetailModalProps> = ({
  isOpen,
  onClose,
  deal,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !deal) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Target className="h-4 w-4 text-blue-500" />
      case 'contacted':
        return <Calendar className="h-4 w-4 text-yellow-500" />
      case 'negotiation':
        return <DollarSign className="h-4 w-4 text-green-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'negotiation':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const profit = deal.revenue - deal.cost

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{deal.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                  {getStatusIcon(deal.status)}
                  {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
              title="Edit Deal"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete Deal"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {deal.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{deal.description}</p>
            </div>
          )}

          {/* Financial Summary */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(deal.revenue)}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Cost</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(deal.cost)}</p>
              </div>

              <div className={`p-4 rounded-lg border ${profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className={`h-5 w-5 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm font-medium ${profit >= 0 ? 'text-green-800' : 'text-red-800'}`}>Profit</span>
                </div>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profit)}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-lg font-semibold text-gray-900">{deal.contact_name || 'Unknown'}</p>
                </div>
                {deal.contact_email && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a 
                        href={`mailto:${deal.contact_email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {deal.contact_email}
                      </a>
                    </div>
                  </div>
                )}
                {deal.contact_phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a 
                        href={`tel:${deal.contact_phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {deal.contact_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link
                  to={`/contacts/${deal.contact_id}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Contact Details
                </Link>
              </div>
            </div>
          </div>

          {/* Campaign Information */}
          {deal.campaign_id && deal.campaign_name && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Campaign Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Campaign Name</p>
                    <p className="text-lg font-semibold text-gray-900">{deal.campaign_name}</p>
                  </div>
                  <Link
                    to={`/campaigns/${deal.campaign_id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Campaign Details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {(deal.start_date || deal.end_date) && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deal.start_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Start Date</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDateOnly(deal.start_date)}</p>
                    </div>
                  )}
                  {deal.end_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">End Date</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDateOnly(deal.end_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Deal Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-sm text-gray-900">{formatDate(deal.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDate(deal.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Deal
          </button>
        </div>
      </div>
    </div>
  )
}

export default DealDetailModal













