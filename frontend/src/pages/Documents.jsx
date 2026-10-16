import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  ExternalLink,
  FileText,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";

import api from "../services/api";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openingId, setOpeningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/documents");
      const data = response.data;

      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load documents. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleOpen(document) {
    setOpeningId(document.id);
    setError("");
    setSuccess("");

    let fileUrl = null;
    let newTab = null;

    try {
      // Open a blank tab immediately to avoid popup blocking.
      newTab = window.open("about:blank", "_blank");

      const response = await api.get(`/documents/${document.id}/open`, {
        responseType: "blob",
      });

      fileUrl = URL.createObjectURL(response.data);

      if (newTab) {
        newTab.location.href = fileUrl;
      } else {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }

      // Keep the object URL available while the document loads.
      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 60000);
    } catch (err) {
      if (newTab && !newTab.closed) {
        newTab.close();
      }

      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }

      setError(
        err.response?.data?.detail ||
          "Failed to open the document. Please try again.",
      );
    } finally {
      setOpeningId(null);
    }
  }

  async function handleDelete(document) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.filename}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(document.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/documents/${document.id}`);

      setDocuments((current) =>
        current.filter((item) => item.id !== document.id),
      );

      setSuccess(
        `"${document.filename}" and its associated chunks were deleted successfully.`,
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to delete the document. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
            <p className="mt-2 text-sm text-slate-500">
              View and manage your uploaded documents.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <p className="break-words">{success}</p>
          </div>
        )}

        <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white ">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Uploaded Files</h2>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {documents.length} files
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <FileText size={34} className="mx-auto text-slate-300" />

              <p className="mt-3 font-medium text-slate-700">
                No documents uploaded yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Upload a document using the chat input to see it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-slate-800">
                      {document.filename}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {document.file_type || "Document"}
                      {document.created_at
                        ? ` · ${new Date(
                            document.created_at,
                          ).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpen(document)}
                      disabled={openingId !== null || deletingId !== null}
                      className="inline-flex items-center cursor-pointer gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
                      {openingId === document.id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <ExternalLink size={16} />
                      )}
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(document)}
                      disabled={deletingId !== null || openingId !== null}
                      aria-label={`Delete ${document.filename}`}
                      className="inline-flex items-center cursor-pointer gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                      {deletingId === document.id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Documents;
