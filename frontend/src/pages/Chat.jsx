import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";

import api from "../services/api";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join(", ");
  }

  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }

  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response) {
    return `Request failed with status ${error.response.status}.`;
  }

  if (error.code === "ERR_NETWORK") {
    return "Unable to connect to the server. Please check your connection.";
  }

  return error.message || "Something went wrong. Please try again.";
}

function Chat() {
  const { conversationId, setCurrentChatId, onConversationCreated } =
    useOutletContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const requestIdRef = useRef(0);
  const sendingRef = useRef(false);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    async function loadMessages() {
      if (!conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await api.get(
          `/conversations/${conversationId}/messages`,
        );

        if (requestId !== requestIdRef.current) return;

        setMessages(response.data.messages || []);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        const errorMessage = getErrorMessage(error);

        console.error(
          "Load conversation messages error:",
          error.response?.data || error,
        );

        setMessages([
          {
            id: `load-error-${conversationId}`,
            role: "system",
            type: "error",
            content: errorMessage,
          },
        ]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      requestIdRef.current++;
    };
  }, [conversationId]);

  async function handleDocumentUpload(file) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/documents/upload", formData);

      setMessages((previous) => [
        ...previous,
        {
          id: `upload-success-${Date.now()}`,
          role: "system",
          type: "success",
          content:
            response.data?.message ||
            (response.data?.filename
              ? `Document "${response.data.filename}" uploaded successfully.`
              : "Document uploaded successfully!"),
        },
      ]);

      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      console.error("Document upload error:", error.response?.data || error);

      setMessages((previous) => [
        ...previous,
        {
          id: `upload-error-${Date.now()}`,
          role: "system",
          type: "error",
          content: `Document upload failed: ${errorMessage}`,
        },
      ]);

      throw error;
    } finally {
      setUploading(false);
    }
  }

  async function handleSendMessage(question) {
    const text = question?.trim();

    if (!text || sendingRef.current) return;

    sendingRef.current = true;
    setLoading(true);

    const temporaryId = `temp-${Date.now()}`;
    let activeId = conversationId;
    let createdConversation = null;

    setMessages((previous) => [
      ...previous,
      {
        id: temporaryId,
        role: "user",
        content: text,
        status: "pending",
      },
    ]);

    try {
      if (!activeId) {
        const createResponse = await api.post("/conversations/");

        createdConversation = createResponse.data;
        activeId =
          createdConversation.id ?? createdConversation.conversation_id;

        if (!activeId) {
          throw new Error("The server did not return a conversation ID.");
        }
      }

      const response = await api.post(`/chat/?conversation_id=${activeId}`, {
        question: text,
      });

      const answer = response.data?.answer;

      if (typeof answer !== "string") {
        throw new Error("The server returned an invalid chat response.");
      }

      setMessages((previous) => [
        ...previous.filter((message) => message.id !== temporaryId),
        {
          id: `user-${temporaryId}`,
          role: "user",
          content: text,
          status: "sent",
        },
        {
          id: `assistant-${temporaryId}`,
          role: "assistant",
          content: answer,
        },
      ]);

      if (createdConversation) {
        onConversationCreated?.({
          ...createdConversation,
          title: text.slice(0, 50),
        });

        setCurrentChatId(activeId);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      console.error("Chat processing error:", error.response?.data || error);

      setMessages((previous) =>
        previous.map((message) =>
          message.id === temporaryId
            ? {
                ...message,
                status: "failed",
                error: errorMessage,
              }
            : message,
        ),
      );
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
      <ChatWindow messages={messages} loading={loading} />

      <ChatInput
        onSend={handleSendMessage}
        onUpload={handleDocumentUpload}
        loading={loading}
        uploading={uploading}
      />
    </div>
  );
}

export default Chat;
