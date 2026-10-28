import type { LibraryNode, Book } from '@Omni/types';

/**
 * Inserts a book into the library tree based on its DDC path.
 */
export function insertBook(root: LibraryNode, book: Book): LibraryNode {
    const newRoot = JSON.parse(JSON.stringify(root)); // Deep clone
    let currentNode = newRoot;

    // AI returns a path like [{number: "600", name: "Technology"}, {number: "670", name: "Manufacturing"}]
    for (const ddcStep of book.ddc.path) {
        const stepKey = ddcStep.number;

        if (!currentNode.children[stepKey]) {
            currentNode.children[stepKey] = {
                id: stepKey,
                name: ddcStep.name,
                children: {},
                books: []
            };
        }
        currentNode = currentNode.children[stepKey];
    }

    // Place the book in the final node
    if (!currentNode.books.find((b: Book) => b.id === book.id)) {
        currentNode.books.push(book);
    }

    return newRoot;
}

export function getAllBooks(node: LibraryNode | null): Book[] {
    if (!node) return [];
    let books: Book[] = [...(node.books || [])];
    for (const key in node.children) {
        books = books.concat(getAllBooks(node.children[key]));
    }
    return books;
}

export function searchLibrary(node: LibraryNode, query: string): Book[] {
    const all = getAllBooks(node);
    const lowerQ = query.toLowerCase();
    return all.filter(b =>
        b.title.toLowerCase().includes(lowerQ) ||
        b.keywords.some(k => k.toLowerCase().includes(lowerQ)) ||
        b.callNumber.includes(query)
    );
}
