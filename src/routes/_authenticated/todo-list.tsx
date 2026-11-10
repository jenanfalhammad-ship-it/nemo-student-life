import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  Download,
  Eraser,
  FileImage,
  FileText,
  Grid2X2,
  Minus,
  PenLine,
  RotateCcw,
  RotateCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTx } from "@/lib/tx";
import "@/page-themes/todo-list.css";

export const Route = createFileRoute("/_authenticated/todo-list")({
  head: () => ({
    meta: [
      { title: "To Do List — NEMO" },
      { name: "description", content: "A handwritten, touch-friendly to-do notebook." },
    ],
  }),
  component: TodoListPage,
});

const STORE_KEY = "nemo-todo-list-v1";
const PAGE = { width: 1000, height: 1414 };
const DEFAULT_INK = "#17213b";
const DEFAULT_PAPER = "#fffefa";
const INKS = ["#17213b", "#161616", "#315fd0", "#8b4cc2", "#d94370", "#10876c", "#e27436"];
const PAPERS = [
  { color: "#fffefa", label: "white" },
  { color: "#fff5dc", label: "cream" },
  { color: "#f8edff", label: "lavender" },
  { color: "#fff0f4", label: "pink" },
  { color: "#eaf7ff", label: "blue" },
  { color: "#edfff5", label: "mint" },
];
type Stroke = {
  points: { x: number; y: number; p: number }[];
  color: string;
  size: number;
  erase?: boolean;
};
type SavedPage = { strokes: Stroke[]; paper: string; ruling: "blank" | "ruled" | "grid" };

function loadDraft(): SavedPage {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedPage>;
      return {
        strokes: Array.isArray(parsed.strokes) ? parsed.strokes : [],
        paper: typeof parsed.paper === "string" ? parsed.paper : DEFAULT_PAPER,
        ruling: parsed.ruling === "ruled" || parsed.ruling === "grid" ? parsed.ruling : "blank",
      };
    }
  } catch {
    // An unavailable or invalid local draft should never prevent the notebook from opening.
  }
  return { strokes: [], paper: DEFAULT_PAPER, ruling: "blank" };
}

function TodoListPage() {
  const { tx, dir } = useTx();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [paper, setPaper] = useState(DEFAULT_PAPER);
  const [ruling, setRuling] = useState<SavedPage["ruling"]>("blank");
  const [ink, setInk] = useState(DEFAULT_INK);
  const [brushSize, setBrushSize] = useState(3.5);
  const [eraser, setEraser] = useState(false);
  const [saved, setSaved] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const paintStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      if (!point) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1.4, stroke.size * point.p * 0.5), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      const first = stroke.points[0];
      if (!first) return;
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        if (point) ctx.lineTo(point.x, point.y);
      }
      ctx.lineWidth = stroke.size;
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  const paintPage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const width = Math.round(PAGE.width * dpr);
    const height = Math.round(PAGE.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, PAGE.width, PAGE.height);
    for (const stroke of strokesRef.current) paintStroke(ctx, stroke);
  }, [paintStroke]);

  useEffect(() => {
    const draft = loadDraft();
    strokesRef.current = draft.strokes;
    setStrokes(draft.strokes);
    setPaper(draft.paper);
    setRuling(draft.ruling);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    paintPage();
    const observer = new ResizeObserver(() => paintPage());
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [loaded, paintPage]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ strokes, paper, ruling } satisfies SavedPage),
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [loaded, strokes, paper, ruling]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(PAGE.width, ((event.clientX - rect.left) / rect.width) * PAGE.width)),
      y: Math.max(
        0,
        Math.min(PAGE.height, ((event.clientY - rect.top) / rect.height) * PAGE.height),
      ),
      p: event.pressure > 0 ? event.pressure : 0.5,
    };
  };

  const startStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    activeRef.current = {
      points: [pointFromEvent(event)],
      color: ink,
      size: eraser ? 28 : brushSize,
      ...(eraser ? { erase: true } : {}),
    };
    const ctx = event.currentTarget.getContext("2d");
    if (ctx && activeRef.current) paintStroke(ctx, activeRef.current);
  };

  const continueStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !activeRef.current) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const stroke = activeRef.current;
    const previous = stroke.points[stroke.points.length - 1];
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 1.1) return;
    stroke.points.push(point);
    const ctx = event.currentTarget.getContext("2d");
    if (ctx && previous) {
      ctx.save();
      ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * Math.max(0.55, (previous.p + point.p) / 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    drawingRef.current = false;
    const finished = activeRef.current;
    activeRef.current = null;
    if (!finished) return;
    const next = [...strokesRef.current, finished].slice(-500);
    strokesRef.current = next;
    setStrokes(next);
    setRedoStack([]);
    setSaved(false);
  };

  const undo = () => {
    if (!strokesRef.current.length) return;
    const next = strokesRef.current.slice(0, -1);
    const removed = strokesRef.current[strokesRef.current.length - 1];
    strokesRef.current = next;
    setStrokes(next);
    if (removed) setRedoStack((current) => [...current, removed]);
    setSaved(false);
  };

  const redo = () => {
    const last = redoStack[redoStack.length - 1];
    if (!last) return;
    const nextRedo = redoStack.slice(0, -1);
    const next = [...strokesRef.current, last];
    strokesRef.current = next;
    setStrokes(next);
    setRedoStack(nextRedo);
    setSaved(false);
  };

  const exportCanvas = (scale = 2) => {
    const output = document.createElement("canvas");
    output.width = PAGE.width * scale;
    output.height = PAGE.height * scale;
    const ctx = output.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable");
    const inkLayer = document.createElement("canvas");
    inkLayer.width = output.width;
    inkLayer.height = output.height;
    const inkContext = inkLayer.getContext("2d");
    if (!inkContext) throw new Error("Canvas is unavailable");
    inkContext.scale(scale, scale);
    for (const stroke of strokesRef.current) paintStroke(inkContext, stroke);
    ctx.scale(scale, scale);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, PAGE.width, PAGE.height);
    drawRuling(ctx, ruling);
    ctx.drawImage(inkLayer, 0, 0, PAGE.width, PAGE.height);
    return output;
  };

  const downloadPng = () => {
    const output = exportCanvas(2);
    output.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, "nemo-to-do-list.png");
    }, "image/png");
  };

  const downloadPdf = () => {
    const output = exportCanvas(2);
    output.toBlob(
      (blob) => {
        if (!blob) return;
        void blob.arrayBuffer().then((buffer) => {
          downloadBlob(
            createA4Pdf(new Uint8Array(buffer), output.width, output.height),
            "nemo-to-do-list.pdf",
          );
        });
      },
      "image/jpeg",
      0.94,
    );
  };

  const clearPage = () => {
    if (!window.confirm(tx("Clear everything on this page?", "هل تريد مسح كل ما على هذه الورقة؟")))
      return;
    strokesRef.current = [];
    setStrokes([]);
    setRedoStack([]);
    setSaved(false);
    paintPage();
  };

  return (
    <main dir={dir} className="nemo-sea-page nemo-todo-page">
      <header className="todo-page-heading">
        <div>
          <div className="todo-eyebrow">
            <Sparkles /> {tx("YOUR PERSONAL NOTEBOOK", "دفترك الشخصي")}
          </div>
          <h1>{tx("To Do List", "قائمة المهام")}</h1>
          <p>
            {tx(
              "A quiet page for your plans, in your own handwriting.",
              "مساحة هادئة لخططك، اكتبيها بطريقتك.",
            )}
          </p>
        </div>
        <div className="todo-save-indicator" aria-live="polite">
          <span className={saved ? "save-light is-saved" : "save-light"} />
          {saved
            ? tx("Saved on this device", "محفوظ على هذا الجهاز")
            : tx("Saving…", "جارٍ الحفظ…")}
        </div>
      </header>

      <section className="todo-workspace">
        <div className="todo-toolbar" aria-label={tx("Notebook tools", "أدوات الدفتر")}>
          <div className="toolbar-group ink-group">
            <span className="tool-label">{tx("Ink", "الحبر")}</span>
            <div className="ink-swatches">
              {INKS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`ink-swatch ${ink === color && !eraser ? "selected" : ""}`}
                  style={{ "--swatch": color } as React.CSSProperties}
                  onClick={() => {
                    setInk(color);
                    setEraser(false);
                  }}
                  aria-label={`${tx("Ink color", "لون الحبر")} ${color}`}
                  aria-pressed={ink === color && !eraser}
                />
              ))}
              <label
                className="custom-ink"
                title={tx("Choose a custom ink color", "اختاري لون حبر مخصص")}
              >
                <input
                  type="color"
                  value={ink}
                  onChange={(event) => {
                    setInk(event.target.value);
                    setEraser(false);
                  }}
                  aria-label={tx("Custom ink color", "لون حبر مخصص")}
                />
                <span>+</span>
              </label>
            </div>
          </div>

          <div className="toolbar-group paper-group">
            <span className="tool-label">{tx("Paper", "الورقة")}</span>
            <div className="paper-swatches">
              {PAPERS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`paper-swatch ${paper === item.color ? "selected" : ""}`}
                  style={{ "--swatch": item.color } as React.CSSProperties}
                  onClick={() => setPaper(item.color)}
                  aria-label={`${tx("Paper color", "لون الورقة")} ${txPaper(item.label, tx)}`}
                  aria-pressed={paper === item.color}
                />
              ))}
            </div>
          </div>

          <div className="toolbar-group line-group">
            <span className="tool-label">{tx("Page", "الصفحة")}</span>
            <div className="line-options">
              {(["blank", "ruled", "grid"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`line-option ${ruling === style ? "selected" : ""}`}
                  onClick={() => setRuling(style)}
                  aria-pressed={ruling === style}
                >
                  {style === "blank" ? <Minus /> : style === "ruled" ? <PenLine /> : <Grid2X2 />}
                  <span>
                    {style === "blank"
                      ? tx("Blank", "فارغة")
                      : style === "ruled"
                        ? tx("Ruled", "مسطرة")
                        : tx("Grid", "مربعات")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-group brush-group">
            <span className="tool-label">{tx("Pen size", "سُمك القلم")}</span>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
              aria-label={tx("Pen size", "سُمك القلم")}
            />
          </div>

          <div className="toolbar-group action-group">
            <button
              type="button"
              className={`icon-tool ${eraser ? "active" : ""}`}
              onClick={() => setEraser((value) => !value)}
              aria-pressed={eraser}
              title={tx("Eraser", "الممحاة")}
            >
              <Eraser />
            </button>
            <button
              type="button"
              className="icon-tool"
              onClick={undo}
              disabled={!strokes.length}
              title={tx("Undo", "تراجع")}
            >
              <RotateCcw />
            </button>
            <button
              type="button"
              className="icon-tool"
              onClick={redo}
              disabled={!redoStack.length}
              title={tx("Redo", "إعادة")}
            >
              <RotateCw />
            </button>
            <button
              type="button"
              className="icon-tool clear-tool"
              onClick={clearPage}
              disabled={!strokes.length}
              title={tx("Clear page", "مسح الورقة")}
            >
              <Trash2 />
            </button>
          </div>

          <div className="toolbar-group export-group">
            <Button type="button" variant="outline" onClick={downloadPng}>
              <FileImage />
              {tx("Image", "صورة")}
            </Button>
            <Button type="button" onClick={downloadPdf}>
              <FileText />
              {tx("PDF", "PDF")}
              <ChevronDown className="export-chevron" />
            </Button>
          </div>
        </div>

        <div className="todo-paper-stage">
          <div className="paper-caption">
            <span>
              <span className="paper-dot" />{" "}
              {tx("A4 · Touch and Apple Pencil ready", "A4 · جاهزة للمس وقلم Apple Pencil")}
            </span>
            <span>
              {tx("Your writing stays private on this device", "كتاباتك محفوظة محليًا على جهازك")}
            </span>
          </div>
          <div className="todo-paper" style={{ "--paper-color": paper } as React.CSSProperties}>
            <canvas
              ref={canvasRef}
              className={`todo-canvas ruling-${ruling}`}
              width={PAGE.width * 2}
              height={PAGE.height * 2}
              onPointerDown={startStroke}
              onPointerMove={continueStroke}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onLostPointerCapture={endStroke}
              style={{ cursor: eraser ? "cell" : "crosshair" }}
              aria-label={tx(
                "Write or draw on your to-do list with your finger, mouse, or Apple Pencil.",
                "اكتبي أو ارسمي على قائمتك بإصبعك أو الفأرة أو قلم Apple Pencil.",
              )}
            />
            {strokes.length === 0 && (
              <div className="paper-placeholder" aria-hidden="true">
                {tx("Start writing here…", "ابدئي الكتابة هنا…")}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function drawRuling(ctx: CanvasRenderingContext2D, ruling: SavedPage["ruling"]) {
  if (ruling === "blank") return;
  ctx.save();
  ctx.strokeStyle = ruling === "ruled" ? "rgba(85, 130, 190, 0.25)" : "rgba(100, 145, 185, 0.19)";
  ctx.lineWidth = ruling === "ruled" ? 1.2 : 0.8;
  ctx.beginPath();
  if (ruling === "ruled") {
    for (let y = 88; y < PAGE.height; y += 52) {
      ctx.moveTo(42, y);
      ctx.lineTo(PAGE.width - 42, y);
    }
  } else {
    for (let x = 42; x < PAGE.width; x += 42) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, PAGE.height);
    }
    for (let y = 42; y < PAGE.height; y += 42) {
      ctx.moveTo(0, y);
      ctx.lineTo(PAGE.width, y);
    }
  }
  ctx.stroke();
  if (ruling === "ruled") {
    ctx.strokeStyle = "rgba(224, 105, 132, 0.25)";
    ctx.beginPath();
    ctx.moveTo(82, 0);
    ctx.lineTo(82, PAGE.height);
    ctx.stroke();
  }
  ctx.restore();
}

function txPaper(key: string, tx: (en: string, ar: string) => string) {
  const labels: Record<string, [string, string]> = {
    white: ["white", "بيضاء"],
    cream: ["cream", "كريمية"],
    lavender: ["lavender", "لافندر"],
    pink: ["pink", "وردية"],
    blue: ["blue", "زرقاء"],
    mint: ["mint", "نعناعية"],
  };
  const pair = labels[key] ?? labels["white"]!;
  return tx(pair[0], pair[1]);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createA4Pdf(jpeg: Uint8Array, imageWidth: number, imageHeight: number) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const append = (chunk: Uint8Array) => {
    chunks.push(chunk);
    length += chunk.byteLength;
  };
  const text = (value: string) => encoder.encode(value);
  append(text("%PDF-1.4\n"));
  const objects: (Uint8Array | string)[][] = [
    ["<< /Type /Catalog /Pages 2 0 R >>"],
    ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"],
    [
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>",
    ],
    [
      `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.byteLength} >>\nstream\n`,
      jpeg,
      "\nendstream",
    ],
    ["<< /Length 37 >>\nstream\nq\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\nendstream"],
  ];
  objects.forEach((parts, index) => {
    offsets.push(length);
    append(text(`${index + 1} 0 obj\n`));
    for (const part of parts) append(typeof part === "string" ? text(part) : part);
    append(text("\nendobj\n"));
  });
  const xrefOffset = length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  append(text(xref));
  const blobParts: BlobPart[] = chunks.map((chunk) => Uint8Array.from(chunk).buffer);
  return new Blob(blobParts, { type: "application/pdf" });
}
