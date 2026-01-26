import { useState, useEffect } from 'react';
import { aiService, billService } from '../services/authService';
import VoiceInputButton from '../components/VoiceInputButton';
import {
    CreditCard,
    Plus,
    Calendar,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Clock,
    Repeat,
    Edit2,
    Trash2,
    X,
    History,
    TrendingUp,
    Sparkles,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Bills = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [isPredicting, setIsPredicting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Utilities',
        dueDate: '',
        isRecurring: false,
        recurringInterval: 'monthly',
        reminderDays: 3,
        notes: '',
        autoCreateExpense: true
    });

    const handleVoiceBill = (voiceData) => {
        setFormData({
            title: voiceData.title || '',
            amount: voiceData.amount ? voiceData.amount.toString() : '',
            category: voiceData.category || 'Utilities',
            dueDate: voiceData.date || '',
            isRecurring: false,
            recurringInterval: 'monthly',
            reminderDays: 3,
            notes: `Voice entry (${Math.round(voiceData.confidence * 100)}% confidence)`,
            autoCreateExpense: true
        });
        setShowModal(true);
        toast.success('AI filled the bill details!', { icon: '✨' });
    };

    const handlePredictAmount = async () => {
        if (!formData.title) {
            toast.error('Please enter a bill title first');
            return;
        }

        try {
            setIsPredicting(true);
            const history = selectedBill ? await billService.getBillHistory(selectedBill._id) : { data: [] };

            const response = await aiService.predictBill({
                title: formData.title,
                history: history.data
            });

            if (response.data.prediction > 0) {
                setFormData({ ...formData, amount: response.data.prediction.toString() });
                toast.success(`Predicted amount: ₹${response.data.prediction}`, { icon: '🤖' });
            } else {
                toast.error('Not enough history to predict amount');
            }
        } catch (error) {
            console.error('Prediction error:', error);
            toast.error('Failed to predict amount');
        } finally {
            setIsPredicting(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            setLoading(true);
            const response = await billService.getBills();
            setBills(response.data);
        } catch (error) {
            console.error('Error fetching bills:', error);
            toast.error('Failed to fetch bills');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.title.trim()) {
            toast.error('Please enter a bill title');
            return;
        }
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        
        if (!formData.dueDate) {
            toast.error('Please select a due date');
            return;
        }
        
        try {
            const billData = {
                ...formData,
                title: formData.title.trim(),
                amount: parseFloat(formData.amount),
                reminderDays: parseInt(formData.reminderDays) || 3,
                notes: formData.notes.trim()
            };
            
            if (selectedBill) {
                await billService.updateBill(selectedBill._id, billData);
                toast.success('Bill updated successfully!');
            } else {
                await billService.createBill(billData);
                toast.success('Bill created successfully!');
            }
            fetchBills();
            closeModal();
        } catch (error) {
            console.error('Error saving bill:', error);
            toast.error(error.response?.data?.message || 'Failed to save bill');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bill?')) return;
        try {
            await billService.deleteBill(id);
            toast.success('Bill deleted successfully!');
            fetchBills();
        } catch (error) {
            console.error('Error deleting bill:', error);
            toast.error('Failed to delete bill');
        }
    };

    const handleMarkAsPaid = async (bill) => {
        try {
            await billService.markAsPaid(bill._id, {
                amount: bill.amount,
                paidDate: new Date(),
                notes: `Payment for ${bill.title}`
            });
            toast.success('Bill marked as paid!');
            fetchBills();
        } catch (error) {
            console.error('Error marking bill as paid:', error);
            toast.error('Failed to mark bill as paid');
        }
    };

    const viewHistory = async (bill) => {
        try {
            const response = await billService.getBillHistory(bill._id);
            setPaymentHistory(response.data);
            setSelectedBill(bill);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Error fetching payment history:', error);
            toast.error('Failed to fetch payment history');
        }
    };

    const openEditModal = (bill) => {
        setSelectedBill(bill);
        setFormData({
            title: bill.title,
            amount: bill.amount,
            category: bill.category,
            dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
            isRecurring: bill.isRecurring,
            recurringInterval: bill.recurringInterval,
            reminderDays: bill.reminderDays,
            notes: bill.notes || '',
            autoCreateExpense: bill.autoCreateExpense
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedBill(null);
        setFormData({
            title: '',
            amount: '',
            category: 'Utilities',
            dueDate: '',
            isRecurring: false,
            recurringInterval: 'monthly',
            reminderDays: 3,
            notes: '',
            autoCreateExpense: true
        });
    };

    const getFilteredBills = () => {
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        switch (activeFilter) {
            case 'upcoming':
                return bills.filter(bill => {
                    const dueDate = new Date(bill.dueDate);
                    return !bill.isPaid && dueDate >= today && dueDate <= sevenDaysFromNow;
                });
            case 'paid':
                return bills.filter(bill => bill.isPaid);
            case 'unpaid':
                return bills.filter(bill => !bill.isPaid);
            case 'recurring':
                return bills.filter(bill => bill.isRecurring);
            case 'overdue':
                return bills.filter(bill => !bill.isPaid && new Date(bill.dueDate) < today);
            default:
                return bills;
        }
    };

    const getDueDateColor = (bill) => {
        if (bill.isPaid) return 'text-green-600';
        const today = new Date();
        const dueDate = new Date(bill.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) return 'text-red-600';
        if (daysUntilDue <= 3) return 'text-orange-600';
        return 'text-gray-600';
    };

    const getDueDateBadge = (bill) => {
        if (bill.isPaid) {
            return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Paid
            </span>;
        }

        const today = new Date();
        const dueDate = new Date(bill.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
            return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Overdue
            </span>;
        }
        if (daysUntilDue === 0) {
            return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" /> Due Today
            </span>;
        }
        if (daysUntilDue <= 3) {
            return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" /> Due in {daysUntilDue}d
            </span>;
        }
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
            <Calendar className="w-4 h-4" /> {daysUntilDue} days
        </span>;
    };

    const filteredBills = getFilteredBills();
    const stats = {
        total: bills.length,
        upcoming: bills.filter(b => {
            const today = new Date();
            const sevenDays = new Date();
            sevenDays.setDate(today.getDate() + 7);
            return !b.isPaid && new Date(b.dueDate) >= today && new Date(b.dueDate) <= sevenDays;
        }).length,
        overdue: bills.filter(b => !b.isPaid && new Date(b.dueDate) < new Date()).length,
        paid: bills.filter(b => b.isPaid).length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-primary" />
                        Bill Reminders
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your bills and never miss a payment
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <VoiceInputButton
                        onParsedData={handleVoiceBill}
                        pageContext="bills"
                    />
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Add Bill
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Bills</p>
                            <p className="text-3xl font-bold mt-1">{stats.total}</p>
                        </div>
                        <CreditCard className="w-12 h-12 text-blue-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Upcoming</p>
                            <p className="text-3xl font-bold mt-1">{stats.upcoming}</p>
                        </div>
                        <Clock className="w-12 h-12 text-orange-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm font-medium">Overdue</p>
                            <p className="text-3xl font-bold mt-1">{stats.overdue}</p>
                        </div>
                        <AlertCircle className="w-12 h-12 text-red-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Paid</p>
                            <p className="text-3xl font-bold mt-1">{stats.paid}</p>
                        </div>
                        <CheckCircle2 className="w-12 h-12 text-green-200" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                    {['all', 'upcoming', 'overdue', 'paid', 'unpaid', 'recurring'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === filter
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bills List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : filteredBills.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No bills found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {activeFilter === 'all'
                            ? "Get started by adding your first bill"
                            : `No ${activeFilter} bills at the moment`}
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-primary/90 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Your First Bill
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBills.map((bill) => (
                        <div
                            key={bill._id}
                            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        {bill.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                            {bill.category}
                                        </span>
                                        {bill.isRecurring && (
                                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs flex items-center gap-1">
                                                <Repeat className="w-3 h-3" />
                                                {bill.recurringInterval}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                {getDueDateBadge(bill)}
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Amount
                                    </span>
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        ₹{bill.amount?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Due Date
                                    </span>
                                    <span className={`font-medium ${getDueDateColor(bill)}`}>
                                        {new Date(bill.dueDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {bill.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    {bill.notes}
                                </p>
                            )}

                            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {!bill.isPaid && (
                                    <button
                                        onClick={() => handleMarkAsPaid(bill)}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Mark Paid
                                    </button>
                                )}
                                <button
                                    onClick={() => viewHistory(bill)}
                                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                    title="View History"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => openEditModal(bill)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(bill._id)}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Bill Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedBill ? 'Edit Bill' : 'Add New Bill'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bill Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g., Electricity Bill"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Amount *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="0.00"
                                        />
                                        <button
                                            type="button"
                                            onClick={handlePredictAmount}
                                            disabled={isPredicting}
                                            className="absolute right-2 top-2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            title="Predict amount using AI"
                                        >
                                            {isPredicting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        {['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Due Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Reminder (days before)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.reminderDays}
                                        onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRecurring}
                                        onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Recurring Bill
                                    </span>
                                </label>

                                {formData.isRecurring && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Recurring Interval
                                        </label>
                                        <select
                                            value={formData.recurringInterval}
                                            onChange={(e) => setFormData({ ...formData, recurringInterval: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                )}

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.autoCreateExpense}
                                        onChange={(e) => setFormData({ ...formData, autoCreateExpense: e.target.checked })}
                                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Auto-create expense when marked as paid
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Add any additional notes..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg"
                                >
                                    {selectedBill ? 'Update Bill' : 'Add Bill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="w-6 h-6 text-primary" />
                                Payment History
                            </h2>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                    {selectedBill?.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedBill?.category} • {selectedBill?.isRecurring ? `Recurring (${selectedBill?.recurringInterval})` : 'One-time'}
                                </p>
                            </div>

                            {paymentHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">No payment history yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paymentHistory.map((payment, index) => (
                                        <div
                                            key={payment._id || index}
                                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                    ₹{payment.amount?.toFixed(2) || '0.00'}
                                                </span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(payment.paidDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {payment.notes && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{payment.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bills;
