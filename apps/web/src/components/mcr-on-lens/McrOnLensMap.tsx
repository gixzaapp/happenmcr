"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LensMapPin } from "@/lib/mcr-on-lens";

const MANCHESTER_CENTER: [number, number] = [-2.244644, 53.480759];
const DEFAULT_ZOOM = 12.2;

type McrOnLensMapProps = {
  accessToken: string;
  pins: LensMapPin[];
};

export function McrOnLensMap({ accessToken, pins }: McrOnLensMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const markers: mapboxgl.Marker[] = [];
    const bounds = new mapboxgl.LngLatBounds();

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
          `<div style="font-family:inherit">`,
          `<img src="${escapeHtml(pin.imageUrl)}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;display:block" />`,
          `<p style="margin:8px 0 0;font-weight:700;font-size:14px;color:#1a1a1a">${escapeHtml(pin.title)}</p>`,
          pin.location
            ? `<p style="margin:4px 0 0;font-size:12px;color:#5f5e5e">${escapeHtml(pin.location)}</p>`
            : "",
          `</div>`,
        ].join(""),
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(map);

      markers.push(marker);
      bounds.extend([pin.lng, pin.lat]);
    }

    if (pins.length === 1) {
      map.easeTo({ center: [pins[0]!.lng, pins[0]!.lat], zoom: 14 });
    } else if (pins.length > 1) {
      map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 600 });
    } else {
      map.easeTo({ center: MANCHESTER_CENTER, zoom: DEFAULT_ZOOM });
    }

    return () => {
      for (const marker of markers) marker.remove();
    };
  }, [pins, ready]);

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
      {!error && pins.length === 0 ? (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-lg bg-canvas-white/95 px-4 py-3 text-sm text-secondary shadow">
          No geotagged uploads yet — add a location when you upload to pin photos
          here.
        </div>
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
