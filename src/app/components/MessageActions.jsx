import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Reply, Smile } from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';

export const MessageActions = ({
  message,
  onReply,
  onReaction,
  className = ""
}) => {
  return (
    <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${className}`}>
      {onReply && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-accent"
          onClick={() => onReply(message)}
        >
          <Reply className="h-3 w-3" />
        </Button>
      )}
      {onReaction && (
        <ReactionPicker onReactionSelect={onReaction}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-accent"
          >
            <Smile className="h-3 w-3" />
          </Button>
        </ReactionPicker>
      )}
    </div>
  );
};