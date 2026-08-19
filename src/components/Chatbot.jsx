// src/components/ChatbotWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // API URL - change this to your deployed API URL later
  const API_URL = import.meta.env.VITE_API_URL || 'https://chatbot-1-2g9x.onrender.com';

  // Welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: "🏠 Hi! I'm your NyumbaHub assistant.\n\nI can help you:\n• Find houses in your budget\n• Suggest neighborhoods\n• Estimate property values\n\nTry asking: 'Show me 3-bedroom houses under $400k'"
        }
      ]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to API
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text: userMessage }
    ]);

    try {
      // Call your Flask API
      const response = await axios.post(`${API_URL}/api/chat/semantic`, {
        message: userMessage
      });

      // Add bot response to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: response.data.response,
          properties: response.data.properties || []
        }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "😅 Sorry, I'm having trouble connecting. Please make sure the API is running on http://localhost:5000"
        }
      ]);
    }

    setIsLoading(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  // If chat is closed, show only the floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#2563EB',
          color: 'white',
          border: 'none',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
          zIndex: 9999,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(37, 99, 235, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 99, 235, 0.4)';
        }}
      >
        💬
      </button>
    );
  }

  // If chat is open, show the full widget
  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      right: '24px',
      width: '380px',
      height: '520px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 9999,
      animation: 'slideUp 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#2563EB',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '16px' }}>🏠 House Assistant</span>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
            Powered by AI
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        backgroundColor: '#F8FAFC',
        minHeight: '0'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '12px'
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: msg.sender === 'user' ? '#2563EB' : 'white',
              color: msg.sender === 'user' ? 'white' : '#1E293B',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              lineHeight: '1.5',
              wordBreak: 'break-word'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'white',
              borderRadius: '12px',
              color: '#94A3B8',
              fontSize: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        borderTop: '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
        flexShrink: 0
      }}>
        {[
          "3-bed under $400k",
          "Family-friendly",
          "Investment tips",
          "SF budget"
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setInput(suggestion);
              setTimeout(() => sendMessage(), 100);
            }}
            style={{
              padding: '4px 12px',
              backgroundColor: '#E2E8F0',
              border: 'none',
              borderRadius: '16px',
              fontSize: '11px',
              color: '#334155',
              cursor: 'pointer',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#CBD5E1'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#E2E8F0'}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        gap: '8px',
        backgroundColor: 'white',
        flexShrink: 0
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about houses..."
          style={{
            flex: 1,
            padding: '8px 14px',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#2563EB'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{
            padding: '8px 18px',
            backgroundColor: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && input.trim()) {
              e.currentTarget.style.background = '#1D4ED8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2563EB';
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Inject animation styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
document.head.appendChild(styleSheet);

export default ChatbotWidget;