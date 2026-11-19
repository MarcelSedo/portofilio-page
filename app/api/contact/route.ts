// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { loadConfig } from "./config";
import { getTransporter } from "./mailer";
import { checkRateLimit, normalizeIp, recordSuccess } from "./rateLimit";
import {
  MAX_FORM_AGE_MS, MAX_REQUEST_SIZE, MIN_FILL_MS,
  clean, createReference, oneLine, validateContact, type ContactValues,
} from "./validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = randomUUID();

  const send = (body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) =>
    NextResponse.json(
      { ...body, requestId },
      { status, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId, ...headers } },
    );

  // Bots get a convincing "thanks" and nothing is sent
  const fakeSuccess = () => send({ ok: true, reference: createReference() });

  try {
    const config = loadConfig();

    // 1. Shape of the request
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("application/json")) {
      return send({ ok: false, code: "UNSUPPORTED_MEDIA_TYPE", message: "The request must be JSON." }, 415);
    }
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > MAX_REQUEST_SIZE) {
      return send({ ok: false, code: "PAYLOAD_TOO_LARGE", message: "Your message is too long to send." }, 413);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return send({ ok: false, code: "INVALID_JSON", message: "The form could not be read." }, 400);
    }

    // 2. Bot traps: honeypot + filled in impossibly fast (or a stale/forged timestamp)
    if (clean(body.website)) {
      console.info("Contact form: honeypot triggered", { requestId });
      return fakeSuccess();
    }
    const startedAt = Number(body.startedAt);
    const elapsed = Date.now() - startedAt;
    if (!Number.isFinite(startedAt) || elapsed < MIN_FILL_MS || elapsed > MAX_FORM_AGE_MS) {
      console.info("Contact form: time trap triggered", { requestId, elapsed });
      return fakeSuccess();
    }

    // 3. Rate limit per IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = normalizeIp(forwarded?.split(",")[0] ?? request.headers.get("x-real-ip"));
    const limit = checkRateLimit(ip);
    if (limit.exceeded) {
      console.warn("Contact form: rate limit exceeded", { requestId, ip });
      return send(
        { ok: false, code: "RATE_LIMIT_EXCEEDED", message: "You've sent several messages in a short time. Please try again in 15 minutes." },
        429,
        { "Retry-After": limit.retryAfter },
      );
    }

    // 4. Validate
    const values: ContactValues = {
      name: clean(body.name),
      email: clean(body.email),
      company: clean(body.company),
      message: clean(body.message),
    };
    const errors = validateContact(values);
    if (errors.length) {
      return send({ ok: false, code: "VALIDATION_ERROR", message: "Check the fields marked below.", errors }, 422);
    }

    // 5. Send
    const reference = createReference();
    const receivedAt = new Date();

    if (config.mode === "mock") {
      console.info("Contact form (mock mode, no email sent):", { reference, requestId, from: values.email });
      recordSuccess(ip);
      return send({ ok: true, mock: true, reference });
    }

    const text = [
      `New message from your portfolio`,
      ``,
      `Reference: ${reference}`,
      `Received: ${receivedAt.toLocaleString("en-GB", { timeZone: "Europe/Bratislava" })}`,
      ``,
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      `Company: ${values.company || "–"}`,
      ``,
      `Message:`,
      values.message,
    ].join("\n");

    await getTransporter(config).sendMail({
      from: config.smtp.mailFrom,
      to: config.smtp.mailTo,
      replyTo: { name: oneLine(values.name, 100), address: values.email },
      subject: `[${reference}] Portfolio: message from ${oneLine(values.name)}`,
      text,
    });

    recordSuccess(ip);
    return send({ ok: true, reference });
  } catch (error) {
    console.error("Contact form: sending failed", { requestId, error });
    return send(
      { ok: false, code: "INTERNAL_ERROR", message: "Sorry, your message could not be sent. Please try again later or email me directly." },
      500,
    );
  }
}
