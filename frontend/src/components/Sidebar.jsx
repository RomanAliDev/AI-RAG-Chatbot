import { useEffect, useState } from "react";
import {
  FileText,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  UserRound,
  X,
  Trash2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Sidebar({
  activePanel = "chat",
  onNewChat,
  onNavigate,
  onSelectChat,
  onDeleteChat,
  chatHistory,
  setChatHistory,
  currentChatId,
  isOpen = false,
  onClose,
}) {
  const { user, logout } = useAuth();

  const [localHistory, setLocalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const conversations = chatHistory ?? localHistory;
  const updateHistory = setChatHistory ?? setLocalHistory;

  async function fetchChatHistory() {
    setLoadingHistory(true);
    setHistoryError("");

    try {
      const response = await api.get("/conversations/");
      const data = Array.isArray(response.data) ? response.data : [];

      updateHistory(data);
    } catch (error) {
      setHistoryError(
        error.response?.data?.detail || "Failed to load chat history.",
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    fetchChatHistory();
  }, []);

  function handleNewChat() {
    onNewChat?.();
    onClose?.();
  }

  function handleNavigation(panel) {
    onNavigate?.(panel);
    onClose?.();
  }

  function handleSelectChat(chat) {
    onSelectChat?.(chat);
    onClose?.();
  }

  async function handleDeleteChat(event, chat) {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${chat.title || "New Chat"}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(chat.id);
    setHistoryError("");

    try {
      await api.delete(`/conversations/${chat.id}`);

      updateHistory((previous) =>
        previous.filter((item) => String(item.id) !== String(chat.id)),
      );

      if (String(currentChatId) === String(chat.id)) {
        onDeleteChat?.(chat);
      }
    } catch (error) {
      setHistoryError(
        error.response?.data?.detail || "Failed to delete conversation.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const sortedConversations = conversations;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}

      <aside
        aria-label="Main sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col overflow-hidden border-r border-gray-200 bg-[#F7F7F8] transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-gray-200 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10A37F] text-white">
            <Sparkles size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-gray-900">
              AI RAG Chatbot
            </h1>
            <p className="mt-1 truncate text-xs text-gray-500">
              Your AI workspace
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg cursor-pointer p-2 text-gray-500 transition hover:bg-gray-200 md:hidden">
            <X size={19} />
          </button>
        </div>

        <div className="shrink-0 space-y-2 p-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center cursor-pointer gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100">
            <Plus size={19} />
            New Chat
          </button>

          <button
            type="button"
            onClick={() => handleNavigation("documents")}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
              activePanel === "documents"
                ? "bg-[#E6F4EF] text-[#087F5B]"
                : "text-gray-700 hover:bg-gray-200"
            }`}>
            <FileText size={19} />
            My Documents
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-4">
          <div className="mb-2 flex items-center justify-between px-2 pt-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Chat History
            </h2>

            <button
              type="button"
              onClick={fetchChatHistory}
              disabled={loadingHistory}
              title="Refresh chat history"
              aria-label="Refresh chat history"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50">
              <RefreshCw
                size={15}
                className={loadingHistory ? "animate-spin" : ""}
              />
            </button>
          </div>

          {historyError && (
            <p
              role="alert"
              className="mb-2 break-words rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {historyError}
            </p>
          )}

          {loadingHistory && conversations.length === 0 ? (
            <p className="px-2 py-4 text-sm text-gray-500">Loading chats...</p>
          ) : sortedConversations.length === 0 ? (
            <p className="px-2 py-4 text-sm leading-6 text-gray-500">
              Your chats will appear here after you send your first message.
            </p>
          ) : (
            <div className="space-y-1">
              {sortedConversations.map((chat) => {
                const isActive =
                  activePanel === "chat" &&
                  String(currentChatId) === String(chat.id);

                const isDeleting = String(deletingId) === String(chat.id);

                return (
                  <div
                    key={chat.id}
                    className={`group flex min-w-0 cursor-pointer items-center gap-1 rounded-xl transition ${
                      isActive
                        ? "bg-[#E6F4EF] text-[#087F5B]"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}>
                    <button
                      type="button"
                      onClick={() => handleSelectChat(chat)}
                      disabled={isDeleting}
                      title={chat.title || "New Chat"}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm disabled:opacity-50">
                      <MessageSquare size={17} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {chat.title || "New Chat"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(event) => handleDeleteChat(event, chat)}
                      disabled={isDeleting}
                      title="Delete conversation"
                      aria-label={`Delete ${chat.title || "conversation"}`}
                      className="mr-1 flex cursor-pointer h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100">
                      {isDeleting ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-gray-200 bg-[#F7F7F8] p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700">
              <UserRound size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user?.email || ""}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              className="rounded-lg p-2 cursor-pointer text-gray-500 transition hover:bg-red-50 hover:text-red-600">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
