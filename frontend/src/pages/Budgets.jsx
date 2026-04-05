import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, XCircle, Calendar, TrendingUp, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { aiService, budgetService, advancedService } from '../services/authService';
import VoiceInputButton from '../components/VoiceInputButton';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [rollovers, setRollovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Food',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const handleVoiceBudget = (voiceData) => {
    setFormData({
      category: voiceData.category || 'Other',
      amount: voiceData.amount ? voiceData.amount.toString() : '',
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
    setShowModal(true);
    toast.success('AI filled the budget details!', { icon: '✨' });
  };

  const generateSmartBudgets = async () => {
    try {
      setIsGenerating(true);
      toast.loading('AI is calculating optimal budgets...', { id: 'smart-budget' });
      const response = await aiService.getSmartBudgets();
      toast.dismiss('smart-budget');

      const suggestions = response.data;
      if (Object.keys(suggestions).length > 0) {
        // Find existing budgets to avoid duplicates or ask for replacement
        // For simplicity, let's just show the first suggestion in the modal
        const firstCat = Object.keys(suggestions)[0];
        setFormData({
          ...formData,
          category: firstCat,
          amount: suggestions[firstCat].toString()
        });
        setShowModal(true);
        toast.success(`AI suggested ₹${suggestions[firstCat]} for ${firstCat}!`, { icon: '🤖' });
      } else {
        toast.error('Not enough spending history to generate budgets');
      }
    } catch (error) {
      toast.dismiss('smart-budget');
      toast.error('Failed to generate smart budgets');
    } finally {
      setIsGenerating(false);
    }
  };

  const categories = ['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'];

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const [budgetsRes, rolloversRes] = await Promise.all([
        budgetService.getBudgets(),
        advancedService.getRollovers()
      ]);
      console.log('Budgets response:', budgetsRes.data);
      setBudgets(budgetsRes.data);
      setRollovers(rolloversRes.data.rollovers || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Error fetching budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return;
    }
    
    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget._id, budgetData);
        toast.success('Budget updated successfully');
      } else {
        await budgetService.createBudget(budgetData);
        toast.success('Budget created successfully');
      }
      setShowModal(false);
      setEditingBudget(null);
      resetForm();
      fetchBudgets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving budget');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await api.delete(`/budgets/${id}`);
        toast.success('Budget deleted successfully');
        fetchBudgets();
      } catch (error) {
        toast.error('Error deleting budget');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'Food',
      amount: '',
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'exceeded': return <XCircle className="w-5 h-5 text-rose-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-orange-500';
      case 'exceeded': return 'bg-rose-500';
      default: return 'bg-slate-300';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      safe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border-amber-200',
      critical: 'bg-orange-50 text-orange-700 border-orange-200',
      exceeded: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return badges[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Food: '🍽️',
      Travel: '✈️',
      Rent: '🏠',
      Entertainment: '🎬',
      Healthcare: '⚕️',
      Shopping: '🛍️',
      Utilities: '💡',
      Other: '📦'
    };
    return icons[category] || '📦';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Budget Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track and manage your spending across different categories
              </p>
            </div>
            <div className="flex items-center gap-2">
              <VoiceInputButton
                onParsedData={handleVoiceBudget}
                pageContext="budgets"
              />
              <button
                onClick={generateSmartBudgets}
                disabled={isGenerating}
                className="bg-emerald-600 text-white px-4 py-3 rounded-xl flex items-center space-x-2 hover:bg-emerald-700 transition-colors shadow-sm font-medium"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span>Smart Suggest ✨</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Budget</span>
              </button>
            </div>
          </div>
        </div>

        {/* Budget Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Total Budgets</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{budgets.length}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Total Allocated</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{budgets.reduce((sum, b) => sum + b.amount, 0).toFixed(0)}
                </p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{budgets.reduce((sum, b) => sum + (b.spent || 0), 0).toFixed(0)}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse h-64"></div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-900 dark:text-white font-semibold text-lg mb-2">No budgets created yet</p>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Start by creating your first budget to track your expenses</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl inline-flex items-center space-x-2 hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Create Budget</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => (
              <div key={budget._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all overflow-hidden">
                {/* Card Header */}
                <div className="bg-slate-50 dark:bg-slate-750 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{getCategoryIcon(budget.category)}</div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {budget.category}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 capitalize flex items-center space-x-1">
                          <span>{budget.period}</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(budget.status)}`}>
                            {budget.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingBudget(budget);
                          setFormData({
                            category: budget.category,
                            amount: budget.amount,
                            period: budget.period,
                            startDate: new Date(budget.startDate).toISOString().split('T')[0],
                            endDate: new Date(budget.endDate).toISOString().split('T')[0]
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget._id)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Amount Display */}
                  <div className="mb-5">
                    <div className="flex justify-between items-baseline mb-3">
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Spent</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{budget.spent?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Budget</p>
                        <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">₹{budget.amount?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </div>

                  {rollovers.find(r => r.category === budget.category) && (
                    <div className="flex items-center gap-1.5 mb-4 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +₹{rollovers.find(r => r.category === budget.category).rolloverAmount.toFixed(0)} Rollover Savings
                      </span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getStatusColor(budget.status)}`}
                        style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(budget.status)}
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {budget.percentage || 0}% used
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        ₹{budget.remaining?.toFixed(2) || '0.00'} left
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="bg-slate-50 dark:bg-slate-750 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      {new Date(budget.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span>→</span>
                    <span className="font-medium">
                      {new Date(budget.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {editingBudget ? 'Update your budget details' : 'Set up a new budget to track your expenses'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-750 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Budget Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-750 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Period
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-750 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-750 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-750 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBudget(null);
                    resetForm();
                  }}
                  className="px-6 py-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default Budgets;