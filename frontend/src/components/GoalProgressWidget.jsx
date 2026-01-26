import { useState, useEffect } from 'react';
import { goalService } from '../services/authService';
import { Target, TrendingUp, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const GoalProgressWidget = () => {
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const [goalsRes, statsRes] = await Promise.all([
                goalService.getGoals({ status: 'Active' }),
                goalService.getGoalStats()
            ]);
            setGoals(goalsRes.data.slice(0, 3)); // Show top 3 active goals
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Financial Goals
                </h3>
                <Link
                    to="/goals"
                    className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                >
                    View All
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {stats && (
                <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                        <span className="text-2xl font-bold text-primary">{stats.overallProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${stats.overallProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                        <span>{stats.activeGoals} Active</span>
                        <span>{stats.completedGoals} Completed</span>
                    </div>
                </div>
            )}

            {goals.length === 0 ? (
                <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        No active goals yet
                    </p>
                    <Link
                        to="/goals"
                        className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center gap-1"
                    >
                        <Sparkles className="w-4 h-4" />
                        Create Your First Goal →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {goals.map((goal) => (
                        <div
                            key={goal._id}
                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{goal.icon}</span>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {goal.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            ₹{goal.currentAmount.toFixed(0)} / ₹{goal.targetAmount.toFixed(0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span
                                        className="text-lg font-bold"
                                        style={{ color: goal.color }}
                                    >
                                        {goal.progressPercentage}%
                                    </span>
                                </div>
                            </div>
                            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="absolute h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${goal.progressPercentage}%`,
                                        backgroundColor: goal.color
                                    }}
                                />
                                {/* Milestone markers */}
                                {[25, 50, 75].map(milestone => (
                                    <div
                                        key={milestone}
                                        className={`absolute top-0 bottom-0 w-0.5 ${goal.progressPercentage >= milestone ? 'bg-white' : 'bg-gray-400'
                                            }`}
                                        style={{ left: `${milestone}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {goals.length >= 3 && stats && stats.activeGoals > 3 && (
                        <Link
                            to="/goals"
                            className="block text-center py-3 text-primary hover:text-primary/80 font-medium text-sm"
                        >
                            View {stats.activeGoals - 3} more goals →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default GoalProgressWidget;
