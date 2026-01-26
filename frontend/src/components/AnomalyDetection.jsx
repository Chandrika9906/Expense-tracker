import React from 'react';
import { AlertTriangle, TrendingUp, Info, ArrowUpRight } from 'lucide-react';

const AnomalyDetection = ({ anomalies }) => {
    if (!anomalies || anomalies.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Spending Anomalies</h3>
            </div>

            {anomalies.map((anomaly, idx) => (
                <div
                    key={idx}
                    className={`p-4 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md ${anomaly.severity === 'high'
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-500'
                        }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${anomaly.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{anomaly.category}</span>
                        </div>
                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${anomaly.severity === 'high' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'}`}>
                            {anomaly.severity} Alert
                        </span>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                        {anomaly.reason}
                    </p>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Current</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white">₹{anomaly.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Typical Avg</span>
                            <span className="text-sm font-bold text-gray-500">₹{anomaly.average.toFixed(2)}</span>
                        </div>
                        <div className="ml-auto">
                            <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View History <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AnomalyDetection;
