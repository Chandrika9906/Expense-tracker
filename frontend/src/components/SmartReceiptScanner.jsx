import { useState, useRef } from 'react';
import { Camera, Upload, Scan, Languages, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SmartReceiptScanner = ({ onExpenseExtracted }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const fileInputRef = useRef(null);

  const processReceipt = async (file) => {
    setIsScanning(true);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await fetch('/api/ai/smart-receipt-scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setExtractedData(result.data);
        setConfidence(result.confidence);
        toast.success(`Receipt processed with ${Math.round(result.confidence * 100)}% confidence!`);
      } else {
        toast.error('Failed to process receipt');
      }
    } catch (error) {
      toast.error('Error processing receipt');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) processReceipt(file);
  };

  const confirmExtraction = () => {
    if (extractedData && onExpenseExtracted) {
      onExpenseExtracted(extractedData);
      setExtractedData(null);
      toast.success('Expense added successfully!');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Scan className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-semibold">Smart Receipt Scanner</h3>
        <Languages className="h-4 w-4 text-green-500 ml-2" title="Multi-language support" />
      </div>

      {!extractedData ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Upload receipt in any language (English, Hindi, Tamil, etc.)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isScanning ? 'Processing...' : 'Choose File'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Receipt Processed ({Math.round(confidence * 100)}% confidence)
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Item:</label>
                <p className="text-gray-900 dark:text-white">{extractedData.title}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Amount:</label>
                <p className="text-gray-900 dark:text-white">₹{extractedData.amount}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Category:</label>
                <p className="text-gray-900 dark:text-white">{extractedData.category}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Merchant:</label>
                <p className="text-gray-900 dark:text-white">{extractedData.merchant}</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={confirmExtraction}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Add Expense
              </button>
              <button
                onClick={() => setExtractedData(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Scan Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartReceiptScanner;