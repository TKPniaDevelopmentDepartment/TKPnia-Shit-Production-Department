<template>
    <div class="inline-player-container">
        <!-- 歌曲信息 -->
        <div class="ip-info">
            <h3>{{ title }}</h3>
        </div>
        
        <!-- 播放控制 -->
        <div class="ip-controls">
            <div class="ip-progress-container">
                <button @click="togglePlay" class="ip-control-btn" :class="{ playing: isPlaying, paused: !isPlaying }">
                    <span v-if="!isPlaying">▶</span>
                    <span v-else>⏸</span>
                </button>
                <span class="ip-time">{{ formatTime(currentTime) }}</span>
                <div class="ip-progress-bar" v-if="duration > 0">
                    <div class="ip-progress" :style="{ width: progress + '%' }"></div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        :value="progress"
                        @input="seek"
                        class="ip-progress-slider"
                    >
                </div>
                <span class="ip-time">{{ formatTime(duration) }}</span>
            </div>
            <div class="ip-volume-control" v-if="duration > 0">
                <span class="ip-volume-label">音量</span>
                <span>🔊</span>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    v-model="volume"
                    @input="setVolume"
                    class="ip-volume-slider"
                >
                <span class="ip-volume-value">{{ volume }}%</span>
            </div>
        </div>
        
        <div v-if="loading" class="ip-loading">
            加载中...
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onUnmounted, watch } from 'vue';

export default defineComponent({
    name: 'InlineMusicPlayer',
    props: {
        src: { type: String, required: true },
        title: { 
            type: String, 
            default: (props: { src: string }) => {
                // 从 src 中提取文件名作为默认标题
                const filename = props.src.split('/').pop() || '音乐';
                return filename.replace(/\.[^.]+$/, ''); // 去掉扩展名
            }
        },
    },
    setup(props) {
        const isPlaying = ref(false);
        const currentTime = ref(0);
        const duration = ref(0);
        const progress = ref(0);
        const volume = ref(50);
        const loading = ref(false);
        
        let audio: HTMLAudioElement | null = null;

        const formatTime = (seconds: number): string => {
            if (isNaN(seconds) || seconds === 0) return '00:00';
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const initAudio = () => {
            if (audio) return;
            audio = new Audio(props.src);
            audio.volume = volume.value / 100;
            
            audio.addEventListener('loadedmetadata', () => {
                duration.value = audio!.duration;
                loading.value = false;
            });
            
            audio.addEventListener('timeupdate', () => {
                if (audio && !isNaN(audio.duration)) {
                    currentTime.value = audio.currentTime;
                    progress.value = (audio.currentTime / audio.duration) * 100;
                }
            });
            
            audio.addEventListener('ended', () => {
                isPlaying.value = false;
                progress.value = 0;
                currentTime.value = 0;
            });
            
            audio.addEventListener('waiting', () => { loading.value = true; });
            audio.addEventListener('playing', () => { loading.value = false; });
            audio.addEventListener('loadeddata', () => { loading.value = false; });
            audio.addEventListener('error', () => { loading.value = false; });
        };

        const togglePlay = async () => {
            initAudio();
            if (!audio) return;
            
            try {
                if (isPlaying.value) {
                    audio.pause();
                    isPlaying.value = false;
                } else {
                    await audio.play();
                    isPlaying.value = true;
                }
            } catch (err) {
                console.error('播放失败:', err);
                isPlaying.value = false;
            }
        };

        const seek = (event: Event) => {
            if (!audio || !duration.value) return;
            const target = event.target as HTMLInputElement;
            audio.currentTime = (duration.value * parseInt(target.value)) / 100;
            progress.value = parseInt(target.value);
        };

        const setVolume = (event: Event) => {
            if (!audio) return;
            const target = event.target as HTMLInputElement;
            audio.volume = parseInt(target.value) / 100;
            volume.value = parseInt(target.value);
        };

        watch(() => props.src, (newSrc) => {
            if (audio) {
                audio.src = newSrc;
                audio.load();
                isPlaying.value = false;
                progress.value = 0;
                currentTime.value = 0;
            }
        });

        onUnmounted(() => {
            if (audio) {
                audio.pause();
                audio = null;
            }
        });

        return { 
            isPlaying, currentTime, duration, progress, volume, loading,
            formatTime, togglePlay, seek, setVolume
        };
    },
});
</script>

<style>
/* 白色卡片样式 */
inline-music-player .inline-player-container,
.inline-player-container {
    width: 100%;
    max-width: 600px;
    background: #fff !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
    padding: 20px !important;
    margin: 12px 0 !important;
    color: #333;
    display: block;
}

inline-music-player .ip-info,
.ip-info {
    text-align: center;
    margin-bottom: 20px;
}

inline-music-player .ip-info h3,
.ip-info h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.2em;
}

inline-music-player .ip-controls,
.ip-controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

inline-music-player .ip-progress-container,
.ip-progress-container {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

inline-music-player .ip-control-btn,
.ip-control-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #4CAF50;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 12px;
    transition: all 0.3s ease;
}

inline-music-player .ip-control-btn:hover,
.ip-control-btn:hover {
    transform: scale(1.1);
}

inline-music-player .ip-control-btn.paused,
.ip-control-btn.paused {
    background: #f44336;
}

inline-music-player .ip-control-btn.playing,
.ip-control-btn.playing {
    background: #4CAF50;
}

inline-music-player .ip-time,
.ip-time {
    font-size: 0.85em;
    color: #666;
    min-width: 40px;
    text-align: center;
}

inline-music-player .ip-progress-bar,
.ip-progress-bar {
    flex: 1;
    position: relative;
    height: 6px;
    background: #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
}

inline-music-player .ip-progress,
.ip-progress {
    position: absolute;
    height: 100%;
    background: #1a73e8;
    border-radius: 3px;
    transition: width 0.1s linear;
}

inline-music-player .ip-progress-slider,
.ip-progress-slider {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 1;
}

inline-music-player .ip-volume-control,
.ip-volume-control {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 5px;
}

inline-music-player .ip-volume-label,
.ip-volume-label {
    color: #666;
    font-size: 0.85em;
    min-width: 35px;
}

inline-music-player .ip-volume-slider,
.ip-volume-slider {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #e0e0e0;
    border-radius: 2px;
    outline: none;
}

inline-music-player .ip-volume-slider::-webkit-slider-thumb,
.ip-volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #1a73e8;
    border-radius: 50%;
    cursor: pointer;
}

inline-music-player .ip-volume-value,
.ip-volume-value {
    color: #666;
    font-size: 0.85em;
    min-width: 35px;
    text-align: right;
}

inline-music-player .ip-loading,
.ip-loading {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.9em;
}
</style>