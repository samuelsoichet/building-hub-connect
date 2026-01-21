import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  isEditable?: boolean;
  type?: 'text' | 'textarea';
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  emptyText?: string;
}

export function InlineEdit({
  value,
  onSave,
  isEditable = true,
  type = 'text',
  placeholder = '',
  className = '',
  displayClassName = '',
  inputClassName = '',
  emptyText = 'Not specified',
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditedValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValue(value);
  };

  const handleSave = async () => {
    if (editedValue.trim() === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedValue.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type === 'text') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-start gap-2 ${className}`}>
        {type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={inputClassName}
            disabled={isSaving}
            rows={4}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={inputClassName}
            disabled={isSaving}
          />
        )}
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <span className={displayClassName}>
        {value || emptyText}
      </span>
      {isEditable && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStartEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
