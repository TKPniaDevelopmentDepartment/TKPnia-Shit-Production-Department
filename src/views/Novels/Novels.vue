<template>
    <div class="n-container">
        <div class="n-sidebar">
            <h2>目录</h2>
            <div class="n-file-list">
                <ul>
                    <li v-for="file in fileList" :key="file.sha" class="n-file-item" @click="handleFileClick(file)">
                        {{ file.name.replace('.md', '') }}
                    </li>
                </ul>
            </div>
        </div>
        <div class="n-main">
            <div v-if="selectedFile" class="n-markdown-content">
                <div v-html="selectedFile.content"></div>
            </div>
            <div v-else class="n-placeholder">
                请从左侧选择要阅读的小说
            </div>
        </div>
        <div v-if="loading" class="n-loading">
            加载中...
        </div>
    </div>
</template>

<script src="./Novels.ts"></script>

<style src="./Novels.css"></style>