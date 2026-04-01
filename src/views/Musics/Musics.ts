import { defineComponent, onMounted, ref } from 'vue';
import type { ContentFileItem } from '../../services/contentSource';
import { getDownloadUrl, listContentFiles } from '../../services/contentSource';

interface MusicContent {
    title: string;
    url: string;
}

const contentCache = new Map<string, MusicContent>();

export const fileList = ref<ContentFileItem[]>([]);
export const selectedFile = ref<MusicContent | null>(null);
export const loading = ref(false);
export const isPlaying = ref(false);
export const progress = ref(0);
export const volume = ref(50);
export const audio = new Audio();
export const currentTime = ref(0);
export const duration = ref(0);

function naturalSort(a: string, b: string): number {
    const splitA = a.split(/(\d+)/);
    const splitB = b.split(/(\d+)/);

    for (let i = 0; i < Math.min(splitA.length, splitB.length); i++) {
        const aPart = splitA[i];
        const bPart = splitB[i];

        if (i % 2 === 0) {
            const comparison = aPart.localeCompare(bPart, 'zh-CN');
            if (comparison !== 0) {
                return comparison;
            }
        } else {
            const numA = parseInt(aPart);
            const numB = parseInt(bPart);
            if (numA !== numB) {
                return numA - numB;
            }
        }
    }

    return splitA.length - splitB.length;
}

const fetchFiles = async () => {
    try {
        loading.value = true;
        fileList.value = (await listContentFiles('musics'))
            .filter((file) => file.type === 'file' && file.name.endsWith('.mp3'))
            .sort((a, b) => naturalSort(a.name, b.name));
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const fetchFileContent = async (file: ContentFileItem): Promise<MusicContent | null> => {
    if (contentCache.has(file.sha)) {
        return contentCache.get(file.sha)!;
    }

    try {
        loading.value = true;
        const result = {
            title: file.name.replace('.mp3', ''),
            url: await getDownloadUrl('musics', file),
        };

        contentCache.set(file.sha, result);
        return result;
    } catch (err) {
        console.error('获取音乐内容失败:', err);
        return null;
    } finally {
        loading.value = false;
    }
};

const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) {
        return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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

const handleFileClick = async (file: ContentFileItem) => {
    try {
        loading.value = true;
        const content = await fetchFileContent(file);

        if (!content || !content.url) {
            console.error('无法加载音乐文件');
            selectedFile.value = null;
            return;
        }

        selectedFile.value = content;
        audio.src = content.url;
        audio.load();
        isPlaying.value = false;
        progress.value = 0;
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
            audio.pause();
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
            audio.volume = volume.value / 100;
        });

        return {
            currentTime,
            duration,
            fileList,
            formatTime,
            handleFileClick,
            isPlaying,
            loading,
            progress,
            seek,
            selectedFile,
            setVolume,
            togglePlay,
            volume,
        };
    },
});
