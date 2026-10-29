import { FileSystemNode } from './types';

export class LibrarianService {

    /**
     * Parsing logic extracted from 3D-FileExplorer (FileSlayerMap5).
     * Converts a flat list of files (from webkitdirectory input) into a hierarchical tree.
     */
    static processInputData(inputData: FileList | File[], isDirectoryInput: boolean = true): FileSystemNode | null {
        // Convert FileList to Array if necessary
        const fileList: File[] = inputData instanceof FileList ? Array.from(inputData) : inputData;

        if (fileList.length === 0) return null;

        const getPathParts = (path: string) => path.split(/[\/\\]/).filter(Boolean);
        const getBaseName = (fullPath: string) => {
            const parts = getPathParts(fullPath);
            return parts.length > 0 ? parts[parts.length - 1] : fullPath;
        };

        const rootPath = isDirectoryInput ? getPathParts(fileList[0].webkitRelativePath)[0] : fileList[0].name;

        const rootNode: FileSystemNode = {
            path: rootPath,
            name: getBaseName(rootPath),
            type: 'dir',
            children: [],
            total_size_bytes: 0,
            file_count: 0,
            depth_level: 0,
            files: []
        };

        const allNodes = new Map<string, FileSystemNode>();
        allNodes.set(rootPath, rootNode);

        for (const file of fileList) {
            const path = isDirectoryInput ? file.webkitRelativePath : file.name;
            const parts = getPathParts(path);
            let currentDirNode = rootNode;

            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                const currentPath = parts.slice(0, i + 1).join('/');

                if (i < parts.length - 1) { // It's a directory
                    let dirNode = allNodes.get(currentPath);
                    if (!dirNode) {
                        dirNode = {
                            path: currentPath,
                            name: part,
                            type: 'dir',
                            children: [],
                            total_size_bytes: 0,
                            file_count: 0,
                            depth_level: i,
                            files: []
                        };
                        currentDirNode.children!.push(dirNode);
                        allNodes.set(currentPath, dirNode);
                    }
                    currentDirNode = dirNode;
                } else { // It's a file
                    const fileEntry: FileSystemNode = {
                        path: path,
                        name: part,
                        type: 'file',
                        extension: path.includes('.') ? path.substring(path.lastIndexOf('.') + 1) : '',
                        size_bytes: file.size,
                        depth_level: i,
                        originalFileObject: file
                    };
                    currentDirNode.files!.push(fileEntry);
                    allNodes.set(path, fileEntry);
                }
            }
        }

        // Calculate sizes and file counts recursively
        this.calculateDirectoryStats(rootNode);
        this.sortChildren(rootNode);

        return rootNode;
    }

    private static calculateDirectoryStats(node: FileSystemNode) {
        if (!node.files) node.files = [];
        if (!node.children) node.children = [];

        node.total_size_bytes = node.files.reduce((sum, file) => sum + (file.size_bytes || 0), 0);
        node.file_count = node.files.length;

        node.children.forEach(child => {
            this.calculateDirectoryStats(child);
            node.total_size_bytes! += child.total_size_bytes || 0;
            node.file_count! += child.file_count || 0;
        });
    }

    private static sortChildren(node: FileSystemNode) {
        if (!node.children) return;
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        node.children.forEach(child => {
            if (child.type === 'dir') this.sortChildren(child);
        });
    }
}
