"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { McrOnLensPhotoLightbox } from "@/components/mcr-on-lens/McrOnLensPhotoLightbox";
import type { LensMapPin } from "@/lib/mcr-on-lens";

const MANCHESTER_CENTER: [number, number] = [-2.244644, 53.480759];
const DEFAULT_ZOOM = 12.2;
const FOCUS_ZOOM = 15;

export type LensMapFocus = {
  photoId: string;
  lat: number;
  lng: number;
};

type McrOnLensMapProps = {
  accessToken: string;
  pins: LensMapPin[];
  focus?: LensMapFocus | null;
};

export function McrOnLensMap({ accessToken, pins, focus }: McrOnLensMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxPin, setLightboxPin] = useState<LensMapPin | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = accessToken;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: MANCHESTER_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: true,
      });
    } catch (err) {
      console.error("[lens-map]", err);
      setError("Could not load the Mapbox map.");
      return;
    }

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");
    mapRef.current = map;

    map.on("load", () => setReady(true));
    map.on("error", () => setError("Map failed to load. Check your Mapbox token."));

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    const bounds = new mapboxgl.LngLatBounds();
    const hasFocus = Boolean(focus);

    for (const pin of pins) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "lens-map-pin";
      el.setAttribute("aria-label", pin.title);
      el.style.cssText = [
        "width:48px",
        "height:48px",
        "padding:0",
        "border:3px solid #FFCC00",
        "border-radius:9999px",
        "overflow:hidden",
        "cursor:pointer",
        "box-shadow:0 4px 12px rgba(0,0,0,0.25)",
        "background:#111 center/cover no-repeat",
        `background-image:url(${JSON.stringify(pin.imageUrl)})`,
      ].join(";");

      const popup = new mapboxgl.Popup({ offset: 28, maxWidth: "240px" }).setHTML(
        [
          `<button type="button" data-lens-enlarge style="display:block;width:100%;padding:0;border:0;background:transparent;cursor:zoom-in;text-align:left;font-family:inherit">`,
          `<img src="${escapeHtml(pin.imageUrl)}" alt="${escapeHtml(pin.title)}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;display:block" />`,
          `<p style="margin:8px 0 0;font-weight:700;font-size:14px;color:#1a1a1a">${escapeHtml(pin.title)}</p>`,
          pin.location
            ? `<p style="margin:4px 0 0;font-size:12px;color:#5f5e5e">${escapeHtml(pin.location)}</p>`
            : "",
          `<p style="margin:8px 0 0;font-size:11px;font-weight:600;color:#8a6d00">Tap to enlarge</p>`,
          `</button>`,
        ].join(""),
      );

      const onPopupOpen = () => {
        const root = popup.getElement();
        const trigger = root?.querySelector<HTMLElement>("[data-lens-enlarge]");
        if (!trigger) return;

        trigger.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          setLightboxPin(pin);
        };
      };

      popup.on("open", onPopupOpen);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.set(pin.id, marker);
      bounds.extend([pin.lng, pin.lat]);
    }

    if (hasFocus && focus) {
      map.flyTo({
        center: [focus.lng, focus.lat],
        zoom: FOCUS_ZOOM,
        duration: 900,
      });
      const marker = markersRef.current.get(focus.photoId);
      if (marker) {
        window.setTimeout(() => marker.togglePopup(), 950);
      }
    } else if (pins.length === 1) {
      map.easeTo({ center: [pins[0]!.lng, pins[0]!.lat], zoom: 14 });
    } else if (pins.length > 1) {
      map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 600 });
    } else {
      map.easeTo({ center: MANCHESTER_CENTER, zoom: DEFAULT_ZOOM });
    }

    return () => {
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
    };
  }, [pins, ready, focus]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-industrial-black/10 bg-surface-container-low">
      <div
        ref={containerRef}
        className="h-[min(70vh,640px)] w-full"
        role="region"
        aria-label="Manchester photo map"
      />
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas-white/90 px-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      ) : null}
      {!error && pins.length === 0 && !focus ? (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-lg bg-canvas-white/95 px-4 py-3 text-sm text-secondary shadow">
          No geotagged uploads yet — add a location when you upload to pin photos
          here.
        </div>
      ) : null}

      {lightboxPin ? (
        <McrOnLensPhotoLightbox
          imageUrl={lightboxPin.imageUrl}
          title={lightboxPin.title}
          open
          onOpenChange={(next) => {
            if (!next) setLightboxPin(null);
          }}
        />
      ) : null}
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
