"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type Pricing = "free" | "paid";

type FormState = {
  title: string;
  startTime: string;
  venueName: string;
  description: string;
  pricing: Pricing;
  ticketUrl: string;
  contactEmail: string;
  website: string;
};

const EMPTY: FormState = {
  title: "",
  startTime: "",
  venueName: "",
  description: "",
  pricing: "paid",
  ticketUrl: "",
  contactEmail: "",
  website: "",
};

const MAX_PROMO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROMO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:4000"
  );
}

const fieldClass =
  "w-full rounded-lg border border-industrial-black/15 bg-canvas-white px-4 py-3 text-base text-industrial-black outline-none transition placeholder:text-secondary focus:border-bee-yellow focus:ring-1 focus:ring-bee-yellow disabled:opacity-60";

export function SubmitEventForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [promoImage, setPromoImage] = useState<File | null>(null);
  const [promoPreviewUrl, setPromoPreviewUrl] = useState<string | null>(null);
  const [promoInputKey, setPromoInputKey] = useState(0);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  useEffect(() => {
    if (!promoImage) {
      setPromoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(promoImage);
    setPromoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [promoImage]);

  function clearPromoImage() {
    setPromoImage(null);
    setPromoInputKey((key) => key + 1);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status.type !== "idle" && status.type !== "loading") {
      setStatus({ type: "idle" });
    }
  }

  function onPromoImageChange(fileList: FileList | null) {
    const file = fileList?.[0] ?? null;
    if (!file) {
      clearPromoImage();
      return;
    }

    if (!ALLOWED_PROMO_TYPES.has(file.type)) {
      setStatus({
        type: "error",
        message: "Promo image must be a JPEG, PNG, or WebP file.",
      });
      clearPromoImage();
      return;
    }

    if (file.size > MAX_PROMO_BYTES) {
      setStatus({
        type: "error",
        message: "Promo image must be 5MB or smaller.",
      });
      clearPromoImage();
      return;
    }

    if (status.type !== "idle" && status.type !== "loading") {
      setStatus({ type: "idle" });
    }
    setPromoImage(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "loading" });

    const isFree = form.pricing === "free";
    const payload = new FormData();
    payload.set("title", form.title);
    payload.set(
      "startTime",
      form.startTime ? new Date(form.startTime).toISOString() : "",
    );
    payload.set("venueName", form.venueName);
    payload.set("description", form.description);
    payload.set("isFree", String(isFree));
    payload.set("ticketUrl", form.ticketUrl);
    payload.set("contactEmail", form.contactEmail);
    payload.set("website", form.website);
    if (promoImage) {
      payload.set("promoImage", promoImage);
    }

    try {
      const response = await fetch(`${getApiBase()}/submit-event`, {
        method: "POST",
        body: payload,
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: body.error || "Could not submit the event. Try again.",
        });
        return;
      }

      setForm(EMPTY);
      clearPromoImage();
      setStatus({
        type: "success",
        message:
          "Thanks — we’ve received your event. We’ll review it and get back to you if we list it.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  const disabled = status.type === "loading";
  const isFree = form.pricing === "free";

  return (
    <form className="relative space-y-6" onSubmit={onSubmit} noValidate>
      <div>
        <label
          htmlFor="event-title"
          className="mb-2 block text-sm font-semibold text-industrial-black"
        >
          Event title <span className="text-primary">*</span>
        </label>
        <input
          id="event-title"
          name="title"
          required
          maxLength={200}
          value={form.title}
          disabled={disabled}
          onChange={(e) => update("title", e.target.value)}
          className={fieldClass}
          placeholder="e.g. Friday Night Jazz at Band on the Wall"
        />
      </div>

      <div>
        <label
          htmlFor="event-start"
          className="mb-2 block text-sm font-semibold text-industrial-black"
        >
          Start date &amp; time <span className="text-primary">*</span>
        </label>
        <input
          id="event-start"
          name="startTime"
          type="datetime-local"
          required
          value={form.startTime}
          disabled={disabled}
          onChange={(e) => update("startTime", e.target.value)}
          className={fieldClass}
        />
        <p className="mt-1.5 text-xs text-secondary">
          Use Manchester / UK local time.
        </p>
      </div>

      <div>
        <label
          htmlFor="event-venue"
          className="mb-2 block text-sm font-semibold text-industrial-black"
        >
          Venue <span className="text-primary">*</span>
        </label>
        <input
          id="event-venue"
          name="venueName"
          required
          maxLength={200}
          value={form.venueName}
          disabled={disabled}
          onChange={(e) => update("venueName", e.target.value)}
          className={fieldClass}
          placeholder="e.g. AO Arena, Manchester"
        />
      </div>

      <div>
        <label
          htmlFor="event-description"
          className="mb-2 block text-sm font-semibold text-industrial-black"
        >
          Description <span className="text-primary">*</span>
        </label>
        <textarea
          id="event-description"
          name="description"
          required
          rows={6}
          maxLength={5000}
          value={form.description}
          disabled={disabled}
          onChange={(e) => update("description", e.target.value)}
          className={`${fieldClass} resize-y`}
          placeholder="What’s the event? Who’s it for? Any door times or age restrictions?"
        />
      </div>

      <fieldset disabled={disabled}>
        <legend className="mb-2 text-sm font-semibold text-industrial-black">
          Pricing <span className="text-primary">*</span>
        </legend>
        <div
          className="inline-flex rounded-lg border border-industrial-black/15 bg-canvas-white p-1"
          role="group"
          aria-label="Event pricing"
        >
          <button
            type="button"
            aria-pressed={isFree}
            onClick={() => update("pricing", "free")}
            className={`rounded-md px-5 py-2.5 font-display text-sm transition-colors ${
              isFree
                ? "bg-bee-yellow text-industrial-black"
                : "text-secondary hover:text-industrial-black"
            }`}
          >
            Free event
          </button>
          <button
            type="button"
            aria-pressed={!isFree}
            onClick={() => update("pricing", "paid")}
            className={`rounded-md px-5 py-2.5 font-display text-sm transition-colors ${
              !isFree
                ? "bg-bee-yellow text-industrial-black"
                : "text-secondary hover:text-industrial-black"
            }`}
          >
            Paid
          </button>
        </div>
      </fieldset>

      {isFree ? (
        <div>
          <label
            htmlFor="event-info-url"
            className="mb-2 block text-sm font-semibold text-industrial-black"
          >
            Event page URL{" "}
            <span className="font-normal text-secondary">(optional)</span>
          </label>
          <input
            id="event-info-url"
            name="ticketUrl"
            type="url"
            maxLength={2000}
            value={form.ticketUrl}
            disabled={disabled}
            onChange={(e) => update("ticketUrl", e.target.value)}
            className={fieldClass}
            placeholder="https://"
          />
          <p className="mt-1.5 text-xs text-secondary">
            Link to more info if you have one.
          </p>
        </div>
      ) : (
        <div>
          <label
            htmlFor="event-ticket-url"
            className="mb-2 block text-sm font-semibold text-industrial-black"
          >
            Ticket URL <span className="text-primary">*</span>
          </label>
          <input
            id="event-ticket-url"
            name="ticketUrl"
            type="url"
            required
            maxLength={2000}
            value={form.ticketUrl}
            disabled={disabled}
            onChange={(e) => update("ticketUrl", e.target.value)}
            className={fieldClass}
            placeholder="https://"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="event-promo-image"
          className="mb-2 block text-sm font-semibold text-industrial-black"
        >
          Promo image{" "}
          <span className="font-normal text-secondary">(optional)</span>
        </label>
        <input
          key={promoInputKey}
          id="event-promo-image"
          name="promoImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(e) => onPromoImageChange(e.target.files)}
          className="block w-full text-sm text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-bee-yellow file:px-4 file:py-2.5 file:font-display file:text-sm file:text-industrial-black hover:file:brightness-95 disabled:opacity-60"
        />
        <p className="mt-1.5 text-xs text-secondary">
          JPEG, PNG or WebP. Max 5MB.
        </p>
        {promoPreviewUrl ? (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob preview URL */}
            <img
              src={promoPreviewUrl}
              alt="Promo image preview"
              className="max-h-48 w-auto rounded-lg border border-industrial-black/10 object-cover"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={clearPromoImage}
              className="mt-2 text-sm font-semibold text-secondary underline hover:text-industrial-black disabled:opacity-60"
            >
              Remove image
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="event-contact"
          className="mb-2 block text-sm font-semibold text-industrial-black"
        >
          Your contact email <span className="text-primary">*</span>
        </label>
        <input
          id="event-contact"
          name="contactEmail"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={form.contactEmail}
          disabled={disabled}
          onChange={(e) => update("contactEmail", e.target.value)}
          className={fieldClass}
          placeholder="you@example.com"
        />
        <p className="mt-1.5 text-xs text-secondary">
          We’ll only use this to follow up about this listing.
        </p>
      </div>

      {/* Honeypot */}
      <div
        className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
        aria-hidden
      >
        <label htmlFor="event-website">Website</label>
        <input
          id="event-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="hard-shadow inline-flex items-center justify-center rounded-lg bg-bee-yellow px-8 py-4 font-display text-headline-sm text-industrial-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {disabled ? "SUBMITTING…" : "SUBMIT EVENT"}
      </button>

      {status.type === "success" ? (
        <p
          className="text-sm font-semibold text-[color:var(--accent-ink)]"
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}

      {status.type === "error" ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {status.message}
        </p>
      ) : null}

      <p className="text-xs text-secondary">
        By submitting, you confirm you have the right to share this event and
        agree to our{" "}
        <Link href="/privacy" className="underline hover:text-industrial-black">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
