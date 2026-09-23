"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { submitPoem, updatePoem } from "@/app/(site)/mcr-buzz/poets-corner/write/actions";
import { poemPath } from "@/lib/poets-corner";
import { PoemDisclaimer } from "./PoemDisclaimer";
import { PoemEditor } from "./PoemEditor";

const fieldClass =
  "w-full rounded-md border border-[#2a2118]/20 bg-[#fffaf3] px-4 py-3 text-base text-[#2a2118] outline-none focus:border-[#7a3e3e] disabled:opacity-60";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string };

export function PoemWriteForm({
  defaultAuthor,
  poemId,
  initial,
}: {
  defaultAuthor: string;
  poemId?: string;
  initial?: {
    title: string;
    authorName: string;
    place: string;
    dedication: string;
    bodyHtml: string;
    imageUrl: string | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [authorName, setAuthorName] = useState(initial?.authorName || defaultAuthor);
  const [place, setPlace] = useState(initial?.place ?? "");
  const [dedication, setDedication] = useState(initial?.dedication ?? "");
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyHtml ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  function onImage(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = bodyHtml.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!title.trim() || !authorName.trim() || !text) {
      setStatus({ type: "error", message: "Add a title, your name, and the poem." });
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("authorName", authorName.trim());
    formData.set("bodyHtml", bodyHtml);
    if (place.trim()) formData.set("place", place.trim());
    if (dedication.trim()) formData.set("dedication", dedication.trim());
    if (image) formData.set("image", image);
    formData.set("website", website);

    setStatus({ type: "loading" });
    const result = poemId
      ? await updatePoem(poemId, formData)
      : await submitPoem(formData);
    if (!result.ok) {
      setStatus({ type: "error", message: result.error });
      return;
    }
    router.push(poemPath(poemId ?? result.id));
    router.refresh();
  }

  const disabled = status.type === "loading";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <label htmlFor="poem-title" className="mb-2 block text-sm font-semibold text-[#2a2118]">
          Title
        </label>
        <input
          id="poem-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={140}
          required
          disabled={disabled}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="poem-author" className="mb-2 block text-sm font-semibold text-[#2a2118]">
          Author name
        </label>
        <input
          id="poem-author"
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          maxLength={80}
          required
          disabled={disabled}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="poem-place" className="mb-2 block text-sm font-semibold text-[#2a2118]">
          Place or subject <span className="font-normal text-[#6d5848]">(optional)</span>
        </label>
        <input
          id="poem-place"
          value={place}
          onChange={(event) => setPlace(event.target.value)}
          maxLength={160}
          placeholder="Northern Quarter, a night bus, the Irwell…"
          disabled={disabled}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="poem-dedication" className="mb-2 block text-sm font-semibold text-[#2a2118]">
          Dedication <span className="font-normal text-[#6d5848]">(optional)</span>
        </label>
        <input
          id="poem-dedication"
          value={dedication}
          onChange={(event) => setDedication(event.target.value)}
          maxLength={160}
          disabled={disabled}
          className={fieldClass}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-[#2a2118]">Poem</p>
        <PoemEditor initialHtml={initial?.bodyHtml} onChange={setBodyHtml} disabled={disabled} />
      </div>
      <div>
        <label htmlFor="poem-image" className="mb-2 block text-sm font-semibold text-[#2a2118]">
          Image <span className="font-normal text-[#6d5848]">(optional, JPEG, PNG, or WebP, up to 5MB)</span>
        </label>
        <input
          id="poem-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => onImage(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-[#5c4a3a] file:mr-3 file:rounded-full file:border-0 file:bg-[#2a2118] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#f7f1e8]"
        />
        {preview ? (
          <div className="relative mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-72 w-full rounded-sm object-cover" />
            <button
              type="button"
              onClick={() => onImage(null)}
              className="absolute right-3 top-3 rounded-full bg-[#2a2118]/80 px-3 py-1 text-xs font-semibold text-white"
            >
              Remove
            </button>
          </div>
        ) : null}
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor="poem-website">Website</label>
        <input
          id="poem-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      {status.type === "error" ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {status.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled}
        className="rounded-full bg-[#7a3e3e] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {disabled ? "Saving…" : poemId ? "Save changes" : "Share poem"}
      </button>
      <PoemDisclaimer />
    </form>
  );
}
