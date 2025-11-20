export interface Note {
  id: string;
  title: string;
  content: string; // Stored as Markdown
  tags: string[];
  updatedAt: number;
  createdAt: number;
}

export interface LinkSuggestion {
  id: string;
  title: string;
  similarity?: number; // For AI ranking
}

export interface GraphNode {
  id: string;
  title: string;
  group?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
