"use client"
import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Send, Calendar, Clock, Mic, Settings, Info, Video, Loader2, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { VoiceRecorder } from "@/app/components/VoiceRecorder";
import { VoiceMessage } from "@/app/components/VoiceMessage";
import { ScheduleSessionDialog } from "@/app/components/ScheduleSessionDialog";
import { EmojiButton } from "@/app/components/EmojiButton";
import { MessageActions } from "@/app/components/MessageActions";
import { ReplyPreview } from "@/app/components/ReplyPreview";
import { groupMessagesByTime, formatTimeOfDay, formatDateSeparator, getPreciseTimestamp } from "@/app/utils/timestampGrouping";
import { useChat } from "@/app/hooks/useChat";
import { useSession } from "next-auth/react";

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
  allowReplies = true,
  allowVoiceMessages = true,
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
  const { data: session } = useSession();
  
  // Use the real-time chat hook
  const {
    messages,
    loading,
    error,
    sending,
    typingUsers,
    onlineUsers,
    hasMore,
    isConnected,
    loadMoreMessages,
    sendMessage,
    handleTyping,
    messagesEndRef
  } = useChat(chatId);

  const [message, setMessage] = useState("");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const inputRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when conversation loads
  useEffect(() => {
    if (chatId && session?.user?.id) {
      const markAsRead = async () => {
        try {
          const response = await fetch(`/api/chat/conversations/${chatId}/read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            console.warn('Failed to mark messages as read:', response.status, response.statusText);
            return;
          }
          
          const data = await response.json();
          if (!data.success) {
            console.warn('Mark as read API returned error:', data.error);
          }
        } catch (error) {
          console.warn('Error marking messages as read:', error.message);
          // Don't throw the error, just log it as a warning
        }
      };

      // Add a small delay to ensure the conversation is fully loaded
      const timeoutId = setTimeout(markAsRead, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [chatId, session?.user?.id]);
  const handleSendMessage = () => {
    if (message.trim()) {
      const messageData = {
        content: message.trim(),
        type: "text",
        replyToId: replyToMessage?.id
      };

      sendMessage(messageData.content, messageData.type, messageData);
      setMessage("");
      setReplyToMessage(null);
    }
  };
  const handleSendVoiceMessage = (audioUrl, duration, waveformData) => {
    sendMessage("", "voice", {
      audioUrl,
      duration: duration, // Use consistent field name
      waveformData
    });
    setShowVoiceRecorder(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
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

  // Check if the other participant is online
  const isOtherParticipantOnline = () => {

    // For personal chats, we need to check if there are other users online globally
    if (chatType === "personal") {
      // Check if there are any online users other than the current user
      // This now uses global online users from useSocket
      const hasOtherOnline = onlineUsers.some(user => user.userId !== currentUserId);
      console.log('Personal chat - has other online:', hasOtherOnline); // Debug log
      return hasOtherOnline;
    }
    // For group chats, show connection status of the current user
    console.log('Group chat - isConnected:', isConnected); // Debug log
    return isConnected;
  };

  const renderSystemMessage = (msg) => (
    <div className="flex gap-3 justify-start my-3">
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
    </div>
  );

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <div className="flex gap-2 items-start justify-start my-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
            ...
          </AvatarFallback>
        </Avatar>
        <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-sm">
              {typingUsers.length === 1 
                ? `${typingUsers[0].userName} is typing...`
                : `${typingUsers.length} people are typing...`
              }
            </span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <div className={`flex flex-col max-h-[calc(100vh-200px)] bg-background border border-border rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col max-h-[calc(100vh-200px)] bg-background border border-border rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-destructive mb-4">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }
  return <div className={`flex flex-col max-h-[calc(100vh-200px)] bg-background border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Chat Header */}
      <div className={`flex items-center justify-between border-b border-border bg-card ${currentUserRole === "client" && chatType === "personal" ? "p-3" : "p-4"}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className={`bg-primary text-primary-foreground ${currentUserRole === "client" && chatType === "personal" ? "h-9 w-9" : "h-10 w-10"}`}>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {participantInitials}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${isOtherParticipantOnline() ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-foreground truncate ${currentUserRole === "client" && chatType === "personal" ? "text-sm" : ""}`}>{title || participantName}</h3>
            {currentUserRole === "client" && chatType === "personal" ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{getResponseGuaranteeText(chatType)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {chatType !== "personal" && (
                  <Badge variant="secondary" className="text-xs">
                    {chatType === "group" ? `${onlineUsers.length}/${groupMembers} online` : `${activeMembers} active`}
                  </Badge>
                )}
                {!isConnected && (
                  <Badge variant="destructive" className="text-xs">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
            )}
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
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-2">
                <Button variant="ghost" size="sm" onClick={loadMoreMessages} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load More Messages
                </Button>
              </div>
            )}

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
                        {isOwnMessage && !msg.isSystemMessage && <MessageActions message={msg} onReply={allowReplies ? handleReplyToMessage : undefined} className="ml-1" />}

                         <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}>
                           {/* Sender name and timestamp - show for all messages in monitoring mode, or first in group for others */}
                           {(isMonitoringMode || (!isOwnMessage && group.isFirstInGroup)) && <div className="flex items-center gap-2 mb-1">
                               <span className="text-sm font-medium text-foreground">
                                 {msg.senderName}
                               </span>
                               <span className="text-xs text-muted-foreground">
                                   {formatTimeOfDay(msg.timestamp)}
                                 </span>
                             </div>}

                          {/* Replied message reference */}
                          {repliedMessage && <RepliedMessage repliedMessage={repliedMessage} onScrollToMessage={scrollToMessage} className="mb-2" />}

                          {/* Message content */}
                          {msg.type === "voice" ? <VoiceMessage audioUrl={msg.audioUrl} duration={msg.duration} waveformData={msg.waveformData || []} isOwnMessage={isOwnMessage} /> : (
                            <div className={`p-3 rounded-lg ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"} ${msg.status === 'sending' ? 'opacity-70' : ''} ${msg.status === 'error' ? 'bg-red-100 border-red-300' : ''}`}>
                              <p className="text-sm leading-relaxed">{msg.content || '[No content]'}</p>
                              {msg.status === 'sending' && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span className="text-xs opacity-70">Sending...</span>
                                </div>
                              )}
                              {msg.status === 'error' && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-red-600">Failed to send</span>
                                </div>
                              )}
                            </div>
                          )}


                                  {/* Timestamp and status for own messages */}
                                  {isOwnMessage && (
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                      {/* Show timestamp for each message */}
                                      <span className="text-xs text-muted-foreground">
                                        {formatTimeOfDay(msg.timestamp)}
                                      </span>
                                    </div>
                                  )}
                        </div>

                        {/* Message actions for received messages - positioned on right of bubble */}
                        {!isOwnMessage && !msg.isSystemMessage && <MessageActions message={msg} onReply={allowReplies ? handleReplyToMessage : undefined} className="ml-1" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {getPreciseTimestamp(msg.timestamp)}
                    </TooltipContent>
                  </Tooltip>
                </div>;
            })}

            {/* Typing Indicator */}
            {renderTypingIndicator()}
            
            <div ref={messagesEndRef} />
          </div>
        </TooltipProvider>
      </ScrollArea>

      {/* Voice Recorder */}
      {showVoiceRecorder && allowVoiceMessages && <div className="p-4 border-t border-border bg-card">
          <VoiceRecorder onSendVoiceMessage={handleSendVoiceMessage} onCancel={() => setShowVoiceRecorder(false)} autoStart={true} />
        </div>}


      {/* Reply Preview */}
      {replyToMessage && allowReplies && <ReplyPreview replyToMessage={replyToMessage} onCancel={handleCancelReply} />}

      {/* Message Input - Hidden in monitoring mode */}
      {!showVoiceRecorder && !hideInput && !readOnly && <div className="p-3 border-t border-border bg-card">

          <div className="flex items-end gap-2">
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

            <Button 
              variant="default" 
              size="icon" 
              onClick={message.trim() ? handleSendMessage : () => allowVoiceMessages && setShowVoiceRecorder(true)} 
              disabled={(!message.trim() && !allowVoiceMessages) || sending || !isConnected} 
              className="h-10 w-10 p-0"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : message.trim() ? (
                <Send className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </div>

          {message.length >= 950 && (
            <div className="flex justify-end mt-2 text-xs text-amber-600">
              <span>{1000 - message.length} characters remaining</span>
            </div>
          )}

          {!isConnected && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
              <WifiOff className="h-3 w-3" />
              <span>Connection lost. Messages will be sent when reconnected.</span>
            </div>
          )}
        </div>}

      {/* Schedule Dialog */}
      {allowScheduling && <ScheduleSessionDialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen} groupName={participantName || "Chat"} groupMembers={groupMembers || 0} />}
    </div>;
}