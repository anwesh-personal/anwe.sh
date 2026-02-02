/**
 * AddBlockMenu - Menu for selecting block types to add
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { BlockType } from '@/types';
import { BLOCK_TYPE_INFO } from './utils';

interface AddBlockMenuProps {
    position: { x: number; y: number };
    onSelect: (type: BlockType) => void;
    onClose: () => void;
}

export function AddBlockMenu({ position, onSelect, onClose }: AddBlockMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchRef = useRef<HTMLInputElement>(null);

    const blockTypes = Object.entries(BLOCK_TYPE_INFO) as [BlockType, typeof BLOCK_TYPE_INFO[BlockType]][];

    // Filter by search
    const filteredTypes = blockTypes.filter(([type, info]) =>
        info.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (info.shortcut && info.shortcut.includes(searchQuery.toLowerCase()))
    );

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Focus search on mount
    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < filteredTypes.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredTypes.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredTypes[selectedIndex]) {
                        onSelect(filteredTypes[selectedIndex][0]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredTypes, selectedIndex, onSelect, onClose]);

    // Reset selection when filter changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    // Group blocks by category
    const basicBlocks: BlockType[] = ['paragraph', 'heading', 'list', 'quote'];
    const mediaBlocks: BlockType[] = ['image', 'embed', 'code'];
    const advancedBlocks: BlockType[] = ['callout', 'table', 'divider', 'html'];

    const getBlocksByCategory = (category: BlockType[]) =>
        filteredTypes.filter(([type]) => category.includes(type));

    return (
        <div
            className="add-block-menu"
            ref={menuRef}
            style={{
                position: 'fixed',
                left: Math.min(position.x, window.innerWidth - 280),
                top: Math.min(position.y, window.innerHeight - 400)
            }}
        >
            <div className="add-block-menu__search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search blocks..."
                />
            </div>

            <div className="add-block-menu__content">
                {filteredTypes.length === 0 ? (
                    <div className="add-block-menu__empty">
                        No blocks found
                    </div>
                ) : (
                    <>
                        {getBlocksByCategory(basicBlocks).length > 0 && (
                            <div className="add-block-menu__section">
                                <div className="add-block-menu__section-title">Basic</div>
                                {getBlocksByCategory(basicBlocks).map(([type, info], idx) => (
                                    <button
                                        key={type}
                                        className={`add-block-menu__item ${selectedIndex === filteredTypes.findIndex(([t]) => t === type)
                                                ? 'add-block-menu__item--selected'
                                                : ''
                                            }`}
                                        onClick={() => onSelect(type)}
                                        onMouseEnter={() => setSelectedIndex(filteredTypes.findIndex(([t]) => t === type))}
                                    >
                                        <span className="add-block-menu__item-icon">{info.icon}</span>
                                        <div className="add-block-menu__item-content">
                                            <span className="add-block-menu__item-label">{info.label}</span>
                                            <span className="add-block-menu__item-desc">{info.description}</span>
                                        </div>
                                        {info.shortcut && (
                                            <span className="add-block-menu__item-shortcut">/{info.shortcut}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {getBlocksByCategory(mediaBlocks).length > 0 && (
                            <div className="add-block-menu__section">
                                <div className="add-block-menu__section-title">Media</div>
                                {getBlocksByCategory(mediaBlocks).map(([type, info]) => (
                                    <button
                                        key={type}
                                        className={`add-block-menu__item ${selectedIndex === filteredTypes.findIndex(([t]) => t === type)
                                                ? 'add-block-menu__item--selected'
                                                : ''
                                            }`}
                                        onClick={() => onSelect(type)}
                                        onMouseEnter={() => setSelectedIndex(filteredTypes.findIndex(([t]) => t === type))}
                                    >
                                        <span className="add-block-menu__item-icon">{info.icon}</span>
                                        <div className="add-block-menu__item-content">
                                            <span className="add-block-menu__item-label">{info.label}</span>
                                            <span className="add-block-menu__item-desc">{info.description}</span>
                                        </div>
                                        {info.shortcut && (
                                            <span className="add-block-menu__item-shortcut">/{info.shortcut}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {getBlocksByCategory(advancedBlocks).length > 0 && (
                            <div className="add-block-menu__section">
                                <div className="add-block-menu__section-title">Advanced</div>
                                {getBlocksByCategory(advancedBlocks).map(([type, info]) => (
                                    <button
                                        key={type}
                                        className={`add-block-menu__item ${selectedIndex === filteredTypes.findIndex(([t]) => t === type)
                                                ? 'add-block-menu__item--selected'
                                                : ''
                                            }`}
                                        onClick={() => onSelect(type)}
                                        onMouseEnter={() => setSelectedIndex(filteredTypes.findIndex(([t]) => t === type))}
                                    >
                                        <span className="add-block-menu__item-icon">{info.icon}</span>
                                        <div className="add-block-menu__item-content">
                                            <span className="add-block-menu__item-label">{info.label}</span>
                                            <span className="add-block-menu__item-desc">{info.description}</span>
                                        </div>
                                        {info.shortcut && (
                                            <span className="add-block-menu__item-shortcut">/{info.shortcut}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="add-block-menu__footer">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
            </div>
        </div>
    );
}
