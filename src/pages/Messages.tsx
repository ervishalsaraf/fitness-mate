import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ChatView from "@/components/ChatView";

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversationId || null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [conversationId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    navigate(`/messages/${id}`);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    navigate("/messages");
  };

  if (!user) {
    return null;
  }

  // Mobile view: show either list or chat
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <div className="min-h-screen bg-background">
          <div className="border-b bg-card p-4 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Chat</h1>
          </div>
          <ChatView conversationId={selectedConversationId} currentUserId={user.id} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card p-4">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        <ConversationList
          currentUserId={user.id}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>
    );
  }

  // Desktop view: split layout
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card p-4">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>
      <div className="flex h-[calc(100vh-73px)]">
        <div className="w-80 border-r overflow-y-auto">
          <ConversationList
            currentUserId={user.id}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>
        <div className="flex-1">
          {selectedConversationId ? (
            <ChatView conversationId={selectedConversationId} currentUserId={user.id} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
