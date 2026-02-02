/**
 * BlockRenderer - Renders each block type appropriately
 */

'use client';

import React, { useRef, useEffect, KeyboardEvent } from 'react';
import type {
    Block,
    ParagraphBlock,
    HeadingBlock,
    ImageBlock,
    CodeBlock,
    QuoteBlock,
    CalloutBlock,
    ListBlock,
    TableBlock,
    EmbedBlock,
    HtmlBlock,
    HeadingLevel
} from '@/types';

interface BlockRendererProps {
    block: Block;
    editable?: boolean;
    onUpdate?: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    placeholder?: string;
}

export function BlockRenderer({
    block,
    editable = false,
    onUpdate,
    onFocus,
    placeholder
}: BlockRendererProps) {
    switch (block.type) {
        case 'paragraph':
            return (
                <ParagraphRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                    onFocus={onFocus}
                    placeholder={placeholder}
                />
            );
        case 'heading':
            return (
                <HeadingRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                    onFocus={onFocus}
                />
            );
        case 'image':
            return (
                <ImageRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                />
            );
        case 'code':
            return (
                <CodeRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                />
            );
        case 'quote':
            return (
                <QuoteRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                />
            );
        case 'callout':
            return (
                <CalloutRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                />
            );
        case 'divider':
            return <DividerRenderer />;
        case 'list':
            return (
                <ListRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                />
            );
        case 'table':
            return (
                <TableRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                />
            );
        case 'embed':
            return (
                <EmbedRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                />
            );
        case 'html':
            return (
                <HtmlRenderer
                    block={block}
                    editable={editable}
                    onUpdate={onUpdate}
                />
            );
        default:
            return <div>Unknown block type</div>;
    }
}

// ============================================
// PARAGRAPH
// ============================================

function ParagraphRenderer({
    block,
    editable,
    onUpdate,
    onFocus,
    placeholder
}: {
    block: ParagraphBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
    onFocus?: () => void;
    placeholder?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    const handleInput = () => {
        if (ref.current && onUpdate) {
            onUpdate({ content: ref.current.innerText });
        }
    };

    if (!editable) {
        return <p className="block-paragraph">{block.content}</p>;
    }

    return (
        <div
            ref={ref}
            className="block-paragraph block-paragraph--editable"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onFocus={onFocus}
            data-placeholder={placeholder || 'Type something...'}
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
    );
}

// ============================================
// HEADING
// ============================================

function HeadingRenderer({
    block,
    editable,
    onUpdate,
    onFocus
}: {
    block: HeadingBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
    onFocus?: () => void;
}) {
    const ref = useRef<HTMLHeadingElement>(null);

    const handleInput = () => {
        if (ref.current && onUpdate) {
            onUpdate({ content: ref.current.innerText });
        }
    };

    const handleLevelChange = (level: HeadingLevel) => {
        if (onUpdate) {
            onUpdate({ level });
        }
    };

    const HeadingTag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)[block.level - 1];

    if (!editable) {
        return React.createElement(HeadingTag, {
            className: `block-heading block-heading--h${block.level}`
        }, block.content);
    }

    return (
        <div className="block-heading-wrapper">
            {editable && (
                <div className="block-heading__level-selector">
                    {([1, 2, 3, 4, 5, 6] as HeadingLevel[]).map(level => (
                        <button
                            key={level}
                            className={`level-btn ${block.level === level ? 'level-btn--active' : ''}`}
                            onClick={() => handleLevelChange(level)}
                        >
                            H{level}
                        </button>
                    ))}
                </div>
            )}
            {React.createElement(HeadingTag, {
                ref: ref,
                className: `block-heading block-heading--h${block.level} block-heading--editable`,
                contentEditable: true,
                suppressContentEditableWarning: true,
                onInput: handleInput,
                onFocus: onFocus,
                'data-placeholder': `Heading ${block.level}`,
                dangerouslySetInnerHTML: { __html: block.content || '' }
            })}
        </div>
    );
}

// ============================================
// IMAGE
// ============================================

function ImageRenderer({
    block,
    editable,
    onUpdate
}: {
    block: ImageBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
}) {
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onUpdate) {
            onUpdate({ url: e.target.value });
        }
    };

    const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onUpdate) {
            onUpdate({ alt: e.target.value });
        }
    };

    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onUpdate) {
            onUpdate({ caption: e.target.value });
        }
    };

    if (!editable && block.url) {
        return (
            <figure className="block-image">
                <img src={block.url} alt={block.alt} />
                {block.caption && <figcaption>{block.caption}</figcaption>}
            </figure>
        );
    }

    return (
        <div className="block-image block-image--editable">
            {block.url ? (
                <figure>
                    <img src={block.url} alt={block.alt} />
                    {block.caption && <figcaption>{block.caption}</figcaption>}
                </figure>
            ) : (
                <div className="block-image__placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Add an image</span>
                </div>
            )}

            {editable && (
                <div className="block-image__controls">
                    <input
                        type="text"
                        value={block.url}
                        onChange={handleUrlChange}
                        placeholder="Image URL..."
                        className="block-input"
                    />
                    <input
                        type="text"
                        value={block.alt}
                        onChange={handleAltChange}
                        placeholder="Alt text..."
                        className="block-input"
                    />
                    <input
                        type="text"
                        value={block.caption || ''}
                        onChange={handleCaptionChange}
                        placeholder="Caption (optional)..."
                        className="block-input"
                    />
                </div>
            )}
        </div>
    );
}

// ============================================
// CODE
// ============================================

function CodeRenderer({
    block,
    editable,
    onUpdate
}: {
    block: CodeBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
}) {
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onUpdate) {
            onUpdate({ content: e.target.value });
        }
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onUpdate) {
            onUpdate({ language: e.target.value });
        }
    };

    const languages = [
        'javascript', 'typescript', 'python', 'rust', 'go',
        'java', 'c', 'cpp', 'csharp', 'ruby', 'php',
        'html', 'css', 'scss', 'json', 'yaml', 'markdown',
        'bash', 'shell', 'sql', 'graphql', 'text'
    ];

    return (
        <div className="block-code">
            {editable && (
                <div className="block-code__header">
                    <select
                        value={block.language}
                        onChange={handleLanguageChange}
                        className="block-code__language"
                    >
                        {languages.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                    {block.filename && (
                        <span className="block-code__filename">{block.filename}</span>
                    )}
                </div>
            )}
            {editable ? (
                <textarea
                    value={block.content}
                    onChange={handleContentChange}
                    className="block-code__textarea"
                    placeholder="// Enter your code here..."
                    spellCheck={false}
                />
            ) : (
                <pre className={`language-${block.language}`}>
                    <code>{block.content}</code>
                </pre>
            )}
        </div>
    );
}

// ============================================
// QUOTE
// ============================================

function QuoteRenderer({
    block,
    editable,
    onUpdate
}: {
    block: QuoteBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
}) {
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onUpdate) {
            onUpdate({ content: e.target.value });
        }
    };

    const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onUpdate) {
            onUpdate({ author: e.target.value });
        }
    };

    return (
        <blockquote className="block-quote">
            {editable ? (
                <>
                    <textarea
                        value={block.content}
                        onChange={handleContentChange}
                        className="block-quote__content"
                        placeholder="Enter quote..."
                    />
                    <input
                        type="text"
                        value={block.author || ''}
                        onChange={handleAuthorChange}
                        className="block-quote__author"
                        placeholder="— Author (optional)"
                    />
                </>
            ) : (
                <>
                    <p>{block.content}</p>
                    {block.author && <footer>— {block.author}</footer>}
                </>
            )}
        </blockquote>
    );
}

// ============================================
// CALLOUT
// ============================================

function CalloutRenderer({
    block,
    editable,
    onUpdate
}: {
    block: CalloutBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
}) {
    const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        tip: '💡',
        danger: '🚫'
    };

    const handleTypeChange = (type: CalloutBlock['calloutType']) => {
        if (onUpdate) {
            onUpdate({ calloutType: type });
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onUpdate) {
            onUpdate({ title: e.target.value });
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onUpdate) {
            onUpdate({ content: e.target.value });
        }
    };

    return (
        <div className={`block-callout block-callout--${block.calloutType}`}>
            <div className="block-callout__icon">{icons[block.calloutType]}</div>
            <div className="block-callout__body">
                {editable && (
                    <div className="block-callout__type-selector">
                        {(Object.keys(icons) as Array<CalloutBlock['calloutType']>).map(type => (
                            <button
                                key={type}
                                className={`callout-type-btn ${block.calloutType === type ? 'callout-type-btn--active' : ''}`}
                                onClick={() => handleTypeChange(type)}
                            >
                                {icons[type]} {type}
                            </button>
                        ))}
                    </div>
                )}
                {editable ? (
                    <>
                        <input
                            type="text"
                            value={block.title || ''}
                            onChange={handleTitleChange}
                            className="block-callout__title"
                            placeholder="Title (optional)"
                        />
                        <textarea
                            value={block.content}
                            onChange={handleContentChange}
                            className="block-callout__content"
                            placeholder="Callout content..."
                        />
                    </>
                ) : (
                    <>
                        {block.title && <strong className="block-callout__title">{block.title}</strong>}
                        <p>{block.content}</p>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================
// DIVIDER
// ============================================

function DividerRenderer() {
    return <hr className="block-divider" />;
}

// ============================================
// LIST
// ============================================

function ListRenderer({
    block,
    editable,
    onUpdate
}: {
    block: ListBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
}) {
    const handleTypeChange = (listType: ListBlock['listType']) => {
        if (onUpdate) {
            onUpdate({ listType });
        }
    };

    const handleItemChange = (index: number, content: string) => {
        if (onUpdate) {
            const newItems = [...block.items];
            newItems[index] = { ...newItems[index], content };
            onUpdate({ items: newItems });
        }
    };

    const handleItemCheck = (index: number, checked: boolean) => {
        if (onUpdate) {
            const newItems = [...block.items];
            newItems[index] = { ...newItems[index], checked };
            onUpdate({ items: newItems });
        }
    };

    const addItem = () => {
        if (onUpdate) {
            onUpdate({ items: [...block.items, { content: '' }] });
        }
    };

    const removeItem = (index: number) => {
        if (onUpdate && block.items.length > 1) {
            const newItems = block.items.filter((_, i) => i !== index);
            onUpdate({ items: newItems });
        }
    };

    const Tag = block.listType === 'numbered' ? 'ol' : 'ul';

    return (
        <div className={`block-list block-list--${block.listType}`}>
            {editable && (
                <div className="block-list__type-selector">
                    <button
                        className={block.listType === 'bullet' ? 'active' : ''}
                        onClick={() => handleTypeChange('bullet')}
                    >
                        • Bullet
                    </button>
                    <button
                        className={block.listType === 'numbered' ? 'active' : ''}
                        onClick={() => handleTypeChange('numbered')}
                    >
                        1. Numbered
                    </button>
                    <button
                        className={block.listType === 'checklist' ? 'active' : ''}
                        onClick={() => handleTypeChange('checklist')}
                    >
                        ☑ Checklist
                    </button>
                </div>
            )}
            <Tag>
                {block.items.map((item, index) => (
                    <li key={index} className={item.checked ? 'checked' : ''}>
                        {block.listType === 'checklist' && (
                            <input
                                type="checkbox"
                                checked={item.checked || false}
                                onChange={(e) => handleItemCheck(index, e.target.checked)}
                                disabled={!editable}
                            />
                        )}
                        {editable ? (
                            <input
                                type="text"
                                value={item.content}
                                onChange={(e) => handleItemChange(index, e.target.value)}
                                placeholder="List item..."
                                className="block-list__item-input"
                            />
                        ) : (
                            <span>{item.content}</span>
                        )}
                        {editable && block.items.length > 1 && (
                            <button
                                className="block-list__remove-item"
                                onClick={() => removeItem(index)}
                            >
                                ×
                            </button>
                        )}
                    </li>
                ))}
            </Tag>
            {editable && (
                <button className="block-list__add-item" onClick={addItem}>
                    + Add item
                </button>
            )}
        </div>
    );
}

// ============================================
// TABLE
// ============================================

function TableRenderer({
    block,
    editable,
    onUpdate
}: {
    block: TableBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
}) {
    const handleHeaderChange = (index: number, value: string) => {
        if (onUpdate) {
            const newHeaders = [...block.headers];
            newHeaders[index] = value;
            onUpdate({ headers: newHeaders });
        }
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        if (onUpdate) {
            const newRows = block.rows.map((row, ri) =>
                ri === rowIndex
                    ? row.map((cell, ci) => ci === colIndex ? value : cell)
                    : row
            );
            onUpdate({ rows: newRows });
        }
    };

    const addRow = () => {
        if (onUpdate) {
            const newRow = new Array(block.headers.length).fill('');
            onUpdate({ rows: [...block.rows, newRow] });
        }
    };

    const addColumn = () => {
        if (onUpdate) {
            onUpdate({
                headers: [...block.headers, `Column ${block.headers.length + 1}`],
                rows: block.rows.map(row => [...row, ''])
            });
        }
    };

    return (
        <div className="block-table">
            <table>
                <thead>
                    <tr>
                        {block.headers.map((header, index) => (
                            <th key={index}>
                                {editable ? (
                                    <input
                                        type="text"
                                        value={header}
                                        onChange={(e) => handleHeaderChange(index, e.target.value)}
                                        className="block-table__cell-input"
                                    />
                                ) : (
                                    header
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {block.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, colIndex) => (
                                <td key={colIndex}>
                                    {editable ? (
                                        <input
                                            type="text"
                                            value={cell}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            className="block-table__cell-input"
                                        />
                                    ) : (
                                        cell
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {editable && (
                <div className="block-table__controls">
                    <button onClick={addRow}>+ Add row</button>
                    <button onClick={addColumn}>+ Add column</button>
                </div>
            )}
        </div>
    );
}

// ============================================
// EMBED
// ============================================

function EmbedRenderer({
    block,
    editable,
    onUpdate
}: {
    block: EmbedBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
}) {
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onUpdate) {
            const url = e.target.value;
            let embedType: EmbedBlock['embedType'] = 'other';

            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                embedType = 'youtube';
            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                embedType = 'twitter';
            } else if (url.includes('vimeo.com')) {
                embedType = 'vimeo';
            } else if (url.includes('codepen.io')) {
                embedType = 'codepen';
            }

            onUpdate({ url, embedType });
        }
    };

    const getEmbedUrl = () => {
        if (block.embedType === 'youtube') {
            const videoId = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }
        if (block.embedType === 'vimeo') {
            const videoId = block.url.match(/vimeo\.com\/(\d+)/)?.[1];
            return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
        }
        return null;
    };

    const embedUrl = getEmbedUrl();

    return (
        <div className="block-embed">
            {editable && (
                <input
                    type="text"
                    value={block.url}
                    onChange={handleUrlChange}
                    placeholder="Paste YouTube, Twitter, Vimeo, or CodePen URL..."
                    className="block-input"
                />
            )}
            {embedUrl ? (
                <div className="block-embed__frame">
                    <iframe
                        src={embedUrl}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            ) : block.url ? (
                <a
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block-embed__link"
                >
                    🔗 {block.url}
                </a>
            ) : (
                <div className="block-embed__placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>Add an embed URL</span>
                </div>
            )}
        </div>
    );
}

// ============================================
// HTML
// ============================================

function HtmlRenderer({
    block,
    editable,
    onUpdate
}: {
    block: HtmlBlock;
    editable?: boolean;
    onUpdate?: (u: Partial<Block>) => void;
}) {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onUpdate) {
            onUpdate({ content: e.target.value });
        }
    };

    return (
        <div className="block-html">
            {editable && (
                <textarea
                    value={block.content}
                    onChange={handleChange}
                    className="block-html__textarea"
                    placeholder="<div>Enter custom HTML...</div>"
                    spellCheck={false}
                />
            )}
            <div
                className="block-html__preview"
                dangerouslySetInnerHTML={{ __html: block.content }}
            />
        </div>
    );
}
