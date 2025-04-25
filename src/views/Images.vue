<template>
    <div class="container">
        <div class="file-list">
            <h2>目录</h2>
            <ul>
                <li v-for="file in fileList" :key="file.sha" class="file-item" @click="handleFileClick(file)">
                    {{ file.name.replace('.png', '') }}
                </li>
            </ul>
        </div>
        <div v-if="selectedFile" class="markdown-content">
            <div v-html="selectedFile.content"></div>
        </div>
        <div v-if="loading" class="loading">
            加载中...
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

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

onMounted(() => {
    fetchFiles();
});
</script>

<style>
/* 目录显示位置为最左边一列,超出上下边界时显示滚动条 */
.file-list {
    position: sticky;
    top: 0;
    left: 0;
    width: 20%;
    height: 100%;
    overflow-y: auto;
}

/* 目录项 */
.file-item {
    cursor: pointer;
    padding: 10px;
    border-bottom: 1px solid #ccc;
}

/* 选中项 */
.file-item.active {
    background-color: #f5f5f5;
}

/* Markdown内容,使用相对位置,在超出上下边界时显示滚动条 */
.markdown-content {
    position: absolute;
    top: 10%;
    left: 20%;
    width: 80%;
    height: 85%;
    overflow-y: auto;
    padding: 20px;
    background-color: #f5f5f5;
}

/* 加载中 */
.loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: #999;
}
</style>