import StartProjectForm from './StartProjectForm';

export default function StartProjectPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Start your project</div>
      <h1 className="font-display text-4xl md:text-5xl mb-4">Tell us what you&apos;re planning</h1>
      <p className="text-ink/70 mb-14 max-w-xl">
        Answer a few quick questions and our team will follow up with a quotation —
        no matter how many services your project needs.
      </p>
      <StartProjectForm />
    </div>
  );
}
