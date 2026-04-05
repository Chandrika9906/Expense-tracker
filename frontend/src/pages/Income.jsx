import { useState, useEffect } from 'react';
import { incomeService } from '../services/authService';
import { Plus, Trash2, Search, Filter, Calendar, DollarSign, FileText, TrendingUp, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import VoiceInputButton from '../components/VoiceInputButton';

const Income = () => {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        source: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const handleVoiceIncome = (voiceData) => {
        setFormData({
            source: voiceData.title || '',
            amount: voiceData.amount ? voiceData.amount.toString() : '',
            date: voiceData.date || new Date().toISOString().split('T')[0],
            notes: `Voice entry (${Math.round(voiceData.confidence * 100)}% confidence)`
        });
        setShowModal(true);
        toast.success('AI filled the income details!', { icon: '✨' });
    };

    useEffect(() => {
        fetchIncomes();
    }, []);

    const fetchIncomes = async () => {
        try {
            const response = await incomeService.getIncomes();
            setIncomes(response.data);
        } catch (error) {
            toast.error('Error fetching incomes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.source.trim()) {
            toast.error('Please enter an income source');
            return;
        }
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        
        if (!formData.date) {
            toast.error('Please select a date');
            return;
        }
        
        try {
            const incomeData = {
                source: formData.source.trim(),
                amount: parseFloat(formData.amount),
                date: formData.date,
                notes: formData.notes.trim()
            };
            
            await incomeService.createIncome(incomeData);
            toast.success('Income added successfully');
            setShowModal(false);
            setFormData({
                source: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            fetchIncomes();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving income');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this income?')) {
            try {
                await incomeService.deleteIncome(id);
                toast.success('Income deleted successfully');
                fetchIncomes();
            } catch (error) {
                toast.error('Error deleting income');
            }
        }
    };

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Income Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track your earnings and revenue sources
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <VoiceInputButton
                        onParsedData={handleVoiceIncome}
                        pageContext="income"
                    />
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white border border-green-600 hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-1 inline" />
                        Add Income
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 max-w-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">
                            ₹{totalIncome.toLocaleString()}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                </div>
            </div>

            {/* Income List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading incomes...</div>
                ) : incomes.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No income records</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Add your salary or other income sources</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Add Income
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {incomes.map((income) => (
                            <div key={income._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/20">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {income.source}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(income.date).toLocaleDateString()}</span>
                                                </div>
                                                {income.notes && (
                                                    <div className="flex items-center space-x-1">
                                                        <FileText className="w-4 h-4" />
                                                        <span>{income.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                            +₹{income.amount?.toFixed(2) || '0.00'}
                                        </p>
                                        <button
                                            onClick={() => handleDelete(income._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Income</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Source</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Salary, Freelance"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Amount (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                                    <textarea
                                        placeholder="Optional notes"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                        rows="3"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                                >
                                    Save Income
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Income;
