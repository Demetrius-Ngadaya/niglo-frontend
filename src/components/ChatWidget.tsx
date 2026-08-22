'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { API_URL } from '@/lib/api';

type ChatMessage = { sender: 'visitor' | 'bot' | 'admin'; message: string; created_at?: string };

const UUID_KEY = 'niglo_chat_uuid';
const MESSAGES_KEY = 'niglo_chat_messages';
const POLL_MS = 20000;

function getOrCreateUuid(): string {
  let uuid = localStorage.getItem(UUID_KEY);
  if (!uuid) {
    uuid = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(UUID_KEY, uuid);
  }
  return uuid;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const uuidRef = useRef<string>('');

  useEffect(() => {
    uuidRef.current = getOrCreateUuid();

    const cached = localStorage.getItem(MESSAGES_KEY);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch {
        // ignore malformed cache
      }
    }

    syncHistory();
    const interval = setInterval(syncHistory, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function syncHistory() {
    try {
      const res = await fetch(`${API_URL}/chatbot/conversation/${uuidRef.current}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages((prev) => {
          if (data.messages.length > prev.length && !open) setHasUnread(true);
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(data.messages));
          return data.messages;
        });
      }
    } catch {
      // Silent — chat should degrade gracefully, not show errors for a background sync.
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');

    const optimistic: ChatMessage = { sender: 'visitor', message: text };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_uuid: uuidRef.current, message: text }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => {
          const next = [...prev, { sender: 'bot' as const, message: data.message }];
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
          return next;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', message: "Sorry, I'm having trouble connecting right now — please try again in a moment." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function toggleOpen() {
    setOpen((o) => !o);
    setHasUnread(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 w-[92vw] max-w-sm h-[70vh] max-h-[520px] bg-stone dark:bg-ink border border-ink/10 dark:border-stone/10 shadow-2xl flex flex-col">
          <div className="bg-ink text-stone px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="font-display text-sm">NIGLOY Assistant</div>
            <button onClick={toggleOpen} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-ink/50 dark:text-stone/50 text-center mt-6">
                Ask me about our services, rentals, or anything else — I&apos;m here to help.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 text-sm whitespace-pre-line ${
                    m.sender === 'visitor'
                      ? 'bg-brass text-ink'
                      : m.sender === 'admin'
                      ? 'bg-green-100 dark:bg-green-900/30 text-ink dark:text-stone'
                      : 'bg-white dark:bg-white/10 text-ink dark:text-stone'
                  }`}
                >
                  {m.sender === 'admin' && <div className="text-[10px] font-semibold text-green-700 dark:text-green-400 mb-1">NIGLOY Team</div>}
                  {m.message}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-ink/10 dark:border-stone/10 p-3 flex items-center gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message…"
              className="flex-1 border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="w-9 h-9 flex items-center justify-center bg-ink text-stone hover:bg-brass hover:text-ink transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={toggleOpen}
        className="relative w-14 h-14 rounded-full bg-ink text-stone hover:bg-brass hover:text-ink transition-colors flex items-center justify-center shadow-xl"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {hasUnread && !open && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-brass border-2 border-stone dark:border-ink" />
        )}
      </button>
    </div>
  );
}
