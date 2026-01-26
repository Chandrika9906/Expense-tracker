import { useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';

const SmartSearch = ({ onFiltersApplied, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedFilters, setParsedFilters] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const response = await aiService.parseQuery(query);
      const filters = response.data.filters;
      
      if (Object.keys(filters).length === 0) {
        toast.error('Could not understand the query. Try being more specific.');
        return;
      }

      setParsedFilters(filters);
      toast.success('Query parsed successfully!');
    } catch (error) {
      toast.error('Error parsing query');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (parsedFilters) {
      onFiltersApplied(parsedFilters);
      onClose();
    }
  };

  const examples = [
    "Show food expenses last month",
    // "Travel expenses over 1000 rupees",
    // "Shopping expenses in December 2024",
    "All expenses under 500 this week",
    "Entertainment expenses sorted by amount",
    "Healthcare expenses from January to March"
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
              Smart Search
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Search your expenses using natural language
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What are you looking for?
              </label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Show food expenses last month"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Parse Query</span>
                </>
              )}
            </button>

            {/* Parsed Filters */}
            {parsedFilters && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <h3 className="font-medium text-green-900 dark:text-green-100 mb-3">
                  Parsed Filters:
                </h3>
                <div className="space-y-2">
                  {Object.entries(parsedFilters).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-green-700 dark:text-green-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                      </span>
                      <span className="text-green-900 dark:text-green-100 font-medium">
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={applyFilters}
                  className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            )}

            {/* Examples */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Try these examples:
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(example)}
                    className="text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Search Tips:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Mention categories: food, travel, shopping, etc.</li>
                <li>• Use time periods: last month, this week, December</li>
                <li>• Specify amounts: over 1000, under 500, between 100-500</li>
                <li>• Add sorting: sorted by amount, ordered by date</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSearch;