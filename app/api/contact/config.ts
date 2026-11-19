// app/api/contact/config.ts
export type ContactConfig =
  | { mode: "mock"; smtp: null }
  | {
      mode: "email";
      smtp: {
        host: string;
        port: number;
        secure: boolean;
        requireTLS: boolean;
        user?: string;
        password?: string;
        mailFrom: string;
        mailTo: string;
        tlsServername?: string;
      };
    };

export const loadConfig = (): ContactConfig => {
  const mode = process.env.CONTACT_FORM_MODE;

  if (process.env.NODE_ENV === "production" && mode !== "email") {
    throw new Error('FATAL: In production CONTACT_FORM_MODE must be "email".');
  }
  if (mode !== "email") return { mode: "mock", smtp: null };

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const mailFrom = process.env.MAIL_FROM;
  const mailTo = process.env.MAIL_TO;

  if (!host) throw new Error("FATAL: SMTP_HOST is missing.");
  if (!mailFrom) throw new Error("FATAL: MAIL_FROM is missing.");
  if (!mailTo) throw new Error("FATAL: MAIL_TO is missing.");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("FATAL: SMTP_PORT is not valid.");
  if (Boolean(user) !== Boolean(password)) throw new Error("FATAL: SMTP_USER and SMTP_PASSWORD must be set together.");

  return {
    mode: "email",
    smtp: {
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
      user,
      password,
      mailFrom,
      mailTo,
      tlsServername: process.env.SMTP_TLS_SERVERNAME || undefined,
    },
  };
};
