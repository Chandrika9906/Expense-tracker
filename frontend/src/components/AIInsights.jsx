import { useState, useEffect } from 'react';
import { aiService } from '../services/authService';
import { Brain, TrendingUp, Lightbulb } from 'lucide-react';

const AIInsights = () => {
  const [advice, setAdvice] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    try {
      const [adviceRes, predictionRes] = await Promise.all([
        aiService.getAdvice(),
        aiService.getPrediction()
      ]);
      setAdvice(adviceRes.data.advice);
      setPrediction(predictionRes.data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Financial Tips</h3>
        </div>
        <div className="space-y-3">
          {advice.map((tip, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-300">{index + 1}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {prediction && prediction.prediction > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Next Month Prediction</h3>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ₹{prediction.prediction.toLocaleString()}
            </div>
            <div className="flex items-center justify-center">
              <Brain className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(prediction.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;