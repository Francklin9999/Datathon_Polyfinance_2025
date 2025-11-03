import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const conversationIdRef = useRef(null);

  // Initialize Web Speech API for voice input
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        // Auto-send after voice input (optional - can be removed if you prefer manual send)
        // sendMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Connect to WebSocket or use HTTP fallback
  useEffect(() => {
    if (isOpen && !wsRef.current) {
      connectChat();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectChat = async () => {
    try {
      // Try WebSocket connection first
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const wsUrl = window.location.protocol === 'https:'
        ? `wss://${window.location.host}/api/ai/aws-voice/ws`
        : apiBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/ai/aws-voice/ws';
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Chat connected via WebSocket');
        setIsConnected(true);
        wsRef.current = ws;
        conversationIdRef.current = crypto.randomUUID();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
      };

      // Add initial greeting after connection
      setTimeout(() => {
        if (messages.length === 0) {
          addMessage('assistant', "Hello! I'm your financial AI assistant. How can I help you today? You can type your message or use the microphone to speak.");
        }
      }, 500);
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      setIsConnected(false);
      // Still allow chat using HTTP fallback
      if (messages.length === 0) {
        addMessage('assistant', "Hello! I'm your financial AI assistant. How can I help you today? (Using HTTP mode)");
      }
    }
  };

  const handleWebSocketMessage = (data) => {
    if (data.type === 'message') {
      addMessage(data.role, data.text);
    } else if (data.type === 'audio' && data.audio) {
      playAudio(data.audio);
    } else if (data.type === 'error') {
      addMessage('assistant', `Error: ${data.message}`);
      setIsLoading(false);
    }
  };

  const addMessage = (role, text) => {
    const message = {
      id: Date.now() + Math.random(),
      role,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = async (textToSend = null) => {
    const messageText = textToSend || inputText.trim();
    
    if (!messageText) return;

    // Add user message immediately
    const userMessage = {
      id: Date.now() + Math.random(),
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setMessages((prev) => {
      const updatedMessages = [...prev, userMessage];
      
      // Try WebSocket first
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({
            type: 'text',
            text: messageText,
          }));
        } catch (error) {
          console.error('Error sending via WebSocket:', error);
          // Fallback to HTTP
          sendViaHTTP(messageText, updatedMessages);
        }
      } else {
        // Use HTTP fallback
        sendViaHTTP(messageText, updatedMessages);
      }
      
      return updatedMessages;
    });
    
    setInputText('');
    setIsLoading(true);
  };

  const sendViaHTTP = async (messageText, currentMessages = []) => {
    try {
      const systemPrompt = `You are a financial AI assistant for IntelliRisk. 
You help users understand financial markets, analyze portfolios, interpret regulatory documents, 
and provide insights on equities, fixed income, options, commodities, and FX markets.

Be concise, professional, and helpful. Always provide actionable insights when possible.`;

      // Build conversation history from recent messages (last 10 messages for context)
      // Exclude the last message if it's the current user message we're processing
      const messagesForContext = currentMessages.length > 0 ? currentMessages : messages;
      const recentMessages = messagesForContext
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-10);
      
      let conversationContext = '';
      if (recentMessages.length > 0) {
        conversationContext = '\n\nPrevious conversation:\n' + 
          recentMessages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n') +
          '\n\nCurrent conversation:';
      }

      const fullPrompt = `${systemPrompt}${conversationContext}\n\nUser: ${messageText}\n\nAssistant:`;

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiBaseUrl}/ai/invoke-llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          add_context_from_internet: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantText = data.text || data.response || 'I apologize, but I could not generate a response.';
        addMessage('assistant', assistantText);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message via HTTP:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('Failed to start voice recognition. Please check your microphone permissions.');
      }
    }
  };

  const playAudio = (audioBase64) => {
    try {
      const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const blob = new Blob([audioData], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    conversationIdRef.current = crypto.randomUUID();
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'rotate-180' : ''
        }`}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        {isLoading && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-40 w-96 h-[600px] transition-all duration-300 ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <Card className="h-full flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={clearChat}
                  className="text-white hover:bg-gray-700 text-xs"
                  title="Clear Chat"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm mb-2">Start a conversation</p>
                <p className="text-xs opacity-70">Type a message or use the microphone to speak</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or speak..."
                  rows={1}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  disabled={isLoading}
                  style={{ minHeight: '42px', maxHeight: '120px' }}
                />
                {isListening && (
                  <div className="absolute bottom-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <Button
                onClick={startListening}
                disabled={isLoading || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)}
                className={`${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white`}
                size="icon"
                title={isListening ? 'Stop Listening' : 'Start Voice Input'}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              <Button
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="icon"
                title="Send Message"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                <Mic className="w-3 h-3" />
                Listening... Speak now
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default ChatAssistant;

