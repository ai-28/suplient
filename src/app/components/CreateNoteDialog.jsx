"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/app/context/LanguageContext";
import { FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

export function CreateNoteDialog({ clientId, onNoteCreated, children }) {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
      }
    };

    checkScreenSize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "",
          description: data.description,
          clientId: clientId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create note');
      }

      console.log('Note created successfully:', result.note);
      
      // Call the callback to refresh the notes list
      if (onNoteCreated) {
        onNoteCreated(result.note);
      }
      
      setIsOpen(false);
      form.reset();
      
    } catch (error) {
      console.error('Error creating note:', error);
      alert(`Error creating note: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className={isMobile ? 'max-w-full mx-2' : 'max-w-md'}>
        <DialogHeader className={isMobile ? 'px-4 py-3' : ''}>
          <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
            <FileText className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            {t('notes.createNewNote', 'Create New Note')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={isMobile ? 'space-y-3 px-4' : 'space-y-4'}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={isMobile ? 'text-xs' : ''}>{t('common.labels.description', 'Description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('notes.enterNoteDescription', 'Enter note description')}
                      className={isMobile ? 'min-h-[60px] text-xs' : 'min-h-[100px]'}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className={isMobile ? 'text-xs' : ''} />
                </FormItem>
              )}
            />

            <div className={`flex ${isMobile ? 'flex-col-reverse gap-2' : 'justify-end space-x-2'} ${isMobile ? 'pt-2' : 'pt-4'}`}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className={isMobile ? 'w-full text-xs h-8' : ''}
                size={isMobile ? "sm" : "default"}
              >
                {t('common.buttons.cancel', 'Cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className={isMobile ? 'w-full text-xs h-8' : ''}
                size={isMobile ? "sm" : "default"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} animate-spin`} />
                    {t('notes.creating', 'Creating...')}
                  </>
                ) : (
                  <>
                    <FileText className={isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} />
                    {t('notes.createNote', 'Create Note')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
