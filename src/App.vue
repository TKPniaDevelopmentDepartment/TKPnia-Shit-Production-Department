<template>
    <div class="app">
        <div class="nav">
            <div class="nav-item" @click="navigateTo('Home')" :class="{ active: currentSection === 'Home' }">主页</div>
            <div class="nav-item" @click="navigateTo('Novels')" :class="{ active: currentSection === 'Novels' }">小说</div>
            <div class="nav-item" @click="navigateTo('Images')" :class="{ active: currentSection === 'Images' }">图片</div>
            <div class="nav-item" @click="navigateTo('Musics')" :class="{ active: currentSection === 'Musics' }">音乐</div>
        </div>
        <div class="content">
            <router-view v-slot="{ Component }">
                <keep-alive>
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </div>
    </div>
</template>

<script>
export default {
    name: "HomePage",
    data() {
        return {
            currentSection: "Home"
        }
    },
    methods: {
        navigateTo(section) {
            this.currentSection = section;
            this.$router.push({ name: section });
        }
    }
}
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    word-break: keep-all;
}

:root {
    --primary-color: #333;
    --secondary-color: #444;
    --accent-color: #555;
    --text-color: #fff;
    --transition-speed: 0.3s;
}

html, body {
    height: 100%;
    overflow: hidden;
}

.app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f5f5;
}

.nav {
    display: flex;
    align-items: center;
    background-color: var(--primary-color);
    color: var(--text-color);
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
    flex-shrink: 0;
}

.nav-item {
    cursor: pointer;
    padding: 0.75rem 1.25rem;
    margin: 0 0.5rem;
    border-radius: 4px;
    transition: all var(--transition-speed) ease;
    font-size: 1rem;
    position: relative;
    white-space: nowrap;
}

.nav-item:hover {
    background-color: var(--secondary-color);
    transform: translateY(-1px);
}

.nav-item.active {
    background-color: var(--accent-color);
    font-weight: 600;
}

.nav-item.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--text-color);
}

.content {
    flex: 1;
    padding: 1rem;
    overflow: hidden;
    position: relative;
}

::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--accent-color);
}

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
    html, body {
        overflow: visible;
        overflow-x: hidden;
    }

    .app {
        height: auto;
        min-height: 100vh;
    }

    .nav {
        padding: 0.5rem;
        justify-content: flex-start;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
    }

    .nav::-webkit-scrollbar {
        display: none;
    }

    .nav-item {
        flex: 0 0 auto;
        padding: 0.6rem 0.8rem;
        margin: 0 0.25rem;
        font-size: 0.9rem;
        min-height: 44px;
        display: flex;
        align-items: center;
    }

    .content {
        padding: 0.5rem;
        overflow: visible;
    }
}
</style>
