import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** CDN hosts seen in production event images (+ marketing Unsplash). */
const EVENT_IMAGE_HOSTS = [
  "images.unsplash.com",
  "cdn.pixabay.com",
  "s1.ticketm.net",
  "d31fr2pwly4c4s.cloudfront.net",
  "d1plawd8huk6hh.cloudfront.net",
  "dynamicmedia.livenationinternational.com",
  "bandonthewall.org",
  "www.bandonthewall.org",
  "alberthallmanchester.com",
  "www.alberthallmanchester.com",
  "img.cooplive.com",
  "www.cooplive.com",
  "cooplive.com",
  "www.ao-arena.com",
  "ao-arena.com",
  "img.evbuc.com",
  "cdn.evbuc.com",
  "www.rncm.ac.uk",
  "rncm.ac.uk",
  "www.manchester.ac.uk",
  "manchester.ac.uk",
  "www.mmu.ac.uk",
  "mmu.ac.uk",
  "www.salford.ac.uk",
  "salford.ac.uk",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@happenmcr/types"],
  experimental: {
    outputFileTracingRoot: root,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86_400,
    remotePatterns: EVENT_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https",
      hostname,
      pathname: "/**",
    })),
  },
  trailingSlash: false,
};

export default nextConfig;
