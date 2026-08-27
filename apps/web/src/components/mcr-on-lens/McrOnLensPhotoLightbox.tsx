"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type McrOnLensPhotoLightboxProps = {
  imageUrl: string;
  title: string;
  children: ReactNode;
};

export function McrOnLensPhotoLightbox({
  imageUrl,
  title,
  children,
}: McrOnLensPhotoLightboxProps) {
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      return;
    }

    if (dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block w-full cursor-zoom-in overflow-hidden bg-industrial-black text-left"
        aria-label={`Open ${title}`}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        onClose={close}
        className="m-auto w-[min(100%-2rem,64rem)] max-w-5xl border-0 bg-transparent p-0 shadow-none backdrop:bg-industrial-black/90"
      >
        <div className="relative">
          <button
            type="button"
            onClick={close}
            className="absolute right-2 top-2 z-10 rounded-full bg-industrial-black/70 p-2 text-white transition hover:bg-industrial-black"
            aria-label="Close image"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[min(90vh,900px)] w-full rounded-lg object-contain"
          />

          <p
            id={dialogTitleId}
            className="mt-3 text-center font-display text-headline-sm text-white"
          >
            {title}
          </p>
        </div>
      </dialog>
    </>
  );
}
