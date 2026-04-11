import { createHash } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

type ContentSection = 'novels' | 'images' | 'musics';

const LOCAL_CONTENT_PREFIX = '/__local-content';

const CONTENT_DIR_ENV_KEYS: Record<ContentSection, string> = {
    novels: 'LOCAL_NOVELS_DIR',
    images: 'LOCAL_IMAGES_DIR',
    musics: 'LOCAL_MUSICS_DIR',
};

const CONTENT_DEFAULT_SUBDIRS: Record<ContentSection, string> = {
    novels: 'novels',
    images: 'images',
    musics: 'media',
};

const MIME_TYPES: Record<string, string> = {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.md': 'text/markdown; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.png': 'image/png',
    '.wav': 'audio/wav',
    '.webp': 'image/webp',
};

function resolveEnvPath(root: string, value: string): string {
    const trimmedValue = value.trim();

    if (path.isAbsolute(trimmedValue)) {
        return path.resolve(trimmedValue);
    }

    // In WSL, paths like D:/foo or D:\foo are not considered absolute by node:path.
    const windowsDriveMatch = /^([A-Za-z]):[\\/](.*)$/.exec(trimmedValue);
    if (windowsDriveMatch && process.platform !== 'win32') {
        const [, drive, rest] = windowsDriveMatch;
        const normalizedRest = rest.replace(/\\/g, '/');
        return path.posix.normalize(`/mnt/${drive.toLowerCase()}/${normalizedRest}`);
    }

    return path.resolve(root, trimmedValue);
}

function isExistingDirectory(dir: string | undefined): dir is string {
    if (!dir || !existsSync(dir)) {
        return false;
    }

    try {
        return statSync(dir).isDirectory();
    } catch {
        return false;
    }
}

function resolveSectionDirs(
    env: Record<string, string>,
    root: string
): Partial<Record<ContentSection, string>> {
    const configuredRoot = env.LOCAL_CONTENT_ROOT
        ? resolveEnvPath(root, env.LOCAL_CONTENT_ROOT)
        : null;

    return (Object.keys(CONTENT_DIR_ENV_KEYS) as ContentSection[]).reduce(
        (dirs, section) => {
            const sectionDir = env[CONTENT_DIR_ENV_KEYS[section]];

            if (sectionDir) {
                dirs[section] = resolveEnvPath(root, sectionDir);
                return dirs;
            }

            if (configuredRoot) {
                dirs[section] = path.resolve(configuredRoot, CONTENT_DEFAULT_SUBDIRS[section]);
            }

            return dirs;
        },
        {} as Partial<Record<ContentSection, string>>
    );
}

function normalizeRelativePath(filePath: string): string {
    return path.posix.normalize(filePath.replace(/\\/g, '/'));
}

function buildLocalContentUrl(section: ContentSection, filePath: string): string {
    const searchParams = new URLSearchParams({
        path: filePath,
        section,
    });

    return `${LOCAL_CONTENT_PREFIX}/raw?${searchParams.toString()}`;
}

function guessMimeType(filePath: string): string {
    return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function parseRangeHeader(
    rangeHeader: string,
    fileSize: number
): { end: number; start: number } | null {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());

    if (!match) {
        return null;
    }

    const [, startText, endText] = match;
    let start = startText ? Number(startText) : null;
    let end = endText ? Number(endText) : null;

    if ((startText && Number.isNaN(start)) || (endText && Number.isNaN(end))) {
        return null;
    }

    if (start === null && end === null) {
        return null;
    }

    if (start === null && end !== null) {
        if (end <= 0) {
            return null;
        }

        start = Math.max(fileSize - end, 0);
        end = fileSize - 1;
    }

    if (start !== null && end === null) {
        end = fileSize - 1;
    }

    if (start === null || end === null) {
        return null;
    }

    if (start < 0 || start >= fileSize || end < start) {
        return null;
    }

    if (end >= fileSize) {
        end = fileSize - 1;
    }

    return { end, start };
}

function createLocalContentPlugin(env: Record<string, string>, root: string): Plugin {
    const sectionDirs = resolveSectionDirs(env, root);
    const availableSections: Record<ContentSection, boolean> = {
        images: isExistingDirectory(sectionDirs.images),
        musics: isExistingDirectory(sectionDirs.musics),
        novels: isExistingDirectory(sectionDirs.novels),
    };

    const sendJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(payload));
    };

    const sendError = (res: ServerResponse, statusCode: number, message: string) => {
        sendJson(res, statusCode, { message });
    };

    const buildFileMeta = (filePath: string) => {
        const normalizedPath = normalizeRelativePath(filePath);

        return {
            path: normalizedPath,
            sha: createHash('sha1').update(normalizedPath).digest('hex'),
        };
    };

    const resolveLocalFilePath = (section: ContentSection, filePath: string): string | null => {
        const baseDir = sectionDirs[section];

        if (!isExistingDirectory(baseDir)) {
            return null;
        }

        const normalizedPath = normalizeRelativePath(filePath);

        if (
            normalizedPath === '..' ||
            normalizedPath.startsWith('../') ||
            normalizedPath.includes('/../')
        ) {
            return null;
        }

        const resolvedPath = path.resolve(baseDir, normalizedPath);
        const relativePath = path.relative(baseDir, resolvedPath);

        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            return null;
        }

        return resolvedPath;
    };

    const middleware: Connect.NextHandleFunction = async (req, res, next) => {
        if (!req.url) {
            next();
            return;
        }

        const requestUrl = new URL(req.url, 'http://localhost');

        if (!requestUrl.pathname.startsWith(LOCAL_CONTENT_PREFIX)) {
            next();
            return;
        }

        if (requestUrl.pathname === `${LOCAL_CONTENT_PREFIX}/config`) {
            sendJson(res, 200, {
                enabled: Object.values(availableSections).some(Boolean),
                sections: availableSections,
            });
            return;
        }

        const section = requestUrl.searchParams.get('section');

        if (!section || !(section in availableSections)) {
            sendError(res, 400, '缺少有效的 section 参数');
            return;
        }

        const contentSection = section as ContentSection;

        if (!availableSections[contentSection]) {
            sendError(res, 404, `本地 ${contentSection} 目录未配置或不存在`);
            return;
        }

        if (requestUrl.pathname === `${LOCAL_CONTENT_PREFIX}/list`) {
            try {
                const baseDir = sectionDirs[contentSection]!;
                const entries = await fs.readdir(baseDir, { withFileTypes: true });
                const files = entries.map((entry) => {
                    const meta = buildFileMeta(entry.name);

                    return {
                        download_url: entry.isFile()
                            ? buildLocalContentUrl(contentSection, meta.path)
                            : undefined,
                        name: entry.name,
                        path: meta.path,
                        sha: meta.sha,
                        type: entry.isDirectory() ? 'dir' : 'file',
                    };
                });

                sendJson(res, 200, files);
            } catch (error) {
                console.error('读取本地目录失败:', error);
                sendError(res, 500, '读取本地目录失败');
            }

            return;
        }

        const filePath = requestUrl.searchParams.get('path');

        if (!filePath) {
            sendError(res, 400, '缺少 path 参数');
            return;
        }

        const resolvedPath = resolveLocalFilePath(contentSection, filePath);

        if (!resolvedPath) {
            sendError(res, 400, '无效的文件路径');
            return;
        }

        try {
            const stats = await fs.stat(resolvedPath);

            if (!stats.isFile()) {
                sendError(res, 404, '目标不是文件');
                return;
            }

            const meta = buildFileMeta(filePath);

            if (requestUrl.pathname === `${LOCAL_CONTENT_PREFIX}/file`) {
                const content = await fs.readFile(resolvedPath);

                sendJson(res, 200, {
                    content: content.toString('base64'),
                    download_url: buildLocalContentUrl(contentSection, meta.path),
                    name: path.basename(resolvedPath),
                    path: meta.path,
                    sha: meta.sha,
                });
                return;
            }

            if (requestUrl.pathname === `${LOCAL_CONTENT_PREFIX}/raw`) {
                const mimeType = guessMimeType(resolvedPath);
                const rangeHeader = req.headers.range;

                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Content-Type', mimeType);

                if (rangeHeader) {
                    const range = parseRangeHeader(rangeHeader, stats.size);

                    if (!range) {
                        res.statusCode = 416;
                        res.setHeader('Content-Range', `bytes */${stats.size}`);
                        res.end();
                        return;
                    }

                    const { end, start } = range;
                    res.statusCode = 206;
                    res.setHeader('Content-Length', String(end - start + 1));
                    res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
                    createReadStream(resolvedPath, { end, start }).pipe(res);
                    return;
                }

                res.statusCode = 200;
                res.setHeader('Content-Length', String(stats.size));
                createReadStream(resolvedPath).pipe(res);
                return;
            }

            sendError(res, 404, '未知的本地内容接口');
        } catch (error) {
            console.error('读取本地文件失败:', error);
            sendError(res, 404, '读取本地文件失败');
        }
    };

    return {
        configurePreviewServer(server) {
            server.middlewares.use(middleware);
        },
        configureServer(server) {
            server.middlewares.use(middleware);
        },
        name: 'local-content-plugin',
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: './',
        publicDir: 'public',
        server: {
            host: '0.0.0.0',
            port: 5173,
        },
        plugins: [vue(), createLocalContentPlugin(env, process.cwd())],
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.names?.includes('.svg')) {
                            return 'assets/[name].[hash].[ext]';
                        }

                        return '[name].[hash].[ext]';
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
    };
});
