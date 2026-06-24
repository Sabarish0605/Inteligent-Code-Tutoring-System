import { create } from "zustand";
import {
  DEFAULT_JAVA_CODE,
  DEFAULT_UTILS_CODE,
  DEFAULT_README,
} from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VFSNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  content: string; // empty string for folders
}

interface VFSStore {
  nodes: VFSNode[];
  activeFileId: string | null;
  focusedNodeId: string | null;
  openFileIds: string[];
  isDirty: boolean;
  autoSaveEnabled: boolean;
  consecutiveErrorCount: number;
  lastErrorCategory: string | null;
  lastRawError: string | null;
  isSocraticBulbVisible: boolean;
  activeSocraticPhase: 1 | 2 | 3;

  // Queries
  getActiveFile: () => VFSNode | null;
  getFileNodes: () => VFSNode[];
  getOpenFiles: () => VFSNode[];

  // Mutations
  createFile: (name: string, currentSelectedId?: string | null) => string;
  createFolder: (name: string, currentSelectedId?: string | null) => string;
  deleteNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  moveNode: (draggedId: string, targetParentId: string | null) => void;
  setActiveFile: (id: string | null) => void;
  setFocusedNodeId: (id: string | null) => void;
  closeFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  loadNodes: (nodes: VFSNode[]) => void;
  markClean: () => void;
  toggleAutoSave: () => void;
  
  registerCompilationSuccess: () => void;
  registerCompilationFailure: (errorCategory: string, rawError: string) => void;
  setSocraticPhase: (phase: 1 | 2 | 3) => void;
}

// ─── Default VFS ──────────────────────────────────────────────────────────────

const DEFAULT_NODES: VFSNode[] = [
  {
    id: "folder-root",
    name: "JAVAZZ",
    type: "folder",
    parentId: null,
    content: "",
  },
  {
    id: "file-main",
    name: "Main.java",
    type: "file",
    parentId: "folder-root",
    content: DEFAULT_JAVA_CODE,
  },
  {
    id: "file-utils",
    name: "Utils.java",
    type: "file",
    parentId: "folder-root",
    content: DEFAULT_UTILS_CODE,
  },
  {
    id: "file-readme",
    name: "README.md",
    type: "file",
    parentId: "folder-root",
    content: DEFAULT_README,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Sanitizes a string into a valid Java class name, substituting invalid characters with underscores */
function sanitizeJavaClassName(name: string): string {
  let baseName = name;
  if (baseName.endsWith(".java")) {
    baseName = baseName.replace(/\.java$/, "");
  }
  
  // Trim messy trailing spaces before replacing inner spaces
  baseName = baseName.trim();
  
  // Replace consecutive spaces, parentheses, hyphens, or invalid special characters with a clean underscore
  // Using [^A-Za-z0-9_] without '+' ensures "Main (1)" -> "Main__1_" exactly as specified
  let sanitized = baseName.replace(/[^A-Za-z0-9_]/g, "_");
  
  // Ensure the name does not start with a number
  if (/^[0-9]/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }
  
  return sanitized;
}

/** Recursively collects all descendant IDs of a node. */
function getAllDescendants(nodeId: string, allNodes: VFSNode[]): string[] {
  const children = allNodes.filter((n) => n.parentId === nodeId);
  return [
    nodeId,
    ...children.flatMap((c) => getAllDescendants(c.id, allNodes)),
  ];
}

/** Resolves name collision by appending a sequential suffix: "Name.ext" -> "Name (1).ext" */
function getUniqueName(name: string, parentId: string | null, nodes: VFSNode[]): string {
  const siblings = nodes.filter((n) => n.parentId === parentId);
  let candidate = name;
  let counter = 1;

  let base = name;
  let ext = "";
  const lastDotIdx = name.lastIndexOf(".");
  // Avoid treating dot-prefix hidden files (e.g. .gitignore) as purely extensions
  if (lastDotIdx !== -1 && lastDotIdx > 0) {
    base = name.substring(0, lastDotIdx);
    ext = name.substring(lastDotIdx);
  }

  while (siblings.some((s) => s.name.toLowerCase() === candidate.toLowerCase())) {
    candidate = `${base} (${counter})${ext}`;
    counter++;
  }
  return candidate;
}

function calculateSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  let intersectionSize = 0;
  for (const w of words1) {
    if (words2.has(w)) intersectionSize++;
  }
  const unionSize = words1.size + words2.size - intersectionSize;
  return unionSize === 0 ? 1 : intersectionSize / unionSize;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVFSStore = create<VFSStore>((set, get) => ({
  nodes: DEFAULT_NODES,
  activeFileId: "file-main",
  focusedNodeId: null,
  openFileIds: ["file-main", "file-utils", "file-readme"],
  isDirty: false,
  autoSaveEnabled: true,
  consecutiveErrorCount: 0,
  lastErrorCategory: null,
  lastRawError: null,
  isSocraticBulbVisible: false,
  activeSocraticPhase: 1,

  // ── Queries ──────────────────────────────────────────────────────────────

  getActiveFile: () => {
    const { nodes, activeFileId } = get();
    return nodes.find((n) => n.id === activeFileId) ?? null;
  },

  getFileNodes: () => {
    return get().nodes.filter((n) => n.type === "file");
  },

  getOpenFiles: () => {
    const { nodes, openFileIds } = get();
    return openFileIds
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is VFSNode => !!n);
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  createFile: (name, currentSelectedId = null) => {
    const id = `file-${crypto.randomUUID()}`;
    
    // Position selection rules
    let parentId: string | null = null;
    if (currentSelectedId) {
      const selectedNode = get().nodes.find((n) => n.id === currentSelectedId);
      if (selectedNode) {
        if (selectedNode.type === "folder") {
          parentId = selectedNode.id;
        } else {
          parentId = selectedNode.parentId;
        }
      }
    }

    // Resolve name collision
    const finalName = getUniqueName(name, parentId, get().nodes);

    // Initialize content as completely empty string for all new files
    let content = "";

    const node: VFSNode = { id, name: finalName, type: "file", parentId, content };
    set((s) => ({
      nodes: [...s.nodes, node],
      isDirty: true,
    }));
    return id;
  },

  // Toggle auto-save feature
  toggleAutoSave: () => {
    set((s) => ({ autoSaveEnabled: !s.autoSaveEnabled }));
  },

  createFolder: (name, currentSelectedId = null) => {
    const id = `folder-${crypto.randomUUID()}`;

    // Position selection rules
    let parentId: string | null = null;
    if (currentSelectedId) {
      const selectedNode = get().nodes.find((n) => n.id === currentSelectedId);
      if (selectedNode) {
        if (selectedNode.type === "folder") {
          parentId = selectedNode.id;
        } else {
          parentId = selectedNode.parentId;
        }
      }
    }

    // Resolve name collision
    const finalName = getUniqueName(name, parentId, get().nodes);

    const node: VFSNode = {
      id,
      name: finalName,
      type: "folder",
      parentId,
      content: "",
    };
    set((s) => ({ nodes: [...s.nodes, node], isDirty: true }));
    return id;
  },

  deleteNode: (id) => {
    set((s) => {
      const toDelete = new Set(getAllDescendants(id, s.nodes));
      const newNodes = s.nodes.filter((n) => !toDelete.has(n.id));
      const newOpenIds = s.openFileIds.filter((oid) => !toDelete.has(oid));
      // If active file was deleted, fall back to last open file, or first available file
      let newActiveId = s.activeFileId;
      if (toDelete.has(s.activeFileId ?? "")) {
        newActiveId = newOpenIds[newOpenIds.length - 1] ?? (newNodes.find((n) => n.type === "file")?.id ?? null);
      }
      return { nodes: newNodes, openFileIds: newOpenIds, activeFileId: newActiveId, isDirty: true };
    });
  },

  renameNode: (id, name) => {
    let trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.includes("/") || trimmed.includes("\\")) return;

    set((s) => {
      const target = s.nodes.find((n) => n.id === id);
      if (!target) return s;

      const isJavaRename = target.name.endsWith(".java") && trimmed.endsWith(".java");
      if (isJavaRename) {
        const newClass = sanitizeJavaClassName(trimmed);
        trimmed = `${newClass}.java`;
      }

      // Sibling duplicate name validation
      const hasConflict = s.nodes.some(
        (n) =>
          n.parentId === target.parentId &&
          n.id !== id &&
          n.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (hasConflict) return s;

      const updatedNodes = s.nodes.map((n) => {
        if (n.id !== id) return n;
        let { content } = n;
        
        const isTrimmedJava = trimmed.endsWith(".java");
        const isTargetJava = target.name.endsWith(".java");

        if (isTrimmedJava) {
          const newClass = trimmed.replace(/\.java$/, ""); // already sanitized
          
          if (isTargetJava && content.trim() !== "") {
            // Already Java and has content, rename class
            const oldClass = target.name.replace(/\.java$/, "");
            const classRegex = new RegExp(`\\bpublic\\s+class\\s+${oldClass}\\b`, 'g');
            content = content.replace(classRegex, `public class ${newClass}`);
          } else if (content.trim() === "") {
            // Content is empty (newly created or cleared), generate Java boilerplate
            content = `public class ${newClass} {\n    public static void main(String[] args) {\n        System.out.println("Hello from ${newClass}!");\n    }\n}\n`;
          }
        }
        
        return { ...n, name: trimmed, content };
      });
      return { nodes: updatedNodes, isDirty: true };
    });
  },

  moveNode: (draggedId, targetParentId) => {
    set((s) => {
      let newParentId = targetParentId;
      if (newParentId === "root") {
        newParentId = null;
      }

      // Prevent moving a node into itself
      if (draggedId === newParentId) return s;

      let spliceIndex = -1;
      // If the target parent is a file, redirect placement to inherit the file's parentId (sibling placement)
      if (newParentId) {
        const parentNode = s.nodes.find((n) => n.id === newParentId);
        if (parentNode && parentNode.type === "file") {
          newParentId = parentNode.parentId;
          spliceIndex = s.nodes.findIndex((n) => n.id === parentNode.id);
        }
      }

      // Check if newParentId is a descendant of draggedId (cycle prevention)
      if (newParentId) {
        let current: string | null = newParentId;
        const parentMap = new Map(s.nodes.map((n) => [n.id, n.parentId]));
        while (current) {
          if (current === draggedId) {
            // Cycle detected! Do not allow move.
            return s;
          }
          current = parentMap.get(current) ?? null;
        }
      }

      const draggedNode = s.nodes.find((n) => n.id === draggedId);
      if (!draggedNode) return s;

      let newNodes = s.nodes.filter((n) => n.id !== draggedId);
      const updatedNode = { ...draggedNode, parentId: newParentId };

      if (spliceIndex !== -1) {
        // Insert directly below the target file
        const newSpliceIndex = newNodes.findIndex((n) => n.id === targetParentId);
        if (newSpliceIndex !== -1) {
          newNodes.splice(newSpliceIndex + 1, 0, updatedNode);
        } else {
          newNodes.push(updatedNode);
        }
      } else {
        newNodes.push(updatedNode);
      }
      
      return { nodes: newNodes, isDirty: true };
    });
  },

  setActiveFile: (id) => {
    set((s) => {
      if (id === null) return { activeFileId: null };
      
      const isSwitchingFile = s.activeFileId !== id;
      const openFileIds = s.openFileIds.includes(id)
        ? s.openFileIds
        : [...s.openFileIds, id];
        
      if (isSwitchingFile) {
        return { 
          activeFileId: id, 
          openFileIds,
          consecutiveErrorCount: 0,
          lastErrorCategory: null,
          lastRawError: null,
          isSocraticBulbVisible: false,
          activeSocraticPhase: 1,
        };
      }
      
      return { activeFileId: id, openFileIds };
    });
  },

  setFocusedNodeId: (id) => set({ focusedNodeId: id }),

  closeFile: (id) => {
    set((s) => {
      const newOpenIds = s.openFileIds.filter((oid) => oid !== id);
      let newActiveId = s.activeFileId;
      if (s.activeFileId === id) {
        newActiveId = newOpenIds[newOpenIds.length - 1] ?? null;
      }
      return { openFileIds: newOpenIds, activeFileId: newActiveId };
    });
  },

  updateFileContent: (id, content) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, content } : n)),
      isDirty: true,
    }));
  },

  loadNodes: (nodes) => {
    const firstFile = nodes.find((n) => n.type === "file");
    const openFileIds = firstFile ? [firstFile.id] : [];
    set({ nodes, activeFileId: firstFile?.id ?? null, openFileIds, isDirty: false });
  },

  markClean: () => {
    set({ isDirty: false });
  },

  registerCompilationSuccess: () => {
    set({
      consecutiveErrorCount: 0,
      lastErrorCategory: null,
      lastRawError: null,
      isSocraticBulbVisible: false,
      activeSocraticPhase: 1,
    });
  },

  registerCompilationFailure: (errorCategory: string, rawError: string) => {
    set((s) => {
      let newCount = s.consecutiveErrorCount;
      
      if (s.lastErrorCategory === errorCategory) {
        if (errorCategory === 'UNKNOWN') {
          // Edge Case 5: For UNKNOWN, only increment if tracebacks are similar
          const similarity = calculateSimilarity(s.lastRawError || "", rawError);
          if (similarity >= 0.85) {
            newCount += 1;
          } else {
            newCount = 1;
          }
        } else {
          newCount += 1;
        }
      } else {
        newCount = 1;
      }
      
      return {
        consecutiveErrorCount: newCount,
        lastErrorCategory: errorCategory,
        lastRawError: rawError,
        isSocraticBulbVisible: newCount >= 3 ? true : s.isSocraticBulbVisible,
      };
    });
  },

  setSocraticPhase: (phase: 1 | 2 | 3) => {
    set((s) => {
      // Edge Case 4: Strict phase gating (cannot skip sequentially)
      if (phase === 2 && s.activeSocraticPhase < 1) return s;
      if (phase === 3 && s.activeSocraticPhase < 2) return s;
      return { activeSocraticPhase: phase };
    });
  },
}));
