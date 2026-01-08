import { useState, useRef } from "react";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { FiUpload, FiX } from "react-icons/fi";
import type { BaseContact } from "../types/contact";

interface BulkUploadProps {
  onUpload: (contacts: BaseContact[]) => void;
}

type CsvRow = string | string[];

export default function BulkUpload({ onUpload }: BulkUploadProps) {
  const [preview, setPreview] = useState<BaseContact[]>([]);
  const [error, setError] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  const parseFile = (file: File) => {
    setError("");

    Papa.parse(file, {
      complete: (results: ParseResult<CsvRow>) => {
        const contacts: BaseContact[] = [];

        results.data.forEach(row => {
          if (Array.isArray(row)) {
            const [name, phone, email] = row.map(c => c?.toString().trim());

            if (name && /^\+?\d{10,15}$/.test(phone)) {
              contacts.push({ name, phone, email });
            }
          }
        });

        if (!contacts.length) {
          setError("No valid contacts found (CSV: Name, Phone, Email)");
          setPreview([]);
          return;
        }

        setPreview(contacts.slice(0, 50));
        onUpload(contacts);
      },
      skipEmptyLines: true,
      error: err => setError(err.message),
    });
  };

  const clearPreview = () => {
    setPreview([]);
    setError("");
    onUpload([]);
  };

  return (
    <div className="mb-6">
      <label className="block mb-2 font-medium text-gray-700">
        Bulk Upload Contacts
      </label>

      <div
        ref={dropRef}
        onDrop={e => {
          e.preventDefault();
          if (e.dataTransfer.files.length) {
            parseFile(e.dataTransfer.files[0]);
          }
        }}
        onDragOver={e => e.preventDefault()}
        className="relative flex flex-col items-center gap-2 border-2 border-dashed border-indigo-300 rounded-lg p-6 bg-indigo-50 hover:bg-indigo-100 transition"
      >
        <FiUpload className="w-8 h-8 text-indigo-500" />
        <p className="text-sm text-gray-600">
          Drag & drop CSV or click to upload
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={e => e.target.files && parseFile(e.target.files[0])}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}

      {preview.length > 0 && (
        <div className="mt-4 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center p-2 border-b">
            <span className="font-medium">Preview (first 50)</span>
            <button onClick={clearPreview} className="text-red-500">
              <FiX />
            </button>
          </div>

          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((c, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.email || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
