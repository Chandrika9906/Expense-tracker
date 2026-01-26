import React from 'react';
import { Shield, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const FinancialHealthGauge = ({ healthData }) => {
    if (!healthData) return null;

    const { score, status, insights, color } = healthData;

    // Calculate stroke-dasharray for the circular gauge
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Financial Health
                </h3>
                <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
                    style={{ backgroundColor: `${color}20`, color: color }}
                >
                    {status}
                </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Gauge */}
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                        {/* Background Circle */}
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-100 dark:text-gray-700"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            stroke={color}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-gray-900 dark:text-white">{score}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Score</span>
                    </div>
                </div>

                {/* Insights */}
                <div className="flex-1 space-y-3">
                    {insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="mt-1">
                                {idx === 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                                    idx === 1 ? <CheckCircle className="w-4 h-4 text-primary" /> :
                                        <AlertCircle className="w-4 h-4 text-amber-500" />}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                                {insight}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinancialHealthGauge;
