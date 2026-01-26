import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NetworkStatus from './components/NetworkStatus';
import Layout from './layouts/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Income from './pages/Income';
import CalendarView from './pages/CalendarView';
import Bills from './pages/Bills';
import Goals from './pages/Goals';

function App() {
  const isAuthenticated = localStorage.getItem('token');

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <NetworkStatus />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Layout>
                  <Expenses />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/budgets" element={
              <ProtectedRoute>
                <Layout>
                  <Budgets />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/income" element={
              <ProtectedRoute>
                <Layout>
                  <Income />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Layout>
                  <CalendarView />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/bills" element={
              <ProtectedRoute>
                <Layout>
                  <Bills />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute>
                <Layout>
                  <Goals />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} />
          </Routes>
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;