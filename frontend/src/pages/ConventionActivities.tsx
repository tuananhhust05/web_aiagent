import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Users, 
  UserCheck, 
  UserX, 
  Target, 
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Send,
  ExternalLink,
  Eye,
  ChevronDown,
  ChevronUp,
  Workflow,
  Plus,
  X,
  Play,
  Pause,
  Trash2
} from 'lucide-react';
import { conventionActivitiesAPI, groupsAPI, campaignsAPI, campaignGoalsAPI } from '../lib/api';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  telegram_username?: string;
  linkedin_profile?: string;
  status: 'active' | 'inactive' | 'lead' | 'customer' | 'prospect';
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    type: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface ConventionActivityResponse {
  contacts: Contact[];
  total_contacts: number;
  total_customers: number;
  total_leads: number;
  total_in_campaigns: number;
  total_not_in_campaigns: number;
  total_convention_campaigns: number;
  total_campaign_goals: number;
}

// interface Stats {
//   total_contacts: number;
//   total_customers: number;
//   total_leads: number;
//   total_in_campaigns: number;
//   total_not_in_campaigns: number;
//   total_convention_campaigns: number;
//   total_campaign_goals: number;
// } // Temporarily unused

interface CampaignGoal {
  id: string;
  name: string;
  description?: string;
  color_gradient: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  type: string;
  created_at: string;
  description?: string;
  source?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  color?: string;
}

const ConventionActivities: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isCustomer: null as boolean | null,
    hasCampaigns: null as boolean | null,
  });
  const [stats, setStats] = useState({
    total_contacts: 0,
    total_customers: 0,
    total_leads: 0,
    total_in_campaigns: 0,
    total_not_in_campaigns: 0,
    total_convention_campaigns: 0,
    total_campaign_goals: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  
  // Campaign Goals state
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [campaignGoals, setCampaignGoals] = useState<CampaignGoal[]>([]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      // Fetch contacts and stats in parallel
      const [contactsResponse, statsResponse] = await Promise.all([
        conventionActivitiesAPI.getActivities({
          search: searchTerm || undefined,
          is_customer: filters.isCustomer || undefined,
          has_campaigns: filters.hasCampaigns || undefined,
          limit: 50,
          offset: 0
        }),
        conventionActivitiesAPI.getStats()
      ]);
      
      const contactsData: ConventionActivityResponse = contactsResponse.data;
      const statsData = statsResponse.data;
      
      setContacts(contactsData.contacts);
      setStats({
        total_contacts: statsData.total_contacts,
        total_customers: statsData.total_customers,
        total_leads: statsData.total_leads,
        total_in_campaigns: statsData.total_in_campaigns,
        total_not_in_campaigns: statsData.total_not_in_campaigns,
        total_convention_campaigns: statsData.total_convention_campaigns || 0,
        total_campaign_goals: statsData.total_campaign_goals || 0,
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchGroups();
    fetchAllContacts();
    fetchCampaignGoals(); // Fetch campaign goals on component mount
  }, [searchTerm, filters]);

  // Separate useEffect to ensure allContacts is loaded when needed
  useEffect(() => {
    if (showContactSelector && allContacts.length === 0) {
      console.log('Contact selector opened but no contacts loaded, fetching...');
      fetchAllContacts();
    }
  }, [showContactSelector]);

  useEffect(() => {
    if (showCampaignModal) {
      fetchConventionCampaigns();
    }
  }, [showCampaignModal]);


  const updateContactStatus = async (contactId: string, newStatus: 'customer' | 'lead') => {
    try {
      setUpdatingStatus(contactId);
      await conventionActivitiesAPI.updateContactStatus({
        contact_id: contactId,
        status: newStatus
      });
      
      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, status: newStatus }
          : contact
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total_customers: newStatus === 'customer' ? prev.total_customers + 1 : prev.total_customers - 1,
        total_leads: newStatus === 'lead' ? prev.total_leads + 1 : prev.total_leads - 1,
      }));
    } catch (error) {
      console.error('Error updating contact status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const fetchConventionCampaigns = async () => {
    try {
      // Use regular campaigns API with source filter
      const response = await campaignsAPI.getCampaigns();
      const allCampaigns = response.data || [];
      const conventionCampaigns = allCampaigns.filter((campaign: any) => campaign.source === 'convention-activities');
      setCampaigns(conventionCampaigns);
    } catch (error) {
      console.error('Error fetching convention campaigns:', error);
    }
  };

  const createCampaign = (campaignData: any) => {
    const newCampaign = {
      name: campaignData.name || '',
      description: campaignData.description || '',
      status: 'draft',
      type: campaignData.type || 'manual',
      source: 'convention-activities', // Add source field
      campaign_goal_id: campaignData.campaign_goal_id || null, // Add campaign goal ID field
      contacts: selectedContacts.filter(id => id !== null && id !== undefined), // Filter out null/undefined contacts
      group_ids: campaignData.group_ids || [], // Selected groups
      call_script: campaignData.call_script || '',
      schedule_time: campaignData.type === 'scheduled' && campaignData.schedule_time ? campaignData.schedule_time : null,
      schedule_settings: campaignData.type === 'scheduled' ? campaignData.schedule_settings : null,
      settings: {}
    }
    
    console.log('Creating campaign with data:', newCampaign); // Debug log
    
    // Use the same API call as main campaigns page
    campaignsAPI.createCampaign(newCampaign)
      .then(() => {
        setShowCreateCampaign(false)
        setSelectedContacts([])
        alert('Campaign created successfully!')
        fetchConventionCampaigns()
        fetchContacts() // Refresh to update stats
      })
      .catch((error) => {
        console.error('Campaign creation error:', error);
        alert('Failed to create campaign')
      })
  };

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.getGroups();
      setGroups(response.data?.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchAllContacts = async () => {
    try {
      console.log('Starting to fetch contacts...');
      // Use convention activities API to get contacts with consistent structure
      const response = await conventionActivitiesAPI.getActivities({
        limit: 1000, // Get more contacts for selection
        offset: 0
      });
      console.log('Convention activities API response:', response);
      let contacts = response.data?.contacts || [];
      
      console.log('Fetched contacts for campaign creation:', contacts);
      console.log('Number of contacts:', contacts.length);
      if (contacts.length > 0) {
        console.log('First contact structure:', contacts[0]);
        console.log('First contact ID:', contacts[0].id);
        console.log('First contact ID type:', typeof contacts[0].id);
      }
      setAllContacts(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      // Fallback to current contacts state
      console.log('Using fallback contacts from current state');
      setAllContacts(contacts);
    }
  };

  const handleContactToggle = (contactId: string) => {
    console.log('=== handleContactToggle called ===');
    console.log('contactId received:', contactId);
    console.log('contactId type:', typeof contactId);
    console.log('contactId is null/undefined:', contactId === null || contactId === undefined);
    
    if (!contactId) {
      console.log('Contact ID is null/undefined, skipping toggle');
      return; // Skip if contactId is null/undefined
    }
    
    console.log('Current selectedContacts before toggle:', selectedContacts);
    console.log('Toggling contact:', contactId);
    
    setSelectedContacts(prev => {
      console.log('Previous selectedContacts:', prev);
      const isSelected = prev.includes(contactId);
      console.log('Is contact already selected:', isSelected);
      
      const newSelection = isSelected 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      
      console.log('New selected contacts:', newSelection);
      return newSelection;
    });
  };

  const handleCampaignAction = (campaignId: string, action: string, campaignType?: string) => {
    if (action === 'active') {
      campaignsAPI.startCampaign(campaignId)
        .then((response) => {
          if (campaignType === 'manual') {
            // For manual campaigns, show different message and don't refresh
            alert(response.data.message || 'Manual campaign executed successfully')
            // Don't refetch campaigns to keep the same status
          } else {
            // For scheduled campaigns, show success and refresh
            alert('Scheduled campaign started successfully')
            fetchConventionCampaigns()
          }
        })
        .catch(() => alert('Failed to start campaign'))
    } else if (action === 'paused') {
      campaignsAPI.pauseCampaign(campaignId)
        .then(() => {
          alert('Campaign paused successfully')
          fetchConventionCampaigns()
        })
        .catch(() => alert('Failed to pause campaign'))
    }
  };

  const handleDeleteCampaign = (campaignId: string, campaignName: string) => {
    if (window.confirm(`Are you sure you want to delete campaign "${campaignName}"? This action cannot be undone.`)) {
      campaignsAPI.deleteCampaign(campaignId)
        .then(() => {
          alert('Campaign deleted successfully')
          fetchConventionCampaigns()
          fetchContacts() // Refresh stats
        })
        .catch(() => alert('Failed to delete campaign'))
    }
  };

  // Campaign Goals functions
  const fetchCampaignGoals = async () => {
    try {
      const response = await campaignGoalsAPI.getGoals('convention-activities');
      setCampaignGoals(response.data || []);
    } catch (error) {
      console.error('Error fetching campaign goals:', error);
    }
  };

  const createCampaignGoal = (goalData: { name: string; description?: string }) => {
    const goalDataWithSource = {
      ...goalData,
      source: 'convention-activities'
    };
    
    campaignGoalsAPI.createGoal(goalDataWithSource)
      .then(() => {
        fetchCampaignGoals();
        fetchContacts(); // Refresh stats
        setShowCreateGoalModal(false);
      })
      .catch((error) => {
        console.error('Campaign goal creation error:', error);
        alert('Failed to create campaign goal');
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'customer': return 'bg-green-100 text-green-800';
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'customer': return 'Customer';
      case 'lead': return 'Lead';
      case 'prospect': return 'Prospect';
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      default: return status;
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Convention Activities</h1>
            <p className="text-gray-600">Manage and track customer activities</p>
          </div>
          <Link
            to="/workflow-builder"
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Workflow className="h-5 w-5 mr-2" />
            Workflow Builder
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-6 mb-8">
        {/* First Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_contacts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_customers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserX className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_leads}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_in_campaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Not in Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_not_in_campaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCampaignModal(true)}>
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Convention Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_convention_campaigns}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Campaign Goals Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Campaign Goals</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {campaignGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => navigate(`/campaign-goals/${goal.id}`)}
              className="relative rounded-lg p-4 text-white font-medium text-center cursor-pointer hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-center"
              style={{ background: goal.color_gradient }}
            >
              <div className="text-lg font-semibold mb-2">{goal.name}</div>
              {!goal.is_active && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Inactive
                </div>
              )}
            </div>
          ))}
          
          {/* Add New Goal Button */}
          <div
            onClick={() => setShowCreateGoalModal(true)}
            className="relative rounded-lg p-4 text-white font-medium text-center cursor-pointer hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-center items-center"
            style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)' }}
          >
            <Plus className="h-8 w-8 mb-2" />
            <div className="text-sm font-semibold">Add New Goal</div>
          </div>
        </div>
        
        {campaignGoals.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No campaign goals found</p>
            <p className="text-sm text-gray-500 mt-2">Create your first campaign goal to get started</p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name, email, phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Status
                </label>
                <select
                  value={filters.isCustomer === null ? '' : filters.isCustomer.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    isCustomer: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Is Customer</option>
                  <option value="false">Not Customer</option>
                </select>
              </div>

              {/* Campaign Participation Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Participation
                </label>
                <select
                  value={filters.hasCampaigns === null ? '' : filters.hasCampaigns.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    hasCampaigns: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Has Campaigns</option>
                  <option value="false">No Campaigns</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaigns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    {/* Contact Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {contact.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.whatsapp_number && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp: {contact.whatsapp_number}
                          </div>
                        )}
                        {contact.telegram_username && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Send className="h-4 w-4 mr-2" />
                            Telegram: @{contact.telegram_username}
                          </div>
                        )}
                        {contact.linkedin_profile && (
                          <div className="flex items-center text-sm text-gray-600">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            <a 
                              href={contact.linkedin_profile} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 truncate max-w-48"
                            >
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contact.status)}`}>
                          {getStatusText(contact.status)}
                        </span>
                        {contact.status !== 'customer' && (
                          <button
                            onClick={() => updateContactStatus(contact.id, 'customer')}
                            disabled={updatingStatus === contact.id}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {updatingStatus === contact.id ? 'Updating...' : 'Make Customer'}
                          </button>
                        )}
                        {contact.status === 'customer' && (
                          <button
                            onClick={() => updateContactStatus(contact.id, 'lead')}
                            disabled={updatingStatus === contact.id}
                            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {updatingStatus === contact.id ? 'Updating...' : 'Make Lead'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Campaigns */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {contact.campaigns.length > 0 ? (
                          contact.campaigns.map((campaign) => (
                            <div key={campaign.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.status)}`}>
                                  {campaign.status}
                                </span>
                                <span className="text-sm text-gray-900 truncate max-w-32">
                                  {campaign.name}
                                </span>
                              </div>
                              <Link
                                to={`/campaigns/${campaign.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No campaigns</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && contacts.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No contacts found</p>
          </div>
        )}
      </div>

      {/* Campaign List Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Convention Campaigns</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCreateCampaign(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </button>
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all w-[80%] mx-auto"
                  >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignAction(campaign.id, 'active', campaign.type);
                          }}
                          className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </button>
                      )}
                      {campaign.status === 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignAction(campaign.id, 'paused');
                          }}
                          className="inline-flex items-center px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </button>
                      )}
                      {campaign.status === 'paused' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignAction(campaign.id, 'active', campaign.type);
                          }}
                          className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCampaign(campaign.id, campaign.name);
                        }}
                        className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{campaign.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Link>
                    {campaign.source && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Source: {campaign.source}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>
            
            {campaigns.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No convention campaigns found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <CreateConventionCampaignModal
          onClose={() => setShowCreateCampaign(false)}
          onSubmit={createCampaign}
          onSelectContacts={() => setShowContactSelector(true)}
          selectedContactsCount={selectedContacts.length}
          groups={groups}
          allContacts={allContacts}
          selectedContacts={selectedContacts}
          campaignGoals={campaignGoals}
        />
      )}

      {/* Contact Selector Modal */}
      {showContactSelector && (
        <ContactSelectorModal
          contacts={allContacts}
          selectedContacts={selectedContacts}
          onToggle={handleContactToggle}
          onClose={() => {
            setShowContactSelector(false);
            setContactSearchTerm(''); // Reset search term when closing
          }}
          onConfirm={() => setShowContactSelector(false)}
          searchTerm={contactSearchTerm}
          onSearchChange={setContactSearchTerm}
          loading={loading}
        />
      )}

      {/* Create Campaign Goal Modal */}
      {showCreateGoalModal && (
        <CreateCampaignGoalModal
          onClose={() => setShowCreateGoalModal(false)}
          onSubmit={createCampaignGoal}
        />
      )}
    </div>
  );
};

// Create Convention Campaign Modal Component
function CreateConventionCampaignModal({ onClose, onSubmit, onSelectContacts, selectedContactsCount, groups, allContacts, selectedContacts, campaignGoals }: {
  onClose: () => void
  onSubmit: (data: any) => void
  onSelectContacts: () => void
  selectedContactsCount: number
  groups: Group[]
  allContacts: any[]
  selectedContacts: string[]
  campaignGoals: CampaignGoal[]
}) {
  console.log('CreateConventionCampaignModal - allContacts:', allContacts);
  console.log('CreateConventionCampaignModal - allContacts length:', allContacts?.length);
  console.log('CreateConventionCampaignModal - selectedContacts:', selectedContacts);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'manual' as 'manual' | 'scheduled',
    call_script: '',
    schedule_time: '',
    group_ids: [] as string[],
    campaign_goal_id: '' as string,
    schedule_settings: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
      start_time: '',
      end_time: '',
      timezone: 'UTC',
      days_of_week: [] as number[],
      day_of_month: 1,
      month_of_year: 1
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Campaign name is required')
      return
    }
    if (!formData.call_script.trim()) {
      alert('Call script is required')
      return
    }
    if (formData.group_ids.length === 0 && selectedContactsCount === 0) {
      alert('Please select at least one group or contact')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Convention Campaign</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe your campaign"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value="manual"
                  checked={formData.type === 'manual'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'manual' | 'scheduled' }))}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Manual</div>
                  <div className="text-sm text-gray-500">Start calls manually when you're ready</div>
                </div>
              </label>
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value="scheduled"
                  checked={formData.type === 'scheduled'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'manual' | 'scheduled' }))}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Scheduled</div>
                  <div className="text-sm text-gray-500">Automatically start calls at scheduled time with frequency</div>
                </div>
              </label>
            </div>
          </div>

          {formData.type === 'scheduled' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">📅 Schedule Settings</h3>
                <p className="text-sm text-blue-600">
                  Configure when and how often the campaign should run automatically.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.schedule_settings.frequency}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_settings: { ...prev.schedule_settings, frequency: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Time (When to start calling)
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule_settings.start_time}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_settings: { ...prev.schedule_settings, start_time: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set the specific time when AI calls should start. Campaign will run automatically at this time.
                </p>
              </div>

              {formData.schedule_settings.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <label key={day} className="flex items-center justify-center p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.schedule_settings.days_of_week.includes(index)}
                          onChange={(e) => {
                            const days = formData.schedule_settings.days_of_week
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                schedule_settings: {
                                  ...prev.schedule_settings,
                                  days_of_week: [...days, index]
                                }
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                schedule_settings: {
                                  ...prev.schedule_settings,
                                  days_of_week: days.filter(d => d !== index)
                                }
                              }))
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.schedule_settings.frequency === 'monthly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={formData.schedule_settings.month_of_year}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        schedule_settings: { ...prev.schedule_settings, month_of_year: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                        <option key={month} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.schedule_settings.day_of_month}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        schedule_settings: { ...prev.schedule_settings, day_of_month: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule_settings.end_time}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_settings: { ...prev.schedule_settings, end_time: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Set when the campaign should stop running automatically.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.schedule_settings.timezone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_settings: { ...prev.schedule_settings, timezone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (Vietnam)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Rome">Europe/Rome (Italy)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the timezone for your call schedule.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Groups (Optional)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {groups.length === 0 ? (
                <p className="text-gray-500 text-sm">No groups available. Create groups first.</p>
              ) : (
                groups.map((group) => (
                  <label key={group.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.group_ids.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, group_ids: [...prev.group_ids, group.id] }))
                        } else {
                          setFormData(prev => ({ ...prev, group_ids: prev.group_ids.filter(id => id !== group.id) }))
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: group.color || '#3B82F6' }}
                      />
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-gray-500">{group.member_count} members</div>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call Script
            </label>
            <textarea
              value={formData.call_script}
              onChange={(e) => setFormData(prev => ({ ...prev, call_script: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter the script that AI will use when making calls..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              This script will guide the AI during phone calls. Be specific about your goals and key talking points.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Goal (Optional)
            </label>
            <select
              value={formData.campaign_goal_id}
              onChange={(e) => setFormData(prev => ({ ...prev, campaign_goal_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a campaign goal (optional)</option>
              {campaignGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Choose a campaign goal to associate with this campaign.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Contacts
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  console.log('Opening contact selector...');
                  console.log('Current allContacts:', allContacts);
                  console.log('Current selectedContacts:', selectedContacts);
                  onSelectContacts();
                }}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-gray-600">
                  {selectedContactsCount > 0 || formData.group_ids.length > 0
                    ? `${selectedContactsCount} contacts + ${formData.group_ids.length} groups selected`
                    : 'Click to select contacts'
                  }
                </div>
              </button>
              
              {/* Debug info */}
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                Debug: {allContacts?.length || 0} contacts loaded, {selectedContacts.length} selected
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Contact Selector Modal Component
function ContactSelectorModal({ 
  contacts, 
  selectedContacts, 
  onToggle, 
  onClose, 
  onConfirm,
  searchTerm,
  onSearchChange,
  loading 
}: {
  contacts: Contact[]
  selectedContacts: string[]
  onToggle: (id: string) => void
  onClose: () => void
  onConfirm: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  loading: boolean
}) {
  console.log('ContactSelectorModal - contacts:', contacts);
  console.log('ContactSelectorModal - searchTerm:', searchTerm);
  console.log('ContactSelectorModal - selectedContacts:', selectedContacts);
  
  const filteredContacts = contacts.filter(contact => 
    contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  console.log('ContactSelectorModal - filteredContacts:', filteredContacts);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Select Contacts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No contacts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={!!(contact.id && selectedContacts.includes(contact.id))}
                    onChange={() => {
                      console.log('=== Checkbox clicked ===');
                      console.log('Contact object:', contact);
                      console.log('Contact ID:', contact.id);
                      console.log('Contact ID type:', typeof contact.id);
                      console.log('Contact first_name:', contact.first_name);
                      console.log('Contact last_name:', contact.last_name);
                      
                      if (contact.id) {
                        console.log('Calling onToggle with contact.id:', contact.id);
                        onToggle(contact.id);
                      } else {
                        console.log('Contact ID is missing or falsy:', contact);
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contact.email} • {contact.phone}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm Selection ({selectedContacts.length} selected)
          </button>
        </div>
      </div>
    </div>
  )
}

// Create Campaign Goal Modal Component
function CreateCampaignGoalModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a goal name');
      return;
    }
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Campaign Goal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Book a Meeting, Lead Nurturing"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe what this goal aims to achieve..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConventionActivities;
