<template>
    <div class="i-container">
        <div class="i-sidebar">
            <h2>目录</h2>
            <div class="i-file-list">
                <ul>
                    <li v-for="file in fileList" :key="file.sha" class="i-file-item" @click="handleFileClick(file)">
                        {{ file.name.replace('.png', '') }}
                    </li>
                </ul>
            </div>
        </div>
        <div class="i-main">
            <div v-if="selectedFile" class="i-image-content">
                <img :src="selectedFile.content" :alt="selectedFile.name" />
            </div>
            <div v-else class="i-placeholder">
                请从左侧选择要查看的图片
            </div>
        </div>
        <div v-if="loading" class="i-loading">
            加载中...
        </div>
    </div>
</template>

<script src="./Image.ts"></script>
<style src="./Image.css"></style>