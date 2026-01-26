import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, CreditCard, BarChart3, User, LogOut, Moon, Sun, Target, DollarSign, Calendar, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import Chatbot from '../components/Chatbot';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/income', icon: DollarSign, label: 'Income' },
    { path: '/expenses', icon: CreditCard, label: 'Expenses' },
    { path: '/bills', icon: Receipt, label: 'Bills' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/budgets', icon: Target, label: 'Budgets' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="w-[85vw] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-primary">
                Expense Tracker
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-[83vw] mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-16">
        {children}
      </main>
      <Chatbot />
    </div>
  );
};

export default Layout;