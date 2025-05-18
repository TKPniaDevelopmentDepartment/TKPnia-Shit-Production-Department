<template>
    <div class="n-container">
        <div class="n-sidebar">
            <h2>目录</h2>
            <div class="n-file-list">
                <div v-for="group in chapterGroups" :key="group.title" class="n-chapter-group">
                    <div class="n-group-header" @click="toggleGroup(group)">
                        <span class="n-group-title">{{ group.title }}</span>
                        <span class="n-group-toggle">{{ group.isExpanded ? '▼' : '▶' }}</span>
                    </div>
                    <ul v-show="group.isExpanded" class="n-chapter-list">
                        <li v-for="file in group.chapters" 
                            :key="file.sha" 
                            class="n-file-item" 
                            @click="handleFileClick(file)">
                            {{ formatFileName(file.name) }}
                        </li>
                    </ul>
                </div>
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