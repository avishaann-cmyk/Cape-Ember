import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircleDots, X, PaperPlaneRight, Flame } from '@phosphor-icons/react';

const API = process.env.REACT_APP_BACKEND_URL;

const getOrCreateSessionId = () => {
  const key = 'cape_ember_concierge_session';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
};

const CoffeeConcierge = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sessionId] = useState(getOrCreateSessionId);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const listRef = useRef(null);
  const abortRef = useRef(null);

  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  useEffect(() => {
    if (!open || historyLoaded) return;
    fetch(`${API}/api/concierge/history/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.messages?.length) {
          setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })));
        } else {
          setMessages([
            {
              role: 'assistant',
              content:
                "Welcome to Cape Ember. I'm your Coffee Concierge — ask me anything about our blends, brewing methods, or which coffee might suit your taste.",
            },
          ]);
        }
        setHistoryLoaded(true);
      })
      .catch(() => {
        setMessages([
          {
            role: 'assistant',
            content:
              "Welcome to Cape Ember. I'm your Coffee Concierge — ask me anything about our blends, brewing methods, or which coffee might suit your taste.",
          },
        ]);
        setHistoryLoaded(true);
      });
  }, [open, historyLoaded, sessionId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API}/api/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error('Concierge unavailable');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (payload.delta) {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  content: (next[next.length - 1].content || '') + payload.delta,
                };
                return next;
              });
            } else if (payload.error) {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: payload.error };
                return next;
              });
            }
          } catch {
            // ignore malformed frame
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          next[next.length - 1] = {
            role: 'assistant',
            content: "I'm briefly unavailable. Please try again in a moment or email hello@capeembercoffee.co.za.",
          };
        }
        return next;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isAdminRoute) return null;

  const quickPrompts = [
    'Which blend is best for espresso?',
    'I like dark chocolate flavors',
    'What is the Ember Circle?',
    'How do I brew with a French Press?',
  ];

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        data-testid="concierge-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? 'Close Coffee Concierge' : 'Open Coffee Concierge'}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white"
        style={{
          background: 'linear-gradient(135deg, #D05C23 0%, #8A5A44 100%)',
          boxShadow: '0 10px 30px rgba(208, 92, 35, 0.35)',
        }}
      >
        {open ? <X size={26} weight="bold" /> : <ChatCircleDots size={26} weight="fill" />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="concierge-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed bottom-24 right-6 z-[59] w-[92vw] max-w-[400px] h-[560px] max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#FDFBF7',
              border: '1px solid #E6DCD1',
              boxShadow: '0 20px 60px rgba(44, 26, 18, 0.25)',
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #2C1A12 0%, #3A2418 100%)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #D05C23, #C86333)' }}
              >
                <Flame size={22} weight="fill" color="#FFFFFF" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-serif text-lg leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Coffee Concierge
                </div>
                <div className="text-[11px] tracking-[0.15em] uppercase" style={{ color: '#E6DCD1' }}>
                  Cape Ember · Ready to help
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              data-testid="concierge-messages"
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ backgroundColor: '#FDFBF7' }}
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'text-white rounded-br-md'
                        : 'text-[#2C1A12] rounded-bl-md border'
                    }`}
                    style={
                      m.role === 'user'
                        ? { background: 'linear-gradient(135deg, #D05C23, #C86333)' }
                        : { backgroundColor: '#FFFFFF', borderColor: '#E6DCD1' }
                    }
                  >
                    {m.content || (streaming && idx === messages.length - 1 ? (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8A5A44] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8A5A44] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8A5A44] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    ) : null)}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick prompts (only when conversation is short) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    data-testid={`concierge-quick-${q.slice(0, 10).replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => sendMessage(), 0);
                    }}
                    className="text-[12px] px-3 py-1.5 rounded-full border transition-colors hover:bg-[#D05C23] hover:text-white hover:border-[#D05C23]"
                    style={{ borderColor: '#E6DCD1', color: '#6B5048', backgroundColor: '#FFFFFF' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              className="px-3 py-3 flex items-center gap-2 border-t"
              style={{ borderColor: '#E6DCD1', backgroundColor: '#FFFFFF' }}
            >
              <input
                data-testid="concierge-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={streaming}
                placeholder="Ask about our blends, brewing, or shipping…"
                className="flex-1 bg-transparent outline-none text-[14px] px-2 py-2 text-[#2C1A12] placeholder:text-[#A9998C] disabled:opacity-60"
                maxLength={1000}
              />
              <button
                data-testid="concierge-send-btn"
                onClick={sendMessage}
                disabled={streaming || !input.trim()}
                aria-label="Send message"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-transform active:scale-95"
                style={{ background: 'linear-gradient(135deg, #D05C23, #C86333)' }}
              >
                <PaperPlaneRight size={18} weight="fill" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CoffeeConcierge;
