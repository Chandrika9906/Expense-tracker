import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Settings, Shield, Bell, Moon, Sun, Save, Edit3, Camera, Database, Trash2, Sparkles, AlertTriangle, Upload, Smartphone, Key, Eye, EyeOff, Link, Award, Trophy, Target, Zap, Star, Crown, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { exportService, testService } from '../services/authService';
import { profileService } from '../services/profileService';

const Profile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userLevel, setUserLevel] = useState(5);
  const [userPoints, setUserPoints] = useState(1250);
  const [streak, setStreak] = useState(12);
  const [errors, setErrors] = useState({});

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currency: 'INR',
    language: 'en',
    timezone: 'Asia/Kolkata'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [integrations, setIntegrations] = useState({
    googlePay: false,
    phonePe: true,
    paytm: false,
    bankSync: true,
    cloudBackup: true
  });

  const achievements = [
    { id: 1, name: 'First Expense', icon: '🎯', unlocked: true, description: 'Added your first expense' },
    { id: 2, name: 'Budget Master', icon: '💰', unlocked: true, description: 'Created 5 budgets' },
    { id: 3, name: 'Streak Keeper', icon: '🔥', unlocked: true, description: '7-day tracking streak' },
    { id: 4, name: 'Goal Achiever', icon: '🏆', unlocked: false, description: 'Complete your first goal' },
    { id: 5, name: 'Savings Pro', icon: '💎', unlocked: false, description: 'Save ₹50,000' }
  ];

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await profileService.getProfile();
      const userData = response.data;
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        currency: userData.currency || 'INR',
        language: userData.language || 'en',
        timezone: userData.timezone || 'Asia/Kolkata'
      });
      setTwoFactorEnabled(userData.twoFactorEnabled || false);
      if (userData.profileImage) {
        setProfileImage(`http://localhost:5001${userData.profileImage}`);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileData.name || profileData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!profileData.email || !/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const formData = new FormData();
      formData.append('profileImage', file);
      
      try {
        setLoading(true);
        const response = await profileService.uploadImage(formData);
        setProfileImage(`http://localhost:5001${response.data.imageUrl}`);
        toast.success('Profile image updated successfully!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to upload image');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      toast.error('Please fix the errors below');
      return;
    }
    
    setLoading(true);
    try {
      const response = await profileService.updateProfile(profileData);
      toast.success(response.data.message);
      setErrors({});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      toast.error('Please fix the errors below');
      return;
    }
    
    setLoading(true);
    try {
      const response = await profileService.changePassword(passwordData);
      toast.success(response.data.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      const newStatus = !twoFactorEnabled;
      const response = await profileService.toggle2FA(newStatus);
      setTwoFactorEnabled(newStatus);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update 2FA settings');
    }
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      toast.loading('Seeding test data...', { id: 'seed-data' });
      const response = await testService.seedData();
      toast.success(response.data.message, { id: 'seed-data' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Failed to seed test data', { id: 'seed-data' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('WARNING: This will permanently delete ALL your expenses, budgets, bills, and goals. This cannot be undone. Are you sure?')) {
      return;
    }

    try {
      setLoading(true);
      toast.loading('Clearing your data...', { id: 'clear-data' });
      const response = await testService.clearData();
      toast.success(response.data.message, { id: 'clear-data' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Failed to clear data', { id: 'clear-data' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    toast.success(`Switched to ${newDarkMode ? 'dark' : 'light'} mode`);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportService.downloadData();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const toggleIntegration = (key) => {
    setIntegrations(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success(`${key} ${integrations[key] ? 'disconnected' : 'connected'}`);
  };

  const getLevelProgress = () => {
    const pointsForNextLevel = (userLevel + 1) * 200;
    const currentLevelPoints = userLevel * 200;
    const progress = ((userPoints - currentLevelPoints) / (pointsForNextLevel - currentLevelPoints)) * 100;
    return Math.min(progress, 100);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'gamification', label: 'Achievements', icon: Trophy },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'data', label: 'Data Management', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Enhanced Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email || 'user@example.com'}
              </p>
              
              {/* Level & Points */}
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Level {userLevel}</span>
                  <span className="text-sm text-purple-600 dark:text-purple-400">{userPoints} pts</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getLevelProgress()}%` }}
                  ></div>
                </div>
              </div>

              {/* Streak Counter */}
              <div className="mt-3 flex items-center justify-center space-x-2 text-sm">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600 dark:text-gray-400">{streak} day streak</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Enhanced Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                </div>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={profileData.currency}
                        onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={profileData.language}
                        onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="te">తెలుగు (Telugu)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={profileData.timezone}
                      onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                    >
                      <option value="Asia/Kolkata">India Standard Time</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="Europe/London">Greenwich Mean Time</option>
                      <option value="Asia/Tokyo">Japan Standard Time</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Enhanced Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Security Settings
                  </h2>
                </div>
                
                {/* Two-Factor Authentication */}
                <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle2FA()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {twoFactorEnabled && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                        ✅ Two-factor authentication is enabled
                      </p>
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        View backup codes
                      </button>
                    </div>
                  )}
                </div>

                {/* Password Change */}
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.currentPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.newPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                      {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" />
                      <span>{loading ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>

                {/* Login Sessions */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Active Sessions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
                          <p className="text-sm text-gray-500">Windows • Chrome • India</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">Active now</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-4 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    Logout from All Devices
                  </button>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Link className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Integrations & Connectivity
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {/* Payment Apps */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Payment Apps
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'googlePay', name: 'Google Pay', icon: '💳', color: 'bg-blue-500' },
                        { key: 'phonePe', name: 'PhonePe', icon: '📱', color: 'bg-purple-500' },
                        { key: 'paytm', name: 'Paytm', icon: '💰', color: 'bg-blue-600' }
                      ].map((app) => (
                        <div key={app.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${app.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                              {app.icon}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{app.name}</h4>
                              <p className="text-sm text-gray-500">
                                {integrations[app.key] ? 'Connected' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleIntegration(app.key)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              integrations[app.key]
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {integrations[app.key] ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cloud Services */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Cloud & Backup
                    </h3>
                    <div className="space-y-4">
                      {[
                        { key: 'bankSync', name: 'Bank Account Sync', icon: '🏦', description: 'Automatically import transactions' },
                        { key: 'cloudBackup', name: 'Cloud Backup', icon: '☁️', description: 'Backup data to Google Drive' }
                      ].map((service) => (
                        <div key={service.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{service.icon}</div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
                              <p className="text-sm text-gray-500">{service.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleIntegration(service.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              integrations[service.key] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                integrations[service.key] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gamification Tab */}
            {activeTab === 'gamification' && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Trophy className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Achievements & Progress
                  </h2>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Current Level</p>
                        <p className="text-3xl font-bold">{userLevel}</p>
                      </div>
                      <Crown className="w-12 h-12 text-purple-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100">Current Streak</p>
                        <p className="text-3xl font-bold">{streak} days</p>
                      </div>
                      <Zap className="w-12 h-12 text-orange-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Total Points</p>
                        <p className="text-3xl font-bold">{userPoints}</p>
                      </div>
                      <Star className="w-12 h-12 text-green-200" />
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Achievements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 border rounded-xl transition-all ${
                          achievement.unlocked
                            ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                            : 'border-gray-200 bg-gray-50 dark:bg-gray-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`text-3xl ${
                            achievement.unlocked ? 'grayscale-0' : 'grayscale'
                          }`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              achievement.unlocked
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {achievement.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {achievement.description}
                            </p>
                          </div>
                          {achievement.unlocked && (
                            <div className="text-green-500">
                              <Award className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenges */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Active Challenges
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">
                          💰 Save ₹10,000 this month
                        </h4>
                        <span className="text-sm text-blue-600">7 days left</span>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-sm text-blue-600 mt-2">₹6,500 / ₹10,000 (65%)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Settings className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Preferences
                  </h2>
                </div>
                <div className="space-y-6">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Dark Mode
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Toggle between light and dark themes
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive notifications for budget alerts
                        </p>
                      </div>
                    </div>
                    <button
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  {/* Data Export */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Data Export
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Download your expense data in CSV format
                    </p>
                    <button
                      onClick={handleExport}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Export Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data Management Tab */}
            {activeTab === 'data' && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Database className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Data Management
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Seed Data */}
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          Seed Test Data
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Automatically generate a complete set of test data including expenses, budgets, bills, incomes, and goals. Perfect for exploring app features!
                        </p>
                        <button
                          onClick={handleSeedData}
                          disabled={isSeeding}
                          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-medium flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {isSeeding ? 'Seeding...' : 'Seed Sample Data ✨'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Clear Data */}
                  <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          Reset Account Data
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Permanently delete all your transaction history, budgets, and goals. This action is irreversible.
                        </p>
                        <button
                          onClick={handleClearData}
                          className="bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-900/50 px-6 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all font-medium flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;