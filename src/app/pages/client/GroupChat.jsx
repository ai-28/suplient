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
      {/* Chat interface with integrated header */}
      <GroupChatInterface
        groupId={groupId}
        groupName={groupName}
        members={[]} 
        activeMembers={0}
        className="h-full"
        showBackButton={true}
        backButtonAction={() => router.push('/client/sessions')}
      />
    </div>
  );
}