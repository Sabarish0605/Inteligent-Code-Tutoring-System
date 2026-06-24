import { useVFSStore } from "@/lib/store/vfsStore";

export function runVfsAntiGravityTest() {
  console.log("=== STARTING VFS ANTI-GRAVITY STRESS TEST ===");
  const store = useVFSStore.getState();

  // Backup original nodes
  const originalNodes = [...store.nodes];

  try {
    // ---------------------------------------------------------
    // TEST SEQUENCE 1: MULTI-LANGUAGE EXTENSION FACTORY ASSERTION
    // ---------------------------------------------------------
    console.log("Running Sequence 1: Extension-Conditional Defaults...");
    
    // Test .md
    const id1 = store.createFile("Untitled", null);
    store.renameNode(id1, "doc.md");
    const node1 = useVFSStore.getState().nodes.find(n => n.id === id1);
    if (node1?.content !== "") throw new Error("Sequence 1 Failed: .md content is not empty.");

    // Test .json
    const id2 = store.createFile("Untitled", null);
    store.renameNode(id2, "config.json");
    const node2 = useVFSStore.getState().nodes.find(n => n.id === id2);
    if (node2?.content !== "") throw new Error("Sequence 1 Failed: .json content is not empty.");

    // Test .java
    const id3 = store.createFile("Untitled", null);
    store.renameNode(id3, "Main.java");
    const node3 = useVFSStore.getState().nodes.find(n => n.id === id3);
    if (!node3?.content.includes("public class Main")) {
      throw new Error("Sequence 1 Failed: .java content missing public class Main boilerplate.");
    }

    console.log("✅ Sequence 1 Passed");

    // ---------------------------------------------------------
    // TEST SEQUENCE 2: FILE-ON-FILE DROP AND RELATIVE RE-INDEXING
    // ---------------------------------------------------------
    console.log("Running Sequence 2: File-on-File Drop (Anti-Gravity)...");
    
    // Clear and mock flat array state
    useVFSStore.setState({
      nodes: [
        { id: 'f1', name: 'A.java', type: 'file', parentId: null, content: "" },
        { id: 'f2', name: 'B.java', type: 'file', parentId: null, content: "" }
      ]
    });
    
    useVFSStore.getState().moveNode('f1', 'f2');
    
    const currentNodesSeq2 = useVFSStore.getState().nodes;
    const f1 = currentNodesSeq2.find(n => n.id === 'f1');
    const f2 = currentNodesSeq2.find(n => n.id === 'f2');
    
    if (f1?.parentId !== null) throw new Error("Sequence 2 Failed: f1 nested instead of sibling.");
    
    // Check array order: f1 should be directly after f2
    const f1Idx = currentNodesSeq2.findIndex(n => n.id === 'f1');
    const f2Idx = currentNodesSeq2.findIndex(n => n.id === 'f2');
    if (f1Idx !== f2Idx + 1) {
      throw new Error(`Sequence 2 Failed: Splice array order incorrect. f2: ${f2Idx}, f1: ${f1Idx}`);
    }
    
    console.log("✅ Sequence 2 Passed");

    // ---------------------------------------------------------
    // TEST SEQUENCE 3: EXTENSION-SAFE STRING SANITIZATION BOUNDARIES
    // ---------------------------------------------------------
    console.log("Running Sequence 3: String Sanitization Boundaries...");
    
    useVFSStore.setState({
      nodes: [
        { id: 'dirty_file', name: 'OldClass.java', type: 'file', parentId: null, content: "public class OldClass {\n}" }
      ]
    });
    
    useVFSStore.getState().renameNode('dirty_file', "  My new class (3) .java  ");
    const sanitizedNode = useVFSStore.getState().nodes.find(n => n.id === 'dirty_file');
    
    if (sanitizedNode?.name !== "My_new_class__3_.java") {
      throw new Error(`Sequence 3 Failed: Invalid sanitized name: '${sanitizedNode?.name}'`);
    }
    
    const expectedRegexHit = "public class My_new_class__3_";
    if (!sanitizedNode.content.includes(expectedRegexHit)) {
      throw new Error(`Sequence 3 Failed: Regex failed to update text buffer cleanly. Expected to find '${expectedRegexHit}'`);
    }
    
    console.log("✅ Sequence 3 Passed");

    // ---------------------------------------------------------
    // TEST SEQUENCE 4: ANTI-LOOP TRAP DISASTER RECOVERY
    // ---------------------------------------------------------
    console.log("Running Sequence 4: Anti-Loop Trap Disaster Recovery...");
    
    useVFSStore.setState({
      nodes: [
        { id: 'folder-A', name: 'A', type: 'folder', parentId: null, content: "" },
        { id: 'folder-B', name: 'B', type: 'folder', parentId: 'folder-A', content: "" },
        { id: 'folder-C', name: 'C', type: 'folder', parentId: 'folder-B', content: "" }
      ]
    });
    
    // Attempt illegal move
    useVFSStore.getState().moveNode('folder-A', 'folder-C');
    
    const currentNodesSeq4 = useVFSStore.getState().nodes;
    const aNode = currentNodesSeq4.find(n => n.id === 'folder-A');
    if (aNode?.parentId === 'folder-C') {
      throw new Error("Sequence 4 Failed: Anti-Loop check bypassed, circular dependency created!");
    }
    
    console.log("✅ Sequence 4 Passed");

    console.log("🎉 ALL VFS ANTI-GRAVITY TESTS PASSED SUCCESSFULLY! 🎉");

  } catch (error: any) {
    console.error("❌ VFS STRESS TEST FAILED:", error.message);
  } finally {
    // Restore original state
    useVFSStore.setState({ nodes: originalNodes });
    console.log("State restored.");
  }
}
