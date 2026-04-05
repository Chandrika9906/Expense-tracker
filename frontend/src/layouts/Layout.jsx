import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  CreditCard,
  BarChart3,
  User,
  LogOut,
  Moon,
  Sun,
  Target,
  DollarSign,
  Calendar,
  Receipt,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import Chatbot from "../components/Chatbot";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true",
  );

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed);
  }, [sidebarCollapsed]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/income", icon: DollarSign, label: "Income" },
    { path: "/expenses", icon: CreditCard, label: "Expenses" },
    { path: "/bills", icon: Receipt, label: "Bills" },
    { path: "/goals", icon: Target, label: "Goals" },
    { path: "/budgets", icon: Target, label: "Budgets" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const currentHeading =
    navItems.find((item) => item.path === location.pathname)?.label ||
    "Dashboard";
  const desktopSidebarOffset = sidebarCollapsed ? "5rem" : "18rem";

  return (
    <div
      className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-500"
      style={{ "--sidebar-offset": desktopSidebarOffset }}
    >
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-72 ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"} z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex-1 min-w-0 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {sidebarCollapsed ? "ET" : "Expense Tracker"}
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              )}
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        <div className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-64px)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "px-3"} py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                location.pathname === item.path
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
              title={item.label}
            >
              <item.icon
                className={`w-4 h-4 ${sidebarCollapsed ? "" : "mr-3"}`}
              />
              {!sidebarCollapsed && item.label}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className={`mt-4 w-full flex items-center ${sidebarCollapsed ? "justify-center px-2" : "px-3"} py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300`}
            title="Logout"
          >
            <LogOut className={`w-4 h-4 ${sidebarCollapsed ? "" : "mr-3"}`} />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-offset)] h-16 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 z-30 backdrop-blur-sm transition-all duration-300">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white ml-10 lg:ml-0">
            {currentHeading}
          </h1>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {user?.name}
            </span>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-300"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="lg:ml-[var(--sidebar-offset)] py-6 px-4 sm:px-6 lg:px-8 mt-16 animate-fade-in transition-all duration-300">
        {children}
      </main>
      <Chatbot />
    </div>
  );
};

export default Layout;
