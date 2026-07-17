"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/providers/locale-provider";
import type { ImportSourceFormat } from "@/lib/import/types";

interface ImportDropzoneProps {
  onUpload: (input: {
    format: ImportSourceFormat;
    filename: string;
    content: string;
  }) => Promise<unknown>;
  uploading: boolean;
}

export function ImportDropzone({ onUpload, uploading }: ImportDropzoneProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<ImportSourceFormat>("santander_csv");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setError(null);
    try {
      const content = await file.text();
      await onUpload({ format, filename: file.name, content });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Could not read the file", "No se pudo leer el archivo")
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="label-caps">
            {t("Bank format", "Formato del banco")}
          </p>
          <Select
            value={format}
            onValueChange={(value) => setFormat(value as ImportSourceFormat)}
          >
            <SelectTrigger className="h-9 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="santander_csv">
                Santander (movimientos.csv)
              </SelectItem>
              <SelectItem value="wise_csv">Wise (statement.csv)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void handleFile(event.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center gap-3 rounded-[calc(var(--radius)*1.35)] border border-dashed px-6 py-12 text-center transition-colors ${
            dragOver
              ? "border-ring bg-accent"
              : "border-border bg-secondary/40 hover:bg-accent"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <FileUp className="h-6 w-6 text-muted-foreground" />
            )}
          </span>
          <span className="text-sm font-medium">
            {uploading
              ? t("Analyzing movements…", "Analizando movimientos…")
              : t("Drop the CSV here or tap to choose", "Suelta el CSV aquí o toca para elegir")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t(
              "Nothing is saved until you review and confirm.",
              "No se guarda nada hasta que revises y confirmes."
            )}
          </span>
        </button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          aria-label={t("Choose CSV file", "Elegir archivo CSV")}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </CardContent>
    </Card>
  );
}
