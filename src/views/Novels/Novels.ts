import { defineComponent, onMounted, ref, shallowRef } from "vue";
import { marked } from "marked";
import InlineMusicPlayer from "../../components/InlinePlayer/InlinePlayer.vue";
import type { ContentFileItem } from "../../services/contentSource";
import {
    getBinaryFileUrl,
    getDownloadUrl,
    readTextContent,
    listContentFiles,
    resolveMarkdownAssetRepoPath,
    resolveSectionFromRepoPath,
    stripBaseDir,
} from "../../services/contentSource";

interface MusicMarker {
    filename: string;
    placeholder: string;
    url: string;
}

interface MarkdownContent {
    content: string;
    title: string;
    musicMarkers: MusicMarker[];
}

interface ChapterGroup {
    title: string;
    chapters: ContentFileItem[];
    isExpanded: boolean;
}

// 智能排序函数
function naturalSort(a: string, b: string): number {
    const aIsMain = a.includes('主线');
    const bIsMain = b.includes('主线');

    if (aIsMain && !bIsMain) {
        return -1;
    }

    if (!aIsMain && bIsMain) {
        return 1;
    }

    const splitA = a.split(/(\d+)/);
    const splitB = b.split(/(\d+)/);

    for (let i = 0; i < Math.min(splitA.length, splitB.length); i++) {
        const aPart = splitA[i];
        const bPart = splitB[i];

        if (i % 2 === 0) {
            const comparison = aPart.localeCompare(bPart, 'zh-CN');
            if (comparison !== 0) {
                return comparison;
            }
        } else {
            const numA = parseInt(aPart);
            const numB = parseInt(bPart);
            if (numA !== numB) {
                return numA - numB;
            }
        }
    }

    return splitA.length - splitB.length;
}

const contentCache = new Map<string, MarkdownContent>();

function organizeFilesIntoGroups(files: ContentFileItem[]): ChapterGroup[] {
    const groups: Record<string, ContentFileItem[]> = {};

    files.forEach((file) => {
        const name = file.name.replace('.md', '');
        const match = name.match(/^([^-]+)(?:-(.+))?$/);
        const groupName = match ? match[1].trim() : '其他';

        if (!groups[groupName]) {
            groups[groupName] = [];
        }

        groups[groupName].push(file);
    });

    return Object.entries(groups)
        .map(([title, chapters]) => ({
            chapters: chapters.sort((a, b) => naturalSort(a.name, b.name)),
            isExpanded: false,
            title,
        }))
        .sort((a, b) => {
            if (a.title === '主线') {
                return -1;
            }

            if (b.title === '主线') {
                return 1;
            }

            return a.title.localeCompare(b.title, 'zh-CN');
        });
}

async function replaceMarkdownImageUrls(html: string, markdownPath: string): Promise<string> {
    const imgRegex = /<img\b[^>]*src="([^"]*)"[^>]*>/g;
    const imgUrls = Array.from(html.matchAll(imgRegex), (match) => match[1]);

    if (imgUrls.length === 0) {
        return html;
    }

    const replacements = await Promise.all(
        imgUrls.map(async (imgUrl) => {
            const repoPath = resolveMarkdownAssetRepoPath(markdownPath, imgUrl);

            if (!repoPath) {
                return null;
            }

            const section = resolveSectionFromRepoPath(repoPath);

            if (!section) {
                return null;
            }

            const filePath = stripBaseDir(section, repoPath);

            if (!filePath) {
                return null;
            }

            const newUrl = await getBinaryFileUrl(section, filePath);

            return {
                newUrl,
                originalUrl: imgUrl,
            };
        })
    );

    let replacedHtml = html;

    for (const replacement of replacements) {
        if (!replacement) {
            continue;
        }

        replacedHtml = replacedHtml.replace(replacement.originalUrl, replacement.newUrl);
    }

    return replacedHtml;
}

async function fetchFiles() {
    try {
        loading.value = true;

        const files = (await listContentFiles('novels'))
            .filter(
                (file) => file.type === 'file' && file.name.endsWith('.md') && file.name !== 'README.md'
            );

        fileList.value = files;
        chapterGroups.value = organizeFilesIntoGroups(files);
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
}

// 解析音乐标记 - 语法: [music:歌曲名.mp3]
async function resolveMusicFileUrl(filename: string): Promise<string | null> {
    try {
        const files = await listContentFiles('musics');
        const matchedFile = files.find(f => f.name === filename || f.name === filename.replace('.mp3', '') + '.mp3');
        if (matchedFile) {
            return await getDownloadUrl('musics', matchedFile);
        }
    } catch (e) {
        console.warn('无法获取音乐文件:', e);
    }
    return null;
}

async function parseMusicMarkers(text: string): Promise<{ content: string; musicMarkers: MusicMarker[] }> {
    // 匹配 [music:文件名.mp3] 或 [music:文件名.mp3;title:标题]
    // 新语法支持 title 自定义：[music:文件名.mp3;title:自定义标题]
    const musicRegex = /\[music:(.+?\.mp3)(?:;title:([^^\]]+))?\]/g;
    const musicMarkers: MusicMarker[] = [];
    let counter = 0;
    
    // 先收集所有音乐标记
    const matches = [...text.matchAll(musicRegex)];
    const uniqueFilenames = [...new Set(matches.map(m => m[1]))];
    
    // 预获取所有音乐URL
    const urlMap: Record<string, string> = {};
    await Promise.all(uniqueFilenames.map(async (filename) => {
        const url = await resolveMusicFileUrl(filename);
        if (url) {
            urlMap[filename] = url;
        }
    }));
    
    // 替换占位符为自定义元素
    const processedContent = text.replace(musicRegex, (_match, filename, customTitle) => {
        const placeholder = `__MUSIC_PLACEHOLDER_${counter}__`;
        const url = urlMap[filename] || '';
        // 如果有自定义title就用自定义title，否则用文件名
        const title = customTitle || filename.replace('.mp3', '');
        musicMarkers.push({ filename, placeholder, url });
        counter++;
        // 替换为自定义元素标签
        return `<inline-music-player src="${url}" title="${title}"></inline-music-player>`;
    });
    
    return { content: processedContent, musicMarkers };
}

export const fetchFileContent = async (path: string): Promise<MarkdownContent | null> => {
    if (contentCache.has(path)) {
        return contentCache.get(path)!;
    }

    try {
        loading.value = true;
        const rawContent = await readTextContent('novels', path);
        
        // 先解析音乐标记（异步获取URL）
        const { content: contentWithMarkers, musicMarkers } = await parseMusicMarkers(rawContent);

        let html = await marked.parse(contentWithMarkers, {
            breaks: true,
            gfm: true,
        });

        html = await replaceMarkdownImageUrls(html, path);

        const title = path.split('/').pop()?.replace('.md', '') ?? path;
        const result = { 
            content: html, 
            title,
            musicMarkers 
        };

        contentCache.set(path, result);
        return result;
    } catch (err) {
        console.error('获取文件内容失败:', err);
        return null;
    } finally {
        loading.value = false;
    }
};

export const handleFileClick = async (file: ContentFileItem): Promise<void> => {
    const content = await fetchFileContent(file.path);
    if (content) {
        selectedFile.value = content;
    }
};

export const fileList = ref<ContentFileItem[]>([]);
export const chapterGroups = ref<ChapterGroup[]>([]);
export const selectedFile = ref<MarkdownContent | null>(null);
export const loading = ref(false);
export const contentRef = shallowRef<HTMLElement | null>(null);

export const toggleGroup = (group: ChapterGroup) => {
    group.isExpanded = !group.isExpanded;
};

export default defineComponent({
    name: "Novels",

    components: {
        InlineMusicPlayer
    },

    setup() {
        onMounted(fetchFiles);

        return {
            chapterGroups,
            fileList,
            handleFileClick,
            loading,
            selectedFile,
            toggleGroup,
            contentRef,
        };
    },
    methods: {
        formatFileName(fileName: string): string {
            const nameWithoutExt = fileName.replace('.md', '');
            return nameWithoutExt.replace(/^[^-]+-/, '');
        }
    }
});