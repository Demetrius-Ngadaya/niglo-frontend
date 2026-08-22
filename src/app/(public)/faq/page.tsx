import { api } from '@/lib/api';
import FaqAccordion from './FaqAccordion';
import Reveal from '@/components/Reveal';

type Faq = { id: number; question: string; answer: string };

async function getFaqs(): Promise<Faq[]> {
  try {
    const { data } = await api.get('/faqs');
    return data;
  } catch {
    return [];
  }
}

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <Reveal>
        <div className="eyebrow mb-3">Got questions?</div>
        <h1 className="font-display text-4xl md:text-5xl mb-16">Frequently Asked Questions</h1>
      </Reveal>

      {faqs.length > 0 ? (
        <FaqAccordion faqs={faqs} />
      ) : (
        <p className="text-ink/50 dark:text-stone/60">No FAQs published yet.</p>
      )}
    </div>
  );
}
