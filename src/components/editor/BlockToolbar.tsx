/**
 * BlockToolbar - Actions for each block
 */

'use client';

import React from 'react';
import type { Block } from '@/types';

interface BlockToolbarProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

export function BlockToolbar({
    block,
    onUpdate,
    onDelete,
    onDuplicate,
    onMoveUp,
    onMoveDown
}: BlockToolbarProps) {
    return (
        <div className="block-toolbar">
            <div className="block-toolbar__group">
                <button
                    className="block-toolbar__btn"
                    onClick={onMoveUp}
                    title="Move up (Alt+↑)"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                    </svg>
                </button>
                <button
                    className="block-toolbar__btn"
                    onClick={onMoveDown}
                    title="Move down (Alt+↓)"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
            </div>

            <div className="block-toolbar__divider" />

            <div className="block-toolbar__group">
                <button
                    className="block-toolbar__btn"
                    onClick={onDuplicate}
                    title="Duplicate (Cmd+D)"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                </button>
                <button
                    className="block-toolbar__btn block-toolbar__btn--danger"
                    onClick={onDelete}
                    title="Delete (Backspace on empty)"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            </div>

            {/* AI Actions */}
            <div className="block-toolbar__divider" />
            <div className="block-toolbar__group">
                <button
                    className="block-toolbar__btn block-toolbar__btn--ai"
                    title="Improve with AI"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                    </svg>
                    AI
                </button>
            </div>
        </div>
    );
}
