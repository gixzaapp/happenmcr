"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  LENS_REPORT_CATEGORIES,
  MCR_ON_LENS_PATH,
  type LensFeedCard,
  type LensReportCategory,
} from "@/lib/mcr-on-lens";

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:4000"
  );
}

function getSiteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://happenmcr.com"
  );
}

type McrOnLensReportButtonProps = {
  card: Pick<LensFeedCard, "id" | "title" | "imageUrl" | "location">;
};

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success" };

export function McrOnLensReportButton({ card }: McrOnLensReportButtonProps) {
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<LensReportCategory | "">("");
  const [details, setDetails] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      return;
    }

    if (dialog.open) dialog.close();
  }, [open]);

  function resetForm() {
    setCategory("");
    setDetails("");
    setReporterEmail("");
    setWebsite("");
    setStatus({ type: "idle" });
  }

  function closeDialog() {
    setOpen(false);
    resetForm();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!category) {
      setStatus({ type: "error", message: "Please choose a report category." });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const response = await fetch(
        `${getApiBase()}/lens/photos/${encodeURIComponent(card.id)}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            details: details.trim() || undefined,
            reporterEmail: reporterEmail.trim() || undefined,
            website,
            feedUrl: `${getSiteBase()}${MCR_ON_LENS_PATH}`,
          }),
        },
      );

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: body.error || "Could not send the report. Try again.",
        });
        return;
      }

      setStatus({ type: "success" });
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-industrial-black/70 transition hover:text-industrial-black"
        aria-label={`Report ${card.title}`}
      >
        <span className="material-symbols-outlined text-xl">flag</span>
        Report
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        onClose={closeDialog}
        className="m-auto w-[min(100%-2rem,28rem)] max-w-lg rounded-2xl border-0 bg-canvas-white p-0 shadow-[0_16px_48px_rgba(0,0,0,0.2)] backdrop:bg-industrial-black/55"
      >
        <form onSubmit={onSubmit} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id={dialogTitleId}
                className="font-display text-headline-sm text-industrial-black"
              >
                Report photo
              </h2>
              <p className="mt-1 text-sm text-secondary">
                Tell us what&apos;s wrong with &ldquo;{card.title}&rdquo;.
              </p>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-full p-1 text-secondary transition hover:bg-industrial-black/5 hover:text-industrial-black"
              aria-label="Close report dialog"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {status.type === "success" ? (
            <div className="mt-6">
              <p className="text-sm font-semibold text-green-800" role="status">
                Thanks — your report was sent to the HappenMCR team.
              </p>
              <button
                type="button"
                onClick={closeDialog}
                className="mt-4 rounded-lg bg-bee-yellow px-4 py-2.5 font-display text-sm text-industrial-black"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <label
                  htmlFor={`${dialogTitleId}-category`}
                  className="mb-2 block text-label-md font-bold text-industrial-black"
                >
                  Category <span className="text-primary">*</span>
                </label>
                <select
                  id={`${dialogTitleId}-category`}
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as LensReportCategory | "")
                  }
                  required
                  disabled={status.type === "loading"}
                  className="w-full rounded-lg border border-industrial-black/15 bg-canvas-white px-4 py-3 text-base outline-none focus:border-bee-yellow focus:ring-1 focus:ring-bee-yellow disabled:opacity-60"
                >
                  <option value="">Choose a reason…</option>
                  {LENS_REPORT_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor={`${dialogTitleId}-details`}
                  className="mb-2 block text-label-md font-bold text-industrial-black"
                >
                  Details
                </label>
                <textarea
                  id={`${dialogTitleId}-details`}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Anything else we should know?"
                  disabled={status.type === "loading"}
                  className="w-full resize-y rounded-lg border border-industrial-black/15 bg-canvas-white px-4 py-3 text-base outline-none focus:border-bee-yellow focus:ring-1 focus:ring-bee-yellow disabled:opacity-60"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor={`${dialogTitleId}-email`}
                  className="mb-2 block text-label-md font-bold text-industrial-black"
                >
                  Your email (optional)
                </label>
                <input
                  id={`${dialogTitleId}-email`}
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  maxLength={320}
                  placeholder="So we can follow up if needed"
                  disabled={status.type === "loading"}
                  className="w-full rounded-lg border border-industrial-black/15 bg-canvas-white px-4 py-3 text-base outline-none focus:border-bee-yellow focus:ring-1 focus:ring-bee-yellow disabled:opacity-60"
                />
              </div>

              <div className="hidden" aria-hidden>
                <label htmlFor={`${dialogTitleId}-website`}>Website</label>
                <input
                  id={`${dialogTitleId}-website`}
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {status.type === "error" ? (
                <p className="mt-4 text-sm font-semibold text-red-700" role="alert">
                  {status.message}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={status.type === "loading"}
                  className="rounded-lg bg-bee-yellow px-5 py-2.5 font-display text-sm text-industrial-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status.type === "loading" ? "Sending…" : "Send report"}
                </button>
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={status.type === "loading"}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold text-secondary transition hover:text-industrial-black disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
