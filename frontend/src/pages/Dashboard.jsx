import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { aiService, expenseService, incomeService, advancedService } from '../services/authService';
import VoiceInputButton from '../components/VoiceInputButton';
import FinancialHealthGauge from '../components/FinancialHealthGauge';
import AnomalyDetection from '../components/AnomalyDetection';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Tag,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  AlertTriangle,
  Wallet,
  Sparkles,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';
import AIInsights from '../components/AIInsights.jsx';
import BillReminderWidget from '../components/BillReminderWidget.jsx';
import GoalProgressWidget from '../components/GoalProgressWidget.jsx';

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [advancedInsights, setAdvancedInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    title: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, expensesRes, incomesRes, advancedRes] = await Promise.all([
        expenseService.getAnalytics(),
        expenseService.getExpenses({ limit: 5 }),
        incomeService.getIncomes(),
        advancedService.getInsights()
      ]);
      setAnalytics(analyticsRes.data);
      setRecentExpenses(expensesRes.data.expenses || []);
      setIncomes(incomesRes.data || []);
      setAdvancedInsights(advancedRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceQuickAdd = (voiceData) => {
    setQuickAddData({
      title: voiceData.title || '',
      amount: voiceData.amount ? voiceData.amount.toString() : '',
      category: voiceData.category || 'Other',
      date: voiceData.date || new Date().toISOString().split('T')[0]
    });
    setShowQuickAddModal(true);
    toast.success('AI filled the details!', { icon: '✨' });
  };

  const saveQuickExpense = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!quickAddData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!quickAddData.amount || parseFloat(quickAddData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    try {
      setIsSaving(true);
      const data = new FormData();
      Object.keys(quickAddData).forEach(key => {
        data.append(key, quickAddData[key]);
      });

      await expenseService.createExpense(data);
      toast.success('Expense added successfully!');
      setShowQuickAddModal(false);
      setQuickAddData({
        title: '',
        amount: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0]
      });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow h-80"></div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow h-80"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const categoryData = analytics?.categoryBreakdown?.slice(0, 6).map((item, index) => ({
    name: item._id,
    value: item.total,
    color: COLORS[index % COLORS.length]
  })) || [];

  const monthlyData = analytics?.monthlyTrends?.slice(0, 6).map(item => ({
    month: `${item._id.month}/${item._id.year}`,
    amount: item.total
  })).reverse() || [];

  const insights = analytics?.insights || {};
  const spendingTrend = parseFloat(insights.spendingTrend) || 0;

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = analytics?.totalExpenses?.total || 0;
  const netBalance = totalIncome - totalExpenses;

  const cards = [
    {
      title: 'Net Balance',
      value: `₹${(netBalance || 0).toFixed(2)}`,
      icon: Wallet,
      color: netBalance >= 0 ? 'text-emerald-600' : 'text-red-600',
      bgColor: netBalance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-red-100 dark:bg-red-900/20',
      subtitle: 'Income - Expenses'
    },
    {
      title: 'Total Income',
      value: `₹${(totalIncome || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      subtitle: `${incomes.length} sources`
    },
    {
      title: 'Total Expenses',
      value: `₹${(totalExpenses || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      change: spendingTrend,
      changeType: spendingTrend > 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Top Category',
      value: analytics?.topCategory || 'None',
      icon: Tag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      subtitle: `₹${categoryData[0]?.value?.toFixed(2) || '0.00'}`
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VoiceInputButton
            onParsedData={handleVoiceQuickAdd}
            pageContext="dashboard"
          />
          <Link
            to="/expenses"
            className="bg-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-primary/90 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expense</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              {card.change && (
                <div className={`flex items-center space-x-1 text-sm font-medium ${card.changeType === 'increase' ? 'text-red-600' : 'text-green-600'
                  }`}>
                  {card.changeType === 'increase' ?
                    <ArrowUpRight className="w-4 h-4" /> :
                    <ArrowDownRight className="w-4 h-4" />
                  }
                  <span>{Math.abs(card.change)}%</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {card.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Advanced Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FinancialHealthGauge healthData={advancedInsights?.healthScore} />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
            <AnomalyDetection anomalies={advancedInsights?.anomalies} />
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Spending by Category
          </h3>
          <Link
            to="/analytics"
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>
        {
          categoryData.length > 0 ? (
            <div className="flex items-center space-x-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {categoryData.slice(0, 4).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{(category.value || 0).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No spending data available
            </div>
          )
        }
      </div >

      {/* Monthly Trends */}
      < div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Trends
          </h3>
          <Link
            to="/analytics"
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            View Analytics →
          </Link>
        </div>
        {
          monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No trend data available
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Expenses */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Expenses
            </h3>
            <Link
              to="/expenses"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div key={expense._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {expense.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {expense.category} • {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{(expense.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No recent expenses</p>
            </div>
          )}
        </div>

        {/* Quick Actions & Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setQuickAddData({
                    title: '',
                    amount: '',
                    category: 'Other',
                    date: new Date().toISOString().split('T')[0]
                  });
                  setShowQuickAddModal(true);
                }}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <span className="text-blue-600 font-medium text-left">Quick Add Expense</span>
              </button>
              <Link
                to="/budgets"
                className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-medium">Smart Budgets ✨</span>
              </Link>
            </div>
          </div>

          <AIInsights />
          <BillReminderWidget />
          <GoalProgressWidget />
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Quick Save
              </h2>
              <button onClick={() => setShowQuickAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={saveQuickExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  value={quickAddData.title}
                  onChange={(e) => setQuickAddData({ ...quickAddData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={quickAddData.amount}
                    onChange={(e) => setQuickAddData({ ...quickAddData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={quickAddData.category}
                    onChange={(e) => setQuickAddData({ ...quickAddData, category: e.target.value })}
                  >
                    {['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Save Expense</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;