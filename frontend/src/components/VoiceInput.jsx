import { useState, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';

const VoiceInput = ({ onExpenseParsed, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setTranscript('');
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        processVoiceInput(finalTranscript);
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.onerror = (event) => {
      setIsRecording(false);
      toast.error('Speech recognition error: ' + event.error);
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceInput = async (text) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await aiService.parseVoice(text);
      if (response.data.expenseData && response.data.expenseData.amount > 0) {
        onExpenseParsed(response.data.expenseData);
        toast.success('Voice expense parsed successfully!');
      } else {
        toast.error('Could not parse expense from voice input. Try saying amount and description.');
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Error processing voice input');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Expense Entry</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Say something like "I spent 250 rupees on lunch at McDonald's"
          </p>
        </div>
        
        <div className="p-6">
          <div className="text-center space-y-6">
            {/* Recording Animation */}
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording 
                ? 'bg-red-100 dark:bg-red-900/20 animate-pulse' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {isRecording ? (
                <MicOff className="w-16 h-16 text-red-600" />
              ) : (
                <Mic className="w-16 h-16 text-gray-600 dark:text-gray-400" />
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              {isRecording && (
                <p className="text-red-600 font-medium animate-pulse">Listening...</p>
              )}
              {isProcessing && (
                <p className="text-blue-600 font-medium">Processing with AI...</p>
              )}
              {transcript && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">"{transcript}"</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!isRecording && !isProcessing ? (
                <button
                  onClick={startRecording}
                  className="bg-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-primary/90 transition-colors"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </button>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-red-700 transition-colors"
                >
                  <MicOff className="w-5 h-5" />
                  <span>Stop Recording</span>
                </button>
              ) : (
                <div className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              )}
              
              {(transcript && !isProcessing) && (
                <button
                  onClick={onClose}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-green-700 transition-colors"
                >
                  <span>Done</span>
                </button>
              )}
            </div>

            {/* Examples */}
            <div className="text-left bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Example phrases:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• "I spent 250 rupees on lunch"</li>
                <li>• "Paid 50 for coffee at Starbucks"</li>
                <li>• "Travel expense of 500 for taxi"</li>
                <li>• "Shopping 1500 at mall yesterday"</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceInput;