<h1 align="center"><strong>ModernBlog AI - A Static HTML Blog with a Client-Side AI Editor</strong></h1>

<p align="center">
  <a href="https://youtu.be/p5NeHlfXNBc">
    <img src="https://img.youtube.com/vi/p5NeHlfXNBc/0.jpg" alt="Youtube Video">
  </a>
</p>

<p align="center">
  <a href="https://youtu.be/p5NeHlfXNBc">Create and edit blog posts effortlessly with smart AI-powered tools, all within a fast and simple static HTML setup.</a>
</p>

## Introduction

This project is a complete, modern, and responsive static HTML blog website that comes with a powerful, browser-based **AI-Assisted Blog Editor**. It's designed for users who want the speed and security of a static site without the complexity of a traditional database or Content Management System (CMS).

The entire workflow—creating, editing, and publishing—is handled locally in your browser. The editor acts as an intelligent content studio, helping you write text, generate images, and manage your posts, which are then saved as simple, clean HTML files.

## Features

### Main Website

- **Fully Responsive Design:** Looks great on desktops, tablets, and mobile devices.
- **Modern & Clean UI:** A professional design with a focus on readability.
- **Static & Secure:** No server-side code or databases to manage, making it incredibly fast and secure.
- **Core Pages Included:** Home, About Us, Services, Blog, and Contact pages are pre-built.

### The Blog Editor

- **WYSIWYG Live Preview:** See your blog post exactly as it will appear while you're writing it.
- **Rich Content Creation:**
  - Add and edit paragraphs, bolded text, and H2 headings.
  - Insert bulleted lists and visual spacers (`<hr>`).
  - Insert links using a simple Markdown-style format `[text](url)`.
- **Content Management:**
  - **Drag-and-Drop Reordering:** Easily move sections of your post up and down.
  - **Smart Insertion:** Add new content blocks exactly where you want them, below the currently active section.
  - **Delete Content Blocks:** Remove any section with a single click.
- **File & Draft Management:**
  - **Save Draft:** Saves your work-in-progress to the browser's local storage.
  - **Load Post:** Open any existing post `.html` file to re-edit it.
- **Automated Publishing Workflow:**
  - Generates a clean, final `.html` file for your new post.
  - Intelligently updates your `index.html` and `blog.html` files by generating the required "post card" snippets, ready for you to paste.

### 🤖 AI Assistant Features

- **Multi-Provider Support:** Connects to multiple leading AI services.
  - **Text Models:** OpenAI (GPT), Google (Gemini), Groq (Llama, etc.).
  - **Image Models:** OpenAI (DALL-E), Hugging Face (FLUX, Stable Diffusion, etc.).
- **Bring Your Own API Key:**
  - A secure settings panel to add your own API keys, which are stored only on your local machine.
  - **Dynamic Model Loading:** Automatically fetches and displays the available models from Groq when a valid key is provided.
- **Context-Aware Text Generation:**
  - **Continue Post:** The AI reads your entire article's context to write a coherent continuation based on your instructions.
  - **Suggest Titles:** Generates creative title ideas based on your post's content.
  - **Generate from Prompt:** Create new paragraphs from scratch.
- **AI Image Generation:**
  - Generate unique images directly within the editor using various models.
  - **Guided Save Workflow:** A seamless process prompts you to save the generated image to your `images` folder and then automatically constructs the correct relative path for you.  

Note: OpenAI API was not tested but it should work.

## Code Challenges & Solutions

This project, while appearing simple on the surface, involved several interesting technical challenges:

1.  **The Browser Sandbox & Local File System:** A web page's JavaScript cannot directly read or write files on a user's computer for security reasons.

    - **Solution:** The editor embraces this limitation by creating a "human-in-the-loop" workflow. It generates the complete HTML content for new posts and updated pages, then triggers a **download prompt**. The user is then responsible for saving the file to the correct local folder. This is the safest and most reliable way to manage a local static site from the browser.

2.  **`contenteditable` Quirks:** Early versions used `contenteditable` `divs`, which proved highly inconsistent across browsers, especially in how they handle newlines (often inserting `<div>`s or `<br>`s unpredictably).

    - **Solution:** This was solved by replacing all multi-line text fields with styled `<textarea>` elements. This provides 100% reliable control over the text content and newline characters (`\n`), ensuring consistency.

3.  **Asynchronous State & Timing Bugs:** Several subtle bugs were caused by timing issues:

    - An infinite loop was created when updating the custom dropdowns, as a `change` event would trigger a re-render, which would trigger another `change` event. This was solved by making the programmatic `setValue` method not fire a change event.
    - On a hard reload, text areas would sometimes appear with extra lines because the font hadn't loaded yet. This was solved by wrapping the entire app initialization in `document.fonts.ready.then(...)`, forcing the script to wait for fonts.
    - The "Paste" button would fail because the text area lost focus before the `click` event fired. This was fixed by using the `mousedown` event, which fires first.

4.  **Multi-API Integration:** Each AI provider has a different API endpoint, request structure, and authentication method.
    - **Solution:** A centralized `callAiApi` function was created to act as a "router." It checks the selected model, determines the provider (OpenAI, Groq, Gemini, etc.), and constructs the correct `fetch` request with the appropriate headers and body for that specific service. This makes the architecture clean and easy to extend with new providers in the future.

## Installation & Usage

This project is designed to be run from a local web server. This is necessary for the editor to be able to fetch local files like `categories.json` via the `fetch` API.

### Prerequisite

You need a simple local web server. If you have Python installed, you already have one.

### Steps

1.  **Download/Clone:** Download or clone this repository to a folder on your computer.
2.  **Navigate:** Open your terminal or command prompt and navigate into the project's root directory.
3.  **Start the Server:** Run the following command (for Python 3):
    ```bash
    python -m http.server
    ```
4.  **Open the App:** Open your web browser and go to the URL: `http://localhost:8000`.
5.  **Start Editing:**
    - Navigate to `http://localhost:8000/blog-editor.html`.
    - The first thing you should do is click the **⚙️ AI** button in the header, enter your API keys, and save the settings.
    - Create your content!
    - When you're ready to publish, use the "Generate & Publish" section. Load your `index.html` and `blog.html` files, then click the "Publish" button.
    - The editor will trigger downloads for your new post file (save it in `/posts/`) and your updated `index.html` and `blog.html` files (use them to overwrite the old versions).

## File Structure

```
/my-blog-website/
├── 📂 css/
│   ├── style.css              # For the main website
|   └── style_blog_editor.css  # For the editor only
├── 📂 images/
|   ├── 🖼️ ai-algorithms-proces.png
|   ├── 🖼️ a-woman-sitting-in-f.png
|   ├── 🖼️ blonde_camera.jpg
|   ├── 🖼️ content-is-king.jpg
|   ├── 🖼️ create-image-archit.png
|   ├── 🖼️ homeoffice.jpg
|   ├── 🖼️ idea.png
|   ├── 🖼️ marketing.jpg
|   ├── 🖼️ photorealistic-scene.png
|   ├── 🖼️ ux.jpg
|   └── 🖼️ ux2.jpg
├── 📂 js/
│   ├── 📄 editor.js         # The core logic for the blog editor
│   └── 📄 script.js         # Simple script for the main website (e.g., mobile menu)
├── 📂 posts/
|   ├── 📄ai-in-web-dev.html
|   ├── 📄archviz-post.html
|   ├── 📄storytelling-in-marketing.html
|   ├── 📄ui-ux-trends-2025.html
|   └── 📄work-life-balance.html
├── 📄 about.html
├── 📄 blog-editor.html      # The Editor Application
├── 📄 blog.html
├── 📄 categories.json       # Editable list of blog categories
├── 📄 contact.html
├── 📄 favicon.ico
├── 📄 index.html            # The main welcome page
├── 📄 README.md             # This file
└── 📄 services.html
```
