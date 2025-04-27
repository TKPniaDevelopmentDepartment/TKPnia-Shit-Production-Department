<template>
    <div class="i-container">
        <div class="i-file-list">
            <h2>目录</h2>
            <ul>
                <li v-for="file in fileList" :key="file.sha" class="i-file-item" @click="handleFileClick(file)">
                    {{ file.name.replace('.png', '') }}
                </li>
            </ul>
        </div>
        <div v-if="selectedFile" class="i-markdown-content">
            <div v-html="selectedFile.content"></div>
        </div>
        <div v-if="loading" class="i-loading">
            加载中...
        </div>
    </div>
</template>
<script src="./Image.ts"></script>
<style src="./Image.css"></style>