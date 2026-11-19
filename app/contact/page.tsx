import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact – Marcel Šedo",
  description: "Get in touch with Marcel Šedo about a role, a project or web accessibility.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-8 sm:py-20">
      <div className="hero-frame p-8 sm:p-12">
        <p className="m-0 font-pixel text-[11px] tracking-widest text-teal uppercase">Final quest</p>
        <h1 className="m-0 mt-4 font-pixel text-2xl leading-snug text-white sm:text-3xl">Send a raven</h1>
        <p className="m-0 mt-5 mb-10 text-lg leading-relaxed text-slate-200">
          Got a role, a project or a question? Write to me and I&apos;ll get back to you, usually within a couple of
          working days.
        </p>
        <ContactForm />
      </div>
    </div>
  );
}
