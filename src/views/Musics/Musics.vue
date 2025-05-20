<template>
    <div class="m-container">
        <div class="m-sidebar">
            <h2>音乐列表</h2>
            <div class="m-file-list">
                <ul>
                    <li v-for="file in fileList" :key="file.sha" class="m-file-item" @click="handleFileClick(file)">
                        {{ file.name.replace('.mp3', '') }}
                    </li>
                </ul>
            </div>
        </div>
        <div class="m-main">
            <div v-if="selectedFile" class="m-player-content">
                <div class="m-player-info">
                    <h3>{{ selectedFile.title }}</h3>
                </div>
                <div class="m-player-controls">
                    <div class="m-progress-container">
                        <button @click="togglePlay" class="m-control-btn" :class="{ 'playing': isPlaying, 'paused': !isPlaying }">
                            <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
                        </button>
                        <span class="m-time current-time">{{ formatTime(currentTime) }}</span>
                        <div class="m-progress-bar">
                            <div class="m-progress" :style="{ width: progress + '%' }"></div>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                v-model="progress"
                                @input="seek"
                                class="m-progress-slider"
                            >
                        </div>
                        <span class="m-time total-time">{{ formatTime(duration) }}</span>
                    </div>
                    <div class="m-volume-control">
                        <span class="m-volume-label">音量</span>
                        <i class="fas fa-volume-up"></i>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            v-model="volume"
                            @input="setVolume"
                            class="m-volume-slider"
                        >
                        <span class="m-volume-value">{{ volume }}%</span>
                    </div>
                </div>
            </div>
            <div v-else class="m-placeholder">
                请从左侧选择要播放的音乐
            </div>
        </div>
        <div v-if="loading" class="m-loading">
            加载中...
        </div>
    </div>
</template>

<script src="./Musics.ts"></script>
<style src="./Musics.css"></style>