import type { Metadata } from "next";
import { getApiBaseUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Visitor count",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

async function getVisitorCount(): Promise<number | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/stats/visitors`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      data?: { pageviews?: number };
    };
    return typeof body.data?.pageviews === "number" ? body.data.pageviews : null;
  } catch {
    return null;
  }
}

export default async function VisitorCountPage() {
  const count = await getVisitorCount();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "monospace",
        background: "#111",
        color: "#eee",
        margin: 0,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ opacity: 0.6, marginBottom: 8 }}>pageviews</p>
        <p style={{ fontSize: "4rem", margin: 0, fontWeight: 700 }}>
          {count === null ? "—" : count.toLocaleString("en-GB")}
        </p>
      </div>
    </main>
  );
}
