// app/api/contact/validation.ts
// Shared by the API route and the form, so the browser and the server say exactly the same thing.
// Error messages follow the GOV.UK Design System style.

export const MAX_REQUEST_SIZE = 20 * 1024; // 20 kB of JSON is plenty for a text message
export const MIN_FILL_MS = 3000; // humans need more than 3 s to fill the form in
export const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;

export const FIELD_LIMITS = { name: 100, email: 254, company: 150, message: 3000 } as const;
export const MIN_MESSAGE = 10;

export type Field = "name" | "email" | "company" | "message";
export type ContactValues = Record<Field, string>;
export type FieldError = { field: Field; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim() : "");

export function validateContact(v: ContactValues): FieldError[] {
  const errors: FieldError[] = [];
  const add = (field: Field, message: string) => errors.push({ field, message });

  if (!v.name) add("name", "Enter your name");
  else if (v.name.length > FIELD_LIMITS.name) add("name", `Name must be ${FIELD_LIMITS.name} characters or fewer`);

  if (!v.email) add("email", "Enter your email address");
  else if (v.email.length > FIELD_LIMITS.email || !EMAIL_RE.test(v.email))
    add("email", "Enter an email address in the correct format, like name@example.com");

  if (v.company.length > FIELD_LIMITS.company)
    add("company", `Company must be ${FIELD_LIMITS.company} characters or fewer`);

  if (!v.message) add("message", "Enter your message");
  else if (v.message.length < MIN_MESSAGE) add("message", `Message must be at least ${MIN_MESSAGE} characters`);
  else if (v.message.length > FIELD_LIMITS.message)
    add("message", `Message must be ${FIELD_LIMITS.message.toLocaleString("en-GB")} characters or fewer`);

  return errors;
}

/** Strip line breaks so nobody can inject extra email headers via the subject. */
export const oneLine = (v: string, max = 120) => v.replace(/[\r\n]+/g, " ").slice(0, max);

export const createReference = () => `MS-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
