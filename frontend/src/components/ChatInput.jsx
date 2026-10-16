import { ArrowUp, FileText, LoaderCircle, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

function ChatInput({ onSend, onUpload, loading = false, uploading = false }) {
  const [question, setQuestion] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedExtensions = [
      ".pdf",
      ".docx",
      ".txt",
      ".png",
      ".jpg",
      ".jpeg",
    ];
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (allowedExtensions.includes(extension)) {
      setSelectedFile(file);
    }

    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const value = question.trim();

    if (loading || uploading || (!value && !selectedFile)) {
      return;
    }

    if (selectedFile) {
      if (!onUpload) return;

      try {
        await onUpload(selectedFile);
        setSelectedFile(null);
      } catch {
        return;
      }
    }

    if (!value) return;

    setQuestion("");

    try {
      await onSend(value);
    } catch {
      setQuestion(value);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const busy = loading || uploading;

  return (
    <footer className="mt-auto w-full shrink-0 bg-white px-3 pb-3 pt-2 sm:px-6 sm:pb-4">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-3xl rounded-3xl border border-gray-300 bg-white p-2 shadow-sm transition focus-within:border-[#10A37F] focus-within:ring-2 focus-within:ring-[#10A37F]/10">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F4EF] text-[#087F5B]">
              <FileText size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={busy}
              aria-label="Remove selected document"
              className="rounded-full p-2 text-gray-500 transition cursor-pointer hover:bg-gray-200 disabled:opacity-50">
              <X size={17} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Choose document"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            aria-label="Attach document"
            title="Attach document"
            className="flex h-11 w-11 cursor-pointer shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-[#087F5B] disabled:opacity-50">
            <Plus size={23} />
          </button>

          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Assistant..."
            rows={1}
            disabled={busy}
            aria-label="Type your message"
            className="max-h-40 min-h-11 min-w-0 flex-1 resize-y bg-transparent px-2 py-3 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={busy || (!question.trim() && !selectedFile)}
            aria-label={uploading ? "Uploading document" : "Send message"}
            title="Send message"
            className="flex h-11 w-11 cursor-pointer shrink-0 items-center justify-center rounded-full bg-[#10A37F] text-white transition hover:bg-[#0D8D6F] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
            {busy ? (
              <LoaderCircle size={19} className="animate-spin" />
            ) : (
              <ArrowUp size={21} />
            )}
          </button>
        </div>
      </form>

      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] leading-4 text-gray-400 sm:text-xs">
        PDF, DOCX and TXT supported. Verify important AI-generated information.
      </p>
    </footer>
  );
}

export default ChatInput;
