type EventSymbolicPosterProps = {
  title: string;
  className?: string;
  /** Extra classes for the title text (size/clamp). */
  titleClassName?: string;
};

/** Dark branded stand-in used instead of scraped organiser photos. */
export function EventSymbolicPoster({
  title,
  className = "",
  titleClassName = "",
}: EventSymbolicPosterProps) {
  return (
    <div
      className={`flex h-full w-full items-end bg-industrial-black p-4 sm:p-5 ${className}`}
      aria-hidden
    >
      <p
        className={`line-clamp-4 font-display text-base font-bold leading-snug tracking-tight text-bee-yellow sm:text-lg ${titleClassName}`}
      >
        {title}
      </p>
    </div>
  );
}
