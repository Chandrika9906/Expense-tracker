import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Bell, Brain, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PredictiveAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictiveAlerts();
    const interval = setInterval(fetchPredictiveAlerts, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchPredictiveAlerts = async () => {
    try {
      const response = await fetch('/api/ai/predictive-alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      setAlerts(data.alerts || []);
      setPredictions(data.predictions || {});
      
      // Show high-priority alerts as toasts
      data.alerts?.forEach(alert => {
        if (alert.priority === 'high' && alert.showToast) {
          toast.error(alert.message, { duration: 8000, icon: '⚠️' });
        }
      });
    } catch (error) {
      console.error('Error fetching predictive alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await fetch(`/api/ai/dismiss-alert/${alertId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'budget_overflow': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'spending_spike': return <TrendingUp className="h-5 w-5 text-orange-500" />;
      case 'goal_risk': return <Target className="h-5 w-5 text-yellow-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20';
      case 'low': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Brain className="h-5 w-5 text-purple-500 mr-2" />
          <h3 className="text-lg font-semibold">AI Predictive Alerts</h3>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No alerts at the moment. You're doing great!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${getAlertColor(alert.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {alert.message}
                      </p>
                      {alert.suggestion && (
                        <div className="bg-white dark:bg-gray-700 rounded p-2 text-xs">
                          <strong>AI Suggestion:</strong> {alert.suggestion}
                        </div>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
                        <span className="mx-2">•</span>
                        <span>{alert.timeframe}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Predictions Panel */}
      {Object.keys(predictions).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold">Smart Predictions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(predictions).map(([category, prediction]) => (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{category}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    prediction.trend === 'increasing' ? 'bg-red-100 text-red-700' :
                    prediction.trend === 'decreasing' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {prediction.trend}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  ₹{prediction.amount?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Next 30 days • {Math.round(prediction.confidence * 100)}% confidence
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAlerts;