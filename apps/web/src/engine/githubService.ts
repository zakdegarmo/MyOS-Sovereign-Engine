
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
            fetch(`${BASE_URL}/repos/${owner}/${repo}/issues?per_page=10&state=open`, { headers })
        ]);

        if (!repoRes.ok) throw new Error(`Repo Connection Error: ${repoRes.statusText}`);

        const details: GitHubRepo = await repoRes.json();
        const issues: GitHubIssue[] = await issuesRes.json();

        const data = { details, issues };
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;

    } catch (error: any) {
        console.error("GitHub Substrate Leak:", error);
        throw error;
    }
};

export const createIssue = async (config: GitHubConfig, title: string, body: string) => {
    const { owner, repo, token } = config;
    if (!token) throw new Error("Credential Token required for Write-Access");

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
        throw new Error(err.message || "Substrate Write Denied");
    }

    cache.delete(`${owner}/${repo}`);
    return await response.json();
};

export const downloadRepo = async (config: GitHubConfig, onProgress?: (msg: string) => void) => {
    const { owner, repo, token } = config;
    const headers: any = { "Accept": "application/vnd.github.v3+json" };
    if (token) headers["Authorization"] = `token ${token}`;

    onProgress?.("DECRYPTION_IN_PROGRESS: BRANCH_RESOLVE");
    const repoRes = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) throw new Error("TARGET_SUBSTRATE_NOT_FOUND");
    const repoData: GitHubRepo = await repoRes.json();
    const branch = repoData.default_branch;

    onProgress?.(`DECRYPTION_IN_PROGRESS: TREE_FETCH (${branch})`);
    const treeRes = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
    if (!treeRes.ok) throw new Error("TREE_TRAVERSAL_FAILED");
    const treeData = await treeRes.json();

    const files = (treeData.tree as any[]).filter(node => node.type === 'blob');
    const results: { path: string, content: string }[] = [];

    onProgress?.(`EXTRACTION_SEQUENCE: ${files.length} NODES`);

    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (file) => {
            try {
                const contentRes = await fetch(file.url, { headers });
                const blobData = await contentRes.json();
                const content = atob(blobData.content.replace(/\n/g, ''));
                results.push({ path: file.path, content });
            } catch (e) {
                console.warn("NODE_LEAK:", file.path);
            }
        }));
        onProgress?.(`EXTRACTION_STATUS: ${Math.min(i + BATCH_SIZE, files.length)} / ${files.length} SEGMENTS`);
        
        if (i > 100) {
           onProgress?.("CRITICAL: ABORTING EXCESSIVE EXTRACTION (RATE_LIMIT_GUARD)");
           break;
        }
    }

    return results;
};
