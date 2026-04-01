import { defineComponent, onMounted, ref } from 'vue';
import type { ContentFileItem } from '../../services/contentSource';
import { getBinaryFileUrl, listContentFiles } from '../../services/contentSource';

interface ImageContent {
    content: string;
    title: string;
}

const contentCache = new Map<string, ImageContent>();

export const fileList = ref<ContentFileItem[]>([]);
export const selectedFile = ref<ImageContent | null>(null);
export const loading = ref(false);

function naturalSort(a: string, b: string): number {
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

const fetchFiles = async () => {
    try {
        loading.value = true;
        fileList.value = (await listContentFiles('images'))
            .filter((file) => file.type === 'file' && file.name.endsWith('.png'))
            .sort((a, b) => naturalSort(a.name, b.name));
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const fetchFileContent = async (path: string): Promise<ImageContent | null> => {
    if (contentCache.has(path)) {
        return contentCache.get(path)!;
    }

    try {
        loading.value = true;
        const result = {
            content: await getBinaryFileUrl('images', path),
            title: path.split('/').pop()?.replace('.png', '') ?? path,
        };

        contentCache.set(path, result);
        return result;
    } catch (err) {
        console.error('获取图片内容失败:', err);
        return null;
    } finally {
        loading.value = false;
    }
};

const handleFileClick = async (file: ContentFileItem) => {
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
