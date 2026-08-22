'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type Faq = { id: number; question: string; answer: string };

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

  return (
    <div className="divide-y divide-ink/10 dark:divide-stone/10">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="py-4">
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="w-full flex items-center justify-between gap-4 text-left"
            >
              <span className="font-display text-lg">{faq.question}</span>
              <ChevronDown
                size={20}
                className={`flex-shrink-0 text-brass transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <p className="mt-3 text-ink/70 dark:text-stone/70 whitespace-pre-line">{faq.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
