"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { savePoetProfile } from "@/app/(site)/mcr-buzz/poets-corner/profile/actions";

const fieldClass =
  "w-full rounded-md border border-[#2a2118]/20 bg-[#fffaf3] px-4 py-3 text-base text-[#2a2118] outline-none focus:border-[#7a3e3e] disabled:opacity-60";

export function PoetProfileForm({
  name,
  bio,
  imageUrl,
}: {
  name: string;
  bio: string | null;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [about, setAbout] = useState(bio ?? "");
  const [preview, setPreview] = useState(imageUrl);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayName.trim()) {
      setError("Add your name.");
      return;
    }
    const formData = new FormData();
    formData.set("name", displayName.trim());
    formData.set("bio", about.trim());
    if (file) formData.set("image", file);
    setSaving(true);
    setError(null);
    const result = await savePoetProfile(formData);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 border-t border-[#2a2118]/10 pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a42]">
        Edit profile
      </h2>
      <div>
        <label htmlFor="poet-name" className="mb-2 block text-sm font-semibold">
          Name
        </label>
        <input
          id="poet-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={80}
          required
          disabled={saving}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="poet-bio" className="mb-2 block text-sm font-semibold">
          Bio
        </label>
        <textarea
          id="poet-bio"
          value={about}
          onChange={(event) => setAbout(event.target.value)}
          maxLength={800}
          rows={4}
          disabled={saving}
          placeholder="A few lines about you and the work."
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="poet-picture" className="mb-2 block text-sm font-semibold">
          Profile picture
        </label>
        <input
          id="poet-picture"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={saving}
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            setFile(next);
            if (next) setPreview(URL.createObjectURL(next));
          }}
          className="block w-full text-sm text-[#5c4a3a] file:mr-3 file:rounded-full file:border-0 file:bg-[#2a2118] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#f7f1e8]"
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="mt-4 h-28 w-28 rounded-full object-cover"
          />
        ) : null}
      </div>
      {error ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[#2a2118] px-5 py-2.5 text-sm font-semibold text-[#f7f1e8] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
