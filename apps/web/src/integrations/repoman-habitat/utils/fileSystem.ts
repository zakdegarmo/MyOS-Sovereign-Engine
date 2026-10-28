import { FileNode, GraphLink, RepoData } from '../types';

// Helper to determine geometry based on file size/complexity heuristic
const calculateComplexity = (size: number, extension: string): number => {
  // Base score
  let score = 1;
  
  // Size factor (logarithmic scale)
  if (size > 0) score += Math.log2(size) / 2;

  // Type factor
  if (['ts', 'tsx', 'js', 'jsx', 'rs', 'go', 'py'].includes(extension)) score += 5;
  if (['json', 'yml', 'xml'].includes(extension)) score += 3;
  if (['md', 'txt'].includes(extension)) score += 1;

  // Cap at 20 (Dodecahedron)
  return Math.min(Math.floor(score), 20);
};

export const parseLocalDirectory = async (dirHandle: any): Promise<RepoData> => {
  const nodes: FileNode[] = [];
  const links: GraphLink[] = [];
  let nodeIdCounter = 0;

  // Create Root Node
  const rootId = 'root';
  nodes.push({
    id: rootId,
    name: dirHandle.name,
    type: 'dir',
    complexity: 20,
    path: '/',
    geometry: 'Dodecahedron'
  });

  const processHandle = async (handle: any, parentId: string, path: string) => {
    // Safety break for demo performance (prevent browser crash on massive folders)
    if (nodes.length > 2000) return;

    for await (const entry of handle.values()) {
      const uniqueId = `${path}/${entry.name}`;
      const isDir = entry.kind === 'directory';
      
      let complexity = 1;
      let extension = '';
      let content = '';

      if (!isDir) {
        // Get file info
        try {
          const file = await entry.getFile();
          extension = entry.name.split('.').pop() || '';
          complexity = calculateComplexity(file.size, extension);
          
          // For demo purposes, we aren't reading full text content of every file
          // to save memory, but we can read small ones if needed.
          content = `File size: ${file.size} bytes`;
        } catch (e) {
          console.warn("Skipping locked file", entry.name);
          continue;
        }
      } else {
        complexity = 4; // Base folder complexity
      }

      const newNode: FileNode = {
        id: uniqueId,
        name: entry.name,
        type: isDir ? 'dir' : 'file',
        complexity,
        path: uniqueId,
        language: extension,
        content: content,
        ontologyTags: isDir ? ['Container', 'Hierarchy'] : ['Data', 'Logic']
      };

      nodes.push(newNode);
      links.push({ source: parentId, target: uniqueId, value: 1 });

      if (isDir) {
        await processHandle(entry, uniqueId, uniqueId);
      }
    }
  };

  await processHandle(dirHandle, rootId, '');

  return { nodes, links };
};
