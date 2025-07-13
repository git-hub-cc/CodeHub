# CodeHub
CodeHub is a lightning-fast query tool designed for developers, aimed at helping users quickly retrieve common commands, framework documentation, and other development-related knowledge. It also integrates personal note management. Whether you're looking up Linux commands, frontend framework usage, or recording personal learning experiences, CodeHub provides an efficient and convenient experience.

## ✨ Key Features

*   **Multi-dimensional Knowledge Query**:
    *   **Commands**: Supports quick search and detailed viewing of various commands for Linux, PowerShell, Git, Docker, K8S, npm, Maven, Pip, Scoop, SQL, and more.
    *   **Frameworks**: Includes common concepts and techniques for mainstream frameworks like SpringBoot, Vue, React, Tailwind.
    *   **Others**: Contains general development knowledge such as design patterns, regular expressions, Markdown syntax, HTTP protocol.
    *   Each entry provides a concise summary, detailed explanation, shell type (if applicable), practical example code, and supports one-click copying.

*   **Built-in Note Management**:
    *   **Note Sets**: Create and manage multiple note sets to categorize your notes.
    *   **CRUD Notes**: Easily add, edit, and delete notes. Each note includes a question and an answer, with answers supporting Markdown format.
    *   **Note Search**: Quickly search for questions or answer content within the current note set.

*   **Global Search & Filtering**: Real-time filtering of results via the search bar, and switching between different data sources (commands, frameworks, others) using the dropdown menu.
*   **Code Block Copy**: One-click copy for all code examples and code blocks in note answers.
*   **Dark/Light Theme**: Supports theme switching to suit different preferences.
*   **Responsive Design**: Provides a good user experience on both desktop and mobile devices.
*   **Offline Availability**: Data is automatically cached in the browser's IndexedDB after loading, supporting offline access (initial load requires an internet connection).

## 🚀 How to Use

CodeHub is a purely frontend application, requiring no backend services or complex configurations.

1.  **Download or Clone the Project**:
    ```bash
    git clone https://github.com/git-hub-cc/CodeHub.git
    cd CodeHub
    ```
2.  **Open `index.html` File**:
    Simply open the `index.html` file in the project's root directory in your browser to start using it.

### 🔎 Search Functionality

*   Type keywords into the search bar at the top of the page; results will appear in real-time in the left-hand list.
*   Use the `↑` (Up) and `↓` (Down) arrow keys to navigate search results.
*   Press `Enter` or click on a list item to view detailed information.
*   Click the dropdown menu next to the search bar to switch between different data sources for commands, frameworks, and other knowledge.

### 📝 Note Management

*   Click the "笔记" (Notes) toggle button at the top to enter the note management interface.
*   **Add a Note Set**: Click the "新建" (New) button and enter a name for the new note set.
*   **Switch Note Sets**: Click the note set dropdown menu and select a different note set.
*   **Add a Note**: Type your question into the input box below the left-hand list and click the "添加" (Add) button.
*   **Edit/Delete a Note**: In the note detail area on the right, you can edit the question and answer of a note, or delete the current note.

### 🌓 Theme Toggle

*   Click the sun/moon icon in the top right corner to switch between dark and light themes.

## 🛠️ Technology Stack

*   **Frontend**:
    *   HTML5
    *   CSS3 (with [Tailwind CSS](https://tailwindcss.com/) for styling)
    *   JavaScript (Vanilla JS)
*   **Data Storage**:
    *   [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (for notes and data caching)
*   **Core Libraries**:
    *   [Fuse.js](https://fusejs.io/) (a powerful fuzzy-search library)
    *   [Marked.js](https://marked.js.org/) (Markdown parser)

## 📁 Project Structure

```
CodeHub/
├── css/
│   └── custom.css             # Custom styles
├── data/                      # JSON data files for commands, frameworks, etc.
│   ├── commands/
│   ├── frameworks/
│   └── other/
├── img/
│   └── icons/                 # Icon files
├── js/
│   ├── app.js                 # Main application logic
│   ├── db.js                  # IndexedDB database operations
│   ├── notes.js               # Note management logic
│   ├── ui.js                  # User interface operations & DOM element management
│   └── tailwind.config.js     # Tailwind CSS configuration file
├── lib/                       # External library files
│   ├── fuse.min.js
│   ├── marked.min.js
│   └── tailwindcss/
├── templates.html             # UI templates (dynamically loaded via JS)
├── index.html                 # Project entry point
└── README.md                  # Project Readme (this file)
```

## 🙏 Acknowledgements

The command data section of this project, particularly Linux commands, draws inspiration and data references from the [jaywcjlove/linux-command](https://github.com/jaywcjlove/linux-command) project.

Many thanks to the original author [jaywcjlove](https://github.com/jaywcjlove) for their selfless sharing and hard work in providing valuable resources to the community!

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---