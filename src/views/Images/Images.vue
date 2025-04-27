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
<script src="./Image.ts"></script>
<style src="./Image.css"></style>