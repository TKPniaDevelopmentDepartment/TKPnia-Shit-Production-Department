<template>
    <div class="app">
        <div class="nav">
            <div class="nav-item" @click="navigateTo('Home')" :class="{ active: currentSection === 'Home' }">主页</div>
            <div class="nav-item" @click="navigateTo('Novels')" :class="{ active: currentSection === 'Novels' }">小说</div>
            <div class="nav-item" @click="navigateTo('Images')" :class="{ active: currentSection === 'Images' }">图片</div>
        </div>
        <div class="content">
            <router-view />
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
}

.app {
    display: flex;
    flex-direction: column;
    height: 98vh;
}

.nav {
    display: flex;
    align-items: center;
    background-color: #333;
    color: #fff;
    padding: 10px;
}

.nav-item {
    cursor: pointer;
    padding: 5px;
    transition: background-color 0.3s;
}

.nav-item:hover {
    background-color: #444;
}

.nav-item.active {
    background-color: #555;
    font-weight: bold;
}

body::-webkit-scrollbar {
    height: 0;
}
/* 禁用滚动 */
.content::-webkit-scrollbar {
    width: 0;
    height: 0;
}

.content {
    flex: 1;
    overflow: hidden;
}
</style>
