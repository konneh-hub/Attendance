"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

import { getImportDefinition } from "@/lib/import/definitions";

interface BulkImportDialogProps {
  type: string;
  title: string;
  buttonLabel: string;
}

export function BulkImportDialog({ type, title, buttonLabel }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"idle" | "validating" | "result" | "confirm" | "importing" | "complete">("idle");
  const [result, setResult] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
    warnings: number;
    errors: Array<{ row: number; message: string }>;
    warningsList: Array<{ row: number; message: string }>;
    previewRows: Array<Record<string, string | number | boolean>>;
    importedCount?: number;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const router = useRouter();

  const definition = useMemo(() => getImportDefinition(type), [type]);

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setStage("validating");

    const formData = new FormData();
    formData.append("file", selected);

    try {
      const response = await fetch(`/api/admin/import/${type}/validate`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Validation failed");
      }

      setResult(payload);
      setStage("result");
    } catch (error) {
      setResult({
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicates: 0,
        warnings: 0,
        errors: [{ row: 1, message: error instanceof Error ? error.message : "Validation failed" }],
        warningsList: [],
        previewRows: [],
      });
      setStage("result");
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setStage("importing");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/admin/import/${type}/execute`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Import failed");
      }
      setStage("complete");
      setResult((current) => current ? { ...current, importedCount: payload.importedCount } : current);
      router.refresh();
    } catch (error) {
      setStage("result");
      setResult((current) => current ? { ...current, errors: [{ row: 1, message: error instanceof Error ? error.message : "Import failed" }] } : current);
    } finally {
      setImporting(false);
    }
  }

  const isValid = (result?.validRows ?? 0) > 0 && (result?.errors?.length ?? 0) === 0;

  return (
    <>
      <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50" onClick={() => setOpen(true)} type="button">
        {buttonLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-zinc-600">Import records directly from a spreadsheet.</p>
              </div>
              <button className="text-sm font-medium text-zinc-600" onClick={() => setOpen(false)} type="button">Close</button>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <p className="font-semibold">Supported formats</p>
                <p className="mt-1">CSV, XLSX</p>
                <p className="mt-2 font-semibold">Maximum file size</p>
                <p className="mt-1">5 MB</p>
              </div>

              {stage === "idle" ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center">
                  <UploadCloud className="mx-auto h-8 w-8 text-indigo-600" />
                  <p className="mt-3 font-semibold">Choose a file to begin</p>
                  <p className="mt-2 text-sm text-zinc-600">The template reflects the expected columns for {definition?.title ?? title}.</p>
                  <label className="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Select file
                    <input accept=".csv,.xlsx" className="hidden" onChange={handleFileSelection} type="file" />
                  </label>
                </div>
              ) : null}

              {stage === "validating" ? (
                <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-700">
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Validating file...
                </div>
              ) : null}

              {stage === "result" || stage === "confirm" || stage === "complete" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-xs uppercase text-zinc-500">Total rows</p>
                      <p className="mt-1 text-lg font-semibold">{result?.totalRows ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-xs uppercase text-zinc-500">Valid rows</p>
                      <p className="mt-1 text-lg font-semibold">{result?.validRows ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-xs uppercase text-zinc-500">Invalid rows</p>
                      <p className="mt-1 text-lg font-semibold">{result?.invalidRows ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-xs uppercase text-zinc-500">Warnings</p>
                      <p className="mt-1 text-lg font-semibold">{result?.warnings ?? 0}</p>
                    </div>
                  </div>

                  {result?.errors?.length ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Validation issues</div>
                      <ul className="mt-2 space-y-1">
                        {result.errors.map((error, index) => <li key={`${error.row}-${index}`}>Row {error.row}: {error.message}</li>)}
                      </ul>
                    </div>
                  ) : null}

                  {result?.warningsList?.length ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                      <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Warnings</div>
                      <ul className="mt-2 space-y-1">
                        {result.warningsList.map((warning, index) => <li key={`${warning.row}-${index}`}>Row {warning.row}: {warning.message}</li>)}
                      </ul>
                    </div>
                  ) : null}

                  {result?.previewRows?.length ? (
                    <div className="rounded-xl border border-zinc-200">
                      <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold">Preview</div>
                      <div className="max-h-64 overflow-auto p-4">
                        <table className="min-w-full text-left text-sm">
                          <tbody>
                            {result.previewRows.map((row, index) => (
                              <tr className="border-b border-zinc-100 last:border-0" key={`${JSON.stringify(row)}-${index}`}>
                                {Object.entries(row).map(([key, value]) => <td className="px-2 py-2" key={`${key}-${value}`}>{String(value)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {stage === "importing" ? (
                <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-sm text-zinc-700">
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Importing records...
                </div>
              ) : null}

              {stage === "complete" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
                  <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" /> Import complete</div>
                  <p className="mt-2">Imported: {result?.importedCount ?? 0}</p>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
              <div>
                <a className="text-sm font-semibold text-indigo-600" href={`/api/admin/import/${type}/template`}>Download template</a>
              </div>
              <div className="flex gap-2">
                {stage !== "idle" && stage !== "complete" ? (
                  <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700" onClick={() => { setStage("idle"); setFile(null); setResult(null); }} type="button">Reset</button>
                ) : null}
                {stage === "result" && isValid ? (
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" onClick={() => { setStage("confirm"); }} type="button">Confirm import</button>
                ) : null}
                {stage === "confirm" ? (
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" disabled={importing} onClick={handleImport} type="button">Import</button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
