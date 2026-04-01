import axios from 'axios';

export type ContentSection = 'novels' | 'images' | 'musics';

export interface ContentFileItem {
    download_url?: string;
    name: string;
    path: string;
    sha: string;
    type: 'file' | 'dir';
}

interface ContentFileResponse {
    content: string;
    download_url?: string;
    name: string;
    path: string;
    sha: string;
}

interface GitHubSectionConfig {
    baseDir: string;
    owner: string;
    ref: string;
    repo: string;
}

interface LocalContentConfig {
    enabled: boolean;
    sections: Record<ContentSection, boolean>;
}

const LOCAL_CONTENT_PREFIX = '/__local-content';

const EMPTY_LOCAL_CONTENT_CONFIG: LocalContentConfig = {
    enabled: false,
    sections: {
        images: false,
        musics: false,
        novels: false,
    },
};

const GITHUB_SECTION_CONFIG: Record<ContentSection, GitHubSectionConfig> = {
    images: {
        baseDir: 'images',
        owner: 'TKPniaDevelopmentDepartment',
        ref: 'main',
        repo: 'TKPnia-Shit-Production-Department',
    },
    musics: {
        baseDir: 'media',
        owner: 'K0meijiSatori',
        ref: 'main',
        repo: 'my-music-page',
    },
    novels: {
        baseDir: 'novels',
        owner: 'TKPniaDevelopmentDepartment',
        ref: 'main',
        repo: 'TKPnia-Shit-Production-Department',
    },
};

const MIME_TYPES: Record<string, string> = {
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    md: 'text/markdown; charset=utf-8',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    png: 'image/png',
    wav: 'audio/wav',
    webp: 'image/webp',
};

const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json',
    },
});

let localContentConfigPromise: Promise<LocalContentConfig> | null = null;

function buildLocalContentUrl(
    endpoint: 'config' | 'file' | 'list' | 'raw',
    params?: Record<string, string>
): string {
    const url = new URL(`${LOCAL_CONTENT_PREFIX}/${endpoint}`, window.location.origin);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }

    return url.toString();
}

function isLocalContentConfig(value: unknown): value is LocalContentConfig {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const config = value as Partial<LocalContentConfig>;
    return Boolean(
        typeof config.enabled === 'boolean' &&
            config.sections &&
            typeof config.sections.images === 'boolean' &&
            typeof config.sections.musics === 'boolean' &&
            typeof config.sections.novels === 'boolean'
    );
}

async function getLocalContentConfig(): Promise<LocalContentConfig> {
    if (!localContentConfigPromise) {
        localContentConfigPromise = fetch(buildLocalContentUrl('config'), {
            headers: {
                Accept: 'application/json',
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('本地内容配置不可用');
                }

                const data: unknown = await response.json();

                if (!isLocalContentConfig(data)) {
                    throw new Error('本地内容配置格式无效');
                }

                return data;
            })
            .catch(() => EMPTY_LOCAL_CONTENT_CONFIG);
    }

    return localContentConfigPromise;
}

async function shouldUseLocalSection(section: ContentSection): Promise<boolean> {
    const config = await getLocalContentConfig();
    return config.enabled && config.sections[section];
}

function encodeRepoPath(filePath: string): string {
    return filePath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
}

function normalizePosixPath(filePath: string): string {
    const segments = filePath.replace(/\\/g, '/').split('/');
    const normalizedSegments: string[] = [];

    for (const segment of segments) {
        if (!segment || segment === '.') {
            continue;
        }

        if (segment === '..') {
            normalizedSegments.pop();
            continue;
        }

        normalizedSegments.push(segment);
    }

    return normalizedSegments.join('/');
}

function dirname(filePath: string): string {
    const normalizedPath = normalizePosixPath(filePath);
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    return lastSlashIndex === -1 ? '' : normalizedPath.slice(0, lastSlashIndex);
}

function guessMimeType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    return extension ? MIME_TYPES[extension] ?? 'application/octet-stream' : 'application/octet-stream';
}

function decodeBase64Utf8(base64Content: string): string {
    const binary = atob(base64Content);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
}

export function resolveSectionFromRepoPath(repoPath: string): ContentSection | null {
    const normalizedPath = normalizePosixPath(repoPath);

    for (const section of Object.keys(GITHUB_SECTION_CONFIG) as ContentSection[]) {
        const baseDir = GITHUB_SECTION_CONFIG[section].baseDir;

        if (normalizedPath === baseDir || normalizedPath.startsWith(`${baseDir}/`)) {
            return section;
        }
    }

    return null;
}

export function stripBaseDir(section: ContentSection, repoPath: string): string {
    const normalizedPath = normalizePosixPath(repoPath);
    const baseDir = GITHUB_SECTION_CONFIG[section].baseDir;

    if (normalizedPath === baseDir) {
        return '';
    }

    if (normalizedPath.startsWith(`${baseDir}/`)) {
        return normalizedPath.slice(baseDir.length + 1);
    }

    return normalizedPath;
}

function extractRepoPathFromKnownGitHubUrl(url: string): string | null {
    const decodedUrl = decodeURIComponent(url);

    for (const section of Object.keys(GITHUB_SECTION_CONFIG) as ContentSection[]) {
        const { baseDir, owner, ref, repo } = GITHUB_SECTION_CONFIG[section];
        const blobPrefix = `https://github.com/${owner}/${repo}/blob/${ref}/`;
        const rawPrefix = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/`;

        if (decodedUrl.startsWith(blobPrefix)) {
            return normalizePosixPath(decodedUrl.slice(blobPrefix.length));
        }

        if (decodedUrl.startsWith(rawPrefix)) {
            return normalizePosixPath(decodedUrl.slice(rawPrefix.length));
        }

        if (decodedUrl === baseDir) {
            return baseDir;
        }
    }

    return null;
}

export function resolveMarkdownAssetRepoPath(markdownPath: string, assetUrl: string): string | null {
    const trimmedUrl = assetUrl.trim();

    if (
        !trimmedUrl ||
        trimmedUrl.startsWith('#') ||
        trimmedUrl.startsWith('data:') ||
        trimmedUrl.startsWith('//')
    ) {
        return null;
    }

    const repoPathFromUrl = extractRepoPathFromKnownGitHubUrl(trimmedUrl);

    if (repoPathFromUrl) {
        return repoPathFromUrl;
    }

    if (/^https?:\/\//i.test(trimmedUrl)) {
        return null;
    }

    const joinedPath = trimmedUrl.startsWith('/')
        ? trimmedUrl.slice(1)
        : `${dirname(markdownPath)}/${trimmedUrl}`;

    return normalizePosixPath(joinedPath);
}

export async function listContentFiles(section: ContentSection): Promise<ContentFileItem[]> {
    if (await shouldUseLocalSection(section)) {
        const { data } = await axios.get<ContentFileItem[]>(
            buildLocalContentUrl('list', { section })
        );
        return data;
    }

    const { baseDir, owner, ref, repo } = GITHUB_SECTION_CONFIG[section];
    const { data } = await githubApi.get<ContentFileItem[]>(
        `/repos/${owner}/${repo}/contents/${encodeRepoPath(baseDir)}?ref=${encodeURIComponent(ref)}`
    );

    return data;
}

export async function readContentFile(
    section: ContentSection,
    filePath: string
): Promise<ContentFileResponse> {
    if (await shouldUseLocalSection(section)) {
        const { data } = await axios.get<ContentFileResponse>(
            buildLocalContentUrl('file', {
                path: filePath,
                section,
            })
        );
        return data;
    }

    const { owner, ref, repo } = GITHUB_SECTION_CONFIG[section];
    const { data } = await githubApi.get<ContentFileResponse>(
        `/repos/${owner}/${repo}/contents/${encodeRepoPath(filePath)}?ref=${encodeURIComponent(ref)}`
    );

    return data;
}

export async function readTextContent(section: ContentSection, filePath: string): Promise<string> {
    const response = await readContentFile(section, filePath);
    return decodeBase64Utf8(response.content);
}

export async function getBinaryFileUrl(
    section: ContentSection,
    filePath: string
): Promise<string> {
    if (await shouldUseLocalSection(section)) {
        return buildLocalContentUrl('raw', {
            path: filePath,
            section,
        });
    }

    const response = await readContentFile(section, filePath);
    return `data:${guessMimeType(filePath)};base64,${response.content}`;
}

export async function getDownloadUrl(
    section: ContentSection,
    file: ContentFileItem
): Promise<string> {
    if (await shouldUseLocalSection(section)) {
        return buildLocalContentUrl('raw', {
            path: file.path,
            section,
        });
    }

    if (file.download_url) {
        return file.download_url;
    }

    const response = await readContentFile(section, file.path);
    return response.download_url ?? `data:${guessMimeType(file.path)};base64,${response.content}`;
}
