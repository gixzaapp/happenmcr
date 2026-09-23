"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function successMessage(startTime: string): string {
  const book = "Please make sure you've booked your ticket.";
  const ms = new Date(startTime).getTime() - Date.now();
  if (ms > 6 * DAY_MS) {
    return `You're on the reminder list. We'll email you a week before, and again the day before. ${book}`;
  }
  if (ms > 36 * HOUR_MS) {
    return `You're on the reminder list. We'll email you the day before. ${book}`;
  }
  return `You're on the reminder list. We'll email you before it starts. ${book}`;
}

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:4000"
  );
}

type EventNotifyFormProps = {
  eventId: string;
  startTime: string;
};

export function EventNotifyForm({ eventId, startTime }: EventNotifyFormProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  if (new Date(startTime).getTime() <= Date.now()) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value || value.length > 254 || !EMAIL_RE.test(value)) {
      setStatus({ type: "error", message: "Enter a valid email address." });
      return;
    }

    setStatus({ type: "loading" });
    try {
      const response = await fetch(`${getApiBase()}/event-reminders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value, eventId }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { alreadyAdded?: boolean };
        error?: string;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: body.error || "Could not save that reminder. Try again.",
        });
        return;
      }

      setEmail("");
      setOpen(false);
      setStatus({
        type: "success",
          message: body.data?.alreadyAdded
            ? "You're already on the reminder list for this event."
            : successMessage(startTime),
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  return (
    <>
      {status.type !== "success" ? (
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            if (status.type === "error") setStatus({ type: "idle" });
          }}
          aria-expanded={open}
          className="inline-flex items-center rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-2)]"
        >
          Notify me
        </button>
      ) : null}

      {open && status.type !== "success" ? (
        <form
          className="basis-full"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="event-notify-email">
              Email address
            </label>
            <input
              id="event-notify-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status.type === "error") setStatus({ type: "idle" });
              }}
              disabled={status.type === "loading"}
              placeholder="Email address"
              className="w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--muted)] focus:ring-2 focus:ring-[color:var(--accent)] disabled:opacity-60 sm:max-w-xs"
            />
            <button
              type="submit"
              disabled={status.type === "loading" || !email.trim()}
              className="inline-flex items-center justify-center rounded-md bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.type === "loading" ? "Adding…" : "Add"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            One email a week before, and one the day before.{" "}
            <Link href="/privacy" className="underline hover:text-[color:var(--ink)]">
              Privacy
            </Link>
          </p>
        </form>
      ) : null}

      {status.type === "success" ? (
        <p
          className="basis-full text-sm font-medium text-[color:var(--ink)]"
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}

      {status.type === "error" ? (
        <p
          className="basis-full text-sm font-medium text-red-700"
          role="alert"
          aria-live="assertive"
        >
          {status.message}
        </p>
      ) : null}
    </>
  );
}
