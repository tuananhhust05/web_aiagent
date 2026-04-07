import { useRef, useEffect, useCallback, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Undo2,
  Redo2,
  Strikethrough,
  Link,
  Unlink,
  Minus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GmailRichEditorProps {
  value: string;          // HTML string
  onChange: (html: string) => void;
  readOnly?: boolean;
  minHeight?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert plain-text (with \n) to minimal HTML for initial display */
export function plainToHtml(text: string): string {
  if (!text) return "";
  // If it already looks like HTML, return as-is
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split("\n")
    .map((line) => `<p>${line === "" ? "<br>" : escapeHtml(line)}</p>`)
    .join("");
}

/** Strip HTML tags to get plain text (for sending / saving as plain) */
export function htmlToPlain(html: string): string {
  if (!html) return "";
  // Replace block-level closes with newlines
  const withNewlines = html
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  // Decode HTML entities
  const el = document.createElement("textarea");
  el.innerHTML = withNewlines;
  return el.value.replace(/\n{3,}/g, "\n\n").trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&#34;");
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

const ToolbarBtn = ({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => {
      e.preventDefault(); // keep focus in editor
      onClick(e);
    }}
    className={`inline-flex h-6 w-6 items-center justify-center rounded transition-colors text-[11px]
      ${active
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"}
      ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    {children}
  </button>
);

const ToolbarSep = () => (
  <div className="mx-0.5 h-4 w-px bg-border/70 shrink-0" />
);

// ─── Main Component ───────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Courier New",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

const FONT_SIZES = ["10", "11", "12", "13", "14", "16", "18", "20", "24"];

const TEXT_COLORS = [
  "#000000", "#374151", "#6B7280", "#EF4444", "#F97316",
  "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899",
];

const BG_COLORS = [
  "transparent", "#FEF3C7", "#DCFCE7", "#DBEAFE", "#F3E8FF",
  "#FCE7F3", "#FEE2E2", "#E0F2FE", "#D1FAE5", "#FDF4FF",
];

export function GmailRichEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = 160,
}: GmailRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState<"text" | "bg" | null>(null);

  // ── Sync initial value into editor ──────────────────────────────────────────
  const lastHtml = useRef<string>("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastHtml.current) {
      const html = plainToHtml(value);
      el.innerHTML = html;
      lastHtml.current = html;
    }
  }, [value]);

  // ── Emit changes ─────────────────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastHtml.current = html;
    onChange(html);
  }, [onChange]);

  // ── execCommand wrapper ───────────────────────────────────────────────────────
  const exec = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value ?? "");
      handleInput();
    },
    [handleInput]
  );

  // ── Query active state ────────────────────────────────────────────────────────
  const isActive = (command: string) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  // ── Force re-render on selection change to update active states ──────────────
  const [, forceUpdate] = useState(0);
  const onSelectionChange = useCallback(() => forceUpdate((n) => n + 1), []);
  useEffect(() => {
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [onSelectionChange]);

  // ── Color picker close on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = () => setShowColorPicker(null);
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColorPicker]);

  if (readOnly) {
    return (
      <div
        className="text-[13px] leading-relaxed text-foreground px-2 py-1"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: plainToHtml(value) }}
      />
    );
  }

  return (
    <div
      className="rounded-md border border-border bg-card overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1.5 py-1">
        {/* Font Family */}
        <select
          title="Font family"
          className="h-6 rounded border border-border bg-card px-1 text-[10px] text-foreground cursor-pointer hover:border-primary focus:outline-none"
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            editorRef.current?.focus();
            exec("fontName", e.target.value);
          }}
        >
          <option value="">Font</option>
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          title="Font size"
          className="h-6 w-12 rounded border border-border bg-card px-1 text-[10px] text-foreground cursor-pointer hover:border-primary focus:outline-none"
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            editorRef.current?.focus();
            // execCommand fontSize uses 1-7, we use a workaround via CSS
            const px = e.target.value;
            exec("fontSize", "7");
            // now find the font elements and override size
            const fonts = editorRef.current?.querySelectorAll("font[size='7']");
            fonts?.forEach((el) => {
              (el as HTMLElement).removeAttribute("size");
              (el as HTMLElement).style.fontSize = `${px}px`;
            });
            handleInput();
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <ToolbarSep />

        {/* Bold / Italic / Underline / Strikethrough */}
        <ToolbarBtn title="Bold (Ctrl+B)" active={isActive("bold")} onClick={() => exec("bold")}>
          <Bold size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Italic (Ctrl+I)" active={isActive("italic")} onClick={() => exec("italic")}>
          <Italic size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Underline (Ctrl+U)" active={isActive("underline")} onClick={() => exec("underline")}>
          <Underline size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" active={isActive("strikeThrough")} onClick={() => exec("strikeThrough")}>
          <Strikethrough size={11} />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            title="Text color"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowColorPicker((v) => (v === "text" ? null : "text"));
            }}
            className="inline-flex h-6 w-6 flex-col items-center justify-center rounded hover:bg-muted cursor-pointer"
          >
            <span className="text-[10px] font-bold leading-none text-foreground">A</span>
            <span
              className="h-1 w-4 rounded-sm"
              style={{ backgroundColor: "#3B82F6" }}
            />
          </button>
          {showColorPicker === "text" && (
            <div
              className="absolute top-7 left-0 z-50 rounded-md border border-border bg-card p-2 shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <p className="mb-1 text-[9px] font-bold uppercase text-muted-foreground">Text Color</p>
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    className="h-5 w-5 rounded border border-border/50 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      exec("foreColor", c);
                      setShowColorPicker(null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative">
          <button
            type="button"
            title="Highlight color"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowColorPicker((v) => (v === "bg" ? null : "bg"));
            }}
            className="inline-flex h-6 w-6 flex-col items-center justify-center rounded hover:bg-muted cursor-pointer"
          >
            <span
              className="h-4 w-4 rounded-sm border border-border/60 text-[8px] flex items-center justify-center font-bold"
              style={{ backgroundColor: "#FEF3C7" }}
            >
              H
            </span>
          </button>
          {showColorPicker === "bg" && (
            <div
              className="absolute top-7 left-0 z-50 rounded-md border border-border bg-card p-2 shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <p className="mb-1 text-[9px] font-bold uppercase text-muted-foreground">Highlight</p>
              <div className="grid grid-cols-5 gap-1">
                {BG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c === "transparent" ? "None" : c}
                    className="h-5 w-5 rounded border border-border/50 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c === "transparent" ? "white" : c }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      exec("hiliteColor", c === "transparent" ? "transparent" : c);
                      setShowColorPicker(null);
                    }}
                  >
                    {c === "transparent" && (
                      <span className="text-[8px] text-muted-foreground">✕</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ToolbarSep />

        {/* Alignment */}
        <ToolbarBtn title="Align left" active={isActive("justifyLeft")} onClick={() => exec("justifyLeft")}>
          <AlignLeft size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Align center" active={isActive("justifyCenter")} onClick={() => exec("justifyCenter")}>
          <AlignCenter size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Align right" active={isActive("justifyRight")} onClick={() => exec("justifyRight")}>
          <AlignRight size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Justify" active={isActive("justifyFull")} onClick={() => exec("justifyFull")}>
          <AlignJustify size={11} />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Lists */}
        <ToolbarBtn
          title="Bullet list"
          active={isActive("insertUnorderedList")}
          onClick={() => exec("insertUnorderedList")}
        >
          <List size={11} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          active={isActive("insertOrderedList")}
          onClick={() => exec("insertOrderedList")}
        >
          <ListOrdered size={11} />
        </ToolbarBtn>

        {/* Indent / Outdent */}
        <ToolbarBtn title="Indent" onClick={() => exec("indent")}>
          <Indent size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Outdent" onClick={() => exec("outdent")}>
          <Outdent size={11} />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Blockquote */}
        <ToolbarBtn
          title="Blockquote"
          onClick={() => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            const bq = document.createElement("blockquote");
            bq.style.cssText =
              "border-left: 3px solid #6B7280; margin: 4px 0 4px 8px; padding-left: 8px; color: #6B7280;";
            try {
              range.surroundContents(bq);
            } catch {
              bq.appendChild(range.extractContents());
              range.insertNode(bq);
            }
            handleInput();
          }}
        >
          <Quote size={11} />
        </ToolbarBtn>

        {/* Horizontal rule */}
        <ToolbarBtn title="Horizontal line" onClick={() => exec("insertHorizontalRule")}>
          <Minus size={11} />
        </ToolbarBtn>

        {/* Link / Unlink */}
        <ToolbarBtn
          title="Insert link"
          onClick={() => {
            const url = prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
        >
          <Link size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Remove link" onClick={() => exec("unlink")}>
          <Unlink size={11} />
        </ToolbarBtn>

        <ToolbarSep />

        {/* Undo / Redo */}
        <ToolbarBtn title="Undo (Ctrl+Z)" onClick={() => exec("undo")}>
          <Undo2 size={11} />
        </ToolbarBtn>
        <ToolbarBtn title="Redo (Ctrl+Y)" onClick={() => exec("redo")}>
          <Redo2 size={11} />
        </ToolbarBtn>
      </div>

      {/* ── Editor area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={(e) => {
          // Tab → indent
          if (e.key === "Tab") {
            e.preventDefault();
            exec(e.shiftKey ? "outdent" : "indent");
          }
        }}
        className="w-full px-3 py-2.5 text-[13px] leading-relaxed text-foreground focus:outline-none"
        style={{
          minHeight,
          fontFamily: "inherit",
          overflowY: "auto",
          wordBreak: "break-word",
        }}
        spellCheck
      />
    </div>
  );
}

export default GmailRichEditor;
