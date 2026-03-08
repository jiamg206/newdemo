# 项目结构（重构后）

## 核心目录

`src/app/config`
- `constants.js`: 统一摄影参数、功率档位、默认模型、附件配置常量。

`src/app/state`
- `factories.js`: `createLight/createFlag` 等状态工厂，避免 UI 内部硬编码。

`src/app/utils`
- `lightingMath.js`: 曝光换算、色温换算、朝向计算、模型归一化等纯函数。
- `exportLightingDiagram.js`: 2D 布光图导出能力。
- `renderStore.js`: 基于 IndexedDB 的本地渲染图存储层。

`src/app/hooks`
- `useManipulator.js`: 3D 对象拖拽与旋转交互。
- `useLocalRenders.js`: 本地作品库读写与生命周期管理。

`src/app/scene`
- `StudioScene.jsx`: 场景组合入口（相机、灯光、人物、边界、后期）。
- `SubjectActor.jsx`: 模型加载、白模/贴图材质、导入容错。
- `LightRig.jsx`: 灯头、附件、闪光/常亮计算与投射。
- `SceneHelpers.jsx`: 相机设备、边界、旗板、曝光控制。
- `CaptureBridge.jsx`: 4K 帧捕获桥接。

`src/app/ui`
- `TopBar.jsx`: 全局摄影参数和动作按钮。
- `LeftSidebar.jsx`: 模特/灯光/场景配置面板。
- `RightInspector.jsx`: 分组引闪器控制台。
- `RenderGallery.jsx`: 本地渲染图浏览与删除。
- `RenderModal.jsx` + `TopViewModal.jsx`: 渲染预览和俯视图弹窗。

## 拆分收益

- 单文件职责清晰，后续新增附件或灯光类型不再触发全量回归。
- 数学与渲染逻辑与 UI 解耦，方便迁移到协作后端或 worker。
- 本地作品库抽象为存储层，后续可平滑替换成云存储 API。
