import {
  Bot,
  CheckCircle,
  FileWarning,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useRef } from "react";

function formatTime(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ChatWindow({ messages = [], loading = false }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  const isEmpty = messages.length === 0 && !loading;

  return (
    <section
      aria-label="Conversation messages"
      className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white">
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E6F4EF] text-[#087F5B]">
            <Sparkles size={27} />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            How can I help you?
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
            Ask a question or get answers from your uploaded documents.
          </p>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isSystem = message.role === "system";
            const time = formatTime(message.created_at);

            if (isSystem) {
              const isSuccess = message.type === "success";

              return (
                <div
                  key={message.id ?? `system-${index}`}
                  role={isSuccess ? "status" : "alert"}
                  className={`flex min-w-0 items-start gap-3 rounded-xl border p-4 text-sm ${
                    isSuccess
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}>
                  {isSuccess ? (
                    <CheckCircle size={19} className="mt-0.5 shrink-0" />
                  ) : (
                    <FileWarning size={19} className="mt-0.5 shrink-0" />
                  )}

                  <p className="min-w-0 break-words [overflow-wrap:anywhere]">
                    {message.content}
                  </p>
                </div>
              );
            }

            return (
              <article
                key={message.id ?? `${message.role}-${index}`}
                className={`flex min-w-0 items-start gap-3 sm:gap-4 ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isUser
                      ? "bg-gray-200 text-gray-700"
                      : "bg-[#10A37F] text-white"
                  }`}>
                  {isUser ? <UserRound size={17} /> : <Bot size={18} />}
                </div>

                <div
                  className={`flex min-w-0 max-w-[calc(100%-2.75rem)] flex-col gap-1 sm:max-w-[85%] ${
                    isUser ? "items-end" : "items-start"
                  }`}>
                  <div
                    className={`min-w-0 rounded-2xl px-4 py-3 text-sm leading-7 sm:px-5 ${
                      isUser
                        ? "rounded-tr-md bg-gray-100 text-gray-900"
                        : "rounded-tl-md bg-white text-gray-800"
                    }`}>
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {message.content}
                    </p>
                  </div>

                  {message.status === "pending" && (
                    <p className="px-1 text-xs text-gray-400">
                      Sending message...
                    </p>
                  )}

                  {message.status === "failed" && message.error && (
                    <div
                      role="alert"
                      className="mt-2 flex max-w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <FileWarning size={17} className="mt-0.5 shrink-0" />

                      <p className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {message.error}
                      </p>
                    </div>
                  )}

                  {time && (
                    <time
                      dateTime={message.created_at}
                      className="px-1 text-xs text-gray-400">
                      {time}
                    </time>
                  )}
                </div>
              </article>
            );
          })}

          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10A37F] text-white">
                <Bot size={18} />
              </div>

              <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#10A37F]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#10A37F] [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#10A37F] [animation-delay:300ms]" />
                </span>
                Generating response...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </section>
  );
}

export default ChatWindow;
