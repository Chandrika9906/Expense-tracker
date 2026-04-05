import { useState, useEffect } from "react";
import { goalService, aiService } from "../services/authService";
import {
  Target,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Trophy,
  Sparkles,
  PiggyBank,
  Plane,
  GraduationCap,
  Home,
  Car,
  LineChart,
} from "lucide-react";
import toast from "react-hot-toast";
import VoiceInputButton from "../components/VoiceInputButton";
import CircularProgress from "../components/CircularProgress";
import GoalSimulator from "../components/GoalSimulator";
import Confetti from "react-confetti";

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    targetAmount: "",
    targetDate: "",
    priority: "Medium",
    color: "#6366F1",
    icon: "🎯",
  });
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNotes, setContributionNotes] = useState("");

  const handleVoiceGoal = (voiceData) => {
    setFormData({
      title: voiceData.title || "",
      description: "",
      category: voiceData.category || "Other",
      targetAmount: voiceData.amount ? voiceData.amount.toString() : "",
      targetDate: voiceData.date || "",
      priority: "Medium",
      color: "#6366F1",
      icon: "🎯",
    });
    setShowModal(true);
    toast.success("AI filled the goal details!", { icon: "✨" });
  };

  const categoryIcons = {
    "Emergency Fund": { icon: "🏥", color: "#EF4444" },
    Vacation: { icon: "✈️", color: "#F59E0B" },
    Education: { icon: "🎓", color: "#8B5CF6" },
    House: { icon: "🏠", color: "#10B981" },
    Car: { icon: "🚗", color: "#3B82F6" },
    Investment: { icon: "📈", color: "#06B6D4" },
    Other: { icon: "🎯", color: "#6366F1" },
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalService.getGoals();
      setGoals(response.data);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }

    if (formData.targetDate && new Date(formData.targetDate) <= new Date()) {
      toast.error("Target date must be in the future");
      return;
    }

    try {
      const goalData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        icon: categoryIcons[formData.category]?.icon || "🎯",
        color: categoryIcons[formData.category]?.color || "#6366F1",
      };

      if (selectedGoal) {
        await goalService.updateGoal(selectedGoal._id, goalData);
        toast.success("Goal updated successfully!");
      } else {
        await goalService.createGoal(goalData);
        toast.success("Goal created successfully!");
      }
      fetchGoals();
      closeModal();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error(error.response?.data?.message || "Failed to save goal");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await goalService.deleteGoal(id);
      toast.success("Goal deleted successfully!");
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();

    // Validation
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast.error("Please enter a valid contribution amount");
      return;
    }

    const amount = parseFloat(contributionAmount);
    if (amount > selectedGoal.remainingAmount) {
      toast.error("Contribution amount cannot exceed remaining goal amount");
      return;
    }

    try {
      const response = await goalService.addContribution(selectedGoal._id, {
        amount: amount,
        notes: contributionNotes.trim(),
      });

      // Show confetti if milestone reached or goal completed
      if (
        response.data.newMilestones &&
        response.data.newMilestones.length > 0
      ) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success(response.data.message, { duration: 5000, icon: "🎉" });
      } else {
        toast.success("Contribution added successfully!");
      }

      fetchGoals();
      closeContributeModal();
    } catch (error) {
      console.error("Error adding contribution:", error);
      toast.error(
        error.response?.data?.message || "Failed to add contribution",
      );
    }
  };

  const handleComplete = async (goal) => {
    try {
      await goalService.completeGoal(goal._id);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      toast.success("🎉 Congratulations! Goal completed!", { duration: 5000 });
      fetchGoals();
    } catch (error) {
      console.error("Error completing goal:", error);
      toast.error("Failed to complete goal");
    }
  };

  const openEditModal = (goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate
        ? new Date(goal.targetDate).toISOString().split("T")[0]
        : "",
      priority: goal.priority,
      color: goal.color,
      icon: goal.icon,
    });
    setShowModal(true);
  };

  const openContributeModal = (goal) => {
    setSelectedGoal(goal);
    setContributionAmount("");
    setContributionNotes("");
    setShowContributeModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGoal(null);
    setFormData({
      title: "",
      description: "",
      category: "Other",
      targetAmount: "",
      targetDate: "",
      priority: "Medium",
      color: "#6366F1",
      icon: "🎯",
    });
  };

  const closeContributeModal = () => {
    setShowContributeModal(false);
    setSelectedGoal(null);
    setContributionAmount("");
    setContributionNotes("");
  };

  const getFilteredGoals = () => {
    switch (activeFilter) {
      case "active":
        return goals.filter((goal) => goal.status === "Active");
      case "completed":
        return goals.filter((goal) => goal.status === "Completed");
      default:
        if (activeFilter in categoryIcons) {
          return goals.filter((goal) => goal.category === activeFilter);
        }
        return goals;
    }
  };

  const filteredGoals = getFilteredGoals();

  const stats = {
    total: goals.length,
    active: goals.filter((g) => g.status === "Active").length,
    completed: goals.filter((g) => g.status === "Completed").length,
    totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
  };

  const overallProgress =
    stats.totalTarget > 0
      ? Math.round((stats.totalSaved / stats.totalTarget) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Financial Goals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Set targets, track progress, and achieve your dreams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VoiceInputButton
            onParsedData={handleVoiceGoal}
            pageContext="goals"
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="bg-primary p-8 rounded-2xl shadow-xl text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CircularProgress
                percentage={overallProgress}
                size={100}
                strokeWidth={8}
                color="#FFFFFF"
                backgroundColor="rgba(255,255,255,0.2)"
              />
            </div>
            <p className="text-sm opacity-90">Overall Progress</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">{stats.total}</p>
            <p className="text-sm opacity-90 mt-1">Total Goals</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">{stats.active}</p>
            <p className="text-sm opacity-90 mt-1">Active</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">{stats.completed}</p>
            <p className="text-sm opacity-90 mt-1">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">
              ₹{stats.totalSaved?.toFixed(0) || "0"}
            </p>
            <p className="text-sm opacity-90 mt-1">
              of ₹{stats.totalTarget?.toFixed(0) || "0"}
            </p>
          </div>
        </div>
      </div>

      {/* Goal Simulator */}
      <GoalSimulator goals={goals} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {["all", "active", "completed", ...Object.keys(categoryIcons)].map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeFilter === filter
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {filter in categoryIcons && (
                  <span>{categoryIcons[filter].icon}</span>
                )}
                {filter.charAt(0).toUpperCase() +
                  filter.slice(1).replace(/([A-Z])/g, " $1")}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No goals found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {activeFilter === "all"
              ? "Start your journey by creating your first financial goal"
              : `No ${activeFilter} goals at the moment`}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <div
              key={goal._id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:-translate-y-1"
              style={{ borderTopColor: goal.color, borderTopWidth: "4px" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{goal.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {goal.title}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                      {goal.category}
                    </span>
                  </div>
                </div>
                {goal.status === "Completed" && (
                  <Trophy className="w-6 h-6 text-yellow-500" />
                )}
              </div>

              {goal.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {goal.description}
                </p>
              )}

              <div className="flex justify-center mb-4">
                <CircularProgress
                  percentage={goal.progressPercentage}
                  size={140}
                  strokeWidth={10}
                  color={goal.color}
                />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Saved
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹{goal.currentAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Target
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹{goal.targetAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Remaining
                  </span>
                  <span className="font-bold text-primary">
                    ₹{goal.remainingAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                {goal.targetDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Target Date
                    </span>
                    <span
                      className={`font-medium ${goal.isOverdue ? "text-red-600" : "text-gray-900 dark:text-white"}`}
                    >
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar with Milestones */}
              <div className="mb-4">
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${goal.progressPercentage}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                  {/* Milestone markers */}
                  {[25, 50, 75].map((milestone) => (
                    <div
                      key={milestone}
                      className="absolute top-0 bottom-0 w-0.5 bg-white"
                      style={{ left: `${milestone}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {goal.status !== "Completed" && (
                  <>
                    <button
                      onClick={() => openContributeModal(goal)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <DollarSign className="w-4 h-4" />
                      Contribute
                    </button>
                    {goal.progressPercentage >= 100 && (
                      <button
                        onClick={() => handleComplete(goal)}
                        className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => openEditModal(goal)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(goal._id)}
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

      {/* Add/Edit Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                {selectedGoal ? "Edit Goal" : "Create New Goal"}
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
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Emergency Fund, Dream Vacation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="What is this goal for?"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {Object.keys(categoryIcons).map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryIcons[cat].icon} {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Amount *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAmount: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) =>
                      setFormData({ ...formData, targetDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
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
                  {selectedGoal ? "Update Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-600 p-6 rounded-t-2xl text-white">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Add Contribution
              </h2>
              <p className="text-sm opacity-90 mt-1">{selectedGoal.title}</p>
            </div>

            <form onSubmit={handleContribute} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={contributionNotes}
                  onChange={(e) => setContributionNotes(e.target.value)}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Add a note about this contribution..."
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Current
                  </span>
                  <span className="font-semibold">
                    ₹{selectedGoal.currentAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    After contribution
                  </span>
                  <span className="font-semibold text-green-600">
                    ₹
                    {(
                      selectedGoal.currentAmount +
                      (parseFloat(contributionAmount) || 0)
                    )?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Target
                  </span>
                  <span className="font-semibold">
                    ₹{selectedGoal.targetAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeContributeModal}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg"
                >
                  Add Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
