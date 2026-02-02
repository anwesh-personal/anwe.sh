/**
 * SortableBlock - Wrapper for drag-drop functionality
 */

'use client';

import React, { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockRenderer } from './BlockRenderer';
import { BlockToolbar } from './BlockToolbar';
import type { Block, BlockType } from '@/types';

interface SortableBlockProps {
    block: Block;
    index: number;
    isSelected: boolean;
    isFocused: boolean;
    isDragging: boolean;
    onUpdate: (updates: Partial<Block>) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onAddAfter: (type: BlockType) => void;
    onOpenMenu: (position: { x: number; y: number }) => void;
    onSelect: () => void;
    onFocus: () => void;
    placeholder?: string;
}

export function SortableBlock({
    block,
    index,
    isSelected,
    isFocused,
    isDragging,
    onUpdate,
    onDelete,
    onDuplicate,
    onMoveUp,
    onMoveDown,
    onAddAfter,
    onOpenMenu,
    onSelect,
    onFocus,
    placeholder
}: SortableBlockProps) {
    const [showToolbar, setShowToolbar] = useState(false);
    const blockRef = useRef<HTMLDivElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleMouseEnter = () => {
        setShowToolbar(true);
    };

    const handleMouseLeave = () => {
        setShowToolbar(false);
    };

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = blockRef.current?.getBoundingClientRect();
        if (rect) {
            onOpenMenu({ x: rect.left, y: rect.bottom + 8 });
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`sortable-block ${isSelected ? 'sortable-block--selected' : ''} ${isFocused ? 'sortable-block--focused' : ''} ${isDragging ? 'sortable-block--dragging' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onSelect}
        >
            {/* Drag Handle + Add Button */}
            <div className="sortable-block__controls">
                <button
                    className="sortable-block__add-btn"
                    onClick={handleAddClick}
                    title="Add block below"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <button
                    className="sortable-block__drag-handle"
                    {...attributes}
                    {...listeners}
                    title="Drag to reorder"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="5" r="1.5" />
                        <circle cx="15" cy="5" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" />
                        <circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="19" r="1.5" />
                        <circle cx="15" cy="19" r="1.5" />
                    </svg>
                </button>
            </div>

            {/* Block Content */}
            <div className="sortable-block__content" ref={blockRef}>
                <BlockRenderer
                    block={block}
                    editable
                    onUpdate={onUpdate}
                    onFocus={onFocus}
                    placeholder={placeholder}
                />
            </div>

            {/* Toolbar */}
            {showToolbar && (
                <BlockToolbar
                    block={block}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                />
            )}
        </div>
    );
}
