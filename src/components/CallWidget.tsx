'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle as WhatsAppIcon, X } from 'lucide-react';
import { API_URL } from '@/lib/api';

type Contact = { phone_display: string | null; phone_url: string | null; whatsapp_url: string | null };

// A small floating "Call Us" button, sitting just above the chat bubble so
// the two don't overlap. Clicking it reveals two options — call directly
// (opens the visitor's phone dialer via a tel: link) or message on WhatsApp
// (opens the WhatsApp app, or web.whatsapp.com if they don't have it) —
// rather than guessing which one a visitor would prefer.
export default function CallWidget() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [open, setOpen] = useState(false);
  const [hiddenByOther, setHiddenByOther] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/company-contact`)
      .then((res) => res.json())
      .then(setContact)
      .catch(() => {
        // Silent — the widget simply won't render if this fails.
      });
  }, []);

  useEffect(() => {
    // Same coordination as ChatWidget — hide this widget's launcher while
    // the chat widget is open, so the two never fight for space on a small
    // phone screen.
    function onOtherWidget(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.widget === 'chat') setHiddenByOther(detail.open);
    }
    window.addEventListener('niglo-widget-toggle', onOtherWidget);
    return () => window.removeEventListener('niglo-widget-toggle', onOtherWidget);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    window.dispatchEvent(new CustomEvent('niglo-widget-toggle', { detail: { widget: 'call', open: next } }));
  }

  if (!contact?.phone_url || hiddenByOther) return null;

  return (
    <div className={`fixed bottom-24 right-6 ${open ? 'z-50' : 'z-40'}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-3 w-56 bg-stone dark:bg-ink border border-ink/10 dark:border-stone/10 shadow-2xl overflow-hidden"
          >
            <div className="bg-ink text-stone px-4 py-3 flex items-center justify-between">
              <div className="font-display text-sm">Get in Touch</div>
              <button onClick={toggleOpen} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="p-2">
              {contact.whatsapp_url && (
                <a
                  href={contact.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-ink/5 dark:hover:bg-stone/10 transition-colors rounded"
                >
                  <span className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <WhatsAppIcon size={18} className="text-white" />
                  </span>
                  <div>
                    <div className="font-medium">WhatsApp</div>
                    <div className="text-xs text-ink/50 dark:text-stone/50">Message us</div>
                  </div>
                </a>
              )}
              <a
                href={contact.phone_url}
                className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-ink/5 dark:hover:bg-stone/10 transition-colors rounded"
              >
                <span className="w-9 h-9 rounded-full bg-brass flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-ink" />
                </span>
                <div>
                  <div className="font-medium">Call</div>
                  <div className="text-xs text-ink/50 dark:text-stone/50">{contact.phone_display}</div>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-brass text-ink hover:bg-ink hover:text-stone transition-colors flex items-center justify-center shadow-xl"
        aria-label={open ? 'Close contact options' : 'Call us'}
      >
        {open ? <X size={22} /> : <Phone size={22} />}
      </motion.button>
    </div>
  );
}
