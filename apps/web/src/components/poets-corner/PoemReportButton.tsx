"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  POEM_REPORT_CATEGORIES,
  poemPath,
  type PoemReportCategory,
} from "@/lib/poets-corner";

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

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success" };

export function PoemReportButton({
  poemId,
  title,
}: {
  poemId: string;
  title: string;
}) {
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<PoemReportCategory | "">("");
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

  function closeDialog() {
    setOpen(false);
    setCategory("");
    setDetails("");
    setReporterEmail("");
    setWebsite("");
    setStatus({ type: "idle" });
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
        `${getApiBase()}/poems/${encodeURIComponent(poemId)}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            details: details.trim() || undefined,
            reporterEmail: reporterEmail.trim() || undefined,
            website,
            poemUrl: `${getSiteBase()}${poemPath(poemId)}`,
          }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus({
          type: "error",
          message: body.error || "Could not send the report. Try again.",
        });
        return;
      }
      setStatus({ type: "success" });
    } catch {
      setStatus({ type: "error", message: "Network error. Try again." });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6d5848] transition hover:text-[#2a2118]"
      >
        <span className="material-symbols-outlined text-[1.25rem]" aria-hidden>
          flag
        </span>
        Report
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        className="w-[min(100%,28rem)] rounded-lg border border-[#2a2118]/15 bg-[#f7f1e8] p-6 text-[#2a2118] backdrop:bg-black/40"
        onClose={closeDialog}
      >
        <h2 id={dialogTitleId} className="font-serif text-2xl">
          Report this poem
        </h2>
        <p className="mt-1 text-sm text-[#6d5848]">{title}</p>
        {status.type === "success" ? (
          <div className="mt-6">
            <p className="text-sm" role="status">
              Thank you. We’ll review this report.
            </p>
            <button
              type="button"
              onClick={closeDialog}
              className="mt-4 rounded-md bg-[#2a2118] px-4 py-2 text-sm font-semibold text-[#f7f1e8]"
            >
              Close
            </button>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="poem-report-category" className="mb-1 block text-sm font-semibold">
                Category
              </label>
              <select
                id="poem-report-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as PoemReportCategory | "")
                }
                className="w-full rounded-md border border-[#2a2118]/20 bg-white px-3 py-2 text-sm"
                required
              >
                <option value="">Choose one</option>
                {POEM_REPORT_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="poem-report-details" className="mb-1 block text-sm font-semibold">
                Details
              </label>
              <textarea
                id="poem-report-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full rounded-md border border-[#2a2118]/20 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="poem-report-email" className="mb-1 block text-sm font-semibold">
                Your email <span className="font-normal text-[#6d5848]">(optional)</span>
              </label>
              <input
                id="poem-report-email"
                type="email"
                value={reporterEmail}
                onChange={(event) => setReporterEmail(event.target.value)}
                className="w-full rounded-md border border-[#2a2118]/20 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="hidden" aria-hidden>
              <label htmlFor="poem-report-website">Website</label>
              <input
                id="poem-report-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>
            {status.type === "error" ? (
              <p className="text-sm text-red-700" role="alert">
                {status.message}
              </p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={status.type === "loading"}
                className="rounded-md bg-[#7a3e3e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {status.type === "loading" ? "Sending…" : "Send report"}
              </button>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-md px-4 py-2 text-sm font-semibold text-[#6d5848]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
