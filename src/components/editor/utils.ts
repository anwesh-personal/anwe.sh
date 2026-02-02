/**
 * Block Editor Utilities
 */

import type { Block, BlockType, HeadingLevel, CalloutType, ListType } from '@/types';

let blockIdCounter = 0;

/**
 * Generate a unique block ID
 */
export function generateBlockId(): string {
    blockIdCounter++;
    return `block-${Date.now()}-${blockIdCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create an empty block of a given type
 */
export function createEmptyBlock(type: BlockType): Block {
    const id = generateBlockId();

    switch (type) {
        case 'paragraph':
            return { id, type: 'paragraph', content: '' };

        case 'heading':
            return { id, type: 'heading', level: 2 as HeadingLevel, content: '' };

        case 'image':
            return { id, type: 'image', url: '', alt: '' };

        case 'code':
            return { id, type: 'code', language: 'javascript', content: '' };

        case 'quote':
            return { id, type: 'quote', content: '' };

        case 'callout':
            return { id, type: 'callout', calloutType: 'info' as CalloutType, content: '' };

        case 'divider':
            return { id, type: 'divider' };

        case 'list':
            return {
                id,
                type: 'list',
                listType: 'bullet' as ListType,
                items: [{ content: '' }]
            };

        case 'table':
            return {
                id,
                type: 'table',
                headers: ['Column 1', 'Column 2'],
                rows: [['', '']]
            };

        case 'embed':
            return { id, type: 'embed', url: '', embedType: 'youtube' };

        case 'html':
            return { id, type: 'html', content: '' };

        default:
            return { id, type: 'paragraph', content: '' };
    }
}

/**
 * Convert blocks to markdown
 */
export function blocksToMarkdown(blocks: Block[]): string {
    return blocks.map(block => {
        switch (block.type) {
            case 'paragraph':
                return block.content + '\n';

            case 'heading':
                const hashes = '#'.repeat(block.level);
                return `${hashes} ${block.content}\n`;

            case 'image':
                return `![${block.alt}](${block.url})${block.caption ? `\n*${block.caption}*` : ''}\n`;

            case 'code':
                return `\`\`\`${block.language}\n${block.content}\n\`\`\`\n`;

            case 'quote':
                return `> ${block.content}${block.author ? `\n> — ${block.author}` : ''}\n`;

            case 'callout':
                const icon = block.calloutType === 'warning' ? '⚠️'
                    : block.calloutType === 'danger' ? '🚫'
                        : block.calloutType === 'tip' ? '💡'
                            : 'ℹ️';
                return `> ${icon} **${block.title || block.calloutType.toUpperCase()}**\n> ${block.content}\n`;

            case 'divider':
                return '---\n';

            case 'list':
                return block.items.map((item, i) => {
                    if (block.listType === 'numbered') {
                        return `${i + 1}. ${item.content}`;
                    } else if (block.listType === 'checklist') {
                        return `- [${item.checked ? 'x' : ' '}] ${item.content}`;
                    }
                    return `- ${item.content}`;
                }).join('\n') + '\n';

            case 'table':
                const header = `| ${block.headers.join(' | ')} |`;
                const divider = `| ${block.headers.map(() => '---').join(' | ')} |`;
                const rows = block.rows.map(row => `| ${row.join(' | ')} |`).join('\n');
                return `${header}\n${divider}\n${rows}\n`;

            case 'embed':
                return `[Embed: ${block.url}]\n`;

            case 'html':
                return block.content + '\n';

            default:
                return '';
        }
    }).join('\n');
}

/**
 * Parse markdown to blocks (basic implementation)
 */
export function markdownToBlocks(markdown: string): Block[] {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let currentBlock: Block | null = null;
    let codeBuffer = '';
    let inCodeBlock = false;
    let codeLanguage = '';

    for (const line of lines) {
        // Code blocks
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // End code block
                blocks.push({
                    id: generateBlockId(),
                    type: 'code',
                    language: codeLanguage,
                    content: codeBuffer.trim()
                });
                codeBuffer = '';
                inCodeBlock = false;
            } else {
                // Start code block
                inCodeBlock = true;
                codeLanguage = line.slice(3).trim() || 'text';
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer += line + '\n';
            continue;
        }

        // Empty lines
        if (!line.trim()) {
            continue;
        }

        // Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            blocks.push({
                id: generateBlockId(),
                type: 'heading',
                level: headingMatch[1].length as HeadingLevel,
                content: headingMatch[2]
            });
            continue;
        }

        // Divider
        if (line.match(/^[-*_]{3,}$/)) {
            blocks.push({
                id: generateBlockId(),
                type: 'divider'
            });
            continue;
        }

        // Quote
        if (line.startsWith('> ')) {
            blocks.push({
                id: generateBlockId(),
                type: 'quote',
                content: line.slice(2)
            });
            continue;
        }

        // List items
        const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
        const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
        const checklistMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);

        if (bulletMatch || numberedMatch || checklistMatch) {
            // For simplicity, each list item becomes its own list block
            // A more advanced parser would group consecutive items
            if (checklistMatch) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'list',
                    listType: 'checklist',
                    items: [{ content: checklistMatch[2], checked: checklistMatch[1] === 'x' }]
                });
            } else if (numberedMatch) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'list',
                    listType: 'numbered',
                    items: [{ content: numberedMatch[1] }]
                });
            } else if (bulletMatch) {
                blocks.push({
                    id: generateBlockId(),
                    type: 'list',
                    listType: 'bullet',
                    items: [{ content: bulletMatch[1] }]
                });
            }
            continue;
        }

        // Image
        const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imageMatch) {
            blocks.push({
                id: generateBlockId(),
                type: 'image',
                alt: imageMatch[1],
                url: imageMatch[2]
            });
            continue;
        }

        // Default: paragraph
        blocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: line
        });
    }

    return blocks.length > 0 ? blocks : [createEmptyBlock('paragraph')];
}

/**
 * Get block type metadata
 */
export const BLOCK_TYPE_INFO: Record<BlockType, {
    label: string;
    icon: string;
    description: string;
    shortcut?: string;
}> = {
    paragraph: {
        label: 'Text',
        icon: '📝',
        description: 'Plain text paragraph',
        shortcut: 'p'
    },
    heading: {
        label: 'Heading',
        icon: '📌',
        description: 'Section heading (H1-H6)',
        shortcut: 'h'
    },
    image: {
        label: 'Image',
        icon: '🖼️',
        description: 'Upload or embed an image',
        shortcut: 'i'
    },
    code: {
        label: 'Code',
        icon: '💻',
        description: 'Code block with syntax highlighting',
        shortcut: 'c'
    },
    quote: {
        label: 'Quote',
        icon: '💬',
        description: 'Blockquote or citation',
        shortcut: 'q'
    },
    callout: {
        label: 'Callout',
        icon: '💡',
        description: 'Highlighted info box',
        shortcut: 'o'
    },
    divider: {
        label: 'Divider',
        icon: '➖',
        description: 'Horizontal line divider',
        shortcut: 'd'
    },
    list: {
        label: 'List',
        icon: '📋',
        description: 'Bullet, numbered, or checklist',
        shortcut: 'l'
    },
    table: {
        label: 'Table',
        icon: '📊',
        description: 'Data table',
        shortcut: 't'
    },
    embed: {
        label: 'Embed',
        icon: '🔗',
        description: 'Embed YouTube, Twitter, etc.',
        shortcut: 'e'
    },
    html: {
        label: 'HTML',
        icon: '🌐',
        description: 'Custom HTML code',
    }
};
