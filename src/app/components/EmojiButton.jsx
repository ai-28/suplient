"use client"

import React, { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Smile } from 'lucide-react';
import { EmojiPickerComponent } from './EmojiPicker';


export const EmojiButton = ({
  onEmojiSelect,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverContentRef = useRef(null);

  const handleEmojiClick = (emoji) => {
    // Insert emoji first
    onEmojiSelect(emoji);
    // Close popover after a short delay to ensure emoji is inserted
    setTimeout(() => {
      setIsOpen(false);
    }, 50);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`h-9 w-9 p-0 hover:bg-accent ${className}`}
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        ref={popoverContentRef}
        className="w-auto p-0 border-0 shadow-lg z-[100]" 
        side="top"
        align="end"
        onInteractOutside={(e) => {
          // Check if the click is on the emoji picker or its children
          const target = e.target;
          // Prevent closing if clicking inside the emoji picker
          if (target && (
            target.closest('epr-emoji-picker') ||
            target.closest('[class*="emoji-picker"]') ||
            target.closest('[id*="emoji-picker"]')
          )) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Check if the click is on the emoji picker or its children
          const target = e.target;
          // Prevent closing if clicking inside the emoji picker
          if (target && (
            target.closest('epr-emoji-picker') ||
            target.closest('[class*="emoji-picker"]') ||
            target.closest('[id*="emoji-picker"]')
          )) {
            e.preventDefault();
          }
        }}
      >
        <div data-emoji-picker onClick={(e) => e.stopPropagation()}>
          <EmojiPickerComponent onEmojiClick={handleEmojiClick} />
        </div>
      </PopoverContent>
    </Popover>
  );
};