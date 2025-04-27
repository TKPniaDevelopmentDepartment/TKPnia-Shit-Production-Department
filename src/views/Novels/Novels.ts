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

const axiosInstance = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json',
    },
});

async function fetchFiles() {
    try {
        loading.value = true;
        const response = await axiosInstance.get(`/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/novels?ref=main`);

        fileList.value = response.data
            .filter((file: FileItem) => file.type === 'file' && file.name.endsWith('.md') && file.name !== 'README.md')
            .sort((a: FileItem, b: FileItem) => a.name.localeCompare(b.name));
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
}

export const fetchFileContent = async (path: string): Promise<MarkdownContent | null> => {
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

        for (const imgUrl of imgUrls) {
            const repoPath = imgUrl.replace(
                'https://github.com/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/blob/main/',
                ''
            );
            
            const imgResponse = await axiosInstance.get(
                `/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/${repoPath}?ref=main`
            );
            
            const imgBase64 = imgResponse.data.content;
            const imgType = repoPath.split('.').pop();
            
            html = html.replace(imgUrl, `data:image/${imgType};base64,${imgBase64}`);
        }

        return {
            content: html,
            title: response.data.name.replace('.md', '')
        };
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
export const selectedFile = ref<MarkdownContent | null>(null);
export const loading = ref(false);

export default defineComponent({
    name: "Novels",
    
    setup() {
        onMounted(fetchFiles);

        return {
            fileList,
            selectedFile,
            loading,
            handleFileClick,
        };
    },
});