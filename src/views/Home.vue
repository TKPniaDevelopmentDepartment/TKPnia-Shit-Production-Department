<template>
    <div class="home">
        <h1 class="title">Welcome to the TKPNIA Shit Production Department</h1>
        <h2 class="title"><s>欢迎来到TKPnia产屎部</s></h2>
        <h3 class="title"><s>↓任某人镇楼↓</s></h3>
        <div class="image_containter">
            <img src="/rmr.svg" class="rmr" />
        </div>
    </div>
</template>
<script></script>
<style>
.title {
    font-weight: bold;
    text-align: center;
}

/* 超出图片容器的部分隐藏,避免遮挡文字 */
.image_containter {
    overflow: hidden;
}

.rmr {
    display: block;
    margin: -10% auto;
    width: 50%;/* 原始图片大小的25% */
}
</style>