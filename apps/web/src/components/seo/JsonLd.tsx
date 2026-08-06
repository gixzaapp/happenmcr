type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Renders a JSON-LD `<script>` block for structured data. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
