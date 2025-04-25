<template>
    <div class="home">
        <h1 class="title">Welcome to the TKPNIA Shit Production Department</h1>
        <h2 class="title"><s>欢迎来到TKPnia产屎部</s></h2>
        <h3 class="title"><s>↓任某人镇楼↓</s></h3>
        <div class="image-container">
            <img src="/rmr.svg" class="rmr" />
        </div>
        <div class="link-container">
            <a href="https://afdian.com/a/TKPnia_D_Department" class="vm50">V我50吃KFC</a><br/>
            <a href="https://afdian.com/a/TKPniadevelopment" class="vm50">V他50吃KFC</a><br/>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Home'
}
</script>

<style>
.title {
    font-weight: bold;
    text-align: center;
}

.image-container {
    overflow: hidden;
    position: relative;
    height: 700px; /* 根据需要调整图片容器高度 */
}

.rmr {
    display: block;
    margin: -15% auto;
    width: 75%;
    animation: float 5s ease-in-out infinite;
}

.link-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 100;
}

.vm50 {
    display: inline-block;
    padding: 7px 9px;
    font-size: 0.875rem;
    color: #fff;
    background-color: #ff6b6b;
    border-radius: 25px;
    text-decoration: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.vm50:hover {
    background-color: #ff1616;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}
</style>
