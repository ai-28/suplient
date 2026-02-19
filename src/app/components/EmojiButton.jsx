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
    const target = e.target;
    
    // Check if click is inside the popover content
    if (popoverContentRef.current && popoverContentRef.current.contains(target)) {
      e.preventDefault();
      return;
    }
    
    // Check if clicking on emoji picker elements
    if (target && target.closest) {
      const emojiPicker = target.closest('.epr-emoji-picker') || 
                         target.closest('[class*="epr-"]') ||
                         target.closest('[class*="emoji-picker"]') ||
                         target.closest('[data-emoji-picker]');
      
      if (emojiPicker) {
        e.preventDefault();
        return;
      }
    }
    
    // Check if clicking inside a dialog (prevent dialog from closing)
    const dialog = target.closest && target.closest('[role="dialog"]');
    if (dialog) {
      // If clicking inside dialog but outside popover, prevent popover from closing
      // but allow the click to go through to dialog
      e.preventDefault();
      return;
    }
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
        className="w-auto p-0 border-0 shadow-lg z-[60]" 
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
          e.nativeEvent.stopImmediatePropagation();
        }}
        onMouseDown={(e) => {
          // Stop propagation on mouse down too
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        style={{ zIndex: 60, pointerEvents: 'auto' }}
      >
        <div 
          data-emoji-picker 
          onClick={(e) => {
            // Stop propagation to prevent dialog from closing, but only after emoji is selected
            // Don't stop on the initial click - let it reach the emoji picker
          }}
          style={{ pointerEvents: 'auto' }}
        >
          <EmojiPickerComponent onEmojiClick={handleEmojiClick} />
        </div>
      </PopoverContent>
    </Popover>
  );
};