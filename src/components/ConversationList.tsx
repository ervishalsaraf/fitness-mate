import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string | null;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_message: {
    content: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

interface ConversationListProps {
  currentUserId: string;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationList = ({ currentUserId, selectedConversationId, onSelectConversation }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const loadConversations = async () => {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_1_id,
          participant_2_id,
          last_message_at
        `)
        .or(`participant_1_id.eq.${currentUserId},participant_2_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (conversations) {
        const conversationsWithDetails = await Promise.all(
          conversations.map(async (conv) => {
            const otherUserId = conv.participant_1_id === currentUserId 
              ? conv.participant_2_id 
              : conv.participant_1_id;

            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', otherUserId)
              .single();

            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('read', false)
              .neq('sender_id', currentUserId);

            return {
              ...conv,
              other_user: profile || { id: otherUserId, full_name: 'Unknown User', avatar_url: null },
              last_message: lastMessage,
              unread_count: unreadCount || 0
            };
          })
        );

        setConversations(conversationsWithDetails);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No conversations yet. Start a conversation with your buddies!
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          className={cn(
            "w-full p-4 flex gap-3 hover:bg-accent transition-colors text-left",
            selectedConversationId === conversation.id && "bg-accent"
          )}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={conversation.other_user.avatar_url || undefined} />
            <AvatarFallback>{conversation.other_user.full_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium truncate">{conversation.other_user.full_name}</span>
              {conversation.last_message_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate">
                {conversation.last_message ? (
                  <>
                    {conversation.last_message.sender_id === currentUserId && "You: "}
                    {conversation.last_message.content}
                  </>
                ) : (
                  "No messages yet"
                )}
              </p>
              {conversation.unread_count > 0 && (
                <Badge variant="default" className="ml-2">
                  {conversation.unread_count}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ConversationList;
