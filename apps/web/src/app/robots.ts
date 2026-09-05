import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/config";
import { MCR_ON_LENS_UPLOAD_PATH } from "@/lib/mcr-on-lens";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/search",
        "/login",
        "/auth/",
        MCR_ON_LENS_UPLOAD_PATH,
        "/getmethevisitorcount",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
