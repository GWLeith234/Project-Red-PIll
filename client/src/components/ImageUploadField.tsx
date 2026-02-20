import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  showPreview?: boolean;
  previewHeight?: number;
  previewClassName?: string;
  hasRegenerate?: boolean;
  onRegenerate?: () => void;
  regenerateLabel?: string;
  regenerateIcon?: React.ReactNode;
  disabled?: boolean;
  testId?: string;
  extraButton?: React.ReactNode;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = "https://...",
  showPreview = true,
  previewHeight = 120,
  previewClassName,
  hasRegenerate,
  onRegenerate,
  regenerateLabel = "Regenerate",
  regenerateIcon,
  disabled,
  testId,
  extraButton,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, WebP, or GIF image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const urlRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();
      const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Upload failed");
      onChange(objectPath);
      toast({ title: "Image uploaded", description: file.name });
    } catch (err: any) {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [onChange, toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  return (
    <div
      className={`space-y-1.5 ${dragOver ? "ring-2 ring-primary ring-dashed rounded-lg p-2 -m-2" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={testId ? `upload-field-${testId}` : undefined}
    >
      {label && (
        <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider block">
          {label}
        </label>
      )}
      <div className="flex gap-2 items-center">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
          data-testid={testId ? `input-${testId}` : undefined}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="shrink-0 text-xs gap-1.5"
          data-testid={testId ? `button-upload-${testId}` : undefined}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        {hasRegenerate && onRegenerate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={disabled}
            className="shrink-0 text-xs"
            data-testid={testId ? `button-regenerate-${testId}` : undefined}
          >
            {regenerateIcon}
            {regenerateLabel}
          </Button>
        )}
        {extraButton}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>
      {showPreview && value && (
        <div className="relative group mt-1.5">
          <div
            className={`overflow-hidden rounded-md bg-muted ${previewClassName || ""}`}
            style={{ maxHeight: previewHeight }}
          >
            <img
              src={value}
              alt="Preview"
              className="w-full object-cover"
              style={{ maxHeight: previewHeight }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              data-testid={testId ? `img-preview-${testId}` : undefined}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={testId ? `button-clear-${testId}` : undefined}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
