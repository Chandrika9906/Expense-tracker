import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Command } from 'lucide-react';
import { aiService } from '../services/authService';
import toast from 'react-hot-toast';

const VoiceInputButton = ({ onParsedData, pageContext = 'general' }) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN';

            recognitionRef.current.onresult = async (event) => {
                const transcript = event.results[0][0].transcript;
                setIsListening(false);
                handleTranscript(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                toast.error('Voice recognition failed. Please try again.');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const handleTranscript = async (text) => {
        try {
            setIsProcessing(true);
            toast.loading('Processing voice input...', { id: 'voice-process' });

            const response = await aiService.parseVoice(text);
            toast.dismiss('voice-process');

            if (response.data) {
                onParsedData(response.data);
                toast.success('Voice input parsed successfully!', { icon: '🎤' });
            } else {
                toast.error("Could't understand the details. Try saying 'Spent 500 on coffee'.");
            }
        } catch (error) {
            console.error('Error processing voice:', error);
            toast.dismiss('voice-process');
            toast.error('AI failed to process voice input.');
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            if (!recognitionRef.current) {
                toast.error('Voice recognition not supported in this browser.');
                return;
            }
            recognitionRef.current.start();
            setIsListening(true);
            toast('Listening...', { icon: '🎙️', duration: 2000 });
        }
    };

    return (
        <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`relative p-3 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-md flex items-center gap-2 ${isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
            title={`Voice Input (${pageContext})`}
        >
            {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : isListening ? (
                <MicOff className="w-5 h-5" />
            ) : (
                <Mic className="w-5 h-5" />
            )}
            {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
            )}
        </button>
    );
};

export default VoiceInputButton;
