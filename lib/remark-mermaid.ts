export function remarkMermaid() {
  return (tree: any) => {
    const walk = (node: any) => {
      if (!node) return;
      
      if (node.type === "code" && node.lang === "mermaid") {
        node.type = "mdxJsxFlowElement";
        node.name = "MermaidChart";
        node.attributes = [
          {
            type: "mdxJsxAttribute",
            name: "code",
            value: node.value,
          },
        ];
        node.children = [];
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(walk);
      }
    };
    
    walk(tree);
  };
}
