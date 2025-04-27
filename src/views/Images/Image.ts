import { ref, onMounted, defineComponent } from 'vue';
import axios from 'axios';

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

const axiosInstance = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json',
    },
});

export const fileList = ref<FileItem[]>([]);
export const selectedFile = ref<MarkdownContent | null>(null);
export const loading = ref(false);

const fetchFiles = async () => {
    try {
        loading.value = true;
        const response = await axiosInstance.get(`/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/images?ref=main`);
        fileList.value = response.data
            .filter((file: FileItem) => file.type === 'file' && file.name.endsWith('.png'))
            .sort((a: FileItem, b: FileItem) => a.name.localeCompare(b.name));
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const fetchFileContent = async (path: string) => {
    try {
        loading.value = true;
        const response = await axiosInstance.get(`/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/${path}?ref=main`);
        const content = response.data.content;//图片的base64编码
        const title = response.data.name.replace('.png', '');
        const html = `<img src="data:image/png;base64,${content}" alt="${title}">`;
        return { content: html, title };
    } catch (err) {
        console.error(err);
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