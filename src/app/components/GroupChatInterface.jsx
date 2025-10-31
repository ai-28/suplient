
import { UniversalChatInterface } from "./UniversalChatInterface";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function GroupChatInterface({ groupId, groupName, members, activeMembers, showBackButton = false, backButtonAction }) {
  const { data: session } = useSession();
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupMembers, setGroupMembers] = useState(Array.isArray(members) ? members : []);

  useEffect(() => {
    if (!groupId || !session?.user?.id) {
      setLoading(false);
      return;
    }

    const getOrCreateGroupConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch group members if not provided or if members is just a number
        if (!Array.isArray(members) || members.length === 0 || typeof members === 'number') {
          try {
            const membersResponse = await fetch(`/api/groups/${groupId}/members`);
            if (membersResponse.ok) {
              const membersData = await membersResponse.json();
              setGroupMembers(membersData.members || []);
            }
          } catch (err) {
            console.warn('Failed to fetch group members:', err);
          }
        }

        // Call API to get or create group conversation
        const response = await fetch(`/api/chat/groups/${groupId}/conversation`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get group conversation: ${response.status}`);
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
  }, [groupId, session?.user?.id, members]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading group chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted-foreground p-4">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2 text-red-500">Error Loading Group Chat</h3>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted-foreground p-4">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Unable to Load Group Chat</h3>
          <p className="mb-4">There was an issue connecting to the group chat.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
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
        groupMembers={groupMembers.length > 0 ? groupMembers : (Array.isArray(members) ? members : [])}
        activeMembers={activeMembers}
        title={`${groupName} Chat`}
        className="h-[calc(100vh-100px)] rounded-lg border border-border"
        showBackButton={showBackButton}
        backButtonAction={backButtonAction}
        groupId={groupId}
      />
    </div>
  );
}
