"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { trackEvent } from "@/components/analytics";
import {
  isAllowedAffiliateUrl,
  type ExperienceProvider,
} from "@/lib/things-to-do";

type AffiliateOutboundLinkProps = {
  href: string;
  provider: ExperienceProvider;
  experienceId: string;
  experienceTitle: string;
  children: ReactNode;
  className?: string;
} & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children" | "className" | "rel" | "target"
>;

/**
 * External booking link.
 * Viator rows must target Viator.com only (affiliate traffic licence).
 */
export function AffiliateOutboundLink({
  href,
  provider,
  experienceId,
  experienceTitle,
  children,
  className,
  onClick,
  ...rest
}: AffiliateOutboundLinkProps) {
  if (!isAllowedAffiliateUrl(provider, href)) {
    return null;
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    trackEvent("affiliate_click", {
      provider,
      experience_id: experienceId,
      experience_title: experienceTitle,
      link_url: href,
    });
    onClick?.(event);
  }

  return (
    <a
      {...rest}
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
