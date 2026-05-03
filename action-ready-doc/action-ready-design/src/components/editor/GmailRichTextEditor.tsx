import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Undo2, Redo2, Bold, Italic, Underline, Type, Palette,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Quote,
  Strikethrough, RemoveFormatting, ChevronDown, Paperclip,
  X, FileText, Image, Film, Music, Archive, Code
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: string;
}

export interface GmailRichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  onAttachmentsChange?: (files: AttachedFile[]) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  hasDropdown?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", Times, serif' },
  { label: 'Monospace', value: '"Courier New", Courier, monospace' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", Tahoma, Verdana, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Verdana', value: 'Verdana, Geneva, Tahoma, sans-serif' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' },
];

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '24', '36'];

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: File): React.ElementType {
  const type = file.type.toLowerCase();
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive;
  if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css')) return Code;
  return FileText;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon, title, onClick, isActive = false, hasDropdown = false
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`flex items-center justify-center gap-1 px-1.5 py-1 text-xs rounded transition-colors ${
      isActive
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}
    onMouseDown={(e) => e.preventDefault()}
  >
    <Icon className="w-3.5 h-3.5" />
    {hasDropdown && <ChevronDown className="w-2.5 h-2.5" />}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-border mx-0.5" />;

interface FileChipProps {
  file: AttachedFile;
  onRemove: (id: string) => void;
}

const FileChip: React.FC<FileChipProps> = ({ file, onRemove }) => {
  const Icon = getFileIcon(file.file);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm max-w-[200px]">
      <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="truncate max-w-[100px]" title={file.name}>{file.name}</span>
      <span className="text-muted-foreground shrink-0">({file.size})</span>
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors ml-0.5"
        title={`Remove ${file.name}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const GmailRichTextEditor: React.FC<GmailRichTextEditorProps> = ({
  value = '',
  onChange,
  onAttachmentsChange,
  placeholder = 'Compose your message...',
  minHeight = 120,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFont, setSelectedFont] = useState('Sans Serif');
  const [selectedSize, setSelectedSize] = useState('14');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  useEffect(() => {
    if (editorRef.current) {
      if (value && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
      const defaultFont = FONT_FAMILIES.find(f => f.label === 'Sans Serif');
      editorRef.current.style.fontFamily = defaultFont?.value || '';
      editorRef.current.style.fontSize = '14px';
    }
  }, [value]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikeThrough')) formats.add('strikethrough');
    setActiveFormats(formats);
  }, []);

  const execCommand = useCallback((command: string, val?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, val);
      updateActiveFormats();
      handleContentChange();
    }
  }, [updateActiveFormats, handleContentChange]);

  const handleFontChange = (fontFamily: string) => {
    const font = FONT_FAMILIES.find(f => f.label === fontFamily);
    if (font) {
      execCommand('fontName', font.value);
      setSelectedFont(fontFamily);
    }
    setShowFontDropdown(false);
  };

  const handleSizeChange = (size: string) => {
    execCommand('fontSize', '3');
    if (editorRef.current) {
      editorRef.current.style.fontSize = `${size}px`;
    }
    setSelectedSize(size);
    setShowSizeDropdown(false);
  };

  const handleColorChange = (color: string) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments: AttachedFile[] = files.map(file => ({
      id: generateId(),
      file,
      name: file.name,
      size: formatFileSize(file.size),
    }));

    const updatedFiles = [...attachedFiles, ...newAttachments];
    setAttachedFiles(updatedFiles);
    onAttachmentsChange?.(updatedFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    const updatedFiles = attachedFiles.filter(f => f.id !== id);
    setAttachedFiles(updatedFiles);
    onAttachmentsChange?.(updatedFiles);
  };

  const closeAllDropdowns = () => {
    setShowFontDropdown(false);
    setShowSizeDropdown(false);
    setShowColorPicker(false);
  };

  return (
    <div className={`border border-border rounded-lg overflow-hidden bg-card ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        aria-label="Attach files"
      />

      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-1.5 py-1 bg-muted/30 border-b border-border">
        <ToolbarButton icon={Undo2} title="Undo" onClick={() => execCommand('undo')} />
        <ToolbarButton icon={Redo2} title="Redo" onClick={() => execCommand('redo')} />

        <Divider />

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { closeAllDropdowns(); setShowFontDropdown(!showFontDropdown); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-foreground hover:bg-muted rounded transition-colors"
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="min-w-0 truncate max-w-[70px]">{selectedFont}</span>
            <ChevronDown className={`w-2.5 h-2.5 text-muted-foreground transition-transform duration-200 ${showFontDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showFontDropdown && (
            <div
              className="absolute top-full left-0 mt-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              style={{ width: '176px' }}
            >
              <div className="relative rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                <div className="max-h-48 overflow-y-auto overscroll-contain">
                  {FONT_FAMILIES.map((font) => {
                    const isActive = font.label === selectedFont;
                    return (
                      <button
                        key={font.label}
                        type="button"
                        onClick={() => handleFontChange(font.label)}
                        style={{ fontFamily: font.value }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 ${
                          isActive
                            ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                            : 'text-foreground hover:bg-muted border-l-2 border-transparent'
                        }`}
                      >
                        {font.label}
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-popover to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { closeAllDropdowns(); setShowSizeDropdown(!showSizeDropdown); }}
            className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-foreground hover:bg-muted rounded transition-colors"
            onMouseDown={(e) => e.preventDefault()}
          >
            <Type className="w-3.5 h-3.5" />
            <span>{selectedSize}</span>
            <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
          {showSizeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-20 bg-popover border border-border rounded-md shadow-lg z-50">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeChange(size)}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                  style={{ fontSize: `${size}px` }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        <ToolbarButton icon={Bold} title="Bold" onClick={() => execCommand('bold')} isActive={activeFormats.has('bold')} />
        <ToolbarButton icon={Italic} title="Italic" onClick={() => execCommand('italic')} isActive={activeFormats.has('italic')} />
        <ToolbarButton icon={Underline} title="Underline" onClick={() => execCommand('underline')} isActive={activeFormats.has('underline')} />
        <ToolbarButton icon={Strikethrough} title="Strikethrough" onClick={() => execCommand('strikeThrough')} isActive={activeFormats.has('strikethrough')} />

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { closeAllDropdowns(); setShowColorPicker(!showColorPicker); }}
            className="flex items-center gap-0.5 px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-colors"
            onMouseDown={(e) => e.preventDefault()}
          >
            <Palette className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 p-2">
              <div className="grid grid-cols-10 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        <ToolbarButton icon={AlignLeft} title="Align left" onClick={() => execCommand('justifyLeft')} />
        <ToolbarButton icon={AlignCenter} title="Align center" onClick={() => execCommand('justifyCenter')} />
        <ToolbarButton icon={AlignRight} title="Align right" onClick={() => execCommand('justifyRight')} />
        <ToolbarButton icon={AlignJustify} title="Justify" onClick={() => execCommand('justifyFull')} />

        <Divider />

        <ToolbarButton icon={ListOrdered} title="Numbered list" onClick={() => execCommand('insertOrderedList')} />
        <ToolbarButton icon={List} title="Bulleted list" onClick={() => execCommand('insertUnorderedList')} />
        <ToolbarButton icon={Outdent} title="Decrease indent" onClick={() => execCommand('outdent')} />
        <ToolbarButton icon={Indent} title="Increase indent" onClick={() => execCommand('indent')} />

        <Divider />

        <ToolbarButton icon={Quote} title="Quote" onClick={() => execCommand('formatBlock', 'blockquote')} />
        <ToolbarButton icon={RemoveFormatting} title="Remove formatting" onClick={() => execCommand('removeFormat')} />

        <Divider />

        {/* Attach File Button */}
        <ToolbarButton icon={Paperclip} title="Attach files" onClick={() => fileInputRef.current?.click()} />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        onFocus={updateActiveFormats}
        className="outline-none px-3 py-2.5 text-foreground leading-relaxed text-sm"
        style={{
          minHeight: `${minHeight}px`,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          fontSize: '14px',
        }}
        data-placeholder={placeholder}
        spellCheck={false}
      />

      {/* Attached Files Display */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border bg-muted/20">
          {attachedFiles.map((file) => (
            <FileChip key={file.id} file={file} onRemove={handleRemoveFile} />
          ))}
        </div>
      )}

      {/* Close dropdowns overlay */}
      {(showFontDropdown || showSizeDropdown || showColorPicker) && (
        <div className="fixed inset-0 z-40" onClick={closeAllDropdowns} />
      )}
    </div>
  );
};

export default GmailRichTextEditor;
