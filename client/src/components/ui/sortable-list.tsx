import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  dragHandleClassName?: string;
}

export function SortableItem({ id, children, className, dragHandleClassName }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50",
        className
      )}
      {...attributes}
    >
      <div className="flex items-stretch">
        <div
          className={cn(
            "flex items-center px-1.5 cursor-grab active:cursor-grabbing touch-none",
            "text-muted-foreground/40 hover:text-muted-foreground transition-colors",
            dragHandleClassName
          )}
          {...listeners}
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
  renderOverlay,
  className,
  itemClassName,
  dragHandleClassName,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={cn("space-y-2", className)}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              className={itemClassName}
              dragHandleClassName={dragHandleClassName}
            >
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem && renderOverlay ? (
          <div className="shadow-xl border border-primary/30 bg-card rounded-sm opacity-90">
            {renderOverlay(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
