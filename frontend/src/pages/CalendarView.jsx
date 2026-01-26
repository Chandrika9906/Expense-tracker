import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { expenseService, incomeService } from '../services/authService';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

const CalendarView = () => {
    const [date, setDate] = useState(new Date());
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch all expense & income data (ideally should be filtered by month, but fetching all for small scale)
            const [expensesRes, incomesRes] = await Promise.all([
                expenseService.getExpenses({ limit: 1000 }), // Increased limit to get most data
                incomeService.getIncomes()
            ]);
            setExpenses(expensesRes.data.expenses);
            setIncomes(incomesRes.data);
        } catch (error) {
            console.error('Error fetching calendar data', error);
        } finally {
            setLoading(false);
        }
    };

    const getTileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayStr = date.toISOString().split('T')[0];

            const dayExpenses = expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === dayStr);
            const dayIncomes = incomes.filter(i => new Date(i.date).toISOString().split('T')[0] === dayStr);

            const totalExpense = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const totalIncome = dayIncomes.reduce((sum, i) => sum + i.amount, 0);

            if (totalExpense === 0 && totalIncome === 0) return null;

            return (
                <div className="flex flex-col items-center mt-1 space-y-0.5">
                    {totalIncome > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" title={`Income: ₹${totalIncome}`} />
                    )}
                    {totalExpense > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" title={`Expense: ₹${totalExpense}`} />
                    )}
                </div>
            );
        }
        return null;
    };

    const selectedDateStr = date.toISOString().split('T')[0];
    const selectedExpenses = expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === selectedDateStr);
    const selectedIncomes = incomes.filter(i => new Date(i.date).toISOString().split('T')[0] === selectedDateStr);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Calendar View
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualise your financial patterns over time
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <style>{`
            .react-calendar {
              width: 100%;
              border: none;
              background: transparent;
              font-family: inherit;
            }
            .react-calendar__tile {
              padding: 1.5em 0.5em;
              border-radius: 8px;
            }
            .react-calendar__tile:enabled:hover,
            .react-calendar__tile:enabled:focus {
              background-color: #eff6ff;
              color: #2563eb;
            }
            .react-calendar__tile--active {
              background: #2563eb !important;
              color: white !important;
            }
            .react-calendar__month-view__weekdays {
              font-weight: 600;
              text-transform: uppercase;
              font-size: 0.75em;
              color: #6b7280;
            }
            .dark .react-calendar__tile:enabled:hover,
            .dark .react-calendar__tile:enabled:focus {
              background-color: #1f2937;
              color: #60a5fa;
            }
            .dark .react-calendar {
              color: #e5e7eb;
            }
            .dark .react-calendar__month-view__days__day--weekend {
              color: #fca5a5;
            }
            .dark .react-calendar__month-view__days__day--neighboringMonth {
              color: #4b5563;
            }
          `}</style>
                    <Calendar
                        onChange={setDate}
                        value={date}
                        tileContent={getTileContent}
                        className="w-full"
                        nextLabel={<ChevronRight className="w-4 h-4" />}
                        prevLabel={<ChevronLeft className="w-4 h-4" />}
                    />
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2" /> Income
                            </h4>
                            {selectedIncomes.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedIncomes.map(income => (
                                        <div key={income._id} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">{income.source}</p>
                                            </div>
                                            <span className="font-semibold text-green-700 dark:text-green-300">+₹{income.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No income records for this day</p>
                            )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                            <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" /> Expenses
                            </h4>
                            {selectedExpenses.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedExpenses.map(expense => (
                                        <div key={expense._id} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">{expense.title}</p>
                                                <p className="text-xs text-gray-500">{expense.category}</p>
                                            </div>
                                            <span className="font-semibold text-blue-700 dark:text-blue-300">-₹{expense.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No expenses for this day</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
