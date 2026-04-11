# TKPnia-Shit-Production-Department
基于vite+vue3+typescript的前端项目  
使用pnpm作为包管理器  
克隆  
```
git clone -b websitefiles https://github.com/TKPniaDevelopmentDepartment/TKPnia-Shit-Production-Department.git
```
编译及测试  
```
pnpm run dev     //测试
pnpm run build   //打包
pnpm run preview //预览
```

## 本地内容调试

当前项目已经支持本地调试 `novels`、`images`、`musics` 的真实文件目录。

1. 复制 `.env.local.example` 为 `.env.local`
2. 配置你的本地内容路径

```env
LOCAL_CONTENT_ROOT=/path/to/YourContentRepo
```

默认会读取：

- `novels` -> `${LOCAL_CONTENT_ROOT}/novels`
- `images` -> `${LOCAL_CONTENT_ROOT}/images`
- `musics` -> `${LOCAL_CONTENT_ROOT}/media`

如果目录不在同一个仓库下，也可以分别配置：

```env
LOCAL_NOVELS_DIR=/path/to/YourNovels
LOCAL_IMAGES_DIR=/path/to/YourImages
LOCAL_MUSICS_DIR=/path/to/YourMedia
```

说明：

- 本地目录已配置且存在时，开发/预览环境会优先读取本地文件
- 本地目录未配置时，会自动回退到当前 GitHub 生产内容源
- `novels` 页面里的图片也会跟随本地路径解析，不再写死线上仓库位置
- 如果你是在 WSL 里启动项目，不要写 `/novels` 这种 Linux 根路径；请写 `./novels`、`/mnt/d/...`，或 `D:/...`

## 2026/4/9新加
&emsp;&emsp;更新了三个东西  
&emsp;&emsp;1.添加了“https://github.com/Plana-EpicTankCommander/musicpage”仓库作为第二个音乐源  
&emsp;&emsp;2.添加了文章内的嵌入音乐播放器，通过[music：；title：]的格式调出  
&emsp;&emsp;3.给网页左下角添加了一个小玩具  
