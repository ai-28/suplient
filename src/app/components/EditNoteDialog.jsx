"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/app/context/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  description: z.string().optional(),
});

export function EditNoteDialog({ open, onOpenChange, note, onNoteUpdated }) {
  const t = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  // Update form when note changes or dialog opens
  useEffect(() => {
    if (note && open) {
      form.reset({
        description: note.description || "",
      });
    }
  }, [note, open, form]);

  const onSubmit = async (data) => {
    if (!note?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: note.title || '', // Preserve existing title
          description: data.description
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('notes.updateFailed', 'Failed to update note'));
      }

      toast.success(t('notes.updateSuccess', 'Note updated successfully'));
      
      // Call the callback to refresh the notes list
      if (onNoteUpdated) {
        onNoteUpdated(result.note);
      }
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error(t('notes.updateFailed', 'Failed to update note') + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t('notes.editNote', 'Edit Note')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.labels.description', 'Description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('notes.enterDescriptionOptional', 'Enter note description (optional)')}
                      className="min-h-[100px]"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common.buttons.cancel', 'Cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.messages.updating', 'Updating...')}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    {t('notes.updateNote', 'Update Note')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

