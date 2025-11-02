import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const AWSVoiceChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [awsConfig, setAwsConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userInput, setUserInput] = useState('');
  const wsRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Load AWS config from backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/ai/aws-voice/config');
        if (response.ok) {
          const config = await response.json();
          setAwsConfig(config);
        } else {
          console.warn('AWS config not available. Please configure AWS credentials in backend.');
        }
      } catch (error) {
        console.error('Failed to load AWS config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (isCallActive && awsConfig && awsConfig.configured) {
      connectWebSocket();
    } else if (!isCallActive && wsRef.current) {
      disconnectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        disconnectWebSocket();
      }
    };
  }, [isCallActive, awsConfig]);

  // Scroll to bottom of transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const connectWebSocket = () => {
    try {
      // Convert to WebSocket URL (ws:// or wss://)
      const wsUrl = window.location.protocol === 'https:' 
        ? `wss://${window.location.host}/api/ai/aws-voice/ws`
        : `ws://localhost:8000/api/ai/aws-voice/ws`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current = ws;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        if (isCallActive) {
          // Try to reconnect
          setTimeout(() => {
            if (isCallActive) {
              connectWebSocket();
            }
          }, 1000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const handleWebSocketMessage = (data) => {
    const messageType = data.type;

    if (messageType === 'message') {
      const message = {
        role: data.role,
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setTranscript((prev) => [...prev, message]);

      // Play audio if available (from Polly)
      if (messageType === 'audio' && data.audio) {
        playAudio(data.audio);
      }
    } else if (messageType === 'audio' && data.audio) {
      playAudio(data.audio);
    } else if (messageType === 'error') {
      console.error('WebSocket error:', data.message);
      setTranscript((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error: ${data.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
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

  const startCall = async () => {
    if (!awsConfig || !awsConfig.configured) {
      alert('AWS services are not configured. Please configure AWS credentials in backend.');
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsCallActive(true);
      setTranscript([
        {
          role: 'assistant',
          text: "Hello! I'm your financial AI coworker. How can I help you today?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Initialize MediaRecorder for audio capture (optional - for voice input)
      // For now, we'll use text input, but this sets up for future voice integration
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // WebSocket will be connected via useEffect
      
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to access microphone. Please check permissions.');
      setIsCallActive(false);
    }
  };

  const stopCall = () => {
    setIsCallActive(false);
    disconnectWebSocket();
    setTranscript([]);
  };

  const sendMessage = () => {
    if (!userInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = userInput.trim();
    setUserInput('');

    // Add user message to transcript
    setTranscript((prev) => [
      ...prev,
      {
        role: 'user',
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    // Send message via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'text',
      text: message,
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle mute (for future voice input)
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In future implementation, this will mute/unmute microphone
  };

  if (isLoading) {
    return null;
  }

  if (!awsConfig || !awsConfig.configured) {
    return null;
  }

  return (
    <>
      {/* Slide Button */}
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
        {isCallActive && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
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
                <div className={`w-3 h-3 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <h3 className="text-lg font-semibold text-white">AI Coworker</h3>
              </div>
              <div className="flex items-center gap-2">
                {isCallActive && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-gray-700"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={isCallActive ? stopCall : startCall}
                  className={`${
                    isCallActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  title={isCallActive ? 'End Call' : 'Start Call'}
                >
                  {isCallActive ? (
                    <PhoneOff className="w-5 h-5" />
                  ) : (
                    <Phone className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Transcript Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcript.length === 0 && !isCallActive && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm mb-2">Click the phone icon to start</p>
                <p className="text-xs opacity-70">a conversation with your AI coworker</p>
                {!awsConfig.configured && (
                  <p className="text-xs text-yellow-500 mt-4 p-2 bg-yellow-500/10 rounded">
                    Configure AWS credentials to enable voice chat
                  </p>
                )}
              </div>
            )}

            {isCallActive && transcript.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm">Connecting to AI coworker...</p>
              </div>
            )}

            {transcript.length > 0 && (
              <>
                {transcript.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Input Area */}
          {isCallActive && (
            <div className="p-4 border-t border-gray-700 bg-gray-800/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  disabled={!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || !wsRef.current || wsRef.current?.readyState !== WebSocket.OPEN}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Send
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            <p className="text-xs text-gray-500 text-center">
              Powered by AWS • Bedrock + Transcribe + Polly
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AWSVoiceChat;
