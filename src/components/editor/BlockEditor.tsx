/**
 * ANWE.SH Block Editor
 * Advanced drag-and-drop content editor
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';
import { BlockRenderer } from './BlockRenderer';
import { BlockToolbar } from './BlockToolbar';
import { AddBlockMenu } from './AddBlockMenu';
import type { Block, BlockType, EditorState } from '@/types';
import { generateBlockId, createEmptyBlock } from './utils';
import './editor.css';

interface BlockEditorProps {
    initialBlocks?: Block[];
    onChange?: (blocks: Block[]) => void;
    onSave?: (blocks: Block[]) => void;
    readOnly?: boolean;
    placeholder?: string;
}

export function BlockEditor({
    initialBlocks = [],
    onChange,
    onSave,
    readOnly = false,
    placeholder = 'Start writing or press / for commands...'
}: BlockEditorProps) {
    const [state, setState] = useState<EditorState>({
        blocks: initialBlocks.length > 0 ? initialBlocks : [createEmptyBlock('paragraph')],
        selectedBlockId: null,
        focusedBlockId: null,
        isDragging: false,
        isPreview: false
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
    const [addMenuBlockIndex, setAddMenuBlockIndex] = useState<number>(-1);

    const containerRef = useRef<HTMLDivElement>(null);

    // Notify parent of changes
    useEffect(() => {
        if (onChange) {
            onChange(state.blocks);
        }
    }, [state.blocks, onChange]);

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Block operations
    const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
        setState(prev => ({
            ...prev,
            blocks: prev.blocks.map(block =>
                block.id === id ? { ...block, ...updates } as Block : block
            )
        }));
    }, []);

    const addBlock = useCallback((type: BlockType, afterId?: string) => {
        const newBlock = createEmptyBlock(type);

        setState(prev => {
            const index = afterId
                ? prev.blocks.findIndex(b => b.id === afterId) + 1
                : prev.blocks.length;

            const newBlocks = [...prev.blocks];
            newBlocks.splice(index, 0, newBlock);

            return {
                ...prev,
                blocks: newBlocks,
                focusedBlockId: newBlock.id
            };
        });

        setShowAddMenu(false);
        return newBlock.id;
    }, []);

    const deleteBlock = useCallback((id: string) => {
        setState(prev => {
            if (prev.blocks.length <= 1) {
                // Keep at least one block
                return {
                    ...prev,
                    blocks: [createEmptyBlock('paragraph')]
                };
            }

            const index = prev.blocks.findIndex(b => b.id === id);
            const newBlocks = prev.blocks.filter(b => b.id !== id);

            return {
                ...prev,
                blocks: newBlocks,
                focusedBlockId: newBlocks[Math.max(0, index - 1)]?.id || null
            };
        });
    }, []);

    const duplicateBlock = useCallback((id: string) => {
        setState(prev => {
            const index = prev.blocks.findIndex(b => b.id === id);
            if (index === -1) return prev;

            const block = prev.blocks[index];
            const duplicate = { ...block, id: generateBlockId() };

            const newBlocks = [...prev.blocks];
            newBlocks.splice(index + 1, 0, duplicate);

            return {
                ...prev,
                blocks: newBlocks
            };
        });
    }, []);

    const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
        setState(prev => {
            const index = prev.blocks.findIndex(b => b.id === id);
            if (index === -1) return prev;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prev.blocks.length) return prev;

            return {
                ...prev,
                blocks: arrayMove(prev.blocks, index, newIndex)
            };
        });
    }, []);

    // Drag handlers
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setState(prev => ({ ...prev, isDragging: true }));
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setState(prev => {
                const oldIndex = prev.blocks.findIndex(b => b.id === active.id);
                const newIndex = prev.blocks.findIndex(b => b.id === over.id);

                return {
                    ...prev,
                    blocks: arrayMove(prev.blocks, oldIndex, newIndex),
                    isDragging: false
                };
            });
        } else {
            setState(prev => ({ ...prev, isDragging: false }));
        }

        setActiveId(null);
    }, []);

    // Add menu handlers
    const openAddMenu = useCallback((blockIndex: number, position: { x: number; y: number }) => {
        setAddMenuBlockIndex(blockIndex);
        setAddMenuPosition(position);
        setShowAddMenu(true);
    }, []);

    const handleAddFromMenu = useCallback((type: BlockType) => {
        const afterId = addMenuBlockIndex >= 0
            ? state.blocks[addMenuBlockIndex]?.id
            : undefined;
        addBlock(type, afterId);
    }, [addMenuBlockIndex, state.blocks, addBlock]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (onSave) {
                    onSave(state.blocks);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.blocks, onSave]);

    // Get active block for overlay
    const activeBlock = activeId
        ? state.blocks.find(b => b.id === activeId)
        : null;

    if (readOnly) {
        return (
            <div className="block-editor block-editor--readonly">
                {state.blocks.map(block => (
                    <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
        );
    }

    return (
        <div className="block-editor" ref={containerRef}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={state.blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="block-editor__blocks">
                        {state.blocks.map((block, index) => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                index={index}
                                isSelected={state.selectedBlockId === block.id}
                                isFocused={state.focusedBlockId === block.id}
                                isDragging={activeId === block.id}
                                onUpdate={(updates) => updateBlock(block.id, updates)}
                                onDelete={() => deleteBlock(block.id)}
                                onDuplicate={() => duplicateBlock(block.id)}
                                onMoveUp={() => moveBlock(block.id, 'up')}
                                onMoveDown={() => moveBlock(block.id, 'down')}
                                onAddAfter={(type) => addBlock(type, block.id)}
                                onOpenMenu={(pos) => openAddMenu(index, pos)}
                                onSelect={() => setState(prev => ({ ...prev, selectedBlockId: block.id }))}
                                onFocus={() => setState(prev => ({ ...prev, focusedBlockId: block.id }))}
                                placeholder={index === 0 ? placeholder : undefined}
                            />
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay>
                    {activeBlock ? (
                        <div className="block-editor__drag-overlay">
                            <BlockRenderer block={activeBlock} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Add Block Button */}
            <button
                className="block-editor__add-btn"
                onClick={() => addBlock('paragraph')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add block
            </button>

            {/* Add Block Menu */}
            {showAddMenu && (
                <AddBlockMenu
                    position={addMenuPosition}
                    onSelect={handleAddFromMenu}
                    onClose={() => setShowAddMenu(false)}
                />
            )}
        </div>
    );
}

export default BlockEditor;
