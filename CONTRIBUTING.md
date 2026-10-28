# 开发与发布指南

面向仓库维护者与贡献者。使用者请看 [README](./README.md)。

## 环境要求

- Node.js `>= 18`
- npm `>= 9`

## 常用命令

```bash
npm install        # 安装依赖
npm run dev        # 启动 playground：http://localhost:5173
npm run typecheck  # 类型检查（含 playground）
npm run build      # 产出 dist/（ESM + CJS + d.ts + style.css）
npm run preview    # 预览构建产物
```

## 目录结构

```
.
├─ src/
│  ├─ index.ts                 # 包入口：组件、组合式函数、工具、类型、插件
│  ├─ types.ts                 # Track / LoopMode / PlayerVariant / Props
│  ├─ composables/
│  │  ├─ useAudioPlayer.ts     # 播放内核（HTMLAudioElement 封装）
│  │  └─ useAudioAnalyser.ts   # Web Audio 频谱分析
│  ├─ components/
│  │  ├─ MusicPlayer.vue       # 主组件（卡片）
│  │  ├─ PlayerFullscreen.vue  # 全屏视图（歌词 + 频谱）
│  │  ├─ PlayerSlider.vue      # 无障碍滑块
│  │  └─ PlayerPlaylist.vue    # 播放列表
│  ├─ utils/
│  │  ├─ format.ts             # 时间格式化
│  │  └─ lrc.ts                # LRC 解析
│  └─ styles/
│     ├─ index.css             # 按序 @import：base → variants → fullscreen
│     ├─ base.css              # 结构层（布局、尺寸、交互过渡）
│     ├─ fullscreen.css        # 全屏视图
│     └─ variants/             # 四套皮肤
├─ playground/                 # 本地演示页，不随包发布
└─ .github/workflows/          # CI 与发布流水线
```

## 约定

- **样式分层**：`base.css` 只写结构与尺寸，视觉身份放 `variants/*.css`；新增皮肤时在 `src/styles/variants/` 建文件、在 `index.css` 末尾追加 `@import`，并同步 `PlayerVariant` 类型与组件默认值。
- **皮肤必须能使用同一份 DOM**：不要为单个皮肤修改模板结构，用 CSS 覆盖解决。
- **变量优先**：配色、字体、圆角、阴影一律走 `--mp-*` 变量，便于宿主覆盖。
- **播放内核不含 DOM**：`useAudioPlayer` 只依赖 `HTMLAudioElement`，不得引入组件或样式。
- **提交前自检**：`npm run typecheck` 与 `npm run build` 必须通过。

## 浏览器验证

`playground/` 内置离线演示音源（本地合成的 WAV Blob），不依赖任何 CDN，断网也能试听。需要真实音源时改 `playground/tracks.ts` 的 `src` 即可。

## 发布流程

发布由 [`.github/workflows/release.yml`](./.github/workflows/release.yml) 完成，推送 `v*` 标签即触发。

### 一次性准备

1. 在 npm 创建 `@hefuhai001` scope，生成一枚具备发布权限的 **Granular Access Token**。
2. 在 GitHub 仓库 `Settings → Secrets and variables → Actions` 添加 `NPM_TOKEN`。

### 发起发布

```bash
# 1. 升版本号（同步 package-lock.json，不自动打 tag）
npm version 1.0.0 --no-git-tag-version

# 2. 提交、打标签、推送到 GitHub
git add -A && git commit -m "chore: release v1.0.0"
git tag v1.0.0
git push github master --tags
```

流水线会执行：`npm ci` → `typecheck` → `build` → 校验 tag 与 `package.json` 版本一致 →
`npm publish --access public --provenance` → 创建 GitHub Release。

### 注意事项

- 标签与 `package.json` 版本不一致时流水线会直接失败，避免发错版本。
- `--provenance` 要求仓库为公开仓库且具备 `id-token: write` 权限；若为私有仓库，删除该参数。
- 本地应急发布：`NODE_AUTH_TOKEN=<你的 npm token> npm publish --access public`。
- Gitee 仅作为镜像，CI/CD 走 GitHub Actions。

## 贡献

- Issue 与 PR 中英文均可。
- PR 请说明动机与行为变化；涉及视觉改动建议附截图（四套皮肤都要验证）。
- 新增对外 API 时同步更新 README 的中英文两个版本。
