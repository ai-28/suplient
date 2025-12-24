"use client"

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { MessageSquare, CheckSquare, FileText, Edit2, Trash2, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { HybridEditor } from "./HybridEditor";
import { toast } from "sonner";

export function ProgramReviewScreen({ generatedProgram, questionnaireData, onImportComplete, onBack }) {
  const [editingElement, setEditingElement] = useState(null);
  const [program, setProgram] = useState(generatedProgram);
  const [isImporting, setIsImporting] = useState(false);

  const handleEdit = (element, index, type) => {
    setEditingElement({ element, index, type });
  };

  const handleSaveEdit = (updatedElement) => {
    if (editingElement.type === 'elements') {
      const newElements = [...program.elements];
      newElements[editingElement.index] = { ...newElements[editingElement.index], ...updatedElement };
      setProgram({ ...program, elements: newElements });
    } else if (editingElement.type === 'documents') {
      const newDocs = [...program.documents];
      newDocs[editingElement.index] = { ...newDocs[editingElement.index], ...updatedElement };
      setProgram({ ...program, documents: newDocs });
    } else if (editingElement.type === 'messagesDocument') {
      setProgram({ ...program, messagesDocument: { ...program.messagesDocument, ...updatedElement } });
    }
    setEditingElement(null);
    toast.success("Changes saved");
  };

  const handleDelete = (index, type) => {
    if (type === 'elements') {
      const newElements = program.elements.filter((_, i) => i !== index);
      setProgram({ ...program, elements: newElements });
    } else if (type === 'documents') {
      const newDocs = program.documents.filter((_, i) => i !== index);
      setProgram({ ...program, documents: newDocs });
    }
    toast.success("Item deleted");
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/ai/import-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programData: program,
          formData: questionnaireData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import program');
      }

      const result = await response.json();
      toast.success("Program imported successfully!");
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import program');
    } finally {
      setIsImporting(false);
    }
  };

  const getElementIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'content': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const stats = {
    totalElements: program.elements?.length || 0,
    messages: program.elements?.filter(e => e.type === 'message').length || 0,
    tasks: program.elements?.filter(e => e.type === 'task').length || 0,
    documents: program.documents?.length || 0
  };

  return (
    <div className="space-y-6">
      {/* Overview Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Total Elements</p>
          <p className="text-2xl font-bold">{stats.totalElements}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Messages</p>
          <p className="text-2xl font-bold">{stats.messages}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tasks</p>
          <p className="text-2xl font-bold">{stats.tasks}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Documents</p>
          <p className="text-2xl font-bold">{stats.documents}</p>
        </div>
      </div>

      <ScrollArea className="h-[400px] sm:h-[500px] pr-4">
        <div className="space-y-6">
          {/* Elements Section */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Program Elements ({stats.totalElements})
            </h4>
            <div className="space-y-2">
              {program.elements?.map((element, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getElementIcon(element.type)}
                    <div>
                      <p className="font-medium text-sm">{element.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Week {element.week}, Day {element.day} - {element.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(element, index, 'elements')}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(index, 'elements')}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({stats.documents})
            </h4>
            <div className="space-y-2">
              {program.documents?.map((doc, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Week {doc.week} Guide
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(doc, index, 'documents')}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(index, 'documents')}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Document */}
          {program.messagesDocument && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages Document
              </h4>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  <p className="font-medium text-sm">{program.messagesDocument.title}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(program.messagesDocument, 0, 'messagesDocument')}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleImport}
          disabled={isImporting}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Import to My Program
            </>
          )}
        </Button>
      </div>

      {/* Edit Modal */}
      {editingElement && (
        <HybridEditor
          element={editingElement.element}
          elementType={editingElement.type === 'elements' ? editingElement.element.type : editingElement.type}
          onSave={handleSaveEdit}
          onCancel={() => setEditingElement(null)}
        />
      )}
    </div>
  );
}

