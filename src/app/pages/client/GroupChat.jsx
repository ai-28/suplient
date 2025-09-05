import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { ArrowLeft, Send, Users, Settings, Mic } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { VoiceRecorder } from "@/app/components/VoiceRecorder";
import { VoiceMessage } from "@/app/components/VoiceMessage";
import { ChatMessage } from "@/app/types/chat";

const initialMessages = [
  {
    id: "1",
    senderId: "coach1",
    senderName: "Coach Clausen",
    content: "Welcome everyone to today's session! Let's start by sharing how everyone's week has been.",
    timestamp: "10:00 AM",
    type: "text",
    status: "read",
    isCoach: true
  },
  {
    id: "2",
    senderId: "alex",
    senderName: "Alex",
    content: "Thank you Coach Clausen. I've been practicing the breathing exercises we discussed last week.",
    timestamp: "10:02 AM",
    type: "text",
    status: "read",
    isCoach: false
  },
  {
    id: "3",
    senderId: "maria",
    senderName: "Maria",
    content: "I had a challenging week but using the coping strategies helped me get through it.",
    timestamp: "10:05 AM",
    type: "text",
    status: "read",
    isCoach: false
  },
  {
    id: "4",
    senderId: "you",
    senderName: "You",
    content: "I've been feeling more positive lately. The group support really makes a difference!",
    timestamp: "10:08 AM",
    type: "text",
    status: "read",
    isCoach: false
  },
  {
    id: "5",
    senderId: "coach1",
    senderName: "Coach Clausen",
    content: "That's wonderful to hear from everyone. Remember, progress isn't always linear, and that's completely normal.",
    timestamp: "10:10 AM",
    type: "text",
    status: "read",
    isCoach: true
  }
];

export default function GroupChat() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const location = useLocation();
  const groupName = location.state?.groupName || "Group Chat";
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        senderId: "you",
        senderName: "You",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "text",
        status: "sent",
        isCoach: false
      };
      setMessages(prev => [...prev, message]);
      setNewMessage("");
    }
  };

  const handleSendVoiceMessage = (audioUrl, duration, waveformData) => {
    const voiceMessage = {
      id: Date.now().toString(),
      senderId: "you",
      senderName: "You",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "voice",
      status: "sent",
      isCoach: false,
      audioUrl,
      duration,
      waveformData
    };
    setMessages(prev => [...prev, voiceMessage]);
    setShowVoiceRecorder(false);
  };

  const getAvatarInitials = (name) => {
    if (name === "You") return "YO";
    if (name === "Coach Clausen") return "CC";
    if (name === "Alex") return "AL";
    if (name === "Maria") return "MA";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/client/groups')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{groupName}</h1>
            <p className="text-sm text-green-500 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              12 members online
            </p>
          </div>
        </div>
        <Button size="icon" variant="ghost">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Group Info */}
      <div className="p-4 bg-muted/30 border-b border-border">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium">Next Session</p>
            <p className="text-xs text-muted-foreground">Today at 3:00 PM</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-4 pb-20">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderName === 'You' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs ${message.senderName === 'You' ? 'order-2' : 'order-2'}`}>
              <div className="flex items-start space-x-2">
                {message.senderName !== 'You' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getAvatarInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`${message.senderName === 'You' ? 'order-1' : 'order-2'}`}>
                  {message.senderName !== 'You' && (
                    <p className="text-xs font-medium mb-1">{message.senderName}</p>
                  )}
                  
                  {message.type === 'voice' && message.audioUrl ? (
                    <VoiceMessage
                      audioUrl={message.audioUrl}
                      duration={message.duration || 0}
                      waveformData={message.waveformData || []}
                      isOwnMessage={message.senderName === 'You'}
                    />
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.senderName === 'You'
                          ? 'bg-primary text-primary-foreground'
                          : message.isCoach
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  
                  <p className={`text-xs text-muted-foreground mt-1 ${
                    message.senderName === 'You' ? 'text-right' : 'text-left'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card border-t border-border">
          <VoiceRecorder
            onSendVoiceMessage={handleSendVoiceMessage}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {/* Message Input */}
      {!showVoiceRecorder && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card border-t border-border">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVoiceRecorder(true)}
              className="shrink-0"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Textarea
              placeholder="Share with the group..."
              value={newMessage}
              rows={1}
              onChange={(e) => setNewMessage(e.target.value)}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 160) + 'px';
              }}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1 resize-none min-h-[40px] max-h-40"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}