import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Note, GraphData } from './types';
import { extractLinks } from './utils/markdownParser';
import { suggestConnections } from './services/geminiService';
import { loadNotes, saveNotes } from './services/storageService';
import RichEditor from './components/RichEditor';
import GraphView from './components/GraphView';
import {
  Plus,
  Search,
  Network,
  FileText,
  Sparkles,
  Menu,
  ChevronRight,
  Tags,
  X,
  PanelRightOpen,
  PanelRightClose,
  Apple,
  Trash2
} from 'lucide-react';


// Hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const App: React.FC = () => {
  // --- State ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeNoteId, setActiveNoteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGraph, setShowGraph] = useState(true); // Default to true to show off the galaxy
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Right Panel State
  const [rightPanelWidth, setRightPanelWidth] = useState(500); // Wider by default for graph
  const [isResizing, setIsResizing] = useState(false);

  // Debounce notes for Graph logic
  const debouncedNotes = useDebounce(notes, 800);

  // --- Derived State ---
  const activeNote = useMemo(() => {
    if (notes.length === 0) return null;
    return notes.find(n => n.id === activeNoteId) || notes[0];
  }, [notes, activeNoteId]);
  
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes.sort((a, b) => a.title.localeCompare(b.title));
    return notes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  // Calculate Backlinks
  const backlinks = useMemo(() => {
    if (!activeNote) return [];
    return notes.filter(n => {
      const links = extractLinks(n.content);
      return links.includes(activeNote.title); // Linking by Title for this demo
    });
  }, [notes, activeNote]);

  // --- Graph Data Optimization ---
  const graphTopology = useMemo(() => {
    return debouncedNotes.map(n => ({
      id: n.id,
      title: n.title,
      links: extractLinks(n.content).sort()
    }));
  }, [debouncedNotes]);

  const lastGraphData = useRef<GraphData>({ nodes: [], links: [] });
  const lastTopologyJson = useRef<string>('');

  const graphData: GraphData = useMemo(() => {
    const currentTopologyJson = JSON.stringify(graphTopology);
    
    if (currentTopologyJson === lastTopologyJson.current) {
      return lastGraphData.current;
    }

    const nodes = debouncedNotes.map(n => ({ id: n.id, title: n.title }));
    const links: any[] = [];
    
    debouncedNotes.forEach(sourceNote => {
      const extracted = extractLinks(sourceNote.content);
      extracted.forEach(targetTitle => {
        const targetNote = debouncedNotes.find(n => n.title === targetTitle);
        if (targetNote) {
          links.push({ source: sourceNote.id, target: targetNote.id });
        }
      });
    });

    const newData = { nodes, links };
    lastGraphData.current = newData;
    lastTopologyJson.current = currentTopologyJson;
    
    return newData;
  }, [graphTopology, debouncedNotes]);

  // --- Effects ---
  // Load notes from file on mount
  useEffect(() => {
    const initNotes = async () => {
      const loadedNotes = await loadNotes();
      if (loadedNotes.length > 0) {
        setNotes(loadedNotes);
        setActiveNoteId(loadedNotes[0].id);
      } else {
        // If no notes in file, create a welcome note
        const welcomeNote: Note = {
          id: uuidv4(),
          title: 'Welcome to NeuroNote',
          content: 'Start taking notes with [[wiki-style links]] to connect your ideas!\n\nClick the **+ button** to create a new note.',
          tags: [],
          updatedAt: Date.now(),
          createdAt: Date.now()
        };
        setNotes([welcomeNote]);
        setActiveNoteId(welcomeNote.id);
        await saveNotes([welcomeNote]);
      }
      setIsLoading(false);
    };
    initNotes();
  }, []);

  // Save notes to file whenever they change
  useEffect(() => {
    if (!isLoading && notes.length > 0) {
      saveNotes(notes);
    }
  }, [notes, isLoading]);

  // Resize Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      // Constraints
      if (newWidth > 250 && newWidth < 800) {
        setRightPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Suggestion Hiding Logic
  useEffect(() => {
    if (aiSuggestion.length > 0) {
      const links = extractLinks(activeNote.content);
      if (links.length > 0) {
        setAiSuggestion([]);
      }
    }
  }, [activeNote.content, aiSuggestion.length]);


  // --- Handlers ---
  const createNote = () => {
    const newNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const updateActiveNote = (updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => 
      n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n
    ));
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    setActiveNoteId(nodeId);
  }, []);

  const handleLinkClick = (title: string) => {
    const target = notes.find(n => n.title === title);
    if (target) {
      setActiveNoteId(target.id);
    } else {
      const confirmCreate = window.confirm(`Note "${title}" does not exist. Create it?`);
      if (confirmCreate) {
        const newNote: Note = {
           id: uuidv4(),
           title: title,
           content: activeNote ? `Linked from [[${activeNote.title}]]` : '',
           tags: [],
           updatedAt: Date.now(),
           createdAt: Date.now()
        };
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
      }
    }
  };

  const handleAICheck = async () => {
    if (!activeNote) return;
    setIsAnalyzing(true);
    setAiSuggestion([]);
    try {
       const suggestions = await suggestConnections(activeNote, notes);
       setAiSuggestion(suggestions);
    } catch (e) {
       console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteNote = (noteId: string) => {
    if (notes.length === 1) {
      alert("Cannot delete the last note.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete "${notes.find(n => n.id === noteId)?.title}"?`);
    if (!confirmDelete) return;

    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);

    // If we deleted the active note, switch to another one
    if (noteId === activeNoteId) {
      setActiveNoteId(updatedNotes[0].id);
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0 relative z-10`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-700">
             <Network className="w-5 h-5 text-brand-600" />
             <span>NeuroNote</span>
          </div>
          <button onClick={() => createNote()} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-600" title="New Note">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search notes..." 
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
          {isLoading ? (
            // Skeleton Loaders
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full px-3 py-3 rounded-lg border border-transparent flex items-start gap-3 animate-pulse">
                  <div className="w-4 h-4 mt-1 shrink-0 bg-slate-200 rounded" />
                  <div className="overflow-hidden w-full space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors group flex items-start gap-3 ${activeNoteId === note.id ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-100 border border-transparent'}`}
              >
                <FileText className={`w-4 h-4 mt-1 shrink-0 ${activeNoteId === note.id ? 'text-brand-500' : 'text-slate-400'}`} />
                <div className="overflow-hidden w-full">
                  <h3 className={`text-sm font-medium truncate ${activeNoteId === note.id ? 'text-slate-900' : 'text-slate-600'}`}>{note.title}</h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {note.content.slice(0, 40).replace(/[#*\[\]]/g, '') || 'No content'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* Header */}
        <header className="h-14 border-b border-slate-100 flex items-center px-6 justify-between shrink-0 bg-white z-30 relative shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-slate-600">
               <Menu className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={activeNote?.title || ''}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              className="text-lg font-bold bg-transparent focus:outline-none text-slate-800 placeholder-slate-300 flex-1"
              placeholder="Note Title"
              disabled={!activeNote}
            />
            <button
              onClick={() => deleteNote(activeNoteId)}
              className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Graph Toggle */}
             <button 
               onClick={() => setShowGraph(!showGraph)}
               className={`p-2 flex items-center gap-2 text-sm font-medium rounded-lg transition-colors ${showGraph ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'}`}
               title="Toggle Graph View"
             >
               {showGraph ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
               <span className="hidden md:inline">{showGraph ? 'Hide Graph' : 'View Graph'}</span>
             </button>

             {/* AI Actions */}
             <div className="flex items-center bg-brand-50 rounded-lg p-1 border border-brand-100 relative">
                <button
                  onClick={handleAICheck}
                  disabled={isAnalyzing}
                  className="p-1.5 text-brand-600 hover:bg-brand-100 rounded transition-colors disabled:opacity-50 relative group"
                  title="Find Related Notes (AI)"
                >
                   <Apple className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                   {/* Tooltip moved to z-50 to ensure it floats over everything */}
                   <span className="absolute top-full mt-2 right-0 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                     Analyze Links
                   </span>
                </button>
             </div>
          </div>
        </header>

        {/* Main Pane: Split into Editor and Graph/Backlinks */}
        <div className="flex-1 flex overflow-hidden relative z-0">
          
          {/* Editor */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {isLoading ? (
              // Skeleton Loader for Editor
              <div className="p-8 space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3" />
                <div className="space-y-3 mt-8">
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-5/6" />
                  <div className="h-4 bg-slate-200 rounded w-4/5" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ) : activeNote ? (
              <>
                {activeNote.tags.length > 0 && (
                  <div className="px-8 pt-4 flex gap-2">
                    {activeNote.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full flex items-center gap-1">
                        <Tags className="w-3 h-3" /> {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI Suggestions Panel */}
                {aiSuggestion.length > 0 && (
                  <div className="mx-8 mt-4 p-4 bg-brand-50 border border-brand-100 rounded-lg flex flex-col gap-2 animate-in slide-in-from-top-2 z-20 relative">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-brand-800 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Suggested Connections
                      </h4>
                      <button onClick={() => setAiSuggestion([])} className="text-brand-400 hover:text-brand-700">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {aiSuggestion.map(s => (
                        <button
                          key={s}
                          onClick={() => updateActiveNote({ content: activeNote.content + ` [[${s}]] ` })}
                          className="text-sm bg-white border border-brand-200 text-brand-700 px-3 py-1 rounded-md hover:border-brand-400 hover:shadow-sm transition-all"
                        >
                          + Link to "{s}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <RichEditor
                  key={activeNote.id}
                  noteId={activeNote.id}
                  initialContent={activeNote.content}
                  availableNotes={notes}
                  onChange={(md) => updateActiveNote({ content: md })}
                  onLinkClick={handleLinkClick}
                  placeholder="Start typing... Use @ to link other notes."
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <p className="mb-4">No note selected</p>
                  <button onClick={createNote} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
                    Create First Note
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Graph / Backlinks */}
          {(showGraph || backlinks.length > 0) && (
             <div 
               className="border-l border-slate-200 bg-slate-50/50 flex flex-col overflow-hidden shrink-0 relative z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]"
               style={{ width: rightPanelWidth }}
             >
                {/* Resizer Handle */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-400/50 active:bg-brand-500 transition-colors z-50"
                  onMouseDown={startResizing}
                />

                {showGraph && (
                  <div className="h-1/2 min-h-[300px] border-b border-slate-200 relative bg-slate-100">
                     <div className="absolute top-0 left-0 w-full flex justify-between items-center p-2 z-10 bg-slate-100/80 backdrop-blur-sm pointer-events-none">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Graph View</span>
                     </div>
                    <GraphView 
                      data={graphData} 
                      onNodeClick={handleNodeClick} 
                      activeNodeId={activeNoteId}
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">
                   <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Linked From</h3>
                      <span className="text-xs bg-slate-200 text-slate-500 px-1.5 rounded-full">{backlinks.length}</span>
                   </div>
                   
                   {backlinks.length === 0 ? (
                     <p className="text-sm text-slate-400 italic">No backlinks found.</p>
                   ) : (
                     <div className="space-y-2">
                       {backlinks.map(bl => (
                         <button 
                           key={bl.id}
                           onClick={() => setActiveNoteId(bl.id)}
                           className="w-full text-left p-3 bg-white rounded border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all group"
                         >
                            <div className="flex items-center gap-2 mb-1">
                               <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-brand-500 transition-colors" />
                               <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700 truncate">{bl.title}</span>
                            </div>
                            <div className="text-xs text-slate-400 pl-5 line-clamp-2">
                              {bl.content.replace(/[#*\[\]]/g, '')}
                            </div>
                         </button>
                       ))}
                     </div>
                   )}
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;