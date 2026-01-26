import { useState } from 'react';
import { Camera, Upload, Loader, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/authService';

const OCRUpload = ({ onExpenseExtracted, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);

    // Process with AI
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/ocr/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setExtractedData(response.data.data);
        toast.success('Expense data extracted successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process image');
      console.error('OCR Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmExpense = () => {
    if (extractedData) {
      onExpenseExtracted(extractedData);
      onClose();
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Smart Receipt Scanner
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload payment screenshot or receipt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {!previewImage && (
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Drop your receipt here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or click to browse files
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Supports: JPG, PNG, WebP (Max 5MB)
                </p>
              </div>
            </div>
          )}

          {/* Preview & Processing */}
          {previewImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Receipt preview"
                  className="max-h-64 rounded-lg shadow-md"
                />
              </div>

              {processing && (
                <div className="flex items-center justify-center space-x-3 py-4">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-gray-600 dark:text-gray-400">
                    AI is analyzing your receipt...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Extracted Data */}
          {extractedData && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Extracted Information
                </h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(extractedData.confidence)}`}>
                  {Math.round(extractedData.confidence * 100)}% confidence
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {extractedData.title}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    ₹{extractedData.amount}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {extractedData.category}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {new Date(extractedData.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {extractedData.merchant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Merchant
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {extractedData.merchant}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            {extractedData && (
              <button
                onClick={handleConfirmExpense}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRUpload;