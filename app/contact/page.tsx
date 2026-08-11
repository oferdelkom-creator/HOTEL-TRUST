import ContactForm from "./ContactForm";

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Contact us</h1>
      <p className="text-neutral-500 mb-8 text-sm">
        Questions, issues, or anything else - send us a message and we&apos;ll get back to you.
      </p>
      <ContactForm />
    </div>
  );
}
