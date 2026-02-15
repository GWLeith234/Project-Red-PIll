import React, { useState, useRef, useCallback } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  dragHandleClassName?: string;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isOver?: boolean;
}

export function SortableItem({
  id,
  children,
  className,
  dragHandleClassName,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isOver,
}: SortableItemProps) {
  const handleRef = useRef<HTMLDivElement>(null);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e, id);
      }}
      onDragEnd={(e) => onDragEnd?.(e)}
      className={cn(
        "relative transition-opacity",
        isDragging && "opacity-50",
        isOver && "border-t-2 border-primary",
        className
      )}
      data-testid={`sortable-item-${id}`}
    >
      <div className="flex items-stretch">
        <div
          ref={handleRef}
          className={cn(
            "flex items-center px-1.5 cursor-grab active:cursor-grabbing touch-none",
            "text-muted-foreground/40 hover:text-muted-foreground transition-colors",
            dragHandleClassName
          )}
          data-testid={`drag-handle-${id}`}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderOverlay?: (item: T) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  dragHandleClassName?: string;
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
  dragHandleClassName,
}: SortableListProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setOverId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragId && overId && dragId !== overId) {
      const oldIndex = items.findIndex((item) => item.id === dragId);
      const newIndex = items.findIndex((item) => item.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = [...items];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        onReorder(reordered);
      }
    }
    setDragId(null);
    setOverId(null);
  }, [dragId, overId, items, onReorder]);

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <SortableItem
          key={item.id}
          id={item.id}
          className={itemClassName}
          dragHandleClassName={dragHandleClassName}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          isDragging={dragId === item.id}
          isOver={overId === item.id && dragId !== item.id}
        >
          {renderItem(item, index)}
        </SortableItem>
      ))}
    </div>
  );
}
