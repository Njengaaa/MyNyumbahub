// src/components/ChatbotWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (textToSend) => {
    const messageText = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageText || isLoading) return;

    setInput('');
    setIsLoading(true);

    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text: messageText }
    ]);

    try {
      const response = await apiClient.post('/api/chat/semantic', {
        message: messageText
      });

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: response.data.response || "Here are some properties that match your request:",
          properties: response.data.properties || []
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "😅 Sorry, I'm having trouble connecting right now."
        }
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Global CSS Styles for Animations & Hover States */}
      <style>{`
        /* Animations */
        @keyframes pulseSkeleton {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .skeleton {
          background-color: #E2E8F0;
          animation: pulseSkeleton 1.5s ease-in-out infinite;
        }

        /* Hover Effects */
        .cb-floating-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .cb-floating-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 28px rgba(37, 99, 235, 0.5) !important;
        }

        .cb-close-btn {
          transition: background 0.2s ease;
          border-radius: 6px;
        }
        .cb-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .cb-suggestion-btn {
          transition: background 0.2s ease, transform 0.1s ease;
        }
        .cb-suggestion-btn:hover {
          background-color: #CBD5E1 !important;
          transform: translateY(-1px);
        }

        .cb-send-btn {
          transition: background 0.2s ease, opacity 0.2s ease;
        }
        .cb-send-btn:not(:disabled):hover {
          background-color: #1D4ED8 !important;
        }

        .cb-property-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .cb-property-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important;
        }

        .cb-input {
          transition: border-color 0.2s ease;
        }
        .cb-input:focus {
          border-color: #2563EB !important;
        }
      `}</style>

      {/* Launcher Button when closed */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="cb-floating-btn"
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          💬
        </button>
      ) : (
        /* Expanded Chat Widget */
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          width: '380px',
          height: '540px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
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
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>Powered by AI</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="cb-close-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '22px',
                cursor: 'pointer',
                padding: '2px 8px'
              }}
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
                marginBottom: '14px',
                width: '100%'
              }}>
                {msg.text && (
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: msg.sender === 'user' ? '#2563EB' : 'white',
                    color: msg.sender === 'user' ? 'white' : '#1E293B',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                    marginBottom: msg.properties?.length ? '8px' : '0'
                  }}>
                    {msg.text}
                  </div>
                )}

                {/* Property Cards with Hover Effect */}
                {msg.properties && msg.properties.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    overflowX: 'auto',
                    width: '100%',
                    paddingBottom: '6px',
                    paddingTop: '4px'
                  }}>
                    {msg.properties.map((property, idx) => (
                      <div
                        key={property.id || idx}
                        className="cb-property-card"
                        style={{
                          minWidth: '200px',
                          maxWidth: '220px',
                          backgroundColor: 'white',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          border: '1px solid #E2E8F0',
                          flexShrink: 0
                        }}
                      >
                        {property.image_url && (
                          <img src={property.image_url} alt={property.title} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                        )}
                        <div style={{ padding: '10px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {property.title || 'Property'}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563EB', margin: '4px 0' }}>
                            {property.price ? `KES ${Number(property.price).toLocaleString()}` : 'Price on Request'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading State: Typing Dots + Property Skeleton Cards */}
            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94A3B8', animation: 'typingBounce 1.4s infinite 0s' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94A3B8', animation: 'typingBounce 1.4s infinite 0.2s' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94A3B8', animation: 'typingBounce 1.4s infinite 0.4s' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', overflowX: 'hidden', width: '100%' }}>
                  {[1, 2].map((item) => (
                    <div key={item} style={{
                      minWidth: '200px',
                      backgroundColor: 'white',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid #E2E8F0',
                      flexShrink: 0
                    }}>
                      <div className="skeleton" style={{ width: '100%', height: '110px' }} />
                      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="skeleton" style={{ width: '80%', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '50%', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '100%', height: '24px', borderRadius: '6px', marginTop: '4px' }} />
                      </div>
                    </div>
                  ))}
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
            {["3-bed under KES 400k", "Family-friendly", "Investment tips", "SF budget"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                className="cb-suggestion-btn"
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#E2E8F0',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '11px',
                  color: '#334155',
                  cursor: 'pointer'
                }}
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
              className="cb-input"
              style={{
                flex: 1,
                padding: '8px 14px',
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="cb-send-btn"
              style={{
                padding: '8px 18px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                opacity: isLoading || !input.trim() ? 0.5 : 1
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;