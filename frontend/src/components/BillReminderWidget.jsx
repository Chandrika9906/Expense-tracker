import { useState, useEffect } from 'react';
import { billService } from '../services/authService';
import { CreditCard, AlertCircle, Clock, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const BillReminderWidget = () => {
    const [upcomingBills, setUpcomingBills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUpcomingBills();
    }, []);

    const fetchUpcomingBills = async () => {
        try {
            const response = await billService.getUpcomingBills();
            setUpcomingBills(response.data);
        } catch (error) {
            console.error('Error fetching upcoming bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickPay = async (billId) => {
        try {
            await billService.markAsPaid(billId, {
                paidDate: new Date(),
                notes: 'Quick payment from dashboard'
            });
            fetchUpcomingBills();
        } catch (error) {
            console.error('Error marking bill as paid:', error);
        }
    };

    const getDaysUntilDue = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getUrgencyColor = (daysUntilDue) => {
        if (daysUntilDue < 0) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
        if (daysUntilDue === 0) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
        if (daysUntilDue <= 3) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
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
                    <CreditCard className="w-5 h-5 text-primary" />
                    Upcoming Bills
                </h3>
                <Link
                    to="/bills"
                    className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                >
                    View All
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {upcomingBills.length === 0 ? (
                <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No upcoming bills in the next 7 days
                    </p>
                    <Link
                        to="/bills"
                        className="text-primary hover:text-primary/80 text-sm font-medium mt-2 inline-block"
                    >
                        Manage Bills →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {upcomingBills.slice(0, 5).map((bill) => {
                        const daysUntilDue = getDaysUntilDue(bill.dueDate);
                        const urgencyColor = getUrgencyColor(daysUntilDue);

                        return (
                            <div
                                key={bill._id}
                                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {bill.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(bill.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            ₹{bill.amount.toFixed(2)}
                                        </p>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${urgencyColor}`}>
                                            {daysUntilDue < 0 ? (
                                                <span className="flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Overdue
                                                </span>
                                            ) : daysUntilDue === 0 ? (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Today
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {daysUntilDue}d
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleQuickPay(bill._id)}
                                    className="w-full mt-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Mark as Paid
                                </button>
                            </div>
                        );
                    })}

                    {upcomingBills.length > 5 && (
                        <Link
                            to="/bills"
                            className="block text-center py-3 text-primary hover:text-primary/80 font-medium text-sm"
                        >
                            View {upcomingBills.length - 5} more bills →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default BillReminderWidget;
