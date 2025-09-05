
import { UniversalChatInterface } from "./UniversalChatInterface";


export function GroupChatInterface({ groupId, groupName, members, activeMembers }) {
  return (
    <UniversalChatInterface
      chatId={groupId.toString()}
      chatType="group"
      participantName={groupName}
      participantInitials="GC"
      currentUserId="you"
      currentUserRole="client"
      groupMembers={members}
      activeMembers={activeMembers}
      title={`${groupName} Chat`}
      className="h-screen rounded-none border-none"
    />
  );
}
