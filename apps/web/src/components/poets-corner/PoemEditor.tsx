"use client";

import { useEffect, useRef } from "react";

type PoemEditorProps = {
  initialHtml?: string;
  onChange: (html: string) => void;
  disabled?: boolean;
};

export function PoemEditor({
  initialHtml = "",
  onChange,
  disabled = false,
}: PoemEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || !editorRef.current) return;
    seeded.current = true;
    if (!initialHtml) return;
    editorRef.current.innerHTML = initialHtml;
    onChange(initialHtml);
  }, [initialHtml, onChange]);

  function sync() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function format(command: "bold" | "italic" | "formatBlock", value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2" role="toolbar" aria-label="Poem formatting">
        <EditorButton label="Bold" disabled={disabled} onClick={() => format("bold")} />
        <EditorButton label="Italic" disabled={disabled} onClick={() => format("italic")} />
        <EditorButton
          label="Heading"
          disabled={disabled}
          onClick={() => format("formatBlock", "h2")}
        />
        <EditorButton
          label="Quote"
          disabled={disabled}
          onClick={() => format("formatBlock", "blockquote")}
        />
      </div>
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label="Poem"
        contentEditable={disabled ? "false" : "true"}
        data-placeholder="Write the poem here…"
        onInput={sync}
        className="min-h-56 w-full rounded-md border border-[#2a2118]/20 bg-[#fffaf3] px-4 py-3 text-lg leading-relaxed outline-none empty:before:text-[#a89888] empty:before:content-[attr(data-placeholder)] focus:border-[#7a3e3e]"
        style={{ fontFamily: "var(--font-history-serif), Georgia, serif" }}
      />
    </div>
  );
}

function EditorButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="rounded-full border border-[#2a2118]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#5c4a3a] hover:bg-[#efe6d8] disabled:opacity-50"
    >
      {label}
    </button>
  );
}
