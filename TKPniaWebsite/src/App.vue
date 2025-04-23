<template>
    <div class="container">
        <!-- 文件列表 -->
        <div class="file-list">
            <h2>目录</h2>
            <ul>
                <li v-for="file in fileList" :key="file.sha" class="file-item" @click="handleFileClick(file)">
                    {{ file.name.replace('.md', '') }}
                </li>
            </ul>
        </div>

        <!-- 文件内容 -->
        <div v-if="selectedFile" class="markdown-content">
            <div v-html="selectedFile.content"></div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
            加载中...
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { marked } from 'marked';

const fileList = ref<FileItem[]>([]);
const selectedFile = ref<MarkdownContent | null>(null);
const loading = ref(false);

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

const fetchFiles = async () => {
    try {
        loading.value = true;
        const response = await axiosInstance.get(`/repos/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department/contents/novels?ref=main`);

        fileList.value = response.data
            .filter((file: FileItem) => file.type === 'file' && file.name.endsWith('.md'))
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
        const base64Content = response.data.content;
        const uint8Array = new Uint8Array(atob(base64Content).split('').map(c => c.charCodeAt(0)));
        const decoder = new TextDecoder('utf-8');
        const content = decoder.decode(uint8Array);
        const html = await marked.parse(content, {
            gfm: true,
            breaks: true,
        });
        const title = response.data.name.replace('.md', '');
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

onMounted(() => {
    fetchFiles();
});
</script>
