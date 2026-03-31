/**
 * 嵌入式音乐播放器
 * 用法：在 Markdown 中写 :::music{url=音乐链接}[标题]:::
 */

export function initMusicEmbed() {
  // 查找包含 :::music 的文本节点
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  )

  const nodesToProcess = []
  let node
  while ((node = walker.nextNode())) {
    if (node.textContent.includes(':::music')) {
      nodesToProcess.push(node)
    }
  }

  // 替换每个节点
  nodesToProcess.forEach(textNode => {
    const parent = textNode.parentNode
    if (!parent) return

    const html = parent.innerHTML
    const replaced = html.replace(
      /:::music\{url=([^}]+)\}\[([^\]]+)\]:::/g,
      (match, url, title) => {
        return createMusicPlayerHTML(url, title)
      }
    )
    parent.innerHTML = replaced
  })
}

// 生成播放器 HTML
function createMusicPlayerHTML(url, title) {
  const id = 'player-' + Math.random().toString(36).substr(2, 9)
  return `
    <div class="music-embed" data-url="${encodeURIComponent(url)}" data-title="${encodeURIComponent(title)}">
      <div class="music-card" onclick="window.toggleMusicEmbed('${id}')">
        <div class="music-icon">🎵</div>
        <div class="music-info">
          <div class="music-title">${escapeHtml(title)}</div>
          <div class="music-url">点击播放</div>
        </div>
        <button class="play-btn" id="btn-${id}">▶</button>
      </div>
      <audio id="audio-${id}" src="${encodeURIComponent(url)}" preload="metadata"></audio>
    </div>
  `
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 播放/暂停功能 - 全局函数
window.toggleMusicEmbed = function(id) {
  const audio = document.getElementById('audio-' + id)
  const btn = document.getElementById('btn-' + id)
  
  if (!audio || !btn) return
  
  // 暂停其他所有音频
  document.querySelectorAll('.music-embed audio').forEach(a => {
    if (a !== audio) {
      a.pause()
      const otherBtn = document.getElementById('btn-' + a.id.replace('audio-', ''))
      if (otherBtn) otherBtn.textContent = '▶'
    }
  })
  
  if (audio.paused) {
    audio.play()
    btn.textContent = '⏸'
  } else {
    audio.pause()
    btn.textContent = '▶'
  }
  
  audio.onended = () => {
    btn.textContent = '▶'
  }
}

// 添加 CSS 样式
const style = document.createElement('style')
style.textContent = `
.music-embed {
  margin: 16px 0;
}
.music-card {
  display: flex;
  align-items: center;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.music-card:hover {
  background: rgba(0, 212, 255, 0.2);
}
.music-icon {
  font-size: 24px;
}
.music-info {
  flex: 1;
}
.music-title {
  font-weight: 500;
  color: #fff;
  font-size: 14px;
}
.music-url {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}
.play-btn {
  background: #00d4ff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 12px;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
`
document.head.appendChild(style)