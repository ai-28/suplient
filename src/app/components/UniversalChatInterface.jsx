"use client"
import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Send, Calendar, Clock, Mic, Settings, Info, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { VoiceRecorder } from "@/app/components/VoiceRecorder";
import { VoiceMessage } from "@/app/components/VoiceMessage";
import { ScheduleSessionDialog } from "@/app/components/ScheduleSessionDialog";
import { EmojiButton } from "@/app/components/EmojiButton";
import { FileAttachmentButton } from "@/app/components/FileAttachmentButton";
import { FileAttachmentPreview } from "@/app/components/FileAttachmentPreview";
import { MessageActions } from "@/app/components/MessageActions";
import { MessageReactions } from "@/app/components/MessageReactions";
import { ReplyPreview } from "@/app/components/ReplyPreview";
import { RepliedMessage } from "@/app/components/RepliedMessage";
import { groupMessagesByTime, formatTimeOfDay, formatDateSeparator, getPreciseTimestamp } from "@/app/utils/timestampGrouping";

// Simple function to get response guarantee text
const getResponseGuaranteeText = (chatType) => {
  switch (chatType) {
    case 'personal':
      return 'Response within 24h';
    case 'light':
      return 'Response within 7 days';
    case 'group':
      return 'Response within 7 days';
    default:
      return 'Response within 24h';
  }
};

export function UniversalChatInterface({
  chatId,
  chatType,
  participantName = "User",
  participantInitials = "U",
  currentUserId,
  currentUserRole,
  allowReactions = true,
  allowReplies = true,
  allowVoiceMessages = true,
  allowFileUploads = true,
  allowScheduling = false,
  showSystemMessages = true,
  readOnly = false,
  hideInput = false,
  title,
  subtitle,
  groupMembers,
  activeMembers,
  className = ""
}) {

    const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [hasAutoMessage, setHasAutoMessage] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send auto-message on first load if not already sent
  useEffect(() => {
    if (!hasAutoMessage && (chatType === "light" || chatType === "group")) {
      // sendAutoMessage(chatId, chatType);
      setHasAutoMessage(true);
    }
  }, [chatId, chatType, hasAutoMessage]);

  // Add initial messages with demo data
  useEffect(() => {
    if (messages.length === 0) {
      const demoMessages = getDemoMessages();
      setMessages(demoMessages);
    }
  }, [chatType, currentUserRole, showSystemMessages]);
  const getDemoMessages = () => {
    const baseTime = new Date();
    const createMessage = (id, content, isCoach, hoursAgo, type = 'text', isSystemMessage = false) => {
      // For monitoring mode, use actual participant names
      let senderName;
      if (isSystemMessage) {
        senderName = "System";
      } else if (chatType === "group" && participantName?.includes(" & ")) {
        // This is a monitoring conversation with coach & client
        const participants = participantName.split(" & ");
        senderName = isCoach ? participants[0] : participants[1];
      } else {
        // Regular chat
        senderName = isCoach ? "Coach Clausen" : "You";
      }

      return {
        id,
        senderId: isSystemMessage ? "system" : isCoach ? "coach1" : currentUserId,
        senderName,
        content,
        timestamp: new Date(baseTime.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
        type,
        status: "delivered",
        isCoach,
        isSystemMessage,
        systemType: isSystemMessage ? "info" : undefined,
        canReply: !isSystemMessage
      };
    };

    if (chatType === "group" && participantName?.includes(" & ")) {
      // Monitoring mode - show actual conversation between coach and client
      const participants = participantName.split(" & ");
      const coachName = participants[0];
      const clientName = participants[1];
      
      return [
        createMessage("demo-1", `Good morning! How are you feeling about the progress we made in our last session?`, true, 8),
        createMessage("demo-2", `Thank you for asking. I've been practicing the mindfulness exercises you recommended. They're really helping with my anxiety.`, false, 6),
        createMessage("demo-3", `That's wonderful to hear! Which technique has been most effective for you?`, true, 4),
        createMessage("demo-4", `The breathing exercises before stressful situations have made a huge difference. I used them before my presentation yesterday.`, false, 2),
        createMessage("demo-5", `Excellent! That shows real progress in applying what we've learned. How did the presentation go?`, true, 1)
      ];
    }

    
    switch (chatType) {
      case "personal":
        return [createMessage("system-1", "Personal therapy session chat. You can expect responses within 48 hours.", false, 48, "system", true), createMessage("demo-1", "How are you feeling today? I noticed you completed your mindfulness exercise yesterday - great work!", true, 8), createMessage("demo-2", "Thank you! I felt much calmer after the breathing exercises. I have been struggling with anxiety this week though.", false, 6), createMessage("demo-3", "I understand. Let's explore what might be triggering the anxiety. Can you tell me about specific situations?", true, 4), createMessage("demo-4", "It happens mostly during work meetings and social gatherings.", false, 2)];
      case "light":
        return [createMessage("system-1", "Light support chat. Responses within 7 days. Book individual sessions for faster help.", false, 72, "system", true), createMessage("demo-1", "Hi! I've been working on the stress management techniques you shared. They're helping a lot!", false, 24), createMessage("demo-2", "That's wonderful to hear! Which technique has been most effective for you?", true, 12), createMessage("demo-3", "The progressive muscle relaxation before bed has really improved my sleep quality.", false, 8)];
      case "group":
        return [createMessage("system-1", "Group therapy chat. Responses within 7 days. Book sessions for individual support.", false, 96, "system", true), createMessage("demo-1", "Welcome everyone! Let's share one positive thing that happened this week.", true, 48), createMessage("demo-2", "I managed to go for a walk every day this week! Small steps but it felt good.", false, 36), createMessage("demo-3", "That's amazing! I started a gratitude journal as we discussed last session.", false, 24), createMessage("demo-4", "Great progress everyone! Remember, consistency is more important than perfection.", true, 12)];
      default:
        return [createMessage("system-1", "Chat started. How can we help you today?", false, 1, "system", true)];
    }
  };
  const handleSendMessage = () => {
    if (message.trim() || selectedFile) {
      let newMessage;

      const messageContent = message.trim();
      if (selectedFile) {
        const fileUrl = URL.createObjectURL(selectedFile);
        newMessage = {
          id: Date.now().toString(),
          senderId: currentUserId,
          senderName: getCurrentUserName(),
          content: selectedFile.name,
          timestamp: new Date().toISOString(),
          type: selectedFile.type.startsWith('image/') ? "image" : "file",
          status: "sent",
          isCoach: currentUserRole === "coach",
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileUrl: fileUrl,
          fileType: selectedFile.type,
          replyTo: replyToMessage?.id,
          isSystemMessage: false,
          canReply: true
        };
        setSelectedFile(null);
      } else {
        newMessage = {
          id: Date.now().toString(),
          senderId: currentUserId,
          senderName: getCurrentUserName(),
          content: messageContent,
          timestamp: new Date().toISOString(),
          type: "text",
          status: "sent",
          isCoach: currentUserRole === "coach",
          replyTo: replyToMessage?.id,
          isSystemMessage: false,
          canReply: true
        };
      }
      setMessages([...messages, newMessage]);
      setMessage("");
      setReplyToMessage(null);
    }
  };
  const getCurrentUserName = () => {
    switch (currentUserRole) {
      case "coach":
        return "Coach";
      case "client":
        return "You";
      default:
        return "User";
    }
  };
  const handleSendVoiceMessage = (audioUrl, duration, waveformData) => {
    const voiceMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: getCurrentUserName(),
      content: "",
      timestamp: new Date().toISOString(),
      type: "voice",
      status: "sent",
      isCoach: currentUserRole === "coach",
      audioUrl,
      duration,
      waveformData,
      isSystemMessage: false,
      canReply: true
    };
    setMessages(prev => [...prev, voiceMessage]);
    setShowVoiceRecorder(false);
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleEmojiSelect = (emoji) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    } else {
      setMessage(prev => prev + emoji);
    }
  };
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };
  const handleAddReaction = (messageId, emoji) => {
    if (!allowReactions) return;
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && !msg.isSystemMessage) {
        const existingReaction = msg.reactions?.find(r => r.userId === currentUserId && r.emoji === emoji);
        if (existingReaction) return msg;
          const newReaction = {
          id: Date.now().toString(),
          userId: currentUserId,
          userName: getCurrentUserName(),
          emoji,
          timestamp: new Date().toISOString()
        };
        return {
          ...msg,
          reactions: [...(msg.reactions || []), newReaction]
        };
      }
      return msg;
    }));
  };
  const handleRemoveReaction = (messageId, reactionId) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.reactions) {
        return {
          ...msg,
          reactions: msg.reactions.filter(r => r.id !== reactionId)
        };
      }
      return msg;
    }));
  };
  const handleReplyToMessage = (message) => {
    if (!allowReplies || message.isSystemMessage) return;
    setReplyToMessage(message);
    inputRef.current?.focus();
  };
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };
  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      messageElement.classList.add('animate-pulse');
      setTimeout(() => messageElement.classList.remove('animate-pulse'), 2000);
    }
  };
  const findRepliedMessage = (replyToId) => {
    return messages.find(msg => msg.id === replyToId);
  };
  const getAvatarInitials = (name) => {
    if (name === "System") return "🛠️";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
    const renderSystemMessage = (msg) => <div className="flex gap-3 justify-start my-3">
      <Avatar className="h-7 w-7 mt-1">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          <Settings className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
      
      <div className="max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-muted-foreground">
            System
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimeOfDay(msg.timestamp)}
          </span>
        </div>
        
        <div className="bg-muted/50 text-muted-foreground p-3 rounded-lg">
          <p className="text-sm leading-relaxed">{msg.content}</p>
        </div>
      </div>
    </div>;
  return <div className={`flex flex-col h-full min-h-[60vh] bg-background border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Chat Header */}
      <div className={`flex items-center justify-between border-b border-border bg-card ${currentUserRole === "client" && chatType === "personal" ? "p-3" : "p-4"}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className={`bg-primary text-primary-foreground ${currentUserRole === "client" && chatType === "personal" ? "h-9 w-9" : "h-10 w-10"}`}>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {participantInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-foreground truncate ${currentUserRole === "client" && chatType === "personal" ? "text-sm" : ""}`}>{title || participantName}</h3>
            {currentUserRole === "client" && chatType === "personal" ? <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{getResponseGuaranteeText(chatType)}</span>
              </div> : <div className="flex items-center gap-2">
                {chatType !== "personal" && <Badge variant="secondary" className="text-xs">
                    {chatType === "group" ? `${activeMembers}/${groupMembers} active` : t(`clients.clientTypes.${chatType}`)}
                  </Badge>}
                {!(currentUserRole === "client" && chatType === "personal")}
              </div>}
          </div>
        </div>

        <div className="flex items-center gap-2">
            {currentUserRole === "client" && chatType === "personal" ? <Button variant="default" size="sm" className="h-8 px-3 text-xs flex items-center gap-1" onClick={() => router.push('/client/book-session')}>
              <Video className="h-3 w-3" />
              <span>1-1</span>
            </Button> : allowScheduling ? <Button variant="ghost" size="sm" className="hover:bg-accent flex items-center gap-2" onClick={() => setIsScheduleDialogOpen(true)}>
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{t("buttons.bookSession")}</span>
            </Button> : null}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <TooltipProvider>
          <div className="space-y-1">
            {/* Grouped Messages */}
            {groupMessagesByTime(messages).map((group, groupIndex) => {
            const msg = group.messages[0];
            if (msg.isSystemMessage) {
              return <div key={msg.id}>{renderSystemMessage(msg)}</div>;
            }
            const repliedMessage = msg.replyTo ? findRepliedMessage(msg.replyTo) : null;
            // In monitoring mode, show coach messages on right, client messages on left
            const isMonitoringMode = chatType === "group" && participantName?.includes(" & ");
            const isOwnMessage = isMonitoringMode ? msg.isCoach : (msg.senderId === currentUserId);
            return <div key={`group-${groupIndex}`} className="space-y-1">
                  {/* Date Separator */}
                  {group.shouldShowDateSeparator && <div className="flex items-center justify-center py-2 my-4">
                      <div className="flex items-center gap-4">
                        <Separator className="flex-1" />
                        <Badge variant="outline" className="bg-background text-xs">
                          {formatDateSeparator(msg.timestamp)}
                        </Badge>
                        <Separator className="flex-1" />
                      </div>
                    </div>}

                  {/* Time Separator for large gaps */}
                  {group.timeSeparatorText && <div className="flex justify-center py-1 my-2">
                      <Badge variant="secondary" className="text-xs text-muted-foreground">
                        {group.timeSeparatorText}
                      </Badge>
                    </div>}

                  {/* Message with smart timestamp */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div id={`message-${msg.id}`} className={`group flex gap-2 items-start ${isOwnMessage ? "justify-end" : "justify-start"} ${group.isFirstInGroup ? "mt-3" : "mt-1"}`}>
                        {!isOwnMessage && <Avatar className={`h-8 w-8 flex-shrink-0 ${group.isFirstInGroup ? "opacity-100" : "opacity-0"}`}>
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                              {getAvatarInitials(msg.senderName)}
                            </AvatarFallback>
                          </Avatar>}
                        
                        {/* Message actions for own messages - positioned on left of bubble */}
                        {isOwnMessage && !msg.isSystemMessage && <MessageActions message={msg} onReply={allowReplies ? handleReplyToMessage : undefined} onReaction={allowReactions ? emoji => handleAddReaction(msg.id, emoji) : undefined} className="ml-1" />}

                         <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}>
                           {/* Sender name and timestamp - show for all messages in monitoring mode, or first in group for others */}
                           {(isMonitoringMode || (!isOwnMessage && group.isFirstInGroup)) && <div className="flex items-center gap-2 mb-1">
                               <span className="text-sm font-medium text-foreground">
                                 {msg.senderName}
                               </span>
                               {group.shouldShowTimestamp && <span className="text-xs text-muted-foreground">
                                   {formatTimeOfDay(msg.timestamp)}
                                 </span>}
                             </div>}

                          {/* Replied message reference */}
                          {repliedMessage && <RepliedMessage repliedMessage={repliedMessage} onScrollToMessage={scrollToMessage} className="mb-2" />}

                          {/* Message content */}
                          {msg.type === "voice" ? <VoiceMessage audioUrl={msg.audioUrl} duration={msg.duration} waveformData={msg.waveformData || []} isOwnMessage={isOwnMessage} /> : msg.type === "image" ? <div className={`relative rounded-lg overflow-hidden border ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                              <img src={msg.fileUrl} alt={msg.fileName || "Shared image"} className="max-w-xs max-h-64 object-cover" />
                              {msg.content && <div className="p-3">
                                  <p className="text-sm">{msg.content}</p>
                                </div>}
                            </div> : msg.type === "file" ? <div className={`p-3 rounded-lg border ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  📎
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{msg.fileName}</p>
                                  <p className="text-xs opacity-70">
                                    {msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB` : 'File'}
                                  </p>
                                </div>
                              </div>
                            </div> : <div className={`p-3 rounded-lg ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>}

                          {/* Message reactions */}
                          {msg.reactions && msg.reactions.length > 0 && <MessageReactions reactions={msg.reactions} onAddReaction={emoji => handleAddReaction(msg.id, emoji)} onRemoveReaction={reactionId => handleRemoveReaction(msg.id, reactionId)} currentUserId={currentUserId} />}

                          {/* Timestamp for own messages - only show for last in group */}
                          {isOwnMessage && group.isLastInGroup && group.shouldShowTimestamp && <span className="text-xs text-muted-foreground mt-1">
                              {formatTimeOfDay(msg.timestamp)}
                            </span>}
                        </div>

                        {/* Message actions for received messages - positioned on right of bubble */}
                        {!isOwnMessage && !msg.isSystemMessage && <MessageActions message={msg} onReply={allowReplies ? handleReplyToMessage : undefined} onReaction={allowReactions ? emoji => handleAddReaction(msg.id, emoji) : undefined} className="ml-1" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {getPreciseTimestamp(msg.timestamp)}
                    </TooltipContent>
                  </Tooltip>
                </div>;
          })}
            <div ref={messagesEndRef} />
          </div>
        </TooltipProvider>
      </ScrollArea>

      {/* Voice Recorder */}
      {showVoiceRecorder && allowVoiceMessages && <div className="p-4 border-t border-border bg-card">
          <VoiceRecorder onSendVoiceMessage={handleSendVoiceMessage} onCancel={() => setShowVoiceRecorder(false)} autoStart={true} />
        </div>}

      {/* File Preview */}
      {selectedFile && allowFileUploads && <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <FileAttachmentPreview fileName={selectedFile.name} fileSize={selectedFile.size} fileType={selectedFile.type} showActions={false} className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="ml-2">
              Cancel
            </Button>
          </div>
        </div>}

      {/* Reply Preview */}
      {replyToMessage && allowReplies && <ReplyPreview replyToMessage={replyToMessage} onCancel={handleCancelReply} />}

      {/* Message Input - Hidden in monitoring mode */}
      {!showVoiceRecorder && !hideInput && !readOnly && <div className="p-3 border-t border-border bg-card">

          <div className="flex items-end gap-2">
            {allowFileUploads && <FileAttachmentButton onFileSelect={handleFileSelect} iconType="plus" className="h-10 w-10" />}

            <div className="relative flex-1">
              <div className="relative">
                <Textarea ref={inputRef} value={message} rows={1} onChange={e => {
                const newValue = e.target.value;
              const el = e.currentTarget;
              if (newValue.length <= 1000) {
                setMessage(newValue);
              }
            }} onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 160) + 'px';
            }} onKeyPress={handleKeyPress} placeholder={replyToMessage ? `Reply to ${replyToMessage.senderName}...` : "Type your message..."} className="bg-transparent border-0 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[40px] max-h-40 rounded-full pr-12" />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <EmojiButton onEmojiSelect={handleEmojiSelect} className="h-8 w-8" />
                </div>
              </div>
            </div>

            <Button variant="default" size="icon" onClick={message.trim() || selectedFile ? handleSendMessage : () => allowVoiceMessages && setShowVoiceRecorder(true)} disabled={!message.trim() && !selectedFile && !allowVoiceMessages} className="h-10 w-10 p-0">
              {message.trim() || selectedFile ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>

          {message.length >= 950 && <div className="flex justify-end mt-2 text-xs text-amber-600">
              <span>{1000 - message.length} characters remaining</span>
            </div>}
        </div>}

      {/* Schedule Dialog */}
      {allowScheduling && <ScheduleSessionDialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen} groupName={participantName || "Chat"} groupMembers={groupMembers || 0} />}
    </div>;
}