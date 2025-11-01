import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CommentItem from "./CommentItem";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface EventCommentsProps {
  groupId: string;
  isOrganizer: boolean;
  isMember: boolean;
  allowComments: boolean;
  commentsPublic: boolean;
  currentUserId: string;
}

const EventComments = ({
  groupId,
  isOrganizer,
  isMember,
  allowComments,
  commentsPublic,
  currentUserId,
}: EventCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();

    const channel = supabase
      .channel(`event-comments-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_comments',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadComments();
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_comments')
        .select(`
          id,
          content,
          user_id,
          created_at,
          user:profiles(full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedComments = (data || []).map(comment => ({
        ...comment,
        user: Array.isArray(comment.user) ? comment.user[0] : comment.user
      }));
      
      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || newComment.length > 1000) return;

    try {
      const { error } = await supabase.from('event_comments').insert({
        group_id: groupId,
        user_id: currentUserId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "Comment added",
        description: commentsPublic 
          ? "Your comment is visible to all members" 
          : "Your comment is only visible to the organizer",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Comment deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!allowComments) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Comments are disabled for this event.
      </div>
    );
  }

  if (!isMember && !isOrganizer) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">
          Comments ({comments.length})
          {!commentsPublic && (
            <span className="text-sm text-muted-foreground ml-2">
              (Private - only organizer sees)
            </span>
          )}
        </h3>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground p-4 bg-muted/50 rounded-lg">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="resize-none"
          maxLength={1000}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {newComment.length}/1000 characters
          </p>
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || newComment.length > 1000}
          >
            Post Comment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventComments;
