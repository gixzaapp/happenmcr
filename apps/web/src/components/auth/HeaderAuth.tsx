"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";

export function HeaderAuth() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (status === "loading") {
    return (
      <span
        className="hidden h-10 w-24 animate-pulse rounded-lg bg-industrial-black/5 sm:inline-block"
        aria-hidden
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="hard-shadow hidden rounded-lg bg-bee-yellow px-6 py-2 text-sm font-semibold tracking-wide text-industrial-black transition-all sm:inline-flex"
      >
        Sign In
      </Link>
    );
  }

  const label = session.user.name?.trim() || session.user.email || "Account";
  const initial = label.charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-industrial-black/10 bg-surface-container-low px-3 py-2 text-sm font-semibold text-industrial-black transition hover:bg-industrial-black/5"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-bee-yellow text-xs font-bold text-industrial-black">
            {initial}
          </span>
        )}
        <span className="max-w-[8rem] truncate">{label}</span>
        <span
          className={`material-symbols-outlined text-base transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          expand_more
        </span>
      </button>

      <div
        id={menuId}
        role="menu"
        className={`absolute right-0 top-full z-50 mt-2 min-w-[12rem] origin-top rounded-lg border border-industrial-black/10 bg-canvas-white py-2 shadow-lg transition ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <p className="truncate px-4 py-2 text-xs text-secondary">{label}</p>
        <button
          type="button"
          role="menuitem"
          className="block w-full px-4 py-2.5 text-left font-display text-base font-semibold text-secondary transition hover:bg-surface-container-low hover:text-industrial-black"
          onClick={() => {
            setOpen(false);
            void signOut({ callbackUrl: "/" });
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function MobileHeaderAuth({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="mt-6 block rounded-lg bg-bee-yellow px-4 py-3 text-center font-display text-lg font-semibold text-industrial-black"
        onClick={onNavigate}
      >
        Sign In
      </Link>
    );
  }

  const label = session.user.name?.trim() || session.user.email || "Account";

  return (
    <div className="mt-6 rounded-lg border border-industrial-black/10 bg-surface-container-low px-4 py-3">
      <p className="truncate font-display text-base font-semibold text-industrial-black">
        {label}
      </p>
      <button
        type="button"
        className="mt-2 font-display text-sm font-semibold text-secondary hover:text-industrial-black"
        onClick={() => {
          onNavigate?.();
          void signOut({ callbackUrl: "/" });
        }}
      >
        Sign out
      </button>
    </div>
  );
}
