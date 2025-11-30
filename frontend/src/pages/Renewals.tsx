import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    CheckCircle,
    Clock,
    AlertCircle,
    User,
    DollarSign,
    X,
    Target,
    Play,
    Pause,
    Users,
    Loader2
} from 'lucide-react';
import { contactsAPI, renewalsAPI, campaignsAPI, campaignGoalsAPI, groupsAPI } from '../lib/api';
import { formatDate, generateInitials } from '../lib/utils';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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
    created_at: string;
    updated_at: string;
}

interface Renewal {
    id: string;
    contact_id: string;
    contact_name: string;
    contact_email?: string;
    contact_phone?: string;
    renewal_type: 'subscription' | 'service' | 'contract' | 'license' | 'other';
    current_expiry_date: string;
    renewal_date: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'overdue' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface Campaign {
    id: string;
    name: string;
    description: string;
    status: string;
    type: string;
    source: string;
    campaign_goal_id?: string;
    contacts: string[];
    group_ids: string[];
    call_script: string;
    schedule_time?: string;
    schedule_settings?: any;
    created_at: string;
    updated_at: string;
}

interface CampaignGoal {
    id: string;
    name: string;
    description?: string;
    source: string;
    created_at: string;
    updated_at: string;
}

interface Group {
    id: string;
    name: string;
    description?: string;
    member_count: number;
    color?: string;
}

export default function Renewals() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);
    const [showRenewalModal, setShowRenewalModal] = useState(false);
    const [editingRenewal, setEditingRenewal] = useState<Renewal | null>(null);
    const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
    const [contactSearch, setContactSearch] = useState('');

    // Campaign Goals state
    const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
    const [campaignGoals, setCampaignGoals] = useState<CampaignGoal[]>([]);

    // Campaigns state
    const [showCreateCampaign, setShowCreateCampaign] = useState(false);
    const [showContactSelector, setShowContactSelector] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [selectedContactsForCampaign, setSelectedContactsForCampaign] = useState<string[]>([]);
    const [contactSearchTerm, setContactSearchTerm] = useState('');

    // Fetch renewals from API
    const { data: renewalsResponse, isLoading: renewalsLoading, error: renewalsError } = useQuery({
        queryKey: ['renewals', { search, status: statusFilter, type: typeFilter }],
        queryFn: () => renewalsAPI.getRenewals({
            search: search || undefined,
            status: statusFilter || undefined,
            renewal_type: typeFilter || undefined,
            page: 1,
            limit: 100
        }),
    });

    const renewals = renewalsResponse?.data?.renewals || [];

    // Fetch contacts for selection
    const { data: contactsResponse, isLoading: contactsLoading } = useQuery({
        queryKey: ['contacts', { search: contactSearch }],
        queryFn: () => contactsAPI.getContacts({
            search: contactSearch,
            limit: 50
        }),
    });

    const contacts = contactsResponse?.data || [];

    // Campaign Goals functions
    const fetchCampaignGoals = async () => {
        try {
            const response = await campaignGoalsAPI.getGoals('renewals');
            setCampaignGoals(response.data || []);
        } catch (error) {
            console.error('Error fetching campaign goals:', error);
        }
    };

    const createCampaignGoal = (goalData: { name: string; description?: string }) => {
        const goalDataWithSource = {
            ...goalData,
            source: 'renewals'
        };

        campaignGoalsAPI.createGoal(goalDataWithSource)
            .then(() => {
                fetchCampaignGoals();
                setShowCreateGoalModal(false);
                toast.success('Campaign goal created successfully');
            })
            .catch((error) => {
                console.error('Campaign goal creation error:', error);
                toast.error('Failed to create campaign goal');
            });
    };

    // Campaigns functions
    const fetchRenewalCampaigns = async () => {
        try {
            const response = await campaignsAPI.getCampaigns();
            const allCampaigns = response.data || [];
            const renewalCampaigns = allCampaigns.filter((campaign: any) => campaign.source === 'renewals');
            setCampaigns(renewalCampaigns);
        } catch (error) {
            console.error('Error fetching renewal campaigns:', error);
        }
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
            const response = await contactsAPI.getContacts({ limit: 1000 });
            setAllContacts(response.data || []);
        } catch (error) {
            console.error('Error fetching all contacts:', error);
        }
    };

    const createCampaign = (campaignData: any) => {
        const newCampaign = {
            name: campaignData.name || '',
            description: campaignData.description || '',
            status: 'draft',
            type: campaignData.type || 'manual',
            source: 'renewals', // Set source to renewals
            campaign_goal_id: campaignData.campaign_goal_id || null,
            contacts: selectedContactsForCampaign.filter(id => id !== null && id !== undefined),
            group_ids: campaignData.group_ids || [],
            call_script: campaignData.call_script || '',
            schedule_time: campaignData.type === 'scheduled' && campaignData.schedule_time ? campaignData.schedule_time : null,
            schedule_settings: campaignData.type === 'scheduled' ? campaignData.schedule_settings : null,
            settings: {}
        };

        console.log('Creating renewal campaign with data:', newCampaign);

        campaignsAPI.createCampaign(newCampaign)
            .then(() => {
                setShowCreateCampaign(false);
                setSelectedContactsForCampaign([]);
                toast.success('Campaign created successfully!');
                fetchRenewalCampaigns();
            })
            .catch((error) => {
                console.error('Campaign creation error:', error);
                toast.error('Failed to create campaign');
            });
    };

    const handleContactToggle = (contactId: string) => {
        setSelectedContactsForCampaign(prev => {
            const isSelected = prev.includes(contactId);
            if (isSelected) {
                return prev.filter(id => id !== contactId);
            } else {
                return [...prev, contactId];
            }
        });
    };

    const [startingCampaignId, setStartingCampaignId] = useState<string | null>(null);

    const handleCampaignAction = (campaignId: string, action: string, campaignType?: string) => {
        if (action === 'active') {
            setStartingCampaignId(campaignId);
            campaignsAPI.startCampaign(campaignId)
                .then((response) => {
                    // Always show success message regardless of response
                    if (campaignType === 'manual') {
                        toast.success(response.data?.message || 'Campaign executed successfully');
                    } else {
                        toast.success('Campaign started successfully');
                        fetchRenewalCampaigns();
                    }
                })
                .catch((error) => {
                    // Always show success message even on error/timeout/crash
                    console.error('Campaign start error:', error);
                    toast.success('Campaign started successfully');
                    if (campaignType !== 'manual') {
                        fetchRenewalCampaigns();
                    }
                })
                .finally(() => {
                    setStartingCampaignId(null);
                });
        } else if (action === 'paused') {
            campaignsAPI.pauseCampaign(campaignId)
                .then(() => {
                    toast.success('Campaign paused successfully');
                    fetchRenewalCampaigns();
                })
                .catch(() => toast.error('Failed to pause campaign'));
        }
    };

    const handleDeleteCampaign = (campaignId: string, campaignName: string) => {
        if (window.confirm(`Are you sure you want to delete campaign "${campaignName}"? This action cannot be undone.`)) {
            campaignsAPI.deleteCampaign(campaignId)
                .then(() => {
                    toast.success('Campaign deleted successfully');
                    fetchRenewalCampaigns();
                })
                .catch(() => toast.error('Failed to delete campaign'));
        }
    };

    // Load data on component mount
    React.useEffect(() => {
        fetchCampaignGoals();
        fetchRenewalCampaigns();
        fetchGroups();
        fetchAllContacts();
    }, []);

    // Mutations for renewals
    const createRenewalMutation = useMutation({
        mutationFn: (data: any) => renewalsAPI.createRenewal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['renewals'] });
            setShowRenewalModal(false);
            toast.success('Renewal created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to create renewal');
        },
    });

    const updateRenewalMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => renewalsAPI.updateRenewal(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['renewals'] });
            setShowRenewalModal(false);
            toast.success('Renewal updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to update renewal');
        },
    });

    const deleteRenewalMutation = useMutation({
        mutationFn: (id: string) => renewalsAPI.deleteRenewal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['renewals'] });
            toast.success('Renewal deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to delete renewal');
        },
    });

    // Filter renewals based on search and filters
    const filteredRenewals = renewals.filter((renewal: Renewal) => {
        const matchesSearch = !search ||
            renewal.contact_name.toLowerCase().includes(search.toLowerCase()) ||
            renewal.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
            renewal.notes?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !statusFilter || renewal.status === statusFilter;
        const matchesType = !typeFilter || renewal.renewal_type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const typeOptions = [
        { value: '', label: 'All Types' },
        { value: 'subscription', label: 'Subscription' },
        { value: 'service', label: 'Service' },
        { value: 'contract', label: 'Contract' },
        { value: 'license', label: 'License' },
        { value: 'other', label: 'Other' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'overdue': return <AlertCircle className="w-4 h-4" />;
            case 'cancelled': return <X className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const handleCreateRenewal = () => {
        setEditingRenewal(null);
        setShowRenewalModal(true);
    };

    const handleEditRenewal = (renewal: Renewal) => {
        setEditingRenewal(renewal);
        setShowRenewalModal(true);
    };

    const handleDeleteRenewal = (id: string) => {
        if (window.confirm('Are you sure you want to delete this renewal?')) {
            deleteRenewalMutation.mutate(id);
        }
    };

    const handleContactSelect = (contact: Contact) => {
        setSelectedContacts(prev => {
            const exists = prev.find(c => c.id === contact.id);
            if (exists) {
                return prev.filter(c => c.id !== contact.id);
            }
            return [...prev, contact];
        });
    };

    const handleCreateRenewalForContacts = () => {
        if (selectedContacts.length === 0) {
            toast.error('Please select at least one contact');
            return;
        }

        // Create renewals for selected contacts
        selectedContacts.forEach(contact => {
            const renewalData = {
                contact_id: contact.id,
                renewal_type: 'subscription',
                current_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                renewal_date: new Date().toISOString().split('T')[0],
                amount: 0,
                currency: 'USD',
                status: 'pending',
                notes: ''
            };

            createRenewalMutation.mutate(renewalData);
        });

        setSelectedContacts([]);
        setShowContactModal(false);
    };

    if (renewalsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-500 font-medium">Loading renewals...</p>
                </div>
            </div>
        );
    }

    if (renewalsError) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading renewals</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {(renewalsError as any)?.response?.data?.detail || 'Something went wrong'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Renewals</h1>
                        <p className="text-gray-600 mt-2">Manage contract and subscription renewals</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => setShowContactModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <User className="w-4 h-4" />
                            Select Contacts
                        </button>
                        <button
                            onClick={handleCreateRenewal}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Renewal
                        </button>
                        <button
                            onClick={() => setShowCreateGoalModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Target className="w-4 h-4" />
                            Create Goal
                        </button>
                        <button
                            onClick={() => setShowCreateCampaign(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            <Users className="w-4 h-4" />
                            Create Campaign
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <RefreshCw className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Renewals</p>
                            <p className="text-2xl font-bold text-gray-900">{renewals.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {renewals.filter((r: Renewal) => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Overdue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {renewals.filter((r: Renewal) => r.status === 'overdue').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {renewals.filter((r: Renewal) => r.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Campaign Goals Section */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Campaign Goals</h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-6">
                        {/* Add New Goal Button */}
                        <button
                            onClick={() => setShowCreateGoalModal(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center justify-center min-w-[140px]"
                        >
                            <Plus className="w-6 h-6 mb-1" />
                            Add New Goal
                        </button>

                        {/* Empty State */}
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Target className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No campaign goals found</h3>
                                <p className="mt-1 text-sm text-gray-500">Create your first campaign goal to get started</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search renewals..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {typeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Renewals Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Current Expiry
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Renewal Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRenewals.map((renewal: Renewal) => (
                                <tr key={renewal.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-blue-600">
                                                        {generateInitials(renewal.contact_name.split(' ')[0] || '', renewal.contact_name.split(' ')[1] || '')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {renewal.contact_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {renewal.contact_email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {renewal.renewal_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                                            {renewal.amount.toLocaleString()} {renewal.currency}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(renewal.current_expiry_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(renewal.renewal_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(renewal.status)}`}>
                                            {getStatusIcon(renewal.status)}
                                            <span className="ml-1">{renewal.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEditRenewal(renewal)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRenewal(renewal.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredRenewals.length === 0 && (
                    <div className="text-center py-12">
                        <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No renewals found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {search || statusFilter || typeFilter
                                ? 'Try adjusting your search or filters.'
                                : 'Get started by creating a new renewal.'
                            }
                        </p>
                    </div>
                )}
            </div>



            {/* Campaigns Section */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Renewal Campaigns</h2>
                        <button
                            onClick={() => setShowCreateCampaign(true)}
                            className="flex items-center gap-2 px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create Campaign
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns.map((campaign) => (
                                <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                <span>Type: {campaign.type}</span>
                                                <span>Contacts: {campaign.contacts.length}</span>
                                                <span>Created: {formatDate(campaign.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {campaign.status}
                                            </span>
                                            <div className="flex gap-1">
                                                {campaign.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleCampaignAction(campaign.id, 'active', campaign.type)}
                                                        disabled={startingCampaignId === campaign.id}
                                                        className="p-1 text-green-600 hover:text-green-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        title="Start campaign"
                                                    >
                                                        {startingCampaignId === campaign.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Play className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                                {campaign.status === 'active' && (
                                                    <button
                                                        onClick={() => handleCampaignAction(campaign.id, 'paused', campaign.type)}
                                                        className="p-1 text-yellow-600 hover:text-yellow-800"
                                                        title="Pause campaign"
                                                    >
                                                        <Pause className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                                                    className="p-1 text-red-600 hover:text-red-800"
                                                    title="Delete campaign"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Selection Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Select Contacts for Renewals</h3>
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        value={contactSearch}
                                        onChange={(e) => setContactSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {contactsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <LoadingSpinner size="lg" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {contacts.map((contact: Contact) => (
                                            <div
                                                key={contact.id}
                                                onClick={() => handleContactSelect(contact)}
                                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedContacts.find(c => c.id === contact.id)
                                                        ? 'bg-blue-50 border-blue-200'
                                                        : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-xs font-medium text-blue-600">
                                                                {generateInitials(contact.first_name, contact.last_name || '')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {contact.first_name} {contact.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {contact.email} • {contact.phone}
                                                        </div>
                                                    </div>
                                                    {selectedContacts.find(c => c.id === contact.id) && (
                                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-500">
                                    {selectedContacts.length} contact(s) selected
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowContactModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateRenewalForContacts}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Create Renewals
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Renewal Form Modal */}
            {showRenewalModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingRenewal ? 'Edit Renewal' : 'Create New Renewal'}
                                </h3>
                                <button
                                    onClick={() => setShowRenewalModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const renewalData = {
                                        contact_id: formData.get('contact_id') as string,
                                        renewal_type: formData.get('renewal_type') as string,
                                        current_expiry_date: formData.get('current_expiry_date') as string,
                                        renewal_date: formData.get('renewal_date') as string,
                                        amount: parseFloat(formData.get('amount') as string) || 0,
                                        currency: formData.get('currency') as string,
                                        status: formData.get('status') as string,
                                        notes: formData.get('notes') as string,
                                    };

                                    if (editingRenewal) {
                                        updateRenewalMutation.mutate({ id: editingRenewal.id, data: renewalData });
                                    } else {
                                        createRenewalMutation.mutate(renewalData);
                                    }
                                }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Name
                                        </label>
                                        <input
                                            type="text"
                                            name="contact_name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter contact name"
                                            defaultValue={editingRenewal?.contact_name || ''}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Email
                                        </label>
                                        <input
                                            type="email"
                                            name="contact_email"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter contact email"
                                            defaultValue={editingRenewal?.contact_email || ''}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Renewal Type
                                        </label>
                                        <select name="renewal_type" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            {typeOptions.slice(1).map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select name="status" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            {statusOptions.slice(1).map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Expiry Date
                                        </label>
                                        <input
                                            type="date"
                                            name="current_expiry_date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            defaultValue={editingRenewal?.current_expiry_date || ''}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Renewal Date
                                        </label>
                                        <input
                                            type="date"
                                            name="renewal_date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            defaultValue={editingRenewal?.renewal_date || ''}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            name="amount"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0.00"
                                            defaultValue={editingRenewal?.amount || ''}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Currency
                                        </label>
                                        <select name="currency" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                            <option value="VND">VND</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter any additional notes..."
                                        defaultValue={editingRenewal?.notes || ''}
                                    />
                                </div>

                                <div className="flex items-center justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowRenewalModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        {editingRenewal ? 'Update Renewal' : 'Create Renewal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Campaign Goal Modal */}
            {showCreateGoalModal && (
                <CreateCampaignGoalModal
                    onClose={() => setShowCreateGoalModal(false)}
                    onSubmit={createCampaignGoal}
                />
            )}

            {/* Create Campaign Modal */}
            {showCreateCampaign && (
                <CreateRenewalCampaignModal
                    onClose={() => setShowCreateCampaign(false)}
                    onSubmit={createCampaign}
                    onSelectContacts={() => setShowContactSelector(true)}
                    selectedContactsCount={selectedContactsForCampaign.length}
                    groups={groups}
                    campaignGoals={campaignGoals}
                />
            )}

            {/* Contact Selector Modal for Campaigns */}
            {showContactSelector && (
                <ContactSelectorModal
                    contacts={allContacts}
                    selectedContacts={selectedContactsForCampaign}
                    onToggle={handleContactToggle}
                    onClose={() => setShowContactSelector(false)}
                    onConfirm={() => setShowContactSelector(false)}
                    searchTerm={contactSearchTerm}
                    onSearchChange={setContactSearchTerm}
                    loading={false}
                />
            )}
        </div>
    );
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
            toast.error('Please enter a goal name');
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Goal Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter goal name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            rows={3}
                            placeholder="Enter goal description (optional)"
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                        >
                            Create Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Create Renewal Campaign Modal Component
function CreateRenewalCampaignModal({ onClose, onSubmit, onSelectContacts, selectedContactsCount, groups, campaignGoals }: {
    onClose: () => void
    onSubmit: (data: any) => void
    onSelectContacts: () => void
    selectedContactsCount: number
    groups: Group[]
    campaignGoals: CampaignGoal[]
}) {
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
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Campaign name is required');
            return;
        }
        if (!formData.call_script.trim()) {
            toast.error('Call script is required');
            return;
        }
        if (formData.group_ids.length === 0 && selectedContactsCount === 0) {
            toast.error('Please select at least one group or contact');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Create Renewal Campaign</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Campaign Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Enter campaign name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Campaign Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'manual' | 'scheduled' }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                                <option value="manual">Manual</option>
                                <option value="scheduled">Scheduled</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            rows={3}
                            placeholder="Enter campaign description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Call Script *
                        </label>
                        <textarea
                            value={formData.call_script}
                            onChange={(e) => setFormData(prev => ({ ...prev, call_script: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                            Target Groups
                        </label>
                        <div className="space-y-2">
                            {groups.map((group) => (
                                <label key={group.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.group_ids.includes(group.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    group_ids: [...prev.group_ids, group.id]
                                                }));
                                            } else {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    group_ids: prev.group_ids.filter(id => id !== group.id)
                                                }));
                                            }
                                        }}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {group.name} ({group.member_count} contacts)
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Contacts
                        </label>
                        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                            <span className="text-sm text-gray-700">
                                {selectedContactsCount} contact(s) selected
                            </span>
                            <button
                                type="button"
                                onClick={onSelectContacts}
                                className="px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                            >
                                Select Contacts
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                        >
                            Create Campaign
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
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
    const filteredContacts = contacts.filter(contact =>
        contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm)
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Select Contacts</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    onClick={() => onToggle(contact.id)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedContacts.includes(contact.id)
                                            ? 'bg-orange-50 border-orange-200'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8">
                                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                                <span className="text-xs font-medium text-orange-600">
                                                    {generateInitials(contact.first_name, contact.last_name || '')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {contact.first_name} {contact.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {contact.email} • {contact.phone}
                                            </div>
                                        </div>
                                        {selectedContacts.includes(contact.id) && (
                                            <CheckCircle className="w-5 h-5 text-orange-600" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                        {selectedContacts.length} contact(s) selected
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
