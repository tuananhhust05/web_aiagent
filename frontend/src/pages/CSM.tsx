import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    AlertCircle,
    User,
    DollarSign,
    X,
    Target,
    Users,
    Heart,
    Shield,
    AlertTriangle,
    Play,
    Pause
} from 'lucide-react';
import { csmAPI, contactsAPI, campaignGoalsAPI, campaignsAPI, groupsAPI } from '../lib/api';
import { formatDate, generateInitials } from '../lib/utils';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    status: 'active' | 'inactive' | 'lead' | 'customer' | 'prospect';
    created_at: string;
    updated_at: string;
}

interface CSMRecord {
    id: string;
    contact_id: string;
    contact_name: string;
    contact_email?: string;
    contact_phone?: string;
    account_value: number;
    health_score: number;
    status: 'active' | 'at_risk' | 'churned' | 'inactive';
    priority: 'low' | 'medium' | 'high' | 'critical';
    last_contact_date?: string;
    next_follow_up?: string;
    notes?: string;
    success_metrics?: any;
    risk_factors?: string[];
    created_at: string;
    updated_at: string;
}

interface CSMStats {
    total_customers: number;
    active_customers: number;
    at_risk_customers: number;
    churned_customers: number;
    average_health_score: number;
    total_account_value: number;
    high_priority_count: number;
    critical_priority_count: number;
}

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
    contacts?: string[];
}

interface Group {
    id: string;
    name: string;
    description?: string;
    member_count: number;
    color?: string;
}

export default function CSM() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [showCSMModal, setShowCSMModal] = useState(false);
    const [editingCSM, setEditingCSM] = useState<CSMRecord | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
    const [contactSearch, setContactSearch] = useState('');

    // Campaign Goals state
    const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
    const [campaignGoals, setCampaignGoals] = useState<CampaignGoal[]>([]);

    // Campaigns state
    const [showCreateCampaign, setShowCreateCampaign] = useState(false);
    const [showContactSelector, setShowContactSelector] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [, setGroups] = useState<Group[]>([]);
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [selectedContactsForCampaign, setSelectedContactsForCampaign] = useState<string[]>([]);
    const [contactSearchTerm, setContactSearchTerm] = useState('');

    // Fetch CSM records from API
    const { data: csmResponse, isLoading: csmLoading, error: csmError } = useQuery({
        queryKey: ['csm', { search, status: statusFilter, priority: priorityFilter }],
        queryFn: () => csmAPI.getCSMRecords({
            search: search || undefined,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            page: 1,
            limit: 100
        }),
    });

    const csmRecords = csmResponse?.data?.csm_records || [];

    // Fetch CSM stats
    const { data: statsResponse } = useQuery({
        queryKey: ['csm-stats'],
        queryFn: () => csmAPI.getStats(),
    });

    const stats: CSMStats = statsResponse?.data || {
        total_customers: 0,
        active_customers: 0,
        at_risk_customers: 0,
        churned_customers: 0,
        average_health_score: 0,
        total_account_value: 0,
        high_priority_count: 0,
        critical_priority_count: 0,
    };

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
            const response = await campaignGoalsAPI.getGoals('csm');
            setCampaignGoals(response.data || []);
        } catch (error) {
            console.error('Error fetching campaign goals:', error);
        }
    };

    const createCampaignGoal = (goalData: { name: string; description?: string }) => {
        const goalDataWithSource = {
            ...goalData,
            source: 'csm'
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
    const fetchCSMCampaigns = async () => {
        try {
            const response = await campaignsAPI.getCampaigns();
            const allCampaigns = response.data || [];
            const csmCampaigns = allCampaigns.filter((campaign: any) => campaign.source === 'csm');
            setCampaigns(csmCampaigns);
        } catch (error) {
            console.error('Error fetching CSM campaigns:', error);
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
            source: 'csm',
            campaign_goal_id: campaignData.campaign_goal_id || null,
            contacts: selectedContactsForCampaign.filter(id => id !== null && id !== undefined),
            group_ids: campaignData.group_ids || [],
            call_script: campaignData.call_script || '',
            schedule_time: campaignData.type === 'scheduled' && campaignData.schedule_time ? campaignData.schedule_time : null,
            schedule_settings: campaignData.type === 'scheduled' ? campaignData.schedule_settings : null,
            settings: {}
        };

        campaignsAPI.createCampaign(newCampaign)
            .then(() => {
                setShowCreateCampaign(false);
                setSelectedContactsForCampaign([]);
                toast.success('Campaign created successfully!');
                fetchCSMCampaigns();
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

    const handleCampaignAction = (campaignId: string, action: string, campaignType?: string) => {
        if (action === 'active') {
            campaignsAPI.startCampaign(campaignId)
                .then((response) => {
                    if (campaignType === 'manual') {
                        toast.success(response.data.message || 'Manual campaign executed successfully');
                    } else {
                        toast.success('Scheduled campaign started successfully');
                        fetchCSMCampaigns();
                    }
                })
                .catch(() => toast.error('Failed to start campaign'));
        } else if (action === 'paused') {
            campaignsAPI.pauseCampaign(campaignId)
                .then(() => {
                    toast.success('Campaign paused successfully');
                    fetchCSMCampaigns();
                })
                .catch(() => toast.error('Failed to pause campaign'));
        }
    };

    const handleDeleteCampaign = (campaignId: string, campaignName: string) => {
        if (window.confirm(`Are you sure you want to delete campaign "${campaignName}"? This action cannot be undone.`)) {
            campaignsAPI.deleteCampaign(campaignId)
                .then(() => {
                    toast.success('Campaign deleted successfully');
                    fetchCSMCampaigns();
                })
                .catch(() => toast.error('Failed to delete campaign'));
        }
    };

    // Load data on component mount
    React.useEffect(() => {
        fetchCampaignGoals();
        fetchCSMCampaigns();
        fetchGroups();
        fetchAllContacts();
    }, []);

    // Mutations for CSM records
    const createCSMMutation = useMutation({
        mutationFn: (data: any) => csmAPI.createCSMRecord(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['csm'] });
            queryClient.invalidateQueries({ queryKey: ['csm-stats'] });
            setShowCSMModal(false);
            toast.success('CSM record created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to create CSM record');
        },
    });

    const updateCSMMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => csmAPI.updateCSMRecord(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['csm'] });
            queryClient.invalidateQueries({ queryKey: ['csm-stats'] });
            setShowCSMModal(false);
            toast.success('CSM record updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to update CSM record');
        },
    });

    const deleteCSMMutation = useMutation({
        mutationFn: (id: string) => csmAPI.deleteCSMRecord(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['csm'] });
            queryClient.invalidateQueries({ queryKey: ['csm-stats'] });
            toast.success('CSM record deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to delete CSM record');
        },
    });

    // Filter CSM records based on search and filters
    const filteredCSMRecords = csmRecords.filter((record: CSMRecord) => {
        const matchesSearch = !search ||
            record.contact_name.toLowerCase().includes(search.toLowerCase()) ||
            record.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
            record.notes?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !statusFilter || record.status === statusFilter;
        const matchesPriority = !priorityFilter || record.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'at_risk', label: 'At Risk' },
        { value: 'churned', label: 'Churned' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const priorityOptions = [
        { value: '', label: 'All Priority' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'at_risk': return 'bg-yellow-100 text-yellow-800';
            case 'churned': return 'bg-red-100 text-red-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4" />;
            case 'at_risk': return <AlertTriangle className="w-4 h-4" />;
            case 'churned': return <X className="w-4 h-4" />;
            case 'inactive': return <Clock className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-blue-100 text-blue-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'critical': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getHealthScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const handleCreateCSM = () => {
        setEditingCSM(null);
        setShowCSMModal(true);
    };

    const handleEditCSM = (csm: CSMRecord) => {
        setEditingCSM(csm);
        setShowCSMModal(true);
    };

    const handleDeleteCSM = (id: string) => {
        if (window.confirm('Are you sure you want to delete this CSM record?')) {
            deleteCSMMutation.mutate(id);
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

    const handleCreateCSMForContacts = () => {
        if (selectedContacts.length === 0) {
            toast.error('Please select at least one contact');
            return;
        }

        // Create CSM records for selected contacts
        selectedContacts.forEach(contact => {
            const csmData = {
                contact_id: contact.id,
                contact_name: `${contact.first_name} ${contact.last_name}`,
                contact_email: contact.email,
                contact_phone: contact.phone,
                account_value: 0,
                health_score: 50,
                status: 'active',
                priority: 'medium',
                notes: ''
            };

            createCSMMutation.mutate(csmData);
        });

        setSelectedContacts([]);
        setShowContactModal(false);
    };

    if (csmLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-500 font-medium">Loading CSM records...</p>
                </div>
            </div>
        );
    }

    if (csmError) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading CSM records</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {(csmError as any)?.response?.data?.detail || 'Something went wrong'}
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
                        <h1 className="text-3xl font-bold text-gray-900">Customer Success Management</h1>
                        <p className="text-gray-600 mt-2">Manage customer health and success metrics</p>
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
                            onClick={handleCreateCSM}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create CSM Record
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Customers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_customers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.active_customers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">At Risk</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.at_risk_customers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <X className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Churned</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.churned_customers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Heart className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Avg Health Score</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.average_health_score}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Account Value</p>
                            <p className="text-2xl font-bold text-gray-900">${stats.total_account_value.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Shield className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">High Priority</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.high_priority_count + stats.critical_priority_count}</p>
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
                            onClick={() => window.location.href = `/campaign-goals/${goal.id}`}
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

            {/* Campaigns Section */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">CSM Campaigns</h2>
                        <button
                            onClick={() => setShowCreateCampaign(true)}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create Campaign
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-8">
                            <Target className="mx-auto h-12 w-12 text-gray-400" />
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
                                                <span>Contacts: {campaign.contacts?.length || 0}</span>
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
                                                        className="p-1 text-green-600 hover:text-green-800"
                                                        title="Start campaign"
                                                    >
                                                        <Play className="w-4 h-4" />
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

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search CSM records..."
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
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* CSM Records Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Account Value
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Health Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Next Follow-up
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCSMRecords.map((record: CSMRecord) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-blue-600">
                                                        {generateInitials(record.contact_name.split(' ')[0] || '', record.contact_name.split(' ')[1] || '')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {record.contact_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {record.contact_email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                                            {record.account_value.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <div className={`font-semibold ${getHealthScoreColor(record.health_score)}`}>
                                                {record.health_score}
                                            </div>
                                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${
                                                        record.health_score >= 80 ? 'bg-green-500' :
                                                        record.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${record.health_score}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                            {getStatusIcon(record.status)}
                                            <span className="ml-1">{record.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(record.priority)}`}>
                                            {record.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {record.last_contact_date ? formatDate(record.last_contact_date) : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {record.next_follow_up ? formatDate(record.next_follow_up) : 'Not scheduled'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEditCSM(record)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCSM(record.id)}
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

                {filteredCSMRecords.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No CSM records found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {search || statusFilter || priorityFilter
                                ? 'Try adjusting your search or filters.'
                                : 'Get started by creating a new CSM record.'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Contact Selection Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Select Contacts for CSM</h3>
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
                                        onClick={handleCreateCSMForContacts}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Create CSM Records
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSM Form Modal */}
            {showCSMModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingCSM ? 'Edit CSM Record' : 'Create New CSM Record'}
                                </h3>
                                <button
                                    onClick={() => setShowCSMModal(false)}
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
                                    const csmData = {
                                        contact_id: formData.get('contact_id') as string,
                                        contact_name: formData.get('contact_name') as string,
                                        contact_email: formData.get('contact_email') as string,
                                        contact_phone: formData.get('contact_phone') as string,
                                        account_value: parseFloat(formData.get('account_value') as string) || 0,
                                        health_score: parseInt(formData.get('health_score') as string) || 50,
                                        status: formData.get('status') as string,
                                        priority: formData.get('priority') as string,
                                        last_contact_date: formData.get('last_contact_date') as string,
                                        next_follow_up: formData.get('next_follow_up') as string,
                                        notes: formData.get('notes') as string,
                                    };

                                    if (editingCSM) {
                                        updateCSMMutation.mutate({ id: editingCSM.id, data: csmData });
                                    } else {
                                        createCSMMutation.mutate(csmData);
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
                                            defaultValue={editingCSM?.contact_name || ''}
                                            required
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
                                            defaultValue={editingCSM?.contact_email || ''}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Account Value
                                        </label>
                                        <input
                                            type="number"
                                            name="account_value"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0.00"
                                            defaultValue={editingCSM?.account_value || ''}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Health Score (0-100)
                                        </label>
                                        <input
                                            type="number"
                                            name="health_score"
                                            min="0"
                                            max="100"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="50"
                                            defaultValue={editingCSM?.health_score || ''}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Priority
                                        </label>
                                        <select name="priority" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            {priorityOptions.slice(1).map(option => (
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
                                            Last Contact Date
                                        </label>
                                        <input
                                            type="date"
                                            name="last_contact_date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            defaultValue={editingCSM?.last_contact_date ? editingCSM.last_contact_date.split('T')[0] : ''}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Next Follow-up
                                        </label>
                                        <input
                                            type="date"
                                            name="next_follow_up"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            defaultValue={editingCSM?.next_follow_up ? editingCSM.next_follow_up.split('T')[0] : ''}
                                        />
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
                                        defaultValue={editingCSM?.notes || ''}
                                    />
                                </div>

                                <div className="flex items-center justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCSMModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        {editingCSM ? 'Update CSM Record' : 'Create CSM Record'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Campaign Goal Modal */}
            {showCreateGoalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Create Campaign Goal</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            createCampaignGoal({
                                name: formData.get('name') as string,
                                description: formData.get('description') as string
                            });
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter goal name"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter goal description"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateGoalModal(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Create Goal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Campaign Modal */}
            {showCreateCampaign && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Create CSM Campaign</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            createCampaign({
                                name: formData.get('name') as string,
                                description: formData.get('description') as string,
                                type: formData.get('type') as string,
                                campaign_goal_id: formData.get('campaign_goal_id') as string || null,
                                call_script: formData.get('call_script') as string
                            });
                        }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter campaign name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Type</label>
                                    <select
                                        name="type"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="manual">Manual</option>
                                        <option value="scheduled">Scheduled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Goal</label>
                                <select
                                    name="campaign_goal_id"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a goal (optional)</option>
                                    {campaignGoals.map((goal) => (
                                        <option key={goal.id} value={goal.id}>{goal.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter campaign description"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Call Script</label>
                                <textarea
                                    name="call_script"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter call script for this campaign"
                                />
                            </div>
                            <div className="mb-6">
                                <button
                                    type="button"
                                    onClick={() => setShowContactSelector(true)}
                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    {selectedContactsForCampaign.length > 0 
                                        ? `${selectedContactsForCampaign.length} contacts selected`
                                        : 'Select Contacts'
                                    }
                                </button>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateCampaign(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Create Campaign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Selector Modal */}
            {showContactSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Select Contacts for Campaign</h3>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={contactSearchTerm}
                                onChange={(e) => setContactSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                            {allContacts
                                .filter(contact => 
                                    contact.first_name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
                                    contact.last_name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
                                    contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase())
                                )
                                .map((contact) => (
                                    <div
                                        key={contact.id}
                                        className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedContactsForCampaign.includes(contact.id)}
                                            onChange={() => handleContactToggle(contact.id)}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {contact.first_name} {contact.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500">{contact.email}</div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowContactSelector(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowContactSelector(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Done ({selectedContactsForCampaign.length} selected)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
