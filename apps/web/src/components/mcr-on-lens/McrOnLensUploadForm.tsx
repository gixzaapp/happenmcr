"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  LocationAutocomplete,
  type SelectedLocation,
} from "@/components/location";
import type { GeocodeSuggestion } from "@/lib/geocode";
import { MCR_ON_LENS_PATH } from "@/lib/mcr-on-lens";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:4000"
  );
}

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

export function McrOnLensUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [geocode, setGeocode] = useState<GeocodeSuggestion | null>(null);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  function clearFile() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearLocation() {
    setLocationQuery("");
    setSelectedLocation(null);
    setGeocode(null);
  }

  function onLocationChange(value: string) {
    setLocationQuery(value);
    // Typing again invalidates a previous pick until they re-select.
    if (selectedLocation && value !== selectedLocation.place_name) {
      setSelectedLocation(null);
      setGeocode(null);
    }
  }

  function onSelectLocation(location: SelectedLocation) {
    setSelectedLocation(location);
    setGeocode(location.geocode);
    setLocationQuery(location.place_name);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    if (!next) {
      clearFile();
      return;
    }

    if (!ALLOWED.has(next.type)) {
      setStatus({
        type: "error",
        message: "Photo must be a JPEG, PNG, or WebP file.",
      });
      clearFile();
      return;
    }

    if (next.size > MAX_BYTES) {
      setStatus({
        type: "error",
        message: "Photo must be 5MB or smaller.",
      });
      clearFile();
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    if (status.type === "error" || status.type === "success") {
      setStatus({ type: "idle" });
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus({ type: "error", message: "Please choose a photo to upload." });
      return;
    }

    setStatus({ type: "loading" });
    const payload = new FormData();
    payload.set("image", file);
    payload.set("caption", caption);
    payload.set("description", description);
    payload.set(
      "location",
      selectedLocation?.place_name || locationQuery.trim(),
    );
    if (selectedLocation) {
      payload.set("lat", String(selectedLocation.lat));
      payload.set("lng", String(selectedLocation.lng));
    }
    if (geocode) {
      payload.set("geocode", JSON.stringify(geocode));
    }
    payload.set("website", website);

    try {
      const response = await fetch(`${getApiBase()}/lens/photos`, {
        method: "POST",
        body: payload,
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: body.error || "Could not upload the photo. Try again.",
        });
        return;
      }

      setCaption("");
      setDescription("");
      clearLocation();
      clearFile();
      setStatus({
        type: "success",
        message: "Photo uploaded — it’s live on the feed.",
      });
      router.refresh();
      router.push(MCR_ON_LENS_PATH);
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  return (
    <section className="mb-stack-lg max-w-xl">
      <h2 className="font-display text-headline-md text-industrial-black">
        Upload a photo
      </h2>
      <p className="mt-2 text-body-md text-secondary">
        Share a moment from Manchester. JPEG, PNG or WebP — up to 5MB.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <label
            htmlFor="lens-image"
            className="mb-2 block text-label-md font-bold text-industrial-black"
          >
            Photo <span className="text-primary">*</span>
          </label>
          <input
            ref={inputRef}
            id="lens-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            disabled={status.type === "loading"}
            className="block w-full text-sm text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-bee-yellow file:px-4 file:py-2.5 file:font-display file:text-sm file:text-industrial-black hover:file:brightness-95 disabled:opacity-60"
          />
          {preview ? (
            <div className="relative mt-4 overflow-hidden rounded-lg border border-industrial-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Upload preview"
                className="max-h-80 w-full object-contain bg-surface-container-low"
              />
              <button
                type="button"
                onClick={clearFile}
                className="absolute right-3 top-3 rounded-full bg-industrial-black/80 px-3 py-1 text-xs font-semibold text-white"
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="lens-caption"
            className="mb-2 block text-label-md font-bold text-industrial-black"
          >
            Caption
          </label>
          <input
            id="lens-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={120}
            placeholder="Short title on the photo"
            disabled={status.type === "loading"}
            className="w-full rounded-lg border border-industrial-black/15 bg-canvas-white px-4 py-3 text-base outline-none focus:border-bee-yellow focus:ring-1 focus:ring-bee-yellow disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="lens-description"
            className="mb-2 block text-label-md font-bold text-industrial-black"
          >
            Description
          </label>
          <textarea
            id="lens-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Tell the story behind the shot…"
            disabled={status.type === "loading"}
            className="w-full resize-y rounded-lg border border-industrial-black/15 bg-canvas-white px-4 py-3 text-base outline-none focus:border-bee-yellow focus:ring-1 focus:ring-bee-yellow disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="lens-location"
            className="mb-2 block text-label-md font-bold text-industrial-black"
          >
            Add location
          </label>
          <LocationAutocomplete
            id="lens-location"
            value={locationQuery}
            onChange={onLocationChange}
            onSelectLocation={onSelectLocation}
            disabled={status.type === "loading"}
            placeholder="Search Manchester places…"
          />
          {selectedLocation ? (
            <p className="mt-2 text-xs text-secondary">
              Selected · {selectedLocation.lat.toFixed(5)},{" "}
              {selectedLocation.lng.toFixed(5)}
            </p>
          ) : null}
        </div>

        {/* Honeypot */}
        <div className="hidden" aria-hidden>
          <label htmlFor="lens-website">Website</label>
          <input
            id="lens-website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {status.type === "error" ? (
          <p className="text-sm font-semibold text-red-700" role="alert">
            {status.message}
          </p>
        ) : null}
        {status.type === "success" ? (
          <p className="text-sm font-semibold text-green-800" role="status">
            {status.message}{" "}
            <Link href={MCR_ON_LENS_PATH} className="underline">
              View feed
            </Link>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status.type === "loading"}
          className="hard-shadow inline-flex items-center gap-2 rounded-lg bg-bee-yellow px-8 py-4 font-display text-headline-sm text-industrial-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {status.type === "loading" ? "Uploading…" : "Share photo"}
          <span className="material-symbols-outlined">upload</span>
        </button>
      </form>
    </section>
  );
}
