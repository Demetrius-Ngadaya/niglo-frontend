import ContactForm from './ContactForm';

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Get in touch</div>
      <h1 className="font-display text-4xl md:text-5xl mb-10">Contact Us</h1>
      <ContactForm />
    </div>
  );
}
