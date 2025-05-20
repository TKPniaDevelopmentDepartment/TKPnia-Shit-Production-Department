import { ref, onMounted, defineComponent } from 'vue';
import axios from 'axios';

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    sha: string;
    download_url: string;
};

interface MusicContent {
    url: string;
    title: string;
};

const axiosInstance = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json',
    },
});

// 缓存已获取的音乐内容
const contentCache = new Map<string, MusicContent>();

export const fileList = ref<FileItem[]>([]);
export const selectedFile = ref<MusicContent | null>(null);
export const loading = ref(false);
export const isPlaying = ref(false);
export const progress = ref(0);
export const volume = ref(50);
export const audio = new Audio();
export const currentTime = ref(0);
export const duration = ref(0);

// 智能排序函数
function naturalSort(a: string, b: string): number {
    const splitA = a.split(/(\d+)/);
    const splitB = b.split(/(\d+)/);
    
    for (let i = 0; i < Math.min(splitA.length, splitB.length); i++) {
        const aPart = splitA[i];
        const bPart = splitB[i];
        
        if (i % 2 === 0) {
            // 非数字部分比较
            const comparison = aPart.localeCompare(bPart, 'zh-CN');
            if (comparison !== 0) return comparison;
        } else {
            // 数字部分比较
            const numA = parseInt(aPart);
            const numB = parseInt(bPart);
            if (numA !== numB) return numA - numB;
        }
    }
    
    return splitA.length - splitB.length;
}

const fetchFiles = async () => {
    try {
        loading.value = true;
        const response = await axiosInstance.get(`/repos/K0meijiSatori/my-music-page/contents/media?ref=main`);
        fileList.value = response.data
            .filter((file: FileItem) => file.type === 'file' && file.name.endsWith('.mp3'))
            .sort((a: FileItem, b: FileItem) => naturalSort(a.name, b.name));
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const fetchFileContent = async (file: FileItem): Promise<MusicContent | null> => {
    // 检查缓存
    if (contentCache.has(file.sha)) {
        return contentCache.get(file.sha)!;
    }

    try {
        loading.value = true;
        const result = {
            url: file.download_url,
            title: file.name.replace('.mp3', '')
        };

        // 存入缓存
        contentCache.set(file.sha, result);
        return result;
    } catch (err) {
        console.error('获取音乐内容失败:', err);
        return null;
    } finally {
        loading.value = false;
    }
};

// 格式化时间
const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 音频事件监听器
const setupAudioListeners = () => {
    audio.addEventListener('timeupdate', () => {
        if (!isNaN(audio.duration)) {
            progress.value = (audio.currentTime / audio.duration) * 100;
            currentTime.value = audio.currentTime;
            duration.value = audio.duration;
        }
    });
    
    audio.addEventListener('loadedmetadata', () => {
        duration.value = audio.duration;
    });
    
    audio.addEventListener('ended', () => {
        isPlaying.value = false;
        progress.value = 0;
    });

    audio.addEventListener('error', (e) => {
        console.error('音频加载错误:', e);
        isPlaying.value = false;
        selectedFile.value = null;
    });

    audio.addEventListener('loadeddata', () => {
        loading.value = false;
    });

    audio.addEventListener('waiting', () => {
        loading.value = true;
    });

    audio.addEventListener('playing', () => {
        loading.value = false;
    });
};

const handleFileClick = async (file: FileItem) => {
    try {
        loading.value = true;
        const content = await fetchFileContent(file);
        if (content && content.url) {
            selectedFile.value = content;
            // 设置新的音频源
            audio.src = content.url;
            audio.load();
            isPlaying.value = false;
            progress.value = 0;
        } else {
            console.error('无法加载音乐文件');
            selectedFile.value = null;
        }
    } catch (err) {
        console.error('加载音乐文件失败:', err);
        selectedFile.value = null;
    } finally {
        loading.value = false;
    }
};

const togglePlay = async () => {
    try {
        if (isPlaying.value) {
            await audio.pause();
        } else {
            await audio.play();
        }
        isPlaying.value = !isPlaying.value;
    } catch (err) {
        console.error('播放控制失败:', err);
        isPlaying.value = false;
    }
};

const seek = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const time = (audio.duration * parseInt(target.value)) / 100;
    audio.currentTime = time;
};

const setVolume = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newVolume = parseInt(target.value) / 100;
    audio.volume = newVolume;
    volume.value = parseInt(target.value);
};

export default defineComponent({
    name: 'Music',
    setup() {
        onMounted(() => {
            fetchFiles();
            setupAudioListeners();
            
            // 初始化音量
            audio.volume = volume.value / 100;
        });

        return { 
            fileList, 
            selectedFile, 
            loading, 
            isPlaying,
            progress,
            volume,
            currentTime,
            duration,
            formatTime,
            handleFileClick,
            togglePlay,
            seek,
            setVolume
        };
    },
}); 