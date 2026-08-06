import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — black square with yellow H. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
          color: "#FFCC00",
          fontSize: 120,
          fontWeight: 800,
          fontFamily: "system-ui, Arial Black, sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        H
      </div>
    ),
    { ...size },
  );
}
