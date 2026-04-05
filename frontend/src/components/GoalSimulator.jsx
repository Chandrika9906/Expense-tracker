import React, { useState, useMemo } from "react";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  Clock,
  TrendingUp,
} from "lucide-react";

const GoalSimulator = ({ goals }) => {
  const activeGoals = goals.filter(
    (g) => g.status === "Active" && g.targetAmount > g.currentAmount,
  );
  const [selectedGoalId, setSelectedGoalId] = useState(
    activeGoals[0]?._id || "",
  );
  const [extraMonthly, setExtraMonthly] = useState(500);

  const selectedGoal = useMemo(
    () => activeGoals.find((g) => g._id === selectedGoalId),
    [selectedGoalId, activeGoals],
  );

  const simulation = useMemo(() => {
    if (!selectedGoal) return null;

    const remaining = selectedGoal.targetAmount - selectedGoal.currentAmount;

    // Base case: assume current rate is roughly 10% of target per month if not specified
    // In a real app, we'd calculate actual rate from history
    const estimatedCurrentMonthlyRange = selectedGoal.targetAmount / 10;

    const monthsWithNormal = Math.ceil(
      remaining / estimatedCurrentMonthlyRange,
    );
    const monthsWithExtra = Math.ceil(
      remaining / (estimatedCurrentMonthlyRange + extraMonthly),
    );

    const timeSaved = monthsWithNormal - monthsWithExtra;

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + monthsWithExtra);

    return {
      monthsToReach: monthsWithExtra,
      timeSaved,
      estimatedDate: targetDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
      extraSavingsPercent: Math.round(
        (extraMonthly / estimatedCurrentMonthlyRange) * 100,
      ),
    };
  }, [selectedGoal, extraMonthly]);

  if (activeGoals.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            Goal Accelerator
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Simulate how faster you can achieve your dreams
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">
              Select Goal
            </label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
            >
              {activeGoals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">
              Extra Monthly Savings
            </label>
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center gap-3">
              <span className="text-sm font-bold">₹</span>
              <input
                type="number"
                value={extraMonthly}
                onChange={(e) => setExtraMonthly(Number(e.target.value))}
                className="bg-transparent outline-none w-full text-sm font-black text-primary"
                placeholder="500"
              />
            </div>
          </div>
        </div>

        {/* Simulation Result */}
        {simulation && (
          <div className="relative overflow-hidden p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-purple-600 uppercase mb-1">
                  New Target Date
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {simulation.estimatedDate}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-purple-600 uppercase mb-1">
                  Time to Reach
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {simulation.monthsToReach} Months
                  </span>
                </div>
              </div>
              <div className="flex flex-col col-span-2 md:col-span-1">
                <span className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                  Time Saved ✨
                </span>
                <div className="flex items-center gap-2 bg-emerald-500/10 self-start px-2 py-0.5 rounded border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-black text-emerald-600">
                    {simulation.timeSaved} Months Faster
                  </span>
                </div>
              </div>
            </div>

            {/* Summary text */}
            <p className="mt-4 text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Increasing your monthly savings by{" "}
              <span className="text-primary font-bold">₹{extraMonthly}</span> (
              {simulation.extraSavingsPercent}% increase) accelerates your{" "}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                "{selectedGoal.title}"
              </span>{" "}
              goal by{" "}
              <span className="text-emerald-500 font-black">
                {simulation.timeSaved} months
              </span>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalSimulator;
