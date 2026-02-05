'use client';

import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import './rich-editor.css';

interface RichTextEditorProps {
    content?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    readOnly?: boolean;
}

export function RichTextEditor({
    content = '',
    onChange,
    placeholder = 'Start writing...',
    readOnly = false,
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rich-editor-image',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'rich-editor-link',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: 'rich-editor-content',
                dir: 'ltr',
            },
        },
    });

    const addImage = useCallback((url: string) => {
        if (editor && url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const handleFileUpload = useCallback(async (file: File) => {
        // Convert to base64 for now (in production, upload to storage)
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
                addImage(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    }, [addImage]);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
        e.target.value = '';
    };

    const addLink = useCallback(() => {
        const url = window.prompt('Enter URL:');
        if (url && editor) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    const addImageFromUrl = useCallback(() => {
        const url = window.prompt('Enter image URL:');
        if (url) {
            addImage(url);
        }
    }, [addImage]);

    if (!editor) return null;

    return (
        <div className="rich-editor">
            {!readOnly && (
                <>
                    {/* Main Toolbar */}
                    <div className="rich-editor-toolbar">
                        {/* Text Style Group */}
                        <div className="toolbar-group">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                                title="Bold (Ctrl+B)"
                            >
                                <strong>B</strong>
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
                                title="Italic (Ctrl+I)"
                            >
                                <em>I</em>
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
                                title="Underline (Ctrl+U)"
                            >
                                <u>U</u>
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
                                title="Strikethrough"
                            >
                                <s>S</s>
                            </button>
                        </div>

                        <div className="toolbar-divider" />

                        {/* Heading Group */}
                        <div className="toolbar-group">
                            <select
                                className="toolbar-select"
                                value={
                                    editor.isActive('heading', { level: 1 }) ? 'h1' :
                                        editor.isActive('heading', { level: 2 }) ? 'h2' :
                                            editor.isActive('heading', { level: 3 }) ? 'h3' :
                                                editor.isActive('heading', { level: 4 }) ? 'h4' :
                                                    'p'
                                }
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === 'p') {
                                        editor.chain().focus().setParagraph().run();
                                    } else {
                                        const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4;
                                        editor.chain().focus().toggleHeading({ level }).run();
                                    }
                                }}
                            >
                                <option value="p">Paragraph</option>
                                <option value="h1">Heading 1</option>
                                <option value="h2">Heading 2</option>
                                <option value="h3">Heading 3</option>
                                <option value="h4">Heading 4</option>
                            </select>
                        </div>

                        <div className="toolbar-divider" />

                        {/* Alignment Group */}
                        <div className="toolbar-group">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
                                title="Align Left"
                            >
                                ≡
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
                                title="Align Center"
                            >
                                ≡
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
                                title="Align Right"
                            >
                                ≡
                            </button>
                        </div>

                        <div className="toolbar-divider" />

                        {/* List Group */}
                        <div className="toolbar-group">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                                title="Bullet List"
                            >
                                •
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                                title="Numbered List"
                            >
                                1.
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
                                title="Quote"
                            >
                                "
                            </button>
                        </div>

                        <div className="toolbar-divider" />

                        {/* Insert Group */}
                        <div className="toolbar-group">
                            <button
                                type="button"
                                onClick={addLink}
                                className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
                                title="Add Link"
                            >
                                🔗
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="toolbar-btn"
                                title="Upload Image"
                            >
                                📷
                            </button>
                            <button
                                type="button"
                                onClick={addImageFromUrl}
                                className="toolbar-btn"
                                title="Image from URL"
                            >
                                🌐
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
                                title="Code Block"
                            >
                                {'</>'}
                            </button>
                        </div>

                        <div className="toolbar-divider" />

                        {/* Color Group */}
                        <div className="toolbar-group">
                            <input
                                type="color"
                                className="toolbar-color"
                                onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                                title="Text Color"
                            />
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                                className={`toolbar-btn ${editor.isActive('highlight') ? 'active' : ''}`}
                                title="Highlight"
                            >
                                🖍
                            </button>
                        </div>

                        <div className="toolbar-divider" />

                        {/* Utility Group */}
                        <div className="toolbar-group">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                                className="toolbar-btn"
                                title="Horizontal Rule"
                            >
                                —
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().undo()}
                                className="toolbar-btn"
                                title="Undo"
                            >
                                ↩
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().redo()}
                                className="toolbar-btn"
                                title="Redo"
                            >
                                ↪
                            </button>
                        </div>
                    </div>

                    {/* Hidden file input for image upload */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />
                </>
            )}

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}

export default RichTextEditor;
