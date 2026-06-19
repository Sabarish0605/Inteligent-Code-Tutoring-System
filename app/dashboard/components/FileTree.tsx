"use client";

import { Tree, NodeApi, TreeApi } from "react-arborist";
import { useRef, useEffect, useState, useCallback } from "react";
import { useVFSStore, VFSNode } from "@/lib/store/vfsStore";

// ─── Tree data format expected by react-arborist ──────────────────────────────

interface TreeNodeData {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: TreeNodeData[];
}

function buildTree(
  nodes: VFSNode[],
  parentId: string | null = null
): TreeNodeData[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => {
      // folders first, then alphabetical
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      // folders get children array (even if empty); files get undefined
      children: n.type === "folder" ? buildTree(nodes, n.id) : undefined,
    }));
}

// ─── SVG Icons matching VS Code / Antigravity ──────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.15s ease",
        color: "#636682",
        marginRight: 4,
        flexShrink: 0,
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={open ? "rgba(196,181,253,0.15)" : "none"}
      stroke="#c4b5fd"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}
    >
      {open ? (
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2zM2 10h20" />
      ) : (
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      )}
    </svg>
  );
}

/** .java — coffee-cup silhouette, orange */
function JavaIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

/** .md — document with M badge, blue */
function MarkdownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <polyline points="7 15 10 12 7 9" />
      <line x1="12" y1="15" x2="17" y2="15" />
    </svg>
  );
}

/** .json — curly-braces icon, purple */
function JsonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}>
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
      <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

/** .ts — TypeScript, cyan */
function TypeScriptIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}>
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <path d="M11 12h4" /><path d="M13 10v4" />
      <path d="M7 14a2 2 0 1 0 4 0v-4H7" />
    </svg>
  );
}

/** .js — JavaScript, amber */
function JavaScriptIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}>
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <path d="M15 10v5a2 2 0 0 1-4 0" />
      <path d="M9 10v1a2 2 0 0 0 2 2" />
    </svg>
  );
}

/** .css — paintbrush, pink */
function CssIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L4.22 13.44a2 2 0 0 0 0 2.83l3.51 3.51a2 2 0 0 0 2.83 0l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
      <line x1="18" y1="11.5" x2="11.5" y2="18"/>
    </svg>
  );
}

/** Default file icon, gray */
function DefaultFileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#a5a6c5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function getFileIcon(name: string) {
  if (name.endsWith(".java"))  return <JavaIcon />;
  if (name.endsWith(".md"))    return <MarkdownIcon />;
  if (name.endsWith(".json"))  return <JsonIcon />;
  if (name.endsWith(".ts"))    return <TypeScriptIcon />;
  if (name.endsWith(".js"))    return <JavaScriptIcon />;
  if (name.endsWith(".css"))   return <CssIcon />;
  return <DefaultFileIcon />;
}


// ─── Context Menu ─────────────────────────────────────────────────────────────

interface CtxMenuState {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
  nodeApi: NodeApi<TreeNodeData>;
}

function ContextMenu({
  menu,
  onClose,
  onRename,
  onDelete,
}: {
  menu: CtxMenuState;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  const menuItems: { label: string; icon: React.ReactNode; danger?: boolean; action: () => void }[] = [
    {
      label: "Rename",
      icon: <EditIcon />,
      action: () => { onRename(); onClose(); },
    },
    {
      label: "Delete",
      icon: <DeleteIcon />,
      danger: true,
      action: () => { onDelete(); onClose(); },
    },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: menu.y,
        left: menu.x,
        zIndex: 9999,
        background: "rgba(18, 17, 30, 0.97)",
        border: "1px solid rgba(167, 139, 250, 0.25)",
        borderRadius: 6,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.08)",
        backdropFilter: "blur(20px)",
        minWidth: 160,
        padding: "4px 0",
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        fontSize: 11,
        overflow: "hidden",
      }}
    >
      {/* Header — file name */}
      <div style={{
        padding: "5px 12px 6px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#636682",
        fontSize: 10,
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {menu.nodeName}
      </div>

      {menuItems.map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            color: item.danger ? "#ef4444" : "#c4c4e0",
            fontSize: 11,
            fontFamily: "inherit",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.1s, color 0.1s",
            letterSpacing: "0.03em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = item.danger
              ? "rgba(239,68,68,0.12)"
              : "rgba(167,139,250,0.12)";
            e.currentTarget.style.color = item.danger ? "#f87171" : "#e2e2f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = item.danger ? "#ef4444" : "#c4c4e0";
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Node renderer ────────────────────────────────────────────────────────────

interface NodeProps {
  node: NodeApi<TreeNodeData>;
  style: React.CSSProperties;
  dragHandle?: (el: HTMLDivElement | null) => void;
  onNodeContextMenu: (e: React.MouseEvent, node: NodeApi<TreeNodeData>) => void;
}

function Node({
  node,
  style,
  dragHandle,
  onNodeContextMenu,
}: NodeProps) {
  const { activeFileId, setActiveFile, deleteNode } = useVFSStore();
  const isActive = node.id === activeFileId;
  const isFolder = node.data.type === "folder";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={dragHandle}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: 2,
        paddingLeft: `${8 + node.level * 14}px`,
        paddingRight: 8,
        height: 26,
        cursor: "pointer",
        fontSize: 11,
        color: isActive ? "#ffffff" : isFolder ? "#c4b5fd" : "#a5a6c5",
        background: isActive
          ? "rgba(167, 139, 250, 0.18)"
          : node.isSelected && !isActive
          ? "rgba(167, 139, 250, 0.07)"
          : "transparent",
        borderLeft: isActive
          ? "2px solid #a78bfa"
          : "2px solid transparent",
        borderRadius: "0 4px 4px 0",
        marginRight: 6,
        userSelect: "none",
        transition: "background 0.12s, color 0.12s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background =
            "rgba(167,139,250,0.08)";
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
      onClick={() => {
        if (isFolder) {
          node.toggle();
        } else {
          node.select();
          setActiveFile(node.id);
        }
      }}
      onDoubleClick={() => node.edit()}
      onContextMenu={(e) => onNodeContextMenu(e, node)}
    >
      {/* Chevron for folders */}
      {isFolder && <ChevronIcon open={node.isOpen} />}

      {/* Icon */}
      <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        {isFolder ? (
          <FolderIcon open={node.isOpen} />
        ) : (
          getFileIcon(node.data.name)
        )}
      </span>

      {/* Name / inline rename input */}
      {node.isEditing ? (
        <input
          autoFocus
          defaultValue={node.data.name}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => node.submit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") node.submit(e.currentTarget.value);
            if (e.key === "Escape") node.reset();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            background: "rgba(28, 27, 45, 0.95)",
            border: "1px solid rgba(167, 139, 250, 0.6)",
            borderRadius: 3,
            padding: "1px 5px",
            color: "#fff",
            fontSize: 11,
            outline: "none",
            fontFamily: "inherit",
            minWidth: 0,
            boxShadow: "0 0 0 2px rgba(167,139,250,0.15)",
          }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: "26px",
          }}
        >
          {node.data.name}
        </span>
      )}

      {/* Hover action buttons */}
      {isHovered && !node.isEditing && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          <button
            title="Rename (or double-click)"
            onClick={(e) => { e.stopPropagation(); node.edit(); }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(167, 139, 250, 0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <EditIcon />
          </button>
          <button
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${node.data.name}"?`)) deleteNode(node.id);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <DeleteIcon />
          </button>
        </div>
      )}
    </div>
  );
}


// ─── Toolbar button style ─────────────────────────────────────────────────────

const btnStyle: React.CSSProperties = {
  padding: "3px 9px",
  background: "rgba(167, 139, 250, 0.06)",
  border: "1px solid rgba(167, 139, 250, 0.22)",
  borderRadius: 4,
  color: "#a78bfa",
  fontSize: 10,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.04em",
  transition: "background 0.15s",
};

// ─── FileTree component ───────────────────────────────────────────────────────

export default function FileTree() {
  const { nodes, createFile, createFolder, deleteNode, renameNode, moveNode, setActiveFile, autoSaveEnabled, toggleAutoSave } =
    useVFSStore();

  // react-arborist needs a fixed height for its virtual list
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<TreeApi<TreeNodeData>>(null);
  const [treeHeight, setTreeHeight] = useState(400);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setTreeHeight(el.clientHeight));
    obs.observe(el);
    setTreeHeight(el.clientHeight);
    return () => obs.disconnect();
  }, []);

  const treeData = buildTree(nodes);

  // ── react-arborist callbacks ─────────────────────────────────────────────

  const handleCreate = useCallback(
    ({
      parentId,
      type,
    }: {
      parentId: string | null;
      index: number;
      type: string;
    }) => {
      const currentSelectedId = useVFSStore.getState().activeFileId;
      if (type === "leaf") {
        const proposedName = "NewFile.java";
        const id = createFile(proposedName, currentSelectedId);
        setActiveFile(id);
        const createdNode = useVFSStore.getState().nodes.find((n) => n.id === id);
        return { id, name: createdNode ? createdNode.name : proposedName };
      } else {
        const proposedName = "NewFolder";
        const id = createFolder(proposedName, currentSelectedId);
        const createdNode = useVFSStore.getState().nodes.find((n) => n.id === id);
        return { id, name: createdNode ? createdNode.name : proposedName };
      }
    },
    [createFile, createFolder, setActiveFile]
  );

  const handleRename = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      renameNode(id, name);
    },
    [renameNode]
  );

  const handleDelete = useCallback(
    ({ ids }: { ids: string[] }) => {
      ids.forEach((id) => deleteNode(id));
    },
    [deleteNode]
  );

  const handleMove = useCallback(
    ({ dragIds, parentId }: { dragIds: string[]; parentId: string | null }) => {
      dragIds.forEach((id) => moveNode(id, parentId));
    },
    [moveNode]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          background: "rgba(22,21,33,0.95)",
          zIndex: 10,
        }}
      >
        <button
          style={btnStyle}
          title="New File"
          onClick={() => treeRef.current?.create({ type: "leaf" })}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(167,139,250,0.14)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(167,139,250,0.06)")
          }
        >
          + File
        </button>
        <button
          style={btnStyle}
          title="New Folder"
          onClick={() => treeRef.current?.create({ type: "branch" })}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(167,139,250,0.14)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(167,139,250,0.06)")
          }
        >
          + Folder
        </button>
        <button
          style={btnStyle}
          title="Toggle Auto Save"
          onClick={() => useVFSStore.getState().toggleAutoSave()}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(167,139,250,0.14)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(167,139,250,0.06)")
          }
        >
          {autoSaveEnabled ? "Auto Save: ON" : "Auto Save: OFF"}
        </button>
      </div>

      {/* Tree container ── fills remaining space */}
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden" }}>
        <Tree<TreeNodeData>
          ref={treeRef}
          data={treeData}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
          onMove={handleMove}
          width={240}
          height={treeHeight || 400}
          indent={0}
          rowHeight={26}
          padding={4}
        >
          {(props) => (
            <Node
              {...props}
              onNodeContextMenu={(e, node) => {
                e.preventDefault();
                e.stopPropagation();
                const x = Math.min(e.clientX, window.innerWidth - 170);
                const y = Math.min(e.clientY, window.innerHeight - 130);
                setCtxMenu({
                  x,
                  y,
                  nodeId: node.id,
                  nodeName: node.data.name,
                  nodeApi: node,
                });
              }}
            />
          )}
        </Tree>
      </div>

      {/* Context menu portal ── rendered at root level of FileTree to escape virtual rows styling/clip */}
      {ctxMenu && (
        <ContextMenu
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onRename={() => ctxMenu.nodeApi.edit()}
          onDelete={() => {
            if (confirm(`Delete "${ctxMenu.nodeName}"?`)) deleteNode(ctxMenu.nodeId);
          }}
        />
      )}
    </div>
  );
}
