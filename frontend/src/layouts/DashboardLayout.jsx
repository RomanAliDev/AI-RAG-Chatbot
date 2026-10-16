import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const activePanel = location.pathname.startsWith("/documents")
    ? "documents"
    : "chat";

  function handleNewChat() {
    setCurrentChatId(null);
    navigate("/chat");
  }

  function handleSelectChat(chat) {
    setCurrentChatId(chat.id);
    navigate("/chat");
  }

  function handleNavigate(panel) {
    navigate(panel === "documents" ? "/documents" : "/chat");
  }

  function handleConversationCreated(conversation) {
    setChatHistory((previous) => [
      conversation,
      ...previous.filter((chat) => chat.id !== conversation.id),
    ]);
  }

  function handleConversationUpdated(conversation) {
    setChatHistory((previous) =>
      previous.map((chat) =>
        chat.id === conversation.id ? { ...chat, ...conversation } : chat,
      ),
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <Sidebar
        activePanel={activePanel}
        onNewChat={handleNewChat}
        onNavigate={handleNavigate}
        onSelectChat={handleSelectChat}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        currentChatId={currentChatId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col md:ml-72">
        <ChatHeader
          activePanel={activePanel}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="min-h-0 flex-1">
          <Outlet
            context={{
              conversationId: activePanel === "chat" ? currentChatId : null,
              setCurrentChatId,
              onConversationCreated: handleConversationCreated,
              onConversationUpdated: handleConversationUpdated,
            }}
          />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
