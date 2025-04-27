<template>
    <div class="n-container">
        <div class="n-file-list">
            <h2>目录</h2>
            <ul>
                <li v-for="file in fileList" :key="file.sha" class="n-file-item" @click="handleFileClick(file)">
                    {{ file.name.replace('.md', '') }}
                </li>
            </ul>
        </div>
        <div v-if="selectedFile" class="n-markdown-content">
            <div v-html="selectedFile.content"></div>
        </div>
        <div v-if="loading" class="n-loading">
            加载中...
        </div>
    </div>
</template>

<script src="./Novels.ts"></script>

<style src="./Novels.css"></style>