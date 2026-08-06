import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HappenMCR — What's on in Manchester";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default Open Graph / Twitter share image. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111111",
          color: "#FFCC00",
          padding: 72,
          fontFamily: "system-ui, Arial Black, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#FFFFFF",
            opacity: 0.7,
          }}
        >
          MANCHESTER UNIFIED
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#FFFFFF",
            }}
          >
            Happen
            <span style={{ color: "#FFCC00" }}>MCR</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 600,
              color: "#FFFFFF",
              maxWidth: 900,
            }}
          >
            What&apos;s on in Manchester — events, gigs & nightlife
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
