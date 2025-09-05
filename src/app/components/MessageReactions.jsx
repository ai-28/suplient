import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';

export const MessageReactions = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  currentUserId
}) => {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});

  const handleReactionClick = (emoji, userReactions) => {
    const userReaction = userReactions.find(r => r.userId === currentUserId);
    if (userReaction) {
      onRemoveReaction(userReaction.id);
    } else {
      onAddReaction(emoji);
    }
  };

  if (Object.keys(groupedReactions).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, userReactions]) => {
        const hasUserReacted = userReactions.some(r => r.userId === currentUserId);
        const reactorNames = userReactions.map(r => r.userName).join(', ');
        
        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-6 px-2 text-xs ${
                    hasUserReacted 
                      ? 'bg-primary/10 border-primary/30 text-primary' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => handleReactionClick(emoji, userReactions)}
                >
                  <span className="mr-1">{emoji}</span>
                  <span>{userReactions.length}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{reactorNames}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};