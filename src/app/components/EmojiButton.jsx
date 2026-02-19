"use client"

import React, { useState, useRef, useEffect } from 'react';
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
    // Close popover immediately - the emoji should be inserted by now
    setIsOpen(false);
  };

  // Prevent popover from closing when clicking inside it or on emoji picker
  const handleInteractOutside = (e) => {
    // Always prevent closing on outside interactions
    // We'll close it manually when emoji is selected
    e.preventDefault();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
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
        onInteractOutside={handleInteractOutside}
        onPointerDownOutside={handleInteractOutside}
        onEscapeKeyDown={(e) => {
          setIsOpen(false);
        }}
        onClick={(e) => {
          // Stop propagation to prevent dialog from closing
          e.stopPropagation();
        }}
      >
        <div 
          data-emoji-picker 
          onClick={(e) => {
            // Don't stop propagation here - let the emoji picker handle it
          }}
          onMouseDown={(e) => {
            // Prevent the popover from closing when clicking inside
            e.stopPropagation();
          }}
        >
          <EmojiPickerComponent onEmojiClick={handleEmojiClick} />
        </div>
      </PopoverContent>
    </Popover>
  );
};