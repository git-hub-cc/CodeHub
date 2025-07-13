# CodeHub
CodeHub 是一个为开发者量身打造的极速查询工具，旨在帮助用户快速检索常用命令、框架资料和其他开发相关知识，并集成了个人笔记管理功能。无论是查找 Linux 命令、前端框架用法，还是记录个人学习心得，CodeHub 都能提供高效便捷的体验。

## ✨ 主要功能

*   **多维度资料查询**：
    *   **命令**：支持 Linux、PowerShell、Git、Docker、K8S、npm、Maven、Pip、Scoop、SQL 等各类命令的快速搜索和详细查看。
    *   **框架**：收录 SpringBoot、Vue、React、Tailwind 等主流框架的常用概念和技巧。
    *   **其他**：包含设计模式、正则表达式、Markdown 语法、HTTP 协议等通用开发知识。
    *   每个条目都提供简洁的摘要、详细的说明、Shell 类型（如果适用）和实用的示例代码，并支持一键复制。

*   **内置笔记管理**：
    *   **笔记集**：创建和管理多个笔记集，对笔记进行分类。
    *   **笔记增删改查**：轻松添加、编辑、删除笔记，每条笔记包含问题和答案，答案支持 Markdown 格式。
    *   **笔记搜索**：在当前笔记集中快速搜索问题或答案内容。

*   **全局搜索与过滤**：通过搜索框实时过滤结果，通过下拉菜单切换不同的资料源。
*   **代码块复制**：一键复制所有代码示例和笔记答案中的代码块。
*   **深色/浅色主题**：支持主题切换，适应不同偏好。
*   **响应式设计**：在桌面和移动设备上均有良好的使用体验。
*   **离线可用**：数据加载后会自动缓存到浏览器 IndexedDB，支持离线访问（初次加载需联网）。

## 🚀 如何使用

CodeHub 是一个纯前端应用，无需后端服务或复杂的配置。

1.  **下载或克隆项目**：
    ```bash
    git clone https://github.com/git-hub-cc/CodeHub.git
    cd CodeHub
    ```
2.  **打开 `index.html` 文件**：
    直接在浏览器中打开项目根目录下的 `index.html` 文件即可开始使用。

### 🔎 搜索功能

*   在页面顶部的搜索框中输入关键词，结果会实时显示在左侧列表。
*   使用键盘的 `↑` (上) 和 `↓` (下) 箭头键导航搜索结果。
*   按下 `Enter` 键或点击列表项可查看详细信息。
*   点击搜索框旁边的下拉菜单，可切换命令、框架、其他资料的不同数据源。

### 📝 笔记管理

*   点击顶部的 "笔记" 切换按钮，进入笔记管理界面。
*   **添加笔记集**：点击 "新建" 按钮，输入笔记集名称。
*   **切换笔记集**：点击笔记集下拉菜单，选择不同的笔记集。
*   **添加笔记**：在左侧列表下方的输入框中输入问题，点击 "添加" 按钮。
*   **编辑/删除笔记**：在右侧笔记详情区域，可对笔记的问题和答案进行编辑，也可删除当前笔记。

### 🌓 主题切换

*   点击右上角的太阳/月亮图标，即可在深色和浅色主题之间切换。

## 🛠️ 技术栈

*   **前端**：
    *   HTML5
    *   CSS3 (使用 [Tailwind CSS](https://tailwindcss.com/) 进行样式开发)
    *   JavaScript (原生 JS)
*   **数据存储**：
    *   [IndexedDB](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API) (用于笔记和数据缓存)
*   **核心库**：
    *   [Fuse.js](https://fusejs.io/) (强大的模糊搜索库)
    *   [Marked.js](https://marked.js.org/) (Markdown 解析器)

## 📁 项目结构

```
CodeHub/
├── css/
│   └── custom.css             # 自定义样式
├── data/                      # 存放命令、框架等 JSON 数据文件
│   ├── commands/
│   ├── frameworks/
│   └── other/
├── img/
│   └── icons/                 # 图标文件
├── js/
│   ├── app.js                 # 应用主逻辑
│   ├── db.js                  # IndexedDB 数据库操作
│   ├── notes.js               # 笔记功能逻辑
│   ├── ui.js                  # 用户界面操作及 DOM 元素管理
│   └── tailwind.config.js     # Tailwind CSS 配置文件
├── lib/                       # 外部库文件
│   ├── fuse.min.js
│   ├── marked.min.js
│   └── tailwindcss/
├── templates.html             # UI 模板 (通过 JS 动态加载)
├── index.html                 # 项目入口文件
└── README-cn.md               # 项目说明 (你正在阅读的这个文件)
```

## 🙏 致谢

本项目的命令数据部分，特别是 Linux 命令，受到 [jaywcjlove/linux-command](https://github.com/jaywcjlove/linux-command) 项目的启发和数据参考。

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---