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

type VisitorStats = {
  day: string;
  uniqueToday: number;
  uniqueTotal: number;
};

async function getVisitorStats(): Promise<VisitorStats | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/stats/visitors`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      data?: {
        day?: string;
        uniqueToday?: number;
        uniqueTotal?: number;
      };
    };
    if (
      typeof body.data?.uniqueToday !== "number" ||
      typeof body.data?.uniqueTotal !== "number" ||
      typeof body.data?.day !== "string"
    ) {
      return null;
    }
    return {
      day: body.data.day,
      uniqueToday: body.data.uniqueToday,
      uniqueTotal: body.data.uniqueTotal,
    };
  } catch {
    return null;
  }
}

export default async function VisitorCountPage() {
  const stats = await getVisitorStats();

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
        <p style={{ opacity: 0.6, marginBottom: 8 }}>unique visitors today</p>
        <p style={{ fontSize: "4rem", margin: 0, fontWeight: 700 }}>
          {stats ? stats.uniqueToday.toLocaleString("en-GB") : "—"}
        </p>
        <p style={{ opacity: 0.45, marginTop: 16, fontSize: "0.95rem" }}>
          {stats
            ? `${stats.day} · lifetime visitor-days ${stats.uniqueTotal.toLocaleString("en-GB")}`
            : "unavailable"}
        </p>
      </div>
    </main>
  );
}
