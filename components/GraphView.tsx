import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData } from '../types';
import { ZoomIn, ZoomOut, LocateFixed } from 'lucide-react';

interface GraphViewProps {
  data: GraphData;
  onNodeClick: (nodeId: string) => void;
  activeNodeId?: string;
}

const GraphView: React.FC<GraphViewProps> = React.memo(({ data, onNodeClick, activeNodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const contentGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesDataRef = useRef<any[]>([]);

  // Initialize D3 Graph (Runs when data changes or component mounts)
  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;
    
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("font", "12px sans-serif");

    // Clean up previous elements
    svg.selectAll("*").remove();

    // Create a container group for zoom/pan (The 'content' layer)
    const g = svg.append("g");
    contentGroupRef.current = g;

    // Define Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4]) // Limit zoom range
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Center the view initially
    svg.call(zoom.transform, d3.zoomIdentity);

    // -- Simulation Setup --
    const links = data.links.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    // Store nodes data for later access
    nodesDataRef.current = nodes;

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300)) // Repel nodes
      .force("center", d3.forceCenter(width / 2, height / 2)) // Pull to center
      .force("collide", d3.forceCollide(30)); // Prevent overlap

    // -- Draw Links --
    const link = g.append("g")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    // -- Draw Node Group (Circle + Text) --
    const nodeGroup = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Circles
    nodeGroup.append("circle")
      .attr("r", (d) => d.id === activeNodeId ? 12 : 6)
      .attr("fill", (d) => d.id === activeNodeId ? "#0ea5e9" : "#64748b")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation(); // Prevent drag/zoom interference
        onNodeClick(d.id);
      });

    // Text Labels
    nodeGroup.append("text")
      .text(d => d.title)
      .attr("x", 14)
      .attr("y", 4)
      .style("pointer-events", "none") // Clicks pass through to circle
      .style("font-size", "12px")
      .style("font-weight", (d) => d.id === activeNodeId ? "bold" : "normal")
      .style("fill", (d) => d.id === activeNodeId ? "#0f172a" : "#64748b")
      .style("text-shadow", "0 1px 3px rgba(255,255,255,0.8)");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag Handlers
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, onNodeClick]); // Removed activeNodeId from dependency to prevent physics reset

  // Separate Effect for Styling Updates (Active Node)
  // This runs quickly without restarting the physics simulation
  useEffect(() => {
    if (!contentGroupRef.current) return;
    
    const g = contentGroupRef.current;
    
    // Update circles
    g.selectAll("circle")
      .transition().duration(200)
      .attr("r", (d: any) => d.id === activeNodeId ? 12 : 6)
      .attr("fill", (d: any) => d.id === activeNodeId ? "#0ea5e9" : "#64748b");
      
    // Update text
    g.selectAll("text")
      .transition().duration(200)
      .style("font-weight", (d: any) => d.id === activeNodeId ? "bold" : "normal")
      .style("fill", (d: any) => d.id === activeNodeId ? "#0f172a" : "#64748b");
      
  }, [activeNodeId]);

  // Zoom Control Handlers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleFindCurrentFile = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !activeNodeId) return;

    // Find the active node in the stored nodes data
    const activeNode = nodesDataRef.current.find((node: any) => node.id === activeNodeId);

    if (!activeNode || !activeNode.x || !activeNode.y) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    // Calculate transform to center on the active node
    const scale = 1.5; // Zoom in a bit to make the node more visible
    const x = width / 2 - activeNode.x * scale;
    const y = height / 2 - activeNode.y * scale;

    // Apply the transform with smooth transition
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale));
  };

  return (
    <div className="w-full h-full relative bg-slate-50/50 overflow-hidden group">
      <svg ref={svgRef} className="w-full h-full cursor-move active:cursor-grabbing"></svg>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleFindCurrentFile}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
          title="I'm Here"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

export default GraphView;