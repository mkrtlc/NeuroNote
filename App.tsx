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

// --- Cosmos Dataset Generation ---
const generateCosmosData = (): Note[] => {
  const now = Date.now();
  const create = (id: string, title: string, content: string, tags: string[]): Note => ({
    id, title, content, tags, updatedAt: now, createdAt: now
  });

  return [
    create('1', 'The Cosmos', 'The **Cosmos** is the universe considered as a complex and orderly system. It contains billions of [[Galaxy]] structures, including our own [[Milky Way]]. It began with the [[Big Bang]] and is governed by forces like [[Gravity]] and mysterious components like [[Dark Matter]].', ['root', 'concept']),
    create('2', 'Big Bang', 'The rapid expansion of matter from a state of extremely high density and temperature. It marks the origin of the [[The Cosmos]]. It created the fundamental elements, eventually leading to the formation of every [[Star]] and [[Galaxy]].', ['origin', 'physics']),
    create('3', 'Galaxy', 'A massive gravitationally bound system that consists of [[Star]] systems, stellar remnants, interstellar gas, dust, and [[Dark Matter]]. Types include [[Spiral Galaxy]], [[Elliptical Galaxy]], and [[Irregular Galaxy]].', ['structure']),
    create('4', 'Milky Way', 'The [[Galaxy]] that contains our [[Solar System]]. It is a barred [[Spiral Galaxy]] with a diameter between 100,000 and 200,000 [[Light Year]]s. At its center lies a supermassive [[Black Hole]] known as [[Sagittarius A*]]. It is on a collision course with the [[Andromeda Galaxy]].', ['galaxy', 'home']),
    create('5', 'Solar System', 'The gravitationally bound system of the [[Sun]] and the objects that orbit it, including eight planets: [[Mercury]], [[Venus]], [[Earth]], [[Mars]], [[Jupiter]], [[Saturn]], [[Uranus]], and [[Neptune]]. It resides in the Orion Arm of the [[Milky Way]].', ['system', 'home']),
    create('6', 'Sun', 'The [[Star]] at the center of the [[Solar System]]. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core. It provides the energy for life on [[Earth]].', ['star']),
    create('7', 'Mercury', 'The smallest planet in the [[Solar System]] and the closest to the [[Sun]]. It has no atmosphere to retain heat, leading to extreme temperature fluctuations.', ['planet', 'terrestrial']),
    create('8', 'Venus', 'The second planet from the [[Sun]]. It has a dense atmosphere of carbon dioxide, creating a runaway greenhouse effect that makes it the hottest planet in the [[Solar System]]. It is often called [[Earth]]\'s twin due to similar size.', ['planet', 'terrestrial']),
    create('9', 'Earth', 'The third planet from the [[Sun]] and the only astronomical object known to harbor life. It has one natural satellite, the [[Moon]]. It exists within the [[Goldilocks Zone]].', ['planet', 'terrestrial', 'life']),
    create('10', 'Moon', '[[Earth]]\'s only natural satellite. It influences tides and stabilizes the planet\'s axial tilt. Humans first landed here during the [[Apollo 11]] mission.', ['moon', 'satellite']),
    create('11', 'Mars', 'The fourth planet from the [[Sun]], often called the "Red Planet" due to iron oxide on its surface. It has two moons, [[Phobos]] and [[Deimos]]. It is a prime target for the search for past life and future colonization.', ['planet', 'terrestrial']),
    create('12', 'Jupiter', 'The fifth planet from the [[Sun]] and the largest in the [[Solar System]]. It is a gas giant with a Great Red Spot, a giant storm. It has many moons, including [[Ganymede]], [[Callisto]], [[Io]], and [[Europa]].', ['planet', 'gas giant']),
    create('13', 'Saturn', 'The sixth planet from the [[Sun]], famous for its prominent ring system. It is a gas giant with numerous moons, including [[Titan]] and [[Enceladus]].', ['planet', 'gas giant']),
    create('14', 'Uranus', 'The seventh planet from the [[Sun]]. It is an ice giant with a unique tilt, rotating on its side. It has a faint ring system.', ['planet', 'ice giant']),
    create('15', 'Neptune', 'The eighth and farthest-known planet from the [[Sun]]. It is an ice giant known for its supersonic winds and deep blue color.', ['planet', 'ice giant']),
    create('16', 'Pluto', 'A dwarf planet in the [[Kuiper Belt]], a ring of bodies beyond [[Neptune]]. It was considered the ninth planet until 2006.', ['dwarf planet']),
    create('17', 'Andromeda Galaxy', 'The nearest major [[Galaxy]] to the [[Milky Way]]. It is a [[Spiral Galaxy]] and contains approximately one trillion stars. It is expected to merge with the Milky Way in about 4.5 billion years.', ['galaxy']),
    create('18', 'Black Hole', 'A region of spacetime where gravity is so strong that nothing, including light, can escape. The boundary is called the [[Event Horizon]]. Most galaxies, like the [[Milky Way]], have a supermassive one at the center.', ['phenomenon', 'physics']),
    create('19', 'Event Horizon', 'The point of no return around a [[Black Hole]]. Any object crossing this boundary is pulled into the singularity.', ['physics', 'boundary']),
    create('20', 'Sagittarius A*', 'The supermassive [[Black Hole]] at the Galactic Center of the [[Milky Way]].', ['black hole', 'center']),
    create('21', 'Dark Matter', 'A hypothetical form of matter that is thought to account for approximately 85% of the matter in the [[The Cosmos]]. It does not interact with light but exerts [[Gravity]].', ['physics', 'mystery']),
    create('22', 'Dark Energy', 'An unknown form of energy that affects the universe on the largest scales, driving the accelerating expansion of the [[The Cosmos]] initiated by the [[Big Bang]].', ['physics', 'mystery']),
    create('23', 'Gravity', 'A fundamental interaction which causes mutual attraction between all things with mass or energy. It governs the orbits of planets in the [[Solar System]] and the structure of every [[Galaxy]].', ['physics', 'force']),
    create('24', 'Light Year', 'A unit of length used to express astronomical distances. It is the distance that light travels in vacuum in one Julian year (approx. 9.46 trillion km). Used to measure distance to [[Proxima Centauri]] and [[Andromeda Galaxy]].', ['measurement']),
    create('25', 'Star', 'An astronomical object consisting of a luminous spheroid of plasma held together by its own [[Gravity]]. The nearest star to [[Earth]] is the [[Sun]].', ['celestial body']),
    create('26', 'Spiral Galaxy', 'A type of [[Galaxy]] characterized by a flat, rotating disk containing stars, gas, and dust, and a central concentration of stars known as the bulge. The [[Milky Way]] and [[Andromeda Galaxy]] are examples.', ['structure']),
    create('27', 'Elliptical Galaxy', 'A type of [[Galaxy]] having an approximately ellipsoidal shape and a smooth, nearly featureless brightness profile. Unlike a [[Spiral Galaxy]], they have little structure.', ['structure']),
    create('28', 'Titan', 'The largest moon of [[Saturn]]. It is the only moon known to have a dense atmosphere and the only object other than [[Earth]] where stable bodies of surface liquid have been found.', ['moon']),
    create('29', 'Europa', 'A moon of [[Jupiter]]. It has the smoothest surface of any known solid object in the [[Solar System]]. It likely has a subsurface ocean of water, making it a candidate for extraterrestrial life.', ['moon']),
    create('30', 'Ganymede', 'A moon of [[Jupiter]] and the largest and most massive moon in the [[Solar System]]. It is even larger than the planet [[Mercury]].', ['moon']),
    create('31', 'Io', 'A moon of [[Jupiter]]. It is the most geologically active object in the [[Solar System]], with over 400 active volcanoes.', ['moon']),
    create('32', 'Enceladus', 'A moon of [[Saturn]]. It ejects plumes of salt water and ice grains from its south polar region, suggesting a subsurface ocean.', ['moon']),
    create('33', 'Phobos', 'The larger and closer of the two natural satellites of [[Mars]].', ['moon']),
    create('34', 'Deimos', 'The smaller and outer of the two natural satellites of [[Mars]].', ['moon']),
    create('35', 'Kuiper Belt', 'A circumstellar disc in the outer [[Solar System]], extending beyond the orbit of [[Neptune]]. It is similar to the [[Asteroid Belt]] but far larger. [[Pluto]] resides here.', ['region']),
    create('36', 'Asteroid Belt', 'The circumstellar disc in the [[Solar System]] located roughly between the orbits of [[Mars]] and [[Jupiter]].', ['region']),
    create('37', 'Oort Cloud', 'A theoretical cloud of predominantly icy planetesimals proposed to surround the [[Sun]] at distances ranging up to 100,000 AU.', ['region']),
    create('38', 'Nebula', 'A distinct body of interstellar clouds (which can consist of cosmic dust, hydrogen, helium, molecular clouds). Stars are often born in them, like in the [[Orion Nebula]].', ['structure']),
    create('39', 'Orion Nebula', 'A diffuse [[Nebula]] situated in the Milky Way, being south of Orion\'s Belt in the constellation of Orion. It is one of the brightest nebulae.', ['nebula']),
    create('40', 'Supernova', 'A powerful and luminous stellar explosion. This transient astronomical event occurs during the last evolutionary stages of a massive [[Star]] or when a [[White Dwarf]] is triggered into runaway nuclear fusion.', ['event']),
    create('41', 'Neutron Star', 'The collapsed core of a massive supergiant [[Star]]. They are the smallest and densest stars known to exist.', ['star', 'remnant']),
    create('42', 'Pulsar', 'A highly magnetized rotating [[Neutron Star]] that emits beams of electromagnetic radiation out of its magnetic poles.', ['star']),
    create('43', 'White Dwarf', 'A stellar core remnant composed mostly of electron-degenerate matter. Our [[Sun]] will eventually become one.', ['star', 'remnant']),
    create('44', 'Red Giant', 'A luminous giant [[Star]] of low or intermediate mass in a late phase of stellar evolution.', ['star']),
    create('45', 'Proxima Centauri', 'A small, low-mass star located 4.244 [[Light Year]]s from the [[Sun]]. It is the closest known star to the [[Solar System]]. It has an exoplanet, [[Proxima Centauri b]].', ['star']),
    create('46', 'Proxima Centauri b', 'An exoplanet orbiting within the [[Goldilocks Zone]] of the red dwarf star [[Proxima Centauri]], the closest star to the [[Sun]].', ['exoplanet']),
    create('47', 'Goldilocks Zone', 'The habitable zone around a star where the temperature is just right - not too hot and not too cold - for liquid water to exist on a planet like [[Earth]].', ['concept']),
    create('48', 'Exoplanet', 'A planet outside the [[Solar System]]. Thousands have been discovered by telescopes like [[Kepler Space Telescope]] and [[James Webb Space Telescope]].', ['planet']),
    create('49', 'James Webb Space Telescope', 'A space telescope conducted by NASA, ESA, and CSA. It views the [[The Cosmos]] in infrared, allowing it to see through dust clouds in a [[Nebula]] and observe the early universe after the [[Big Bang]].', ['tech']),
    create('50', 'Hubble Space Telescope', 'A space telescope that was launched into low Earth orbit in 1990. It has provided some of the most detailed images of the [[The Cosmos]].', ['tech']),
    create('51', 'Voyager 1', 'A space probe launched by NASA in 1977. It is the most distant human-made object from [[Earth]], having entered interstellar space beyond the [[Kuiper Belt]].', ['tech']),
    create('52', 'Apollo 11', 'The spaceflight that first landed humans on the [[Moon]]. Commander Neil Armstrong and pilot Buzz Aldrin formed the American crew.', ['history']),
    create('53', 'Kepler Space Telescope', 'A retired space telescope launched by NASA to discover Earth-size planets orbiting other stars, hunting for [[Exoplanet]]s.', ['tech']),
    create('54', 'Triangulum Galaxy', 'A [[Spiral Galaxy]] approximately 3 million [[Light Year]]s from Earth. It is the third-largest member of the Local Group, behind the [[Andromeda Galaxy]] and the [[Milky Way]].', ['galaxy']),
    create('55', 'Sombrero Galaxy', 'A peculiar [[Galaxy]] of unclear classification in the constellation Virgo. It has a bright nucleus and an unusually large central bulge.', ['galaxy']),
    create('56', 'Whirlpool Galaxy', 'A distinct interacting grand-design [[Spiral Galaxy]]. It was the first galaxy to be classified as a spiral galaxy.', ['galaxy']),
    create('57', 'Irregular Galaxy', 'A [[Galaxy]] that does not have a distinct regular shape, unlike a [[Spiral Galaxy]] or an [[Elliptical Galaxy]].', ['structure']),
    create('58', 'TRAPPIST-1 System', 'A system of seven temperate terrestrial planets orbiting an ultra-cool dwarf star. Several are in the [[Goldilocks Zone]].', ['system']),
    create('59', 'Pillars of Creation', 'A photograph taken by the [[Hubble Space Telescope]] of elephant trunks of interstellar gas and dust in the Eagle [[Nebula]].', ['phenomenon']),
    create('60', 'Eagle Nebula', 'A young open cluster of stars in the constellation Serpens. It contains the [[Pillars of Creation]].', ['nebula'])
  ];
};

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
  const [notes, setNotes] = useState<Note[]>(generateCosmosData());
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0].id);
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
  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId) || notes[0], [notes, activeNoteId]);
  
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes.sort((a, b) => a.title.localeCompare(b.title));
    return notes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  // Calculate Backlinks
  const backlinks = useMemo(() => {
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
      } else {
        // If no notes in file, save the default cosmos data
        const defaultNotes = generateCosmosData();
        setNotes(defaultNotes);
        await saveNotes(defaultNotes);
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
           content: `Linked from [[${activeNote.title}]]`,
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
              value={activeNote.title}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              className="text-lg font-bold bg-transparent focus:outline-none text-slate-800 placeholder-slate-300 flex-1"
              placeholder="Note Title"
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
            ) : (
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