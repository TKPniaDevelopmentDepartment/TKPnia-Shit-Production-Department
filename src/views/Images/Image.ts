import { ref, onMounted, defineComponent } from 'vue';
import axios from 'axios';

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    sha: string;
};

interface ImageContent {
    content: string;
    title: string;
};

const axiosInstance = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json',
    },
});

// 缓存已获取的图片内容
const contentCache = new Map<string, ImageContent>();

export const fileList = ref<FileItem[]>([]);
export const selectedFile = ref<ImageContent | null>(null);
export const loading = ref(false);

// 智能排序函数
function naturalSort(a: string, b: string): number {
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

const fetchFiles = async () => {
    try {
        loading.value = true;
        const response = await axiosInstance.get(`/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/images?ref=main`);
        fileList.value = response.data
            .filter((file: FileItem) => file.type === 'file' && file.name.endsWith('.png'))
            .sort((a: FileItem, b: FileItem) => naturalSort(a.name, b.name));
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const fetchFileContent = async (path: string): Promise<ImageContent | null> => {
    // 检查缓存
    if (contentCache.has(path)) {
        return contentCache.get(path)!;
    }

    try {
        loading.value = true;
        const response = await axiosInstance.get(`/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/${path}?ref=main`);
        const content = response.data.content;
        const title = response.data.name.replace('.png', '');
        
        const result = {
            content: `data:image/png;base64,${content}`,
            title
        };

        // 存入缓存
        contentCache.set(path, result);
        return result;
    } catch (err) {
        console.error('获取图片内容失败:', err);
        return null;
    } finally {
        loading.value = false;
    }
};

const handleFileClick = async (file: FileItem) => {
    const content = await fetchFileContent(file.path);
    if (content) {
        selectedFile.value = content;
    }
};

export default defineComponent({
    name: 'Image',
    setup() {
        onMounted(fetchFiles);
        return { fileList, selectedFile, loading, handleFileClick };
    },
});