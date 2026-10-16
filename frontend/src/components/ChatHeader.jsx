import { Menu, Sparkles } from "lucide-react";

function ChatHeader({ activePanel = "chat", onMenuClick }) {
  const isDocuments = activePanel === "documents";

  const pageTitle = isDocuments ? "My Documents" : "AI Assistant";

  const pageDescription = isDocuments
    ? "Manage and organize your uploaded documents"
    : "Ask questions and explore your documents";

  return (
    <header className="z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="cursor-pointer rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 md:hidden">
          <Menu size={21} />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F4EF] text-[#087F5B]">
          {isDocuments ? <Sparkles size={21} /> : <Sparkles size={21} />}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-gray-900 sm:text-lg">
            {pageTitle}
          </h2>

          <p className="hidden truncate text-xs text-gray-500 sm:block">
            {pageDescription}
          </p>
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#10A37F]" />
        <span className="text-xs font-medium text-gray-600">Workspace</span>
      </div>
    </header>
  );
}

export default ChatHeader;
