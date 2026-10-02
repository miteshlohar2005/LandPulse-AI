import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, X, Minus, Send, RotateCcw, Bot,
  FileText, Home, ClipboardList, Scale, Map, Clock,
  ChevronDown
} from 'lucide-react';
import {
  ChatMessage,
  sendChatMessage,
  getWelcomeMessage,
  createUserMessage
} from '../services/chatbotService';

// ─── Quick Action Chips ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Check Land Records', emoji: '📄' },
  { icon: Home, label: 'Property Ownership', emoji: '🏠' },
  { icon: ClipboardList, label: 'Required Documents', emoji: '📑' },
  { icon: Scale, label: 'Land Disputes', emoji: '⚖️' },
  { icon: Map, label: 'Land Survey', emoji: '🗺️' },
  { icon: Clock, label: 'Application Delay', emoji: '⏳' },
];

// ─── Sub-Components ─────────────────────────────────────────────────────────

/** Typing Indicator with 3-dot bounce animation */
const TypingIndicator: React.FC = () => (
  <div className="flex items-start space-x-2 px-4 py-2">
    <div className="w-7 h-7 rounded-full bg-forest-900 flex items-center justify-center shrink-0 shadow-sm">
      <Bot className="w-3.5 h-3.5 text-forest-100" />
    </div>
    <div className="bg-forest-50 border border-forest-100 rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex items-center space-x-1.5">
        <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

/** Single Chat Message Bubble */
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end space-x-2 px-4 py-1 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-forest-900 flex items-center justify-center shrink-0 shadow-sm mb-1">
          <Bot className="w-3.5 h-3.5 text-forest-100" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-forest-900 text-white rounded-2xl rounded-br-sm shadow-sm'
            : 'bg-forest-50 border border-forest-100 text-slate-800 rounded-2xl rounded-tl-sm'
        }`}
      >
        {/* Render markdown-lite: bold, italic */}
        {message.content.split('\n').map((line, i) => {
          // Process bold (**text**)
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
                }
                // Process italic (*text*)
                const italicParts = part.split(/(\*[^*]+\*)/g);
                return italicParts.map((ip, k) => {
                  if (ip.startsWith('*') && ip.endsWith('*') && !ip.startsWith('**')) {
                    return <em key={`${j}-${k}`} className="italic text-forest-700">{ip.slice(1, -1)}</em>;
                  }
                  return <span key={`${j}-${k}`}>{ip}</span>;
                });
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-forest-700 flex items-center justify-center shrink-0 shadow-sm mb-1 text-white text-[11px] font-bold">
          You
        </div>
      )}
    </div>
  );
};

// ─── Main Chatbot Component ─────────────────────────────────────────────────

interface LandGuardChatbotProps {
  showPhoneFrame?: boolean;
}

export const LandGuardChatbot: React.FC<LandGuardChatbotProps> = ({ showPhoneFrame = true }) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, isMinimized, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  // Scroll observer for "scroll down" button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;

    const userMsg = createUserMessage(trimmed);
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(trimmed, messages);
      setMessages(prev => [...prev, response]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
          timestamp: Date.now(),
          suggestions: ['Check Land Records', 'Property Ownership', 'Required Documents']
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (label: string) => {
    setInputValue(label);
    // Send it directly
    const userMsg = createUserMessage(label);
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setInputValue('');

    sendChatMessage(label, messages)
      .then(response => {
        setMessages(prev => [...prev, response]);
      })
      .catch(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: '⚠️ Something went wrong. Please try again.',
            timestamp: Date.now()
          }
        ]);
      })
      .finally(() => setIsTyping(false));
  };

  const handleNewChat = () => {
    setMessages([getWelcomeMessage()]);
    setInputValue('');
    setIsTyping(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // ─── Positioning Classes ──────────────────────────────────────────────
  // When phone frame is ON: position absolute within the 430px container
  // When phone frame is OFF: position fixed at browser bottom-right

  const positionClass = showPhoneFrame
    ? 'absolute' // Inside the phone frame container
    : 'fixed';   // Browser viewport

  // Get latest suggestions from the last assistant message
  const latestSuggestions = [...messages]
    .reverse()
    .find(m => m.role === 'assistant' && m.suggestions)?.suggestions;

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          FLOATING ACTION BUTTON
          ══════════════════════════════════════════════════════════════════ */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className={`${positionClass} bottom-20 right-4 z-40 flex items-center justify-center 
            w-12 h-12 bg-forest-900 hover:bg-forest-800 text-white 
            rounded-full shadow-lg
            transition-all duration-300 ease-out transform hover:scale-105 active:scale-95
            cursor-pointer group`}
          style={{
            animation: 'chatbot-fab-entrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            boxShadow: '0 4px 20px rgba(15, 77, 53, 0.35), 0 0 0 0 rgba(15, 77, 53, 0.4)'
          }}
          aria-label="Open LandGuard AI Assistant"
          title="Open LandGuard AI Assistant"
          id="landguard-chatbot-fab"
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping bg-forest-600 opacity-20" />

          <Bot className="w-6 h-6 text-forest-100 group-hover:rotate-12 transition-transform relative z-10" />
        </button>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CHAT WINDOW
          ══════════════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div
          className={`${positionClass} z-40 flex flex-col
            ${showPhoneFrame
              ? 'bottom-16 right-2 left-2 top-14 rounded-2xl'
              : 'bottom-4 right-4 w-[380px] h-[560px] sm:w-[400px] sm:h-[600px] rounded-2xl'
            }
            bg-white border border-forest-200/60 shadow-2xl overflow-hidden
          `}
          style={{
            animation: 'chatbot-window-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            boxShadow: '0 12px 48px rgba(15, 77, 53, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
          id="landguard-chatbot-window"
        >
          {/* ────────────────────────────────────────────────────────────
              HEADER
              ──────────────────────────────────────────────────────────── */}
          <div className="bg-forest-900 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest-700/50 backdrop-blur flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-forest-100" />
              </div>
              <div>
                <h3 className="text-white font-bold text-[13px] tracking-tight flex items-center space-x-1">
                  <span>🤖</span>
                  <span>LandGuard AI Assistant</span>
                </h3>
                <p className="text-forest-200/80 text-[10px] font-medium">Your Intelligent Land Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* New Chat */}
              <button
                onClick={handleNewChat}
                className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-forest-700/50 transition cursor-pointer"
                title="New Chat"
                aria-label="Start New Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Minimize */}
              <button
                onClick={handleMinimize}
                className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-forest-700/50 transition cursor-pointer"
                title="Minimize"
                aria-label="Minimize Chat"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-red-500/80 transition cursor-pointer"
                title="Close"
                aria-label="Close Chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Minimized State */}
          {isMinimized ? (
            <button
              onClick={() => setIsMinimized(false)}
              className="flex-1 flex items-center justify-center space-x-2 text-sm text-forest-700 font-medium hover:bg-forest-50 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Click to expand chat</span>
              <span className="text-[10px] bg-forest-100 text-forest-800 px-2 py-0.5 rounded-full font-bold">
                {messages.filter(m => m.role === 'assistant').length} messages
              </span>
            </button>
          ) : (
            <>
              {/* ────────────────────────────────────────────────────────
                  MESSAGES AREA
                  ──────────────────────────────────────────────────────── */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 bg-gradient-to-b from-white to-forest-50/30"
                style={{ scrollBehavior: 'smooth' }}
              >
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Typing Indicator */}
                {isTyping && <TypingIndicator />}

                {/* Dynamic Suggestion Chips (after AI responses) */}
                {!isTyping && latestSuggestions && latestSuggestions.length > 0 && (
                  <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5">
                    {latestSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleQuickAction(suggestion)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-forest-200 
                          text-forest-800 hover:bg-forest-50 hover:border-forest-300 
                          transition-all cursor-pointer active:scale-95"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom FAB */}
              {showScrollDown && (
                <button
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-28 right-4 w-8 h-8 rounded-full bg-white border border-forest-200 shadow-md flex items-center justify-center text-forest-700 hover:bg-forest-50 transition cursor-pointer z-10"
                  aria-label="Scroll to bottom"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}

              {/* ────────────────────────────────────────────────────────
                  QUICK ACTION CHIPS (Only shown at start)
                  ──────────────────────────────────────────────────────── */}
              {messages.length <= 1 && !isTyping && (
                <div className="px-3 py-2 border-t border-forest-100/50 bg-white shrink-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.label)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-xl border border-forest-100 
                          text-forest-800 hover:bg-forest-50 hover:border-forest-200 
                          transition-all text-[11px] font-semibold cursor-pointer active:scale-[0.97]
                          text-left"
                      >
                        <span className="text-sm">{action.emoji}</span>
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────
                  INPUT AREA
                  ──────────────────────────────────────────────────────── */}
              <div className="border-t border-forest-100 px-3 py-2.5 bg-white shrink-0">
                <div className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isTyping ? 'AI is typing...' : 'Ask about land, property, records...'}
                    disabled={isTyping}
                    className="flex-1 px-3.5 py-2 text-[13px] rounded-xl border border-forest-200 bg-forest-50/30
                      text-slate-800 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-forest-400/40 focus:border-forest-300
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all"
                    id="landguard-chatbot-input"
                    autoComplete="off"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="w-9 h-9 rounded-xl bg-forest-900 text-white flex items-center justify-center
                      hover:bg-forest-800 transition-all cursor-pointer
                      disabled:opacity-40 disabled:cursor-not-allowed
                      active:scale-95 shrink-0"
                    aria-label="Send Message"
                    id="landguard-chatbot-send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-[9px] text-slate-400 text-center mt-2 leading-tight px-2">
                  LandGuard AI provides general informational guidance. Responses should not be considered
                  official legal advice or a substitute for verification through authorized government departments.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          INLINE KEYFRAMES
          ══════════════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes chatbot-fab-entrance {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes chatbot-window-slide-up {
          0% { opacity: 0; transform: translateY(24px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default LandGuardChatbot;
