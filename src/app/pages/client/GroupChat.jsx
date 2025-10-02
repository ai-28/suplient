"use client"
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { GroupChatInterface } from "@/app/components/GroupChatInterface";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function GroupChat() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params?.id; // Changed from groupId to id to match route
  const groupName = searchParams?.get('groupName') || "Group Chat";

  if (!groupId) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Invalid Group ID
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/client/sessions')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{groupName} Chat</h1>
      </div>
      
      {/* Chat interface */}
      <div className="flex-1">
        <GroupChatInterface
          groupId={groupId}
          groupName={groupName}
          members={[]} 
          activeMembers={0}
          className="h-full"
        />
      </div>
    </div>
  );
}