// app/api/contact/mailer.ts
import nodemailer, { type Transporter } from "nodemailer";
import type { ContactConfig } from "./config";

let cachedTransporter: Transporter | null = null;
let cachedKey: string | null = null;

export const getTransporter = (config: ContactConfig): Transporter => {
  if (config.mode !== "email") {
    throw new Error("Internal error: tried to send an email in mock mode.");
  }
  const { smtp } = config;
  const key = JSON.stringify({ ...smtp, password: undefined });
  if (cachedTransporter && cachedKey === key) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    requireTLS: smtp.requireTLS,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: smtp.user && smtp.password ? { user: smtp.user, pass: smtp.password } : undefined,
    tls: smtp.tlsServername ? { servername: smtp.tlsServername } : undefined,
  });
  cachedKey = key;
  return cachedTransporter;
};
