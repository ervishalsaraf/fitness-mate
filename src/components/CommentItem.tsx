import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    user: {
      full_name: string;
      avatar_url: string | null;
    };
  };
  currentUserId: string;
  isOrganizer: boolean;
  onDelete: (commentId: string) => void;
}

const CommentItem = ({ comment, currentUserId, isOrganizer, onDelete }: CommentItemProps) => {
  const canDelete = comment.user_id === currentUserId || isOrganizer;

  return (
    <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user.avatar_url || undefined} />
        <AvatarFallback>{comment.user.full_name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.user.full_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm break-words">{comment.content}</p>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
