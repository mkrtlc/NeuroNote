
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { markdownToHtml, htmlToMarkdown } from '../utils/markdownParser';
import { Note } from '../types';
import { Hash, FilePlus, Heading1, Heading2, Heading3, Bold, Italic, Code, List, ListOrdered, Quote, Minus } from 'lucide-react';

interface RichEditorProps {
  initialContent: string;
  noteId: string; // Added to track note switching
  availableNotes: Note[];
  onChange: (markdown: string) => void;
  onLinkClick: (title: string) => void;
  placeholder?: string;
}

const RichEditor: React.FC<RichEditorProps> = ({ 
  initialContent, 
  noteId,
  availableNotes, 
  onChange, 
  onLinkClick,
  placeholder 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [slashSearch, setSlashSearch] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Track the last content we sent to the parent to avoid self-update loops
  const lastEmittedMarkdown = useRef<string>(initialContent);

  // Auto-scroll selected item into view when navigating with arrow keys
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Slash command options
  const slashCommands = [
    { id: 'h1', label: 'Heading 1', icon: Heading1, format: '# ', description: 'Large heading' },
    { id: 'h2', label: 'Heading 2', icon: Heading2, format: '## ', description: 'Medium heading' },
    { id: 'h3', label: 'Heading 3', icon: Heading3, format: '### ', description: 'Small heading' },
    { id: 'bold', label: 'Bold', icon: Bold, format: '**', suffix: '**', description: 'Bold text' },
    { id: 'italic', label: 'Italic', icon: Italic, format: '*', suffix: '*', description: 'Italic text' },
    { id: 'code', label: 'Inline Code', icon: Code, format: '`', suffix: '`', description: 'Inline code' },
    { id: 'codeblock', label: 'Code Block', icon: Code, format: '```', suffix: '```', description: 'Code block' },
    { id: 'bullet', label: 'Bullet List', icon: List, format: '- ', description: 'Bullet list' },
    { id: 'numbered', label: 'Numbered List', icon: ListOrdered, format: '1. ', description: 'Numbered list' },
    { id: 'quote', label: 'Quote', icon: Quote, format: '> ', description: 'Block quote' },
    { id: 'divider', label: 'Divider', icon: Minus, format: '---', description: 'Horizontal rule' },
  ];

  // Initialize or Switch Notes
  useEffect(() => {
    if (editorRef.current) {
      const html = markdownToHtml(initialContent);
      
      // Logic: 
      // 1. If the Note ID changed, ALWAYS update the editor (switching notes).
      // 2. If Note ID is same, ONLY update if the content is different from what we last typed.
      //    This allows external updates (like AI or Search replace) to work, 
      //    while ignoring updates triggered by our own typing (which avoids cursor jumps).
      
      if (noteId !== editorRef.current.dataset.noteId) {
         // Note switched, force update
         editorRef.current.innerHTML = html;
         editorRef.current.dataset.noteId = noteId;
         lastEmittedMarkdown.current = initialContent; // Sync tracker
      } else if (initialContent !== lastEmittedMarkdown.current) {
         // Content changed externally (e.g. AI appended text), so we must update DOM
         editorRef.current.innerHTML = html;
         lastEmittedMarkdown.current = initialContent; // Sync tracker
      }
    }
  }, [initialContent, noteId]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);

    // Update our tracker BEFORE notifying parent so useEffect knows this change came from us
    lastEmittedMarkdown.current = markdown;
    onChange(markdown);

    // Trigger detection logic for @mentions and /commands
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;

      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
        const textBefore = textNode.textContent.slice(0, range.startOffset);

        // Check if we just typed '/'
        if (textBefore.endsWith('/')) {
           const rect = range.getBoundingClientRect();
           const editorRect = editorRef.current.getBoundingClientRect();
           setMenuPos({
             top: rect.bottom - editorRect.top + 24 + editorRef.current.scrollTop,
             left: rect.left - editorRect.left
           });
           setSelectionRange(range.cloneRange());
           setShowSlashMenu(true);
           setSlashSearch('');
           setSelectedIndex(0);
        }
        // Check if we just typed '@'
        else if (textBefore.endsWith('@')) {
           const rect = range.getBoundingClientRect();
           const editorRect = editorRef.current.getBoundingClientRect();
           setMenuPos({
             top: rect.bottom - editorRect.top + 24 + editorRef.current.scrollTop,
             left: rect.left - editorRect.left
           });
           setSelectionRange(range.cloneRange());
           setShowLinkMenu(true);
           setLinkSearch('');
           setSelectedIndex(0);
        }
      }
    }
  }, [onChange]);

  const handleSlashCommand = (command: typeof slashCommands[0]) => {
    if (!selectionRange || !editorRef.current) return;

    // Restore selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRange);

      const textNode = selectionRange.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
         const currentText = textNode.textContent;
         const offset = selectionRange.startOffset;

         // Remove the '/' trigger character
         if (currentText[offset - 1] === '/') {
             textNode.textContent = currentText.slice(0, offset - 1) + currentText.slice(offset);
             selectionRange.setStart(textNode, offset - 1);
             selectionRange.setEnd(textNode, offset - 1);
         }
      }

      // Handle different command types
      let element: HTMLElement | null = null;

      // Block-level elements - insert actual HTML elements
      if (command.id === 'h1') {
        element = document.createElement('h1');
        element.textContent = 'Heading 1';
      } else if (command.id === 'h2') {
        element = document.createElement('h2');
        element.textContent = 'Heading 2';
      } else if (command.id === 'h3') {
        element = document.createElement('h3');
        element.textContent = 'Heading 3';
      } else if (command.id === 'bullet') {
        element = document.createElement('li');
        element.className = 'bullet-item';
        element.textContent = 'List item';
      } else if (command.id === 'numbered') {
        element = document.createElement('li');
        element.className = 'numbered-item';
        element.textContent = 'List item';
      } else if (command.id === 'quote') {
        element = document.createElement('blockquote');
        element.textContent = 'Quote';
      } else if (command.id === 'divider') {
        element = document.createElement('hr');
      } else if (command.id === 'codeblock') {
        element = document.createElement('code');
        element.className = 'code-block';
        element.textContent = 'code';
      }

      // If we created a block element, insert it
      if (element) {
        // Insert the element
        selectionRange.insertNode(element);

        // For divider, add a line break after
        if (command.id === 'divider') {
          const br = document.createElement('br');
          selectionRange.setStartAfter(element);
          selectionRange.insertNode(br);
          selectionRange.setStartAfter(br);
          selectionRange.collapse(true);
        } else {
          // Select the text inside the element so user can start typing
          const newRange = document.createRange();
          newRange.selectNodeContents(element);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }

        // Trigger save
        handleInput({} as any);
      }
      // Inline elements - insert markdown syntax
      else if (command.suffix) {
        // For bold, italic, inline code with wrappers
        const formatText = document.createTextNode(command.format);
        selectionRange.insertNode(formatText);

        const placeholder = document.createTextNode('text');
        selectionRange.setStartAfter(formatText);
        selectionRange.insertNode(placeholder);

        const suffixText = document.createTextNode(command.suffix);
        selectionRange.setStartAfter(placeholder);
        selectionRange.insertNode(suffixText);

        // Select the placeholder text so user can start typing
        const newRange = document.createRange();
        newRange.selectNodeContents(placeholder);
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Trigger save
        handleInput({} as any);
      }
    }

    setShowSlashMenu(false);
    editorRef.current.focus();
  };

  const handleLinkSelect = (targetTitle: string) => {
    if (!selectionRange || !editorRef.current) return;

    // Restore selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRange);

      const textNode = selectionRange.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
         const currentText = textNode.textContent;
         const offset = selectionRange.startOffset;

         // Remove the '@' trigger character
         if (currentText[offset - 1] === '@') {
             textNode.textContent = currentText.slice(0, offset - 1) + currentText.slice(offset);
             selectionRange.setStart(textNode, offset - 1);
             selectionRange.setEnd(textNode, offset - 1);
         }
      }

      // Create the link chip
      const span = document.createElement('span');
      span.className = 'link-chip';
      span.contentEditable = 'false';
      span.dataset.link = targetTitle;
      span.textContent = targetTitle;

      selectionRange.deleteContents();
      selectionRange.insertNode(span);

      // Move cursor after span and add space
      selectionRange.setStartAfter(span);
      selectionRange.setEndAfter(span);
      const space = document.createTextNode('\u00A0'); // Non-breaking space
      selectionRange.insertNode(space);
      selectionRange.setStartAfter(space);
      selectionRange.setEndAfter(space);

      selection.removeAllRanges();
      selection.addRange(selectionRange);

      // Trigger save
      handleInput({} as any);
    }

    setShowLinkMenu(false);
    editorRef.current.focus();
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('link-chip')) {
      const title = target.dataset.link;
      if (title) onLinkClick(title);
    }
    // Hide menus on click elsewhere
    setShowLinkMenu(false);
    setShowSlashMenu(false);
  };

  // Filter logic for link menu
  const filteredNotes = availableNotes.filter(n =>
    n.title.toLowerCase().includes(linkSearch.toLowerCase())
  );

  // Combined list for navigation (existing notes + create option)
  const showCreateOption = linkSearch.trim().length > 0 && !filteredNotes.find(n => n.title.toLowerCase() === linkSearch.toLowerCase());
  const linkMenuOptions = [
    ...filteredNotes,
    ...(showCreateOption ? [{ id: 'create-new', title: linkSearch, isCreate: true }] : [])
  ];

  // Filter logic for slash menu
  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashSearch.toLowerCase()) ||
    cmd.description.toLowerCase().includes(slashSearch.toLowerCase())
  );

  // Handle Keyboard Navigation for Menus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu) {
       if (e.key === 'Escape') {
         e.preventDefault();
         setShowSlashMenu(false);
         editorRef.current?.focus();
         return;
       }
       if (e.key === 'ArrowDown') {
         e.preventDefault();
         setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
         return;
       }
       if (e.key === 'ArrowUp') {
         e.preventDefault();
         setSelectedIndex(prev => Math.max(prev - 1, 0));
         return;
       }
       if (e.key === 'Enter') {
         e.preventDefault();
         const selected = filteredCommands[selectedIndex];
         if (selected) {
            handleSlashCommand(selected);
         }
         return;
       }
    }

    if (showLinkMenu) {
       if (e.key === 'Escape') {
         e.preventDefault();
         setShowLinkMenu(false);
         editorRef.current?.focus();
         return;
       }
       if (e.key === 'ArrowDown') {
         e.preventDefault();
         setSelectedIndex(prev => Math.min(prev + 1, linkMenuOptions.length - 1));
         return;
       }
       if (e.key === 'ArrowUp') {
         e.preventDefault();
         setSelectedIndex(prev => Math.max(prev - 1, 0));
         return;
       }
       if (e.key === 'Enter') {
         e.preventDefault();
         const selected = linkMenuOptions[selectedIndex];
         if (selected) {
            handleLinkSelect(selected.title);
         }
         return;
       }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div 
        ref={editorRef}
        className="editor-content w-full h-full p-8 outline-none text-lg leading-relaxed resize-none overflow-auto no-scrollbar"
        contentEditable
        onInput={handleInput}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        data-placeholder={placeholder}
      />

      {/* Floating Link Menu */}
      {showLinkMenu && (
        <div 
          className="absolute z-50 bg-white shadow-xl border border-slate-200 rounded-lg w-72 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <input 
              autoFocus
              type="text"
              placeholder="Search notes..."
              className="w-full bg-transparent outline-none text-sm text-slate-700 font-medium"
              value={linkSearch}
              onChange={(e) => {
                setLinkSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown} // Pass keydown to parent handler
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
             {linkMenuOptions.map((option: any, idx) => (
               <button
                key={option.id}
                ref={idx === selectedIndex ? selectedItemRef : null}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors
                  ${idx === selectedIndex ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}
                `}
                onClick={() => handleLinkSelect(option.title)}
                onMouseEnter={() => setSelectedIndex(idx)}
               >
                 {option.isCreate ? (
                   <>
                    <FilePlus className="w-4 h-4 text-brand-500" />
                    <span className="font-medium">Create "{option.title}"</span>
                   </>
                 ) : (
                   <>
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span>{option.title}</span>
                   </>
                 )}
               </button>
             ))}
             {linkMenuOptions.length === 0 && (
               <div className="px-4 py-3 text-xs text-slate-400 text-center">
                 No matches found
               </div>
             )}
          </div>
        </div>
      )}

      {/* Floating Slash Command Menu */}
      {showSlashMenu && (
        <div
          className="absolute z-50 bg-white shadow-xl border border-slate-200 rounded-lg w-80 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              placeholder="Search commands..."
              className="w-full bg-transparent outline-none text-sm text-slate-700 font-medium"
              value={slashSearch}
              onChange={(e) => {
                setSlashSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
             {filteredCommands.map((command, idx) => {
               const Icon = command.icon;
               return (
                 <button
                  key={command.id}
                  ref={idx === selectedIndex ? selectedItemRef : null}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors
                    ${idx === selectedIndex ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}
                  `}
                  onClick={() => handleSlashCommand(command)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                 >
                   <Icon className="w-4 h-4 flex-shrink-0 text-slate-400" />
                   <div className="flex flex-col min-w-0">
                     <span className="font-medium">{command.label}</span>
                     <span className="text-xs text-slate-500">{command.description}</span>
                   </div>
                 </button>
               );
             })}
             {filteredCommands.length === 0 && (
               <div className="px-4 py-3 text-xs text-slate-400 text-center">
                 No commands found
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichEditor;
