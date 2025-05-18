import { defineComponent, ref, onMounted } from "vue";
import axios from 'axios';
import { marked } from "marked";

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    sha: string;
};

interface MarkdownContent {
    content: string;
    title: string;
};

interface ChapterGroup {
    title: string;
    chapters: FileItem[];
    isExpanded: boolean;
}

const axiosInstance = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json',
    },
});

// 智能排序函数
function naturalSort(a: string, b: string): number {
    // 检查是否包含"主线"和"番外篇"
    const aIsMain = a.includes('主线');
    const bIsMain = b.includes('主线');

    // 如果一个是主线一个是番外篇，主线优先
    if (aIsMain && !bIsMain) return -1;
    if (!aIsMain && bIsMain) return 1;

    // 如果都是主线或都是番外篇，则按数字排序
    const splitA = a.split(/(\d+)/);
    const splitB = b.split(/(\d+)/);

    for (let i = 0; i < Math.min(splitA.length, splitB.length); i++) {
        const aPart = splitA[i];
        const bPart = splitB[i];

        if (i % 2 === 0) {
            // 非数字部分比较
            const comparison = aPart.localeCompare(bPart, 'zh-CN');
            if (comparison !== 0) return comparison;
        } else {
            // 数字部分比较
            const numA = parseInt(aPart);
            const numB = parseInt(bPart);
            if (numA !== numB) return numA - numB;
        }
    }

    return splitA.length - splitB.length;
}

// 缓存已获取的文件内容
const contentCache = new Map<string, MarkdownContent>();

function organizeFilesIntoGroups(files: FileItem[]): ChapterGroup[] {
    const groups: { [key: string]: FileItem[] } = {};

    files.forEach(file => {
        const name = file.name.replace('.md', '');
        // 使用正则表达式匹配文件名中的分组信息
        // 匹配模式：任意文字-任意文字 或 任意文字
        const match = name.match(/^([^-]+)(?:-(.+))?$/);
        let groupName = '其他';

        if (match) {
            // 如果匹配到分组信息，使用第一部分作为分组名
            groupName = match[1].trim();
        }

        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(file);
    });

    // 将分组转换为数组并排序
    return Object.entries(groups)
        .map(([title, chapters]) => ({
            title,
            chapters: chapters.sort((a, b) => naturalSort(a.name, b.name)),
            isExpanded: true
        }))
        .sort((a, b) => {
            // 主线始终放在第一位
            if (a.title === '主线') return -1;
            if (b.title === '主线') return 1;

            // 其他分组按首字母排序
            return a.title.localeCompare(b.title, 'zh-CN');
        });
}

async function fetchFiles() {
    try {
        loading.value = true;
        const response = await axiosInstance.get(`/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/novels?ref=main`);

        const files = response.data
            .filter((file: FileItem) => file.type === 'file' && file.name.endsWith('.md') && file.name !== 'README.md');

        fileList.value = files;
        chapterGroups.value = organizeFilesIntoGroups(files);
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
}

export const fetchFileContent = async (path: string): Promise<MarkdownContent | null> => {
    // 检查缓存
    if (contentCache.has(path)) {
        return contentCache.get(path)!;
    }

    try {
        loading.value = true;
        const response = await axiosInstance.get(
            `/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/${path}?ref=main`
        );

        const base64Content = response.data.content;
        const uint8Array = new Uint8Array(atob(base64Content).split('').map(c => c.charCodeAt(0)));
        const decoder = new TextDecoder('utf-8');
        const content = decoder.decode(uint8Array);

        let html = await marked.parse(content, {
            gfm: true,
            breaks: true,
        });

        // 图片处理
        const imgRegex = /<img\b[^>]*src="([^"]*)"[^>]*>/g;
        let match;
        const imgUrls = [];

        while ((match = imgRegex.exec(html)) !== null) {
            imgUrls.push(match[1]);
        }

        // 批量获取图片内容
        const imgPromises = imgUrls.map(async (imgUrl) => {
            const repoPath = imgUrl.replace(
                'https://github.com/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/blob/main/',
                ''
            );

            const imgResponse = await axiosInstance.get(
                `/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/${repoPath}?ref=main`
            );

            const imgBase64 = imgResponse.data.content;
            const imgType = repoPath.split('.').pop();

            return {
                originalUrl: imgUrl,
                newUrl: `data:image/${imgType};base64,${imgBase64}`
            };
        });

        const imgResults = await Promise.all(imgPromises);

        // 替换所有图片URL
        for (const { originalUrl, newUrl } of imgResults) {
            html = html.replace(originalUrl, newUrl);
        }

        const result = {
            content: html,
            title: response.data.name.replace('.md', '')
        };

        // 存入缓存
        contentCache.set(path, result);
        return result;
    } catch (err) {
        console.error('获取文件内容失败:', err);
        return null;
    } finally {
        loading.value = false;
    }
};

export const handleFileClick = async (file: FileItem): Promise<void> => {
    const content = await fetchFileContent(file.path);
    if (content) {
        selectedFile.value = content;
    }
};

export const fileList = ref<FileItem[]>([]);
export const chapterGroups = ref<ChapterGroup[]>([]);
export const selectedFile = ref<MarkdownContent | null>(null);
export const loading = ref(false);

export const toggleGroup = (group: ChapterGroup) => {
    group.isExpanded = !group.isExpanded;
};

export default defineComponent({
    name: "Novels",

    setup() {
        onMounted(fetchFiles);

        return {
            fileList,
            chapterGroups,
            selectedFile,
            loading,
            handleFileClick,
            toggleGroup,
        };
    },
    methods: {
        formatFileName(fileName: string): string {
            // 移除 .md 后缀
            const nameWithoutExt = fileName.replace('.md', '');
            // 移除前缀（如果有的话）
            return nameWithoutExt.replace(/^[^-]+-/, '');
        }
    }
});