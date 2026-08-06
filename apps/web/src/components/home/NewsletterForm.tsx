"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

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

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "loading" });

    try {
      const response = await fetch(`${getApiBase()}/newsletter/subscribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        data?: { alreadySubscribed?: boolean };
        error?: string;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: body.error || "Could not join the list. Try again.",
        });
        return;
      }

      setEmail("");
      setStatus({
        type: "success",
        message: body.data?.alreadySubscribed
          ? "You’re already on the list."
          : "You’re on the list. See you Thursday.",
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
      <form
        className="flex flex-col gap-4 md:flex-row"
        onSubmit={onSubmit}
        noValidate
      >
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status.type !== "idle" && status.type !== "loading") {
              setStatus({ type: "idle" });
            }
          }}
          disabled={status.type === "loading"}
          placeholder="Enter your email address"
          className="flex-grow rounded-lg border border-canvas-white/20 bg-canvas-white/10 px-6 py-4 text-canvas-white outline-none placeholder:text-canvas-white/40 focus:ring-2 focus:ring-bee-yellow disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status.type === "loading" || !email.trim()}
          className="hard-shadow rounded-lg bg-bee-yellow px-10 py-4 font-display text-headline-sm text-industrial-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {status.type === "loading" ? "JOINING…" : "JOIN THE LIST"}
        </button>
      </form>

      {status.type === "success" ? (
        <p
          className="mt-4 text-sm font-semibold text-bee-yellow"
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}

      {status.type === "error" ? (
        <p
          className="mt-4 text-sm font-semibold text-red-300"
          role="alert"
          aria-live="assertive"
        >
          {status.message}
        </p>
      ) : null}

      <p className="mt-6 text-xs uppercase tracking-widest text-secondary-fixed-dim">
        By subscribing, you agree to our{" "}
        <Link
          href="/privacy"
          className="underline transition-colors hover:text-bee-yellow"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}
