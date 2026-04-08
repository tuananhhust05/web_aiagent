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
  Paperclip,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GmailRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  minHeight?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  attachments?: File[];
  onAttachmentsChange?: (files: File[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function plainToHtml(text: string): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split("\n")
    .map((line) => `<p>${line === "" ? "<br>" : escapeHtml(line)}</p>`)
    .join("");
}

export function htmlToPlain(html: string): string {
  if (!html) return "";
  const withNewlines = html
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "");
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: File): string {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return "📄";
  if (type.startsWith("image/")) return "🖼️";
  if (
    type.includes("spreadsheet") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  )
    return "📊";
  if (
    type.includes("word") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt") ||
    type.includes("text")
  )
    return "📝";
  return "📎";
}

function truncateFilename(name: string, max = 24): string {
  if (name.length <= max) return name;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.slice(0, max - ext.length - 3);
  return `${base}...${ext}`;
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
      e.preventDefault();
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

// ─── Font Dropdown ────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Courier New",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Comic Sans MS",
  "Impact",
  "Tahoma",
  "Palatino Linotype",
  "Book Antiqua",
  "Lucida Console",
];

interface FontDropdownProps {
  currentFont: string;
  onSelect: (font: string) => void;
}

const FontDropdown = ({ currentFont, onSelect }: FontDropdownProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        title="Font family"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="flex h-6 items-center gap-1 rounded border border-border bg-card px-1.5 text-[10px] text-foreground hover:border-primary focus:outline-none cursor-pointer min-w-[68px] max-w-[80px]"
        style={{ fontFamily: currentFont || "inherit" }}
      >
        <span className="truncate flex-1 text-left">{currentFont || "Font"}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0 text-muted-foreground">
          <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-[100] mt-0.5 w-44 rounded-md border border-border bg-card shadow-xl animate-in slide-in-from-top-1 fade-in-0 duration-150 overflow-hidden"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="relative">
            <ul className="max-h-48 overflow-y-auto py-0.5">
              {FONT_FAMILIES.map((font) => {
                const isActive = currentFont === font;
                return (
                  <li key={font}>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-left transition-colors
                        ${isActive
                          ? "bg-primary/10 border-l-2 border-primary text-foreground"
                          : "border-l-2 border-transparent text-foreground hover:bg-muted"
                        }`}
                      style={{ fontFamily: font }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(font);
                        setOpen(false);
                      }}
                    >
                      <span className="flex-1 truncate">{font}</span>
                      {isActive && (
                        <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 text-primary">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FONT_SIZES = ["10", "11", "12", "13", "14", "16", "18", "20", "24"];

const TEXT_COLORS = [
  "#000000", "#374151", "#6B7280", "#EF4444", "#F97316",
  "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899",
];

const BG_COLORS = [
  "transparent", "#FEF3C7", "#DCFCE7", "#DBEAFE", "#F3E8FF",
  "#FCE7F3", "#FEE2E2", "#E0F2FE", "#D1FAE5", "#FDF4FF",
];

export function GmailRichTextEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = 160,
  onFocus,
  onBlur,
  attachments = [],
  onAttachmentsChange,
}: GmailRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState<"text" | "bg" | null>(null);
  const [currentFont, setCurrentFont] = useState<string>("");
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

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastHtml.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val ?? "");
      handleInput();
    },
    [handleInput]
  );

  const isActive = (command: string) => {
    try { return document.queryCommandState(command); } catch { return false; }
  };

  const [, forceUpdate] = useState(0);
  const onSelectionChange = useCallback(() => {
    forceUpdate((n) => n + 1);
    try {
      const fontName = document.queryCommandValue("fontName");
      setCurrentFont(fontName ? fontName.replace(/['"]/g, "") : "");
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [onSelectionChange]);

  useEffect(() => {
    if (!showColorPicker) return;
    const handler = () => setShowColorPicker(null);
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColorPicker]);

  const applyFont = useCallback((font: string) => {
    editorRef.current?.focus();
    exec("fontName", font);
    setCurrentFont(font);
  }, [exec]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onAttachmentsChange) return;
    onAttachmentsChange([...attachments, ...Array.from(files)]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    if (!onAttachmentsChange) return;
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

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
    <div className="rounded-md border border-border bg-card overflow-hidden" onClick={(e) => e.stopPropagation()}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1.5 py-1">
        <FontDropdown currentFont={currentFont} onSelect={applyFont} />

        <select
          title="Font size"
          className="h-6 w-12 rounded border border-border bg-card px-1 text-[10px] text-foreground cursor-pointer hover:border-primary focus:outline-none"
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            editorRef.current?.focus();
            const px = e.target.value;
            exec("fontSize", "7");
            editorRef.current?.querySelectorAll("font[size='7']").forEach((el) => {
              (el as HTMLElement).removeAttribute("size");
              (el as HTMLElement).style.fontSize = `${px}px`;
            });
            handleInput();
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <ToolbarSep />
        <ToolbarBtn title="Bold" active={isActive("bold")} onClick={() => exec("bold")}><Bold size={11} /></ToolbarBtn>
        <ToolbarBtn title="Italic" active={isActive("italic")} onClick={() => exec("italic")}><Italic size={11} /></ToolbarBtn>
        <ToolbarBtn title="Underline" active={isActive("underline")} onClick={() => exec("underline")}><Underline size={11} /></ToolbarBtn>
        <ToolbarBtn title="Strikethrough" active={isActive("strikeThrough")} onClick={() => exec("strikeThrough")}><Strikethrough size={11} /></ToolbarBtn>
        <ToolbarSep />

        {/* Text Color */}
        <div className="relative">
          <button type="button" title="Text color" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowColorPicker((v) => (v === "text" ? null : "text")); }} className="inline-flex h-6 w-6 flex-col items-center justify-center rounded hover:bg-muted cursor-pointer">
            <span className="text-[10px] font-bold leading-none text-foreground">A</span>
            <span className="h-1 w-4 rounded-sm" style={{ backgroundColor: "#3B82F6" }} />
          </button>
          {showColorPicker === "text" && (
            <div className="absolute top-7 left-0 z-50 rounded-md border border-border bg-card p-2 shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
              <p className="mb-1 text-[9px] font-bold uppercase text-muted-foreground">Text Color</p>
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map((c) => (
                  <button key={c} type="button" className="h-5 w-5 rounded border border-border/50 hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: c }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); exec("foreColor", c); setShowColorPicker(null); }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BG Color */}
        <div className="relative">
          <button type="button" title="Highlight" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowColorPicker((v) => (v === "bg" ? null : "bg")); }} className="inline-flex h-6 w-6 flex-col items-center justify-center rounded hover:bg-muted cursor-pointer">
            <span className="h-4 w-4 rounded-sm border border-border/60 text-[8px] flex items-center justify-center font-bold" style={{ backgroundColor: "#FEF3C7" }}>H</span>
          </button>
          {showColorPicker === "bg" && (
            <div className="absolute top-7 left-0 z-50 rounded-md border border-border bg-card p-2 shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
              <p className="mb-1 text-[9px] font-bold uppercase text-muted-foreground">Highlight</p>
              <div className="grid grid-cols-5 gap-1">
                {BG_COLORS.map((c) => (
                  <button key={c} type="button" className="h-5 w-5 rounded border border-border/50 hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: c === "transparent" ? "white" : c }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); exec("hiliteColor", c === "transparent" ? "transparent" : c); setShowColorPicker(null); }}>
                    {c === "transparent" && <span className="text-[8px] text-muted-foreground">✕</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ToolbarSep />
        <ToolbarBtn title="Align left" active={isActive("justifyLeft")} onClick={() => exec("justifyLeft")}><AlignLeft size={11} /></ToolbarBtn>
        <ToolbarBtn title="Align center" active={isActive("justifyCenter")} onClick={() => exec("justifyCenter")}><AlignCenter size={11} /></ToolbarBtn>
        <ToolbarBtn title="Align right" active={isActive("justifyRight")} onClick={() => exec("justifyRight")}><AlignRight size={11} /></ToolbarBtn>
        <ToolbarBtn title="Justify" active={isActive("justifyFull")} onClick={() => exec("justifyFull")}><AlignJustify size={11} /></ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn title="Bullet list" active={isActive("insertUnorderedList")} onClick={() => exec("insertUnorderedList")}><List size={11} /></ToolbarBtn>
        <ToolbarBtn title="Numbered list" active={isActive("insertOrderedList")} onClick={() => exec("insertOrderedList")}><ListOrdered size={11} /></ToolbarBtn>
        <ToolbarBtn title="Indent" onClick={() => exec("indent")}><Indent size={11} /></ToolbarBtn>
        <ToolbarBtn title="Outdent" onClick={() => exec("outdent")}><Outdent size={11} /></ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn title="Blockquote" onClick={() => {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          const range = sel.getRangeAt(0);
          const bq = document.createElement("blockquote");
          bq.style.cssText = "border-left: 3px solid #6B7280; margin: 4px 0 4px 8px; padding-left: 8px; color: #6B7280;";
          try { range.surroundContents(bq); } catch { bq.appendChild(range.extractContents()); range.insertNode(bq); }
          handleInput();
        }}><Quote size={11} /></ToolbarBtn>
        <ToolbarBtn title="Horizontal line" onClick={() => exec("insertHorizontalRule")}><Minus size={11} /></ToolbarBtn>
        <ToolbarBtn title="Insert link" onClick={() => { const url = prompt("Enter URL:"); if (url) exec("createLink", url); }}><Link size={11} /></ToolbarBtn>
        <ToolbarBtn title="Remove link" onClick={() => exec("unlink")}><Unlink size={11} /></ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn title="Undo" onClick={() => exec("undo")}><Undo2 size={11} /></ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => exec("redo")}><Redo2 size={11} /></ToolbarBtn>

        {onAttachmentsChange && (
          <>
            <ToolbarSep />
            <ToolbarBtn title="Attach file" onClick={() => fileInputRef.current?.click()}><Paperclip size={11} /></ToolbarBtn>
          </>
        )}
      </div>

      {onAttachmentsChange && (
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Tab") { e.preventDefault(); exec(e.shiftKey ? "outdent" : "indent"); }
        }}
        className="w-full px-3 py-2.5 text-[13px] leading-relaxed text-foreground focus:outline-none"
        style={{ minHeight, fontFamily: "inherit", overflowY: "auto", wordBreak: "break-word" }}
        spellCheck
      />

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border/50 bg-muted/20 px-2.5 py-2">
          {attachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] shadow-sm hover:border-primary/40 transition-colors">
              <span className="shrink-0">{getFileIcon(file)}</span>
              <span className="text-foreground font-medium max-w-[150px] truncate" title={file.name}>{truncateFilename(file.name)}</span>
              <span className="text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
              <button type="button" title="Remove" onClick={() => removeAttachment(index)}
                className="ml-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors cursor-pointer">
                <X size={8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GmailRichTextEditor;
