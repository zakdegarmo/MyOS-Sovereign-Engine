
// Native Fetch Implementation

const BASE_URL = "https://api.github.com";

export interface GitHubConfig {
    owner: string;
    repo: string;
    token?: string;
}

export interface GitHubIssue {
    number: number;
    title: string;
    html_url: string;
    state: string;
    user: { login: string; avatar_url: string };
    created_at: string;
}

export interface GitHubRepo {
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    html_url: string;
    full_name: string;
    description: string;
    default_branch: string;
}

// Simple Cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 1000;

export const getGitHubData = async (config: GitHubConfig) => {
    const { owner, repo, token } = config;
    if (!owner || !repo) throw new Error("Missing Owner/Repo");

    const cacheKey = `${owner}/${repo}`;
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
    }

    const headers: any = { "Accept": "application/vnd.github.v3+json" };
    if (token) headers["Authorization"] = `token ${token}`;

    try {
        const [repoRes, issuesRes] = await Promise.all([
            fetch(`${BASE_URL}/repos/${owner}/${repo}`, { headers }),
            fetch(`${BASE_URL}/repos/${owner}/${repo}/issues?per_page=5&state=open`, { headers })
        ]);

        if (!repoRes.ok) throw new Error(`Repo Error: ${repoRes.statusText}`);
        // Issues might fail if disabled, ignore strict error for issues?

        const details: GitHubRepo = await repoRes.json();
        const issues: GitHubIssue[] = await issuesRes.json();

        const data = { details, issues };
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;

    } catch (error: any) {
        console.error("GitHub Fetch Error", error);
        throw error;
    }
};

export const createIssue = async (config: GitHubConfig, title: string, body: string) => {
    const { owner, repo, token } = config;
    if (!token) throw new Error("Token required");

    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/issues`, {
        method: "POST",
        headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, body })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create issue");
    }

    cache.delete(`${owner}/${repo}`);
    return await response.json();
};

export const downloadRepo = async (config: GitHubConfig, onProgress?: (msg: string) => void) => {
    const { owner, repo, token } = config;
    const headers: any = { "Accept": "application/vnd.github.v3+json" };
    if (token) headers["Authorization"] = `token ${token}`;

    // 1. Get Default Branch SHA
    onProgress?.("Resolving Branch...");
    const repoRes = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) throw new Error("Repo not found");
    const repoData: GitHubRepo = await repoRes.json();
    const branch = repoData.default_branch;

    // 2. Get Tree (Recursive)
    onProgress?.(`Fetching Tree (${branch})...`);
    const treeRes = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
    if (!treeRes.ok) throw new Error("Failed to fetch tree");
    const treeData = await treeRes.json();

    // 3. Filter Blobs (Files) and Fetch Content
    // Note: GitHub Get Blob API has rate limits. 
    // Optimization: Git Tree API returns 'url' for blobs.
    // If files are small, we can fetch them. Large repos will hit rate limits.
    // Limit to 50 files for safety in this demo? Or try all?
    // Let's rely on raw.githubusercontent.com for content if public? 
    // But for private we need API.

    // We will use the 'content' API for each file.

    const files = (treeData.tree as any[]).filter(node => node.type === 'blob');
    const results: { path: string, content: string }[] = [];

    onProgress?.(`Downloading ${files.length} files...`);

    // Batch process to avoid flooding
    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (file) => {
            try {
                // Fetch Content (Raw if possible or API)
                // Use API for authenticated private repos support
                const contentRes = await fetch(file.url, { headers }); // Blob API
                const blobData = await contentRes.json();

                // Content is base64 encoded usually
                const content = atob(blobData.content.replace(/\n/g, ''));
                results.push({ path: file.path, content });
            } catch (e) {
                console.warn("Failed to download", file.path);
            }
        }));
        onProgress?.(`Downloaded ${Math.min(i + BATCH_SIZE, files.length)} / ${files.length}`);
    }

    return results;
};
