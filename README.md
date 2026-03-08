# Photon Studio Demo

专业摄影布光预演工具（React + Vite + Three.js + R3F）。

## 本地开发

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

打开 `http://localhost:5173`。

## 关键能力

- 双视图：主工作区 + 右下角实时相机画中画。
- 灯光系统：分组引闪器、闪光档位、造型灯、附件链路。
- 物理相机参数：ISO / 快门 / 光圈 / 焦段驱动曝光。
- 4K 渲染：导出 3840x2160 PNG。
- 本地作品库：渲染图保存在浏览器 IndexedDB，支持预览/下载/删除。

## Docker 部署

### 构建镜像

```bash
docker build -t photon-studio:latest .
```

### 运行容器

```bash
docker run -d --name photon-studio -p 8080:80 photon-studio:latest
```

访问 `http://localhost:8080`。

### 使用 docker-compose

```bash
docker compose up -d --build
```

## 项目结构

详见：

- [docs/ARCHITECTURE.md](/C:/Users/20641/Desktop/newdemo/docs/ARCHITECTURE.md)
- [docs/PRODUCT_BACKLOG.md](/C:/Users/20641/Desktop/newdemo/docs/PRODUCT_BACKLOG.md)
