import ContactForm from './ContactForm';
import Reveal from '@/components/Reveal';

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <Reveal>
        <div className="eyebrow mb-3">Get in touch</div>
        <h1 className="font-display text-4xl md:text-5xl mb-10">Contact Us</h1>
      </Reveal>
      <Reveal delay={0.1}>
        <ContactForm />
      </Reveal>
    </div>
  );
}
