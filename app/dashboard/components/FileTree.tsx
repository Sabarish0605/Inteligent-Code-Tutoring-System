"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useVFSStore, VFSNode } from "@/lib/store/vfsStore";

// ─── TreeNodeData Structure ──────────────────────────────────────────────────

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
      children: n.type === "folder" ? buildTree(nodes, n.id) : undefined,
    }));
}

// ─── Custom Icons (Modern VS Code Style) ──────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.1s ease",
        color: "#858585",
        flexShrink: 0,
      }}
    >
      <polyline points="6 12 10 8 6 4" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ marginRight: 6, flexShrink: 0 }}
    >
      <path
        d={
          open
            ? "M1.5 3.5A1.5 1.5 0 0 1 3 2h3.5l1.5 1.5H13a1.5 1.5 0 0 1 1.5 1.5v7.5A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5v-9zM3 3.5v1h10v-1H3zm0 2.5v6.5h10V6H3z"
            : "M1.5 3.5A1.5 1.5 0 0 1 3 2h3.5l1.5 1.5H13a1.5 1.5 0 0 1 1.5 1.5v7.5A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5v-9zm1.5 2V12.5h10V5.5H3z"
        }
        fill="#c4b5fd"
      />
    </svg>
  );
}

/** Precise Java "J" icon in orange/red square badge with white lettering */
function JavaIcon() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        border: "1px solid rgba(249, 115, 22, 0.4)",
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: "'Segoe UI', 'Inter', sans-serif",
        marginRight: 6,
        flexShrink: 0,
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      }}
    >
      J
    </span>
  );
}

function MarkdownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ marginRight: 6, flexShrink: 0 }}
    >
      <rect width="16" height="16" rx="2" fill="#007acc" />
      <path
        d="M3 5h1.5v2.5L6 6l1.5 1.5V5H9v6H7.5V8.5L6 9.5 4.5 8.5V11H3V5zm7 4.5h3v1.5h-3v-1.5zm0-3h3v1.5h-3V6.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function JsonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ marginRight: 6, flexShrink: 0 }}
    >
      <rect width="16" height="16" rx="2" fill="#cbcb41" />
      <path
        d="M5 4h2v1H5v2H4V5a1 1 0 0 1 1-1zm6 0h-2v1h2v2h1V5a1 1 0 0 0-1-1zm-6 8h2v-1H5V9H4v2a1 1 0 0 0 1 1zm6 0h-2v-1h2V9h1v2a1 1 0 0 1-1 1z"
        fill="#333"
      />
    </svg>
  );
}

function TypeScriptIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ marginRight: 6, flexShrink: 0 }}
    >
      <rect width="16" height="16" rx="2" fill="#007acc" />
      <text
        x="3"
        y="12"
        fill="#ffffff"
        fontSize="8"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        TS
      </text>
    </svg>
  );
}

function JavaScriptIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ marginRight: 6, flexShrink: 0 }}
    >
      <rect width="16" height="16" rx="2" fill="#f7df1e" />
      <text
        x="3"
        y="12"
        fill="#000000"
        fontSize="8"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        JS
      </text>
    </svg>
  );
}

function CssIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ marginRight: 6, flexShrink: 0 }}
    >
      <rect width="16" height="16" rx="2" fill="#264de4" />
      <text
        x="3"
        y="12"
        fill="#ffffff"
        fontSize="8"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        CS
      </text>
    </svg>
  );
}

function DefaultFileIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#a5a6c5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginRight: 6, flexShrink: 0 }}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

// ─── Toolbar Utility Icons ────────────────────────────────────────────────────

function NewFileIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function NewFolderIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "spin-animation" : ""}
    >
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function CollapseAllIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="10" y1="14" x2="3" y2="21" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#a78bfa"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ef4444"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function getFileIcon(name: string) {
  if (name.endsWith(".java")) return <JavaIcon />;
  if (name.endsWith(".md")) return <MarkdownIcon />;
  if (name.endsWith(".json")) return <JsonIcon />;
  if (name.endsWith(".ts")) return <TypeScriptIcon />;
  if (name.endsWith(".js")) return <JavaScriptIcon />;
  if (name.endsWith(".css")) return <CssIcon />;
  return <DefaultFileIcon />;
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

interface CtxMenuState {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
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

  const menuItems = [
    {
      label: "Rename",
      icon: <EditIcon />,
      action: () => {
        onRename();
        onClose();
      },
    },
    {
      label: "Delete",
      icon: <DeleteIcon />,
      danger: true,
      action: () => {
        onDelete();
        onClose();
      },
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
        fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
        fontSize: 11,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "5px 12px 6px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          color: "#636682",
          fontSize: 10,
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
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

// ─── FileTree component ───────────────────────────────────────────────────────

export default function FileTree() {
  const {
    nodes,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    moveNode,
    setActiveFile,
    activeFileId,
    focusedNodeId,
    setFocusedNodeId,
  } = useVFSStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["folder-root"])
  );
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const toggleFolder = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleStartRename = (id: string, name: string) => {
    setEditingNodeId(id);
    setEditName(name);
  };

  // Build the hierarchical tree data structure
  const treeData = buildTree(nodes);
  const editingNodeParentId = editingNodeId ? nodes.find(n => n.id === editingNodeId)?.parentId : null;

  // Recursive Tree Rendering
  const renderTree = (items: TreeNodeData[], depth: number = 0) => {
    return items.map((node, index) => {
      const isFolder = node.type === "folder";
      const isExpanded = expandedIds.has(node.id);
      const isActive = node.id === activeFileId;
      const isEditing = editingNodeId === node.id;
      const isRootNode = node.id === "folder-root";
      const isFocused = focusedNodeId === node.id;
      const isDragOver = dragOverId === node.id;
      const isEditingParent = isFolder && node.id === editingNodeParentId;

      const indent = depth * 12; // Precise 12px indentation per level

      return (
        <div key={node.id} style={{ display: "flex", flexDirection: "column" }}>
          {/* Row Component */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", node.id);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dragOverId !== node.id) {
                setDragOverId(node.id);
              }
            }}
            onDragLeave={(e) => {
              if (dragOverId === node.id) {
                setDragOverId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverId(null);
              const draggedId = e.dataTransfer.getData("text/plain");
              if (draggedId && draggedId !== node.id) {
                moveNode(draggedId, node.id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const x = Math.min(e.clientX, window.innerWidth - 170);
              const y = Math.min(e.clientY, window.innerHeight - 130);
              setCtxMenu({
                x,
                y,
                nodeId: node.id,
                nodeName: node.name,
              });
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleStartRename(node.id, node.name);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setFocusedNodeId(node.id);
              if (isFolder) {
                toggleFolder(node.id);
              } else {
                setActiveFile(node.id);
              }
            }}
            className={`tree-node-row ${isActive ? "active" : ""} ${isFocused ? "focused" : ""} ${
              isRootNode ? "root-row" : "item-row"
            }`}
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: indent + 6,
              paddingRight: 8,
              height: 24,
              cursor: "pointer",
              userSelect: "none",
              position: "relative",
              fontSize: 12,
              fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
              color: isActive || isEditingParent || isFocused ? "#ffffff" : "#a5a6c5",
              background: isDragOver
                ? "rgba(0, 229, 255, 0.15)"
                : isActive
                ? "rgba(167, 139, 250, 0.15)"
                : isEditingParent
                ? "rgba(167, 139, 250, 0.08)"
                : "transparent",
              boxShadow: isFocused && isFolder
                ? "inset 3px 0 0 0 #00e5ff, inset 0 0 0 1px rgba(0, 229, 255, 0.15)"
                : isActive
                ? "inset 2px 0 0 0 #a78bfa, inset 0 0 0 1px rgba(167, 139, 250, 0.2)"
                : isEditingParent
                ? "inset 1px 0 0 0 #a78bfa, inset 0 0 0 1px rgba(167, 139, 250, 0.15)"
                : "none",
              borderRadius: 3,
              margin: "1px 4px",
              transition: "all 0.15s ease",
            }}
          >
            {/* Indentation Guides */}
            {Array.from({ length: depth }).map((_, i) => (
              <div
                key={i}
                className="indent-guide"
                style={{
                  position: "absolute",
                  left: 14 + i * 12,
                  top: i === depth - 1 && index === 0 ? -14 : -1,
                  bottom: -1,
                  width: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.25)",
                  zIndex: 0,
                  transition: "background-color 0.15s ease",
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Chevron Zone (16px) */}
            <div
              style={{
                width: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                zIndex: 2,
              }}
            >
              {isFolder ? (
                <ChevronIcon open={isExpanded} />
              ) : (
                <div style={{ width: 8 }} />
              )}
            </div>

            {/* Icon Zone (20px) */}
            <div
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                zIndex: 2,
              }}
            >
              {isFolder ? <FolderIcon open={isExpanded} /> : getFileIcon(node.name)}
            </div>

            {/* Label Zone */}
            <div style={{ flex: 1, overflow: "hidden", minWidth: 0, display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
              {isEditing ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onFocus={(e) => {
                    const val = e.target.value;
                    const dotIndex = val.lastIndexOf(".");
                    if (dotIndex > 0) {
                      e.target.setSelectionRange(0, dotIndex);
                    } else {
                      e.target.select();
                    }
                  }}
                  onBlur={() => {
                    if (editName.trim() && editName.trim() !== node.name) {
                      renameNode(node.id, editName.trim());
                    }
                    setEditingNodeId(null);
                    if (newlyCreatedId === node.id) {
                      if (node.type === "file") setActiveFile(node.id);
                      setNewlyCreatedId(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (editName.trim() && editName.trim() !== node.name) {
                        renameNode(node.id, editName.trim());
                      }
                      setEditingNodeId(null);
                      if (newlyCreatedId === node.id) {
                        if (node.type === "file") setActiveFile(node.id);
                        setNewlyCreatedId(null);
                      }
                    } else if (e.key === "Escape") {
                      if (newlyCreatedId === node.id) {
                        deleteNode(node.id);
                        setNewlyCreatedId(null);
                      }
                      setEditingNodeId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "rgba(28, 27, 45, 0.95)",
                    border: "1px solid rgba(167, 139, 250, 0.6)",
                    borderRadius: 3,
                    padding: "0px 4px",
                    color: "#fff",
                    fontSize: 11,
                    outline: "none",
                    width: "100%",
                    height: 18,
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingLeft: 2,
                  }}
                >
                  {node.name}
                </span>
              )}
            </div>

            {/* Hover Utility Actions */}
            {!isEditing && (
              <div
                className="hover-actions-container"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: 6,
                  marginLeft: "auto",
                  paddingLeft: 6,
                  background: "transparent",
                  zIndex: 2,
                }}
              >
                <button
                  className="tree-action-btn"
                  title="Delete Permanently"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${node.name}" permanently?`)) {
                      deleteNode(node.id);
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    color: "#a5a6c5",
                  }}
                >
                  <DeleteIcon />
                </button>
              </div>
            )}
          </div>

          {/* Children block */}
          {isFolder && isExpanded && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Render actual child nodes recursively */}
              {node.children && renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Explorer Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 6px 14px",
          fontSize: 11,
          color: "#636682",
          fontWeight: "bold",
          letterSpacing: "0.05em",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a5a6c5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span>EXPLORER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            className="tree-action-btn"
            title="New File..."
            onClick={(e) => {
              e.stopPropagation();
              const newId = createFile("Untitled.java", focusedNodeId || activeFileId || null);
              if (newId) {
                setNewlyCreatedId(newId);
                setFocusedNodeId(newId);
                const newFile = useVFSStore.getState().nodes.find(n => n.id === newId);
                if (newFile?.parentId) {
                  setExpandedIds(prev => new Set(prev).add(newFile.parentId!));
                }
                handleStartRename(newId, "Untitled.java");
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              color: "#a5a6c5",
            }}
          >
            <NewFileIcon />
          </button>
          <button
            className="tree-action-btn"
            title="New Folder..."
            onClick={(e) => {
              e.stopPropagation();
              const newId = createFolder("Untitled Folder", focusedNodeId || activeFileId || null);
              if (newId) {
                setNewlyCreatedId(newId);
                setFocusedNodeId(newId);
                const newFolder = useVFSStore.getState().nodes.find(n => n.id === newId);
                if (newFolder?.parentId) {
                  setExpandedIds(prev => new Set(prev).add(newFolder.parentId!));
                }
                handleStartRename(newId, "Untitled Folder");
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              color: "#a5a6c5",
            }}
          >
            <NewFolderIcon />
          </button>
        </div>
      </div>
      <style>{`
        .tree-node-row {
          transition: background 0.12s ease, color 0.12s ease;
        }
        .tree-node-row:hover {
          background: rgba(255, 255, 255, 0.04) !important;
        }
        .tree-node-row.active {
          color: #ffffff !important;
        }
        .tree-node-row.active:hover {
          background: rgba(167, 139, 250, 0.2) !important;
        }
        .tree-node-row:hover .indent-guide {
          background-color: rgba(255, 255, 255, 0.5) !important;
        }
        .tree-node-row.active .indent-guide {
          background-color: rgba(255, 255, 255, 0.5) !important;
        }
        .tree-node-row.focused .indent-guide {
          background-color: rgba(255, 255, 255, 0.5) !important;
        }
        .tree-node-row:hover .hover-actions-container {
          display: flex !important;
        }
        .tree-action-btn {
          opacity: 0.65;
          transition: opacity 0.15s ease, color 0.15s ease;
        }
        .tree-action-btn:hover {
          opacity: 1 !important;
          color: #a78bfa !important;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      {/* Tree container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 0px",
          scrollbarWidth: "thin",
          boxShadow: focusedNodeId === null ? "inset 0 0 0 1px rgba(0, 229, 255, 0.3)" : "none",
          transition: "box-shadow 0.15s ease, background 0.15s ease",
          background: dragOverId === "root-container" ? "rgba(0, 229, 255, 0.05)" : "transparent",
        }}
        onClick={() => {
          setActiveFile(null);
          setEditingNodeId(null);
          setFocusedNodeId(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragOverId !== "root-container") {
            setDragOverId("root-container");
          }
        }}
        onDragLeave={() => {
          if (dragOverId === "root-container") setDragOverId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverId(null);
          const draggedId = e.dataTransfer.getData("text/plain");
          if (draggedId) {
            moveNode(draggedId, null);
          }
        }}
      >
        {renderTree(treeData, 0)}
      </div>

      {/* Context Menu Portal */}
      {ctxMenu && (
        <ContextMenu
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onRename={() => handleStartRename(ctxMenu.nodeId, ctxMenu.nodeName)}
          onDelete={() => {
            if (confirm(`Delete "${ctxMenu.nodeName}"?`)) {
              deleteNode(ctxMenu.nodeId);
            }
          }}
        />
      )}
    </div>
  );
}
