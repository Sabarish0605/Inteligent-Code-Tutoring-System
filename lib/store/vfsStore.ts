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
  openFileIds: string[];
  isDirty: boolean;
  autoSaveEnabled: boolean;

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
  setActiveFile: (id: string) => void;
  closeFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  loadNodes: (nodes: VFSNode[]) => void;
  markClean: () => void;
  toggleAutoSave: () => void;
}

// ─── Default VFS ──────────────────────────────────────────────────────────────

const DEFAULT_NODES: VFSNode[] = [
  {
    id: "folder-root",
    name: "spell-java-lab",
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

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVFSStore = create<VFSStore>((set, get) => ({
  nodes: DEFAULT_NODES,
  activeFileId: "file-main",
  openFileIds: ["file-main", "file-utils", "file-readme"],
  isDirty: false,
  autoSaveEnabled: true,

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

    // Auto-generate class-matched boilerplate for Java files
    let content = "";
    if (finalName.endsWith(".java")) {
      let className = finalName.replace(/\.java$/, "");
      // Sanitize filename to form a valid Java class name identifier
      className = className.replace(/[^a-zA-Z0-9_]/g, "_");
      if (/^[0-9]/.test(className)) {
        className = "_" + className;
      }
      content = `public class ${className} {\n    public static void main(String[] args) {\n        System.out.println("Hello from ${className}!");\n    }\n}\n`;
    }

    const node: VFSNode = { id, name: finalName, type: "file", parentId, content };
    set((s) => ({
      nodes: [...s.nodes, node],
      openFileIds: [...s.openFileIds, id],
      activeFileId: id,
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
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.includes("/") || trimmed.includes("\\")) return;

    set((s) => {
      const target = s.nodes.find((n) => n.id === id);
      if (!target) return s;

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
        // Sync public class name when renaming a .java file
        if (n.name.endsWith(".java") && trimmed.endsWith(".java")) {
          const oldClass = n.name.replace(/\.java$/, "");
          const newClass = trimmed.replace(/\.java$/, "");
          content = content.replace(
            new RegExp(`\\bpublic\\s+class\\s+${oldClass}\\b`, "g"),
            `public class ${newClass}`
          );
        }
        return { ...n, name: trimmed, content };
      });
      return { nodes: updatedNodes, isDirty: true };
    });
  },

  moveNode: (draggedId, targetParentId) => {
    set((s) => {
      let newParentId = targetParentId;
      if (newParentId === "root" || newParentId === "folder-root") {
        newParentId = null;
      }

      // Prevent moving a node into itself
      if (draggedId === newParentId) return s;

      // If the target parent is a file, redirect placement to inherit the file's parentId (sibling placement)
      if (newParentId) {
        const parentNode = s.nodes.find((n) => n.id === newParentId);
        if (!parentNode || parentNode.type === "file") {
          newParentId = parentNode ? parentNode.parentId : null;
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

      const updatedNodes = s.nodes.map((n) => {
        if (n.id === draggedId) {
          return { ...n, parentId: newParentId };
        }
        return n;
      });
      return { nodes: updatedNodes, isDirty: true };
    });
  },

  setActiveFile: (id) => {
    set((s) => {
      const openFileIds = s.openFileIds.includes(id)
        ? s.openFileIds
        : [...s.openFileIds, id];
      return { activeFileId: id, openFileIds };
    });
  },

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
}));
