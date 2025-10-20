
import { UniversalChatInterface } from "./UniversalChatInterface";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function GroupChatInterface({ groupId, groupName, members, activeMembers }) {
  const { data: session } = useSession();
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId || !session?.user?.id) {
      setLoading(false);
      return;
    }

    const getOrCreateGroupConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call API to get or create group conversation
        const response = await fetch(`/api/chat/groups/${groupId}/conversation`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to get group conversation');
        }

        const data = await response.json();

        if (data.success) {
          setConversationId(data.conversationId);
        } else {
          throw new Error(data.error || 'Failed to get group conversation');
        }
      } catch (err) {
        console.error('Error getting/creating group conversation:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getOrCreateGroupConversation();
  }, [groupId, session?.user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Error loading group chat: {error}
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Unable to load group chat
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <UniversalChatInterface
        chatId={conversationId}
        chatType="group"
        participantName={groupName}
        participantInitials="GC"
        currentUserId={session?.user?.id}
        currentUserRole={session?.user?.role || "client"}
        groupMembers={members}
        activeMembers={activeMembers}
        title={`${groupName} Chat`}
        className="h-full rounded-lg border border-border"
      />
    </div>
  );
}
