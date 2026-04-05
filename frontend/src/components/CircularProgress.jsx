import { useEffect, useState } from 'react';

const CircularProgress = ({
    percentage = 0,
    size = 120,
    strokeWidth = 8,
    color = '#6366F1',
    backgroundColor = '#E5E7EB',
    showPercentage = true,
    animated = true
}) => {
    const [displayPercentage, setDisplayPercentage] = useState(0);

    useEffect(() => {
        if (animated) {
            let current = 0;
            const increment = percentage / 50; // Animate over 50 frames
            const timer = setInterval(() => {
                current += increment;
                if (current >= percentage) {
                    setDisplayPercentage(percentage);
                    clearInterval(timer);
                } else {
                    setDisplayPercentage(Math.floor(current));
                }
            }, 20);
            return () => clearInterval(timer);
        } else {
            setDisplayPercentage(percentage);
        }
    }, [percentage, animated]);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (displayPercentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            {showPercentage && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {displayPercentage}%
                    </span>
                </div>
            )}
        </div>
    );
};

export default CircularProgress;
