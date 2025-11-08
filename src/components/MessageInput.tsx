import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UpgradePrompt from "./UpgradePrompt";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  currentUserId: string;
}

const MessageInput = ({ onSendMessage, currentUserId }: MessageInputProps) => {
  const [content, setContent] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [checking, setChecking] = useState(false);

  const checkMessageLimit = async (): Promise<boolean> => {
    if (checking) return false;
    
    setChecking(true);
    try {
      // Check subscription tier
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data: subData } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const tier = subData?.tier || 'free';
      setSubscriptionTier(tier);

      // Premium and Elite users have unlimited messaging
      if (tier === 'premium' || tier === 'elite') {
        return true;
      }

      // Check today's message count for free users
      const today = new Date().toISOString().split('T')[0];
      
      const { data: limitData, error } = await supabase
        .from('user_message_limits')
        .select('message_count')
        .eq('user_id', currentUserId)
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking message limit:', error);
        return true; // Allow on error
      }

      const currentCount = limitData?.message_count || 0;
      setMessageCount(currentCount);

      if (currentCount >= 5) {
        setShowUpgradePrompt(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking message limit:', error);
      return true; // Allow on error
    } finally {
      setChecking(false);
    }
  };

  const incrementMessageCount = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingLimit } = await supabase
      .from('user_message_limits')
      .select('id, message_count')
      .eq('user_id', currentUserId)
      .eq('date', today)
      .maybeSingle();

    if (existingLimit) {
      await supabase
        .from('user_message_limits')
        .update({ message_count: existingLimit.message_count + 1 })
        .eq('id', existingLimit.id);
    } else {
      await supabase
        .from('user_message_limits')
        .insert({ user_id: currentUserId, date: today, message_count: 1 });
    }
  };

  const handleSend = async () => {
    if (!content.trim() || content.length > 2000) return;

    const canSend = await checkMessageLimit();
    if (!canSend) return;

    onSendMessage(content.trim());
    setContent("");
    
    // Increment count for free users
    if (subscriptionTier === 'free') {
      await incrementMessageCount();
      setMessageCount(prev => prev + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="border-t bg-card p-4">
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[120px] resize-none"
            maxLength={2000}
          />
          <Button
            onClick={handleSend}
            disabled={!content.trim() || content.length > 2000 || checking}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-muted-foreground">
            {content.length}/2000 characters
          </p>
          {subscriptionTier === 'free' && (
            <p className="text-xs text-muted-foreground">
              {messageCount}/5 messages today
            </p>
          )}
        </div>
      </div>

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        title="Daily Message Limit Reached"
        description="You've reached your daily limit of 5 messages. Upgrade to Premium for unlimited messaging!"
        feature="messaging"
        currentUsage={messageCount}
        limit={5}
      />
    </>
  );
};

export default MessageInput;
