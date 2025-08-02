// CustomSelect Class with loop prevention
class CustomSelect {
  constructor(element) {
    this.element = element;
    this.trigger = element.querySelector(".custom-select-trigger");
    this.optionsContainer = element.querySelector(".custom-select-options");
    this.valueElement = element.querySelector(".custom-select-value");
    this.isOpen = false;
    this.selectedValue = "";
    this.bindEvents();
  }
  bindEvents() {
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });
    document.addEventListener("click", () => this.close());
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  open() {
    document
      .querySelectorAll(".custom-select-options.active")
      .forEach((el) => el.classList.remove("active"));
    document
      .querySelectorAll(".custom-select-trigger.active")
      .forEach((el) => el.classList.remove("active"));
    this.isOpen = true;
    this.trigger.classList.add("active");
    this.optionsContainer.classList.add("active");
  }
  close() {
    this.isOpen = false;
    this.trigger.classList.remove("active");
    this.optionsContainer.classList.remove("active");
  }
  selectOption(optionElement, triggerChangeEvent = true) {
    this.optionsContainer
      .querySelectorAll(".selected")
      .forEach((el) => el.classList.remove("selected"));
    optionElement.classList.add("selected");
    this.valueElement.textContent = optionElement.textContent;
    this.selectedValue = optionElement.dataset.value;
    if (triggerChangeEvent) {
      this.element.dispatchEvent(
        new CustomEvent("change", { detail: { value: this.selectedValue } })
      );
    }
    this.close();
  }
  populate(optionsArray, selectedValue) {
    this.optionsContainer.innerHTML = "";
    let selectedOptionText = "Select...";
    optionsArray.forEach((option) => {
      const optionEl = document.createElement("div");
      optionEl.className = "custom-select-option";
      optionEl.dataset.value = typeof option === "object" ? option.id : option;
      optionEl.textContent = typeof option === "object" ? option.name : option;
      if (optionEl.dataset.value === selectedValue) {
        optionEl.classList.add("selected");
        selectedOptionText = optionEl.textContent;
      }
      optionEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectOption(optionEl);
      });
      this.optionsContainer.appendChild(optionEl);
    });
    this.valueElement.textContent = selectedOptionText;
    this.selectedValue = selectedValue;
  }
  getValue() {
    return this.selectedValue;
  }
  setValue(value) {
    const option = this.optionsContainer.querySelector(
      `[data-value="${value}"]`
    );
    if (option) {
      this.selectOption(option, false);
    } else {
      this.valueElement.textContent = "Select...";
      this.selectedValue = "";
    }
  }

  setEnabled(enabled) {
    this.disabled = !enabled;
    if (this.disabled) {
      this.trigger.classList.add("disabled");
    } else {
      this.trigger.classList.remove("disabled");
    }
  }

  setPlaceholder(text) {
    this.placeholderText = text;
    // Update the display text only if no value is currently selected
    if (!this.getValue()) {
      this.valueElement.textContent = text;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // --- STATE MANAGEMENT ---
  let post = {
    title: "",
    author: "",
    category: "",
    cardImage: "",
    content: [],
  };
  let categories = [];
  let indexHtmlContent = null;
  let blogHtmlContent = null;
  let lastFocusedTextarea = null;
  let activeContentIndex = null;
  let lastSavedImagePath = null;
  let aiSettings = {
    keys: { openai: "", groq: "", hf: "", gemini: "" },
    models: { text: "", image: "", dynamic: { groq: [] } },
  };
  let generatedImageData = { url: "", blob: null };
  let aiClipboard = "";
  const placeholders = {
    p: "Enter new paragraph text...",
    "p-bold": "Enter bold text...",
    h2: "New heading...",
    caption: "Image caption...",
    imgSrc: "Image URL (e.g., images/photo.jpg)",
    ul: "- First item\n- Second item",
  };

  // --- DOM ELEMENTS ---
  const mainContainer = document.getElementById("editor-main-container");
  const titleInput = document.getElementById("postTitle");
  const authorInput = document.getElementById("postAuthor");
  const categorySelect = new CustomSelect(
    document.getElementById("postCategory")
  );
  const newCategoryInput = document.getElementById("newCategoryInput");
  const cardImageInput = document.getElementById("cardImageInput");
  const cardImagePreview = document.getElementById("cardImagePreview");
  const filenameInput = document.getElementById("postFilename");
  const preview = document.getElementById("live-preview");
  const previewContainer = document.getElementById("editor-preview-container");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const addLinkBtn = document.getElementById("addLinkBtn");
  const addBulletListBtn = document.getElementById("addBulletListBtn");
  const addSpacerBtn = document.getElementById("addSpacerBtn");
  const aiSettingsBtn = document.getElementById("aiSettingsBtn");
  const aiSettingsModal = document.getElementById("ai-settings-modal");
  const closeModalBtn = document.querySelector(".close-modal-btn");
  const saveAiSettingsBtn = document.getElementById("save-ai-settings-btn");
  const openaiApiKeyInput = document.getElementById("openai-api-key");
  const groqApiKeyInput = document.getElementById("groq-api-key");
  const hfApiKeyInput = document.getElementById("hf-api-key");
  const geminiApiKeyInput = document.getElementById("gemini-api-key");
  const defaultTextModelSelect = new CustomSelect(
    document.getElementById("default-text-model")
  );
  const defaultImageModelSelect = new CustomSelect(
    document.getElementById("default-image-model")
  );
  const aiAssistantWrapper = document.getElementById("ai-assistant-wrapper");
  const aiTextPrompt = document.getElementById("ai-text-prompt");
  const aiCopyPasteBtn = document.getElementById("ai-copy-paste-btn");
  const aiContinuePostBtn = document.getElementById("ai-continue-post-btn");
  const aiSuggestTitlesBtn = document.getElementById("ai-suggest-titles-btn");
  const aiImagePrompt = document.getElementById("ai-image-prompt");
  const aiGenerateImageBtn = document.getElementById("ai-generate-image-btn");
  const aiImagePreviewContainer = document.getElementById(
    "ai-image-preview-container"
  );
  const aiGeneratedImage = document.getElementById("ai-generated-image");
  const aiSetCardImageBtn = document.getElementById("ai-set-card-image-btn");
  const aiInsertImageBtn = document.getElementById("ai-insert-image-btn");
  const aiDownloadImageBtn = document.getElementById("ai-download-image-btn");
  const openAiSettingsLink = document.getElementById("open-ai-settings-link");
  const aiTabsContainer = document.querySelector(".ai-assistant-tabs");
  const loadCardImageBtn = document.getElementById("loadCardImageBtn");
  const cardImageFileInput = document.getElementById("cardImageFileInput");
  const innerImageFileInput = document.getElementById("innerImageFileInput");

  // --- AI CONFIGURATION ---
  const AI_MODELS = {
    "gpt-4o": { provider: "openai", type: "text" },
    "gpt-3.5-turbo": { provider: "openai", type: "text" },
    "gemini-1.5-pro-latest": { provider: "gemini", type: "text" },
    "dall-e-3": { provider: "openai", type: "image" },
    "dall-e-2": { provider: "openai", type: "image" },
    "flux-schnell": {
      provider: "hf",
      modelId: "black-forest-labs/FLUX.1-schnell",
      type: "image",
    },
    "flux-dev": {
      provider: "hf",
      modelId: "deep-floyd/FLUX.1-dev",
      type: "image",
    },
    "stable-diffusion-xl": {
      provider: "hf",
      modelId: "stabilityai/stable-diffusion-xl-base-1.0",
      type: "image",
    },
    "segmind-vega": {
      provider: "hf",
      modelId: "segmind/Segmind-Vega",
      type: "image",
    },
    "deepfloyd-if": {
      provider: "hf",
      modelId: "DeepFloyd/IF-I-M-v1.0",
      type: "image",
    },
  };

  // --- CORE EDITOR FUNCTIONS ---
  function renderPreview() {
    titleInput.value = post.title;
    authorInput.value = post.author;
    categorySelect.setValue(post.category);
    cardImageInput.value = post.cardImage;
    if (post.cardImage) {
      cardImagePreview.src = post.cardImage;
      cardImagePreview.style.display = "block";
    } else {
      cardImagePreview.style.display = "none";
    }
    if (post.title && !filenameInput.value) {
      filenameInput.value = post.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    }
    const postBodyHTML = post.content
      .map((element, index) => renderContentElement(element, index))
      .join("");
    preview.innerHTML = `<article class="blog-post"><h1>${
      post.title || "Post Title"
    }</h1><div class="post-meta"><span>By: ${
      post.author || "Author Name"
    }</span> | <span>Published: ${new Date().toLocaleDateString(
      "en-US"
    )}</span> | <span>Category: <a href="#">${
      post.category || "Category"
    }</a></span></div><div class="post-body" id="post-body-preview">${postBodyHTML}</div></article>`;
    setTimeout(() => {
      preview
        .querySelectorAll(".editable-textarea")
        .forEach(autoResizeTextarea);
    }, 0);
    updateActiveHighlight();
  }
  function renderContentElement(element, index) {
    const moveControls = `<div class="move-controls"><button class="move-up" data-index="${index}" title="Up">↑</button><button class="move-down" data-index="${index}" title="Down">↓</button><button class="delete-section" data-index="${index}" title="Delete">🗑️</button></div>`;
    const wrapperClass = `content-block ${
      element.type === "h2" ? "content-block-h2" : ""
    } ${element.type === "img" ? "content-block-img" : ""}`;
    let contentHTML = "";
    switch (element.type) {
      case "p":
        contentHTML = `<textarea rows="1" class="editable-textarea" data-index="${index}" placeholder="${placeholders.p}">${element.text}</textarea>`;
        break;
      case "p-bold":
        contentHTML = `<textarea rows="1" class="editable-textarea bold" data-index="${index}" placeholder="${placeholders["p-bold"]}">${element.text}</textarea>`;
        break;
      case "h2":
        contentHTML = `<textarea rows="1" class="editable-textarea h2" data-index="${index}" placeholder="${placeholders.h2}">${element.text}</textarea>`;
        break;
      case "img":
        if (element.isEditing) {
          const srcText =
            element.src === placeholders.imgSrc ? "" : element.src;
          const captionText =
            element.caption === placeholders.caption ? "" : element.caption;
          contentHTML = `<div class="image-editor-block" data-index="${index}"><label>Image URL:</label><div class="editable-input" contenteditable="true" data-prop="src" data-placeholder="${placeholders.imgSrc}">${srcText}</div><button class="secondary-action load-inner-image-btn" data-index="${index}">Load Image from Computer</button><label>Caption:</label><div class="editable-input" contenteditable="true" data-prop="caption" data-placeholder="${placeholders.caption}">${captionText}</div><button class="save-image-btn">Save</button></div>`;
        } else {
          contentHTML = `<figure class="in-post-figure" data-index="${index}"><img src="${
            element.src ||
            "https://placehold.co/800x450/eeeeee/aaaaaa?text=Click+to+edit"
          }" alt="${element.caption}"><figcaption>${
            element.caption
          }</figcaption></figure>`;
        }
        break;
      case "ul":
        contentHTML = `<textarea rows="2" class="editable-textarea bullet-list" data-index="${index}" placeholder="${placeholders.ul}">${element.text}</textarea>`;
        break;
      case "spacer":
        contentHTML = `<hr class="post-spacer">`;
        break;
    }
    return `<div class="${wrapperClass}" data-index="${index}">${contentHTML}${moveControls}</div>`;
  }
  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  // --- LIVE UPDATE & INTERACTIVITY ---
  function updatePostFromInputs() {
    post.title = titleInput.value.trim();
    post.author = authorInput.value.trim();
    post.category = categorySelect.getValue();
    post.cardImage = cardImageInput.value.trim();
    const imageUrl = post.cardImage;
    if (imageUrl) {
      cardImagePreview.src = imageUrl;
      cardImagePreview.style.display = "block";
    } else {
      cardImagePreview.style.display = "none";
    }
    const previewTitle = preview.querySelector("h1");
    if (previewTitle) previewTitle.textContent = post.title || "Post Title";
    const previewMeta = preview.querySelector(".post-meta");
    if (previewMeta) {
      const authorText = post.author || "Author Name";
      const categoryText = post.category || "Category";
      previewMeta.innerHTML = `<span>By: ${authorText}</span> | <span>Published: ${new Date().toLocaleDateString(
        "en-US"
      )}</span> | <span>Category: <a href="#">${categoryText}</a></span>`;
    }
  }
  [titleInput, authorInput, cardImageInput]
    .filter((el) => el)
    .forEach((input) => {
      input.addEventListener("input", updatePostFromInputs);
    });
  categorySelect.element.addEventListener("change", updatePostFromInputs);
  cardImagePreview.addEventListener("error", () => {
    cardImagePreview.style.display = "none";
  });
  preview.addEventListener("focusin", (e) => {
    if (e.target.matches(".editable-textarea")) {
      lastFocusedTextarea = e.target;
      addLinkBtn.disabled = false;
    }
  });
  preview.addEventListener("focusout", (e) => {
    if (e.target.matches(".editable-textarea")) {
      lastFocusedTextarea = null;
      addLinkBtn.disabled = true;
    }
  });
  preview.addEventListener("input", (e) => {
    const target = e.target;
    const index = parseInt(target.closest("[data-index]").dataset.index);
    if (target.matches(".editable-textarea")) {
      post.content[index].text = target.value;
      autoResizeTextarea(target);
    } else if (target.matches(".editable-input")) {
      const property = target.dataset.prop;
      post.content[index][property] = target.innerText;
    }
  });
  preview.addEventListener("click", (e) => {
    const block = e.target.closest(".content-block");
    if (block) {
      activeContentIndex = parseInt(block.dataset.index);
      updateActiveHighlight();
    }

    const button = e.target.closest("button");
    if (button) {
      let index = parseInt(button.dataset.index);

      // Load Image from Computer Button
      if (button.classList.contains("load-inner-image-btn")) {
        // Store the index so the file input knows which post element to update
        innerImageFileInput.dataset.targetIndex = index;
        innerImageFileInput.click();
        return; // Exit early
      }

      // Handle Save Image Button
      if (button.classList.contains("save-image-btn")) {
        const block = button.closest(".image-editor-block");
        index = parseInt(block.dataset.index);
        post.content[index].isEditing = false;
        updatePreviewWithAnimation(() => {
          const savedElement = preview.querySelector(
            `.content-block[data-index="${index}"]`
          );
          if (savedElement)
            savedElement.scrollIntoView({
              behavior: "instant",
              block: "center",
            });
        });
        return; // Exit early
      }

      // Handle Move Up/Down Buttons
      if (button.classList.contains("move-up") && index > 0) {
        [post.content[index], post.content[index - 1]] = [
          post.content[index - 1],
          post.content[index],
        ];
        activeContentIndex = index - 1; // Update active index
        updatePreviewWithAnimation(() => {
          const targetElement = preview.querySelector(
            `.content-block[data-index="${activeContentIndex}"]`
          );
          if (targetElement)
            targetElement.scrollIntoView({
              behavior: "instant",
              block: "center",
            });
        });
        return;
      }
      if (
        button.classList.contains("move-down") &&
        index < post.content.length - 1
      ) {
        [post.content[index], post.content[index + 1]] = [
          post.content[index + 1],
          post.content[index],
        ];
        activeContentIndex = index + 1; // Update active index
        updatePreviewWithAnimation(() => {
          const targetElement = preview.querySelector(
            `.content-block[data-index="${activeContentIndex}"]`
          );
          if (targetElement)
            targetElement.scrollIntoView({
              behavior: "instant",
              block: "center",
            });
        });
        return;
      }

      // Handle Delete Button
      if (button.classList.contains("delete-section")) {
        if (confirm("Are you sure you want to delete this section?")) {
          // Determine which block to scroll to after deletion
          const newActiveIndex = index > 0 ? index - 1 : 0;

          post.content.splice(index, 1);
          activeContentIndex = post.content.length > 0 ? newActiveIndex : null;

          updatePreviewWithAnimation(() => {
            if (activeContentIndex !== null) {
              const targetElement = preview.querySelector(
                `.content-block[data-index="${activeContentIndex}"]`
              );
              if (targetElement)
                targetElement.scrollIntoView({
                  behavior: "instant",
                  block: "center",
                });
            }
          });
        }
        return;
      }
    }

    // Handle clicking on an image to edit it
    else if (e.target.closest("figure.in-post-figure")) {
      const index = parseInt(
        e.target.closest("figure.in-post-figure").dataset.index
      );
      post.content.forEach((el, i) => {
        el.isEditing = i === index;
      });
      updatePreviewWithAnimation(() => {
        const editElement = preview.querySelector(
          `.content-block[data-index="${index}"]`
        );
        if (editElement)
          editElement.scrollIntoView({ behavior: "instant", block: "center" });
      });
    }
  });

  mainContainer.addEventListener(
    "click",
    (e) => {
      if (
        !preview.contains(e.target) &&
        !e.target.closest(".editor-controls")
      ) {
        activeContentIndex = null;
        updateActiveHighlight();
      }
    },
    true
  );
  function updateActiveHighlight() {
    preview.querySelectorAll(".content-block").forEach((block, index) => {
      if (index === activeContentIndex) {
        block.classList.add("active");
      } else {
        block.classList.remove("active");
      }
    });
  }

  // Reusable function to handle local file selection
  function handleLocalImageSelection(file, callback) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const assumedPath = `images/${file.name}`;

      showNotification({
        type: "success",
        title: "Image Loaded for Preview",
        message: `Path set to "${assumedPath}". Please ensure you have copied the file to your project's '/images/' folder.`,
      });

      callback(dataUrl, assumedPath);
    };
    reader.readAsDataURL(file);
  }

  // Event listener for the "Load Image" button for the Card Image
  loadCardImageBtn.addEventListener("click", () => {
    cardImageFileInput.click();
  });

  cardImageFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    handleLocalImageSelection(file, (dataUrl, assumedPath) => {
      cardImageInput.value = assumedPath;
      cardImagePreview.src = dataUrl;
      cardImagePreview.style.display = "block";
      updatePostFromInputs();
    });
    event.target.value = null; // Reset file input
  });

  // Event listener for the hidden file input for Inner Images
  innerImageFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    const targetIndex = parseInt(event.target.dataset.targetIndex);

    if (file && !isNaN(targetIndex)) {
      handleLocalImageSelection(file, (dataUrl, assumedPath) => {
        // Update the state directly
        post.content[targetIndex].src = assumedPath;
        // Visually update the editable input in the live preview
        const editableSrcDiv = preview.querySelector(
          `.image-editor-block[data-index="${targetIndex}"] [data-prop="src"]`
        );
        if (editableSrcDiv) editableSrcDiv.textContent = assumedPath;
      });
    }
    event.target.value = null; // Reset file input
  });

  // NEW ANIMATION FUNCTION
  function updatePreviewWithAnimation(scrollCallback = null) {
    if (!previewContainer) return;

    const onFadeOut = () => {
      renderPreview(); // Update DOM while invisible

      // Use requestAnimationFrame to ensure DOM is fully rendered before scrolling
      if (scrollCallback) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollCallback(); // Scroll after DOM is completely updated
          });
        });
      }

      previewContainer.classList.remove("fading-out"); // Start fade in
    };

    previewContainer.addEventListener("transitionend", onFadeOut, {
      once: true,
    });
    previewContainer.classList.add("fading-out");

    // Failsafe in case transitionend doesn't fire (e.g., element is hidden)
    setTimeout(() => {
      if (previewContainer.classList.contains("fading-out")) {
        onFadeOut();
      }
    }, 350);
  }

  // --- AI LOGIC ---
  function showLoading(show) {
    document.getElementById("ai-loading-overlay").style.display = show
      ? "flex"
      : "none";
  }
  function showNotification({ type, title, message }) {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    const icons = { error: "❌", warning: "⚠️", success: "✅" };
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><div class="toast-message"><h4>${title}</h4><p>${message}</p></div>`;
    document.getElementById("notification-container").appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
  }
  async function callAiApi({ model, prompt }) {
    const modelInfo = AI_MODELS[model] || { provider: "groq", type: "text" };
    const apiKey = aiSettings.keys[modelInfo.provider];
    if (!apiKey) {
      showNotification({
        type: "error",
        title: "Missing API Key",
        message: `Please add your ${modelInfo.provider.toUpperCase()} API key in AI Settings.`,
      });
      return null;
    }
    let endpoint = "";
    let options = {};
    let responsePath = null;
    if (modelInfo.provider === "openai" || modelInfo.provider === "groq") {
      endpoint =
        modelInfo.provider === "groq"
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
      if (modelInfo.type === "text") {
        const systemPrompt =
          "You are a helpful blog writing assistant. Your response should be in plain text. For lists, use simple formats like '-' for bullet points or '1.' for numbered lists. Do not use Markdown formatting like `**bold**` or `## headers`.";
        options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            max_tokens: 4096,
          }),
        };
        responsePath = (data) => data.choices[0].message.content;
      } else {
        endpoint = "https://api.openai.com/v1/images/generations";
        options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
          }),
        };
        responsePath = (data) =>
          `data:image/png;base64,${data.data[0].b64_json}`;
      }
    } else if (modelInfo.provider === "gemini") {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
      const systemPrompt =
        "You are a helpful blog writing assistant. Your response should be in plain text. For lists, use simple formats like '-' for bullet points or '1.' for numbered lists. Do not use Markdown formatting like `**bold**` or `## headers`.";
      options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      };
      responsePath = (data) => data.candidates[0].content.parts[0].text;
    } else if (modelInfo.provider === "hf") {
      endpoint = `https://api-inference.huggingface.co/models/${modelInfo.modelId}`;
      options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ inputs: prompt }),
      };
      responsePath = (data) => data;
    }
    showLoading(true);
    try {
      const response = await fetch(endpoint, options);
      if (
        modelInfo.provider === "hf" &&
        response.headers.get("content-type").includes("application/json")
      ) {
        const errorData = await response.json();
        throw { status: 503, data: errorData };
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw { status: response.status, data: errorData };
      }
      const data =
        modelInfo.provider === "hf"
          ? await response.blob()
          : await response.json();
      return responsePath(data);
    } catch (error) {
      handleApiError(error);
      return null;
    } finally {
      showLoading(false);
    }
  }
  function handleApiError(error) {
    console.error("AI API Error:", error);
    let title = "Generic Error";
    let message = "An unknown error occurred. Check the console for details.";
    if (error.status) {
      switch (error.status) {
        case 401:
          title = "Invalid API Key";
          message =
            "The provided key is invalid. Please check it in AI Settings.";
          break;
        case 429:
          title = "AI Overloaded";
          message = "Too many requests. Please wait a minute and try again.";
          break;
        case 400:
          title = "Bad Request";
          message = `The AI server rejected the request. Reason: ${
            error.data?.error?.message || "Unknown"
          }`;
          break;
        case 503:
          title = "Model Loading";
          message = `The Hugging Face model is currently loading. Please try again in a minute. (${
            error.data?.error || ""
          })`;
          break;
      }
    }
    showNotification({ type: "error", title, message });
  }
  function serializePostToMarkdown() {
    let markdown = `# ${post.title}\n\n`;
    post.content.forEach((el) => {
      switch (el.type) {
        case "h2":
          markdown += `## ${el.text}\n\n`;
          break;
        case "p":
          markdown += `${el.text}\n\n`;
          break;
        case "p-bold":
          markdown += `**${el.text}**\n\n`;
          break;
        case "ul":
          markdown += `${el.text
            .split("\n")
            .map((item) => `- ${item}`)
            .join("\n")}\n\n`;
          break;
        case "img":
          markdown += `![${el.caption}](${el.src})\n\n`;
          break;
      }
    });
    return markdown;
  }

  // --- AI FEATURE IMPLEMENTATIONS ---
  document
    .getElementById("ai-generate-text-btn")
    .addEventListener("click", async () => {
      const result = await callAiApi({
        model: aiSettings.models.text,
        prompt: aiTextPrompt.value,
      });
      if (result) {
        aiTextPrompt.value = result;
        aiCopyPasteBtn.textContent = "Copy";
      }
    });
  aiContinuePostBtn.addEventListener("click", async () => {
    const context = serializePostToMarkdown();
    const fullPrompt = `CONTEXT:\n${context}\n\n---\n\nINSTRUCTION: Continue writing the post based on the context, following this instruction: ${aiTextPrompt.value}`;
    const result = await callAiApi({
      model: aiSettings.models.text,
      prompt: fullPrompt,
    });
    if (result) {
      addContent("p", { text: result });
    }
  });
  aiSuggestTitlesBtn.addEventListener("click", async () => {
    const context = serializePostToMarkdown();
    if (context.length < 50) {
      showNotification({
        type: "warning",
        title: "Not Enough Text",
        message: "Write more content in the post for better suggestions.",
      });
      return;
    }
    const fullPrompt = `CONTEXT:\n${context}\n\n---\n\nINSTRUCTION: Based on the article context, suggest 5 creative and engaging titles in English. Return them as a numbered list (e.g., "1. ...\n2. ...").`;
    const result = await callAiApi({
      model: aiSettings.models.text,
      prompt: fullPrompt,
    });
    if (result) {
      aiTextPrompt.value = `Title Suggestions:\n${result}`;
      aiCopyPasteBtn.textContent = "Copy";
    }
  });
  aiGenerateImageBtn.addEventListener("click", async () => {
    const result = await callAiApi({
      model: aiSettings.models.image,
      prompt: aiImagePrompt.value,
    });
    if (result) {
      let imageUrl, imageBlob;
      if (typeof result === "string") {
        const response = await fetch(result);
        imageBlob = await response.blob();
        imageUrl = URL.createObjectURL(imageBlob);
      } else {
        imageBlob = result;
        imageUrl = URL.createObjectURL(imageBlob);
      }
      generatedImageData = { url: imageUrl, blob: imageBlob };
      aiGeneratedImage.src = imageUrl;
      aiImagePreviewContainer.style.display = "block";
    }
  });
  async function handleGeneratedImage(insertFunction) {
    if (!generatedImageData.blob) return;
    const suggestedFilename = `${
      aiImagePrompt.value
        .toLowerCase()
        .slice(0, 20)
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-") || "ai-image"
    }.png`;
    if (lastSavedImagePath) {
      if (
        confirm(
          `Would you like to re-use the previous path?\n\n${lastSavedImagePath}`
        )
      ) {
        insertFunction(lastSavedImagePath);
        return;
      }
    }
    downloadFile(generatedImageData.blob, suggestedFilename, "image/png");
    setTimeout(() => {
      const userFilename = prompt(
        "SAVE INSTRUCTIONS:\n\n1. Save the image to your website's 'images' folder.\n2. Enter the exact filename you used here (e.g., 'astronaut-on-mars.png').",
        suggestedFilename
      );
      if (userFilename) {
        const finalPath = `images/${userFilename.trim()}`;
        lastSavedImagePath = finalPath;
        insertFunction(finalPath);
      }
    }, 100);
  }
  aiSetCardImageBtn.addEventListener("click", () => {
    handleGeneratedImage((finalPath) => {
      cardImageInput.value = finalPath;
      updatePostFromInputs();
      showNotification({
        type: "success",
        title: "Card Image Set",
        message: `Path set to: ${finalPath}`,
      });
    });
  });
  aiInsertImageBtn.addEventListener("click", () => {
    handleGeneratedImage((finalPath) => {
      addContent("img", { src: finalPath, caption: aiImagePrompt.value });
      showNotification({
        type: "success",
        title: "Image Inserted",
        message: `Image inserted with path: ${finalPath}`,
      });
    });
  });
  aiDownloadImageBtn.addEventListener("click", () => {
    if (generatedImageData.blob) {
      downloadFile(
        generatedImageData.blob,
        `ai-generated-${Date.now()}.png`,
        "image/png"
      );
    }
  });
  function resetCopyButton() {
    aiCopyPasteBtn.textContent = "Copy";
  }
  aiTextPrompt.addEventListener("focus", resetCopyButton);
  aiTextPrompt.addEventListener("input", resetCopyButton);
  aiCopyPasteBtn.addEventListener("mousedown", (event) => {
    event.preventDefault();
    if (aiCopyPasteBtn.textContent === "Copy") {
      const textToCopy = aiTextPrompt.value;
      if (!textToCopy) return;
      navigator.clipboard.writeText(textToCopy).then(() => {
        aiClipboard = textToCopy;
        aiCopyPasteBtn.textContent = "Paste";
        showNotification({
          type: "success",
          title: "Copied",
          message: "Text copied to clipboard.",
        });
      });
    } else {
      if (!lastFocusedTextarea) {
        showNotification({
          type: "warning",
          title: "No Focus",
          message: "Click into a text field to paste.",
        });
        return;
      }
      const textarea = lastFocusedTextarea;
      const index = parseInt(textarea.dataset.index);
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value =
        textarea.value.substring(0, start) +
        aiClipboard +
        textarea.value.substring(end);
      post.content[index].text = textarea.value;
      textarea.focus();
      autoResizeTextarea(textarea);
      aiCopyPasteBtn.textContent = "Copy";
    }
  });

  // --- AI SETTINGS MODAL & FEATURE TOGGLING ---

  function toggleAiFeatures() {
    // This function combines the robust disabling from before with the new smart-switching logic.

    const hasAnyKey = Object.values(aiSettings.keys).some(
      (key) => key.trim() !== ""
    );

    // 1. Handle the case where NO keys are provided at all.
    if (!hasAnyKey) {
      aiAssistantWrapper.classList.remove("ai-enabled");
      aiAssistantWrapper.classList.add("ai-disabled");
      // Visually disable and lock both tabs and their content
      document.querySelector('[data-tab="text-ai"]').disabled = true;
      document.getElementById("text-ai").style.pointerEvents = "none";
      document.getElementById("text-ai").style.opacity = "0.5";
      document.querySelector('[data-tab="image-ai"]').disabled = true;
      document.getElementById("image-ai").style.pointerEvents = "none";
      document.getElementById("image-ai").style.opacity = "0.5";
      return; // Exit the function early
    }

    // 2. Determine which AI types have available models
    const hasTextModels = getAvailableTextModels().length > 0;
    const hasImageModels = getAvailableImageModels().length > 0;

    // 3. Enable the main wrapper if at least one AI type is available
    if (hasTextModels || hasImageModels) {
      aiAssistantWrapper.classList.add("ai-enabled");
      aiAssistantWrapper.classList.remove("ai-disabled");
    } else {
      aiAssistantWrapper.classList.remove("ai-enabled");
      aiAssistantWrapper.classList.add("ai-disabled");
    }

    // 4. Set the state for the Text AI tab and content
    const textTabButton = document.querySelector('[data-tab="text-ai"]');
    textTabButton.disabled = !hasTextModels;
    document.getElementById("text-ai").style.pointerEvents = hasTextModels
      ? "auto"
      : "none";
    document.getElementById("text-ai").style.opacity = hasTextModels
      ? "1"
      : "0.5";

    // 5. Set the state for the Image AI tab and content
    const imageTabButton = document.querySelector('[data-tab="image-ai"]');
    imageTabButton.disabled = !hasImageModels;
    document.getElementById("image-ai").style.pointerEvents = hasImageModels
      ? "auto"
      : "none";
    document.getElementById("image-ai").style.opacity = hasImageModels
      ? "1"
      : "0.5";

    // 6. NEW: Intelligent Tab Switching Logic
    const activeTabButton = document.querySelector(".ai-tab-btn.active");
    if (activeTabButton && activeTabButton.disabled) {
      // If the active tab just became disabled, switch to an available one.
      activeTabButton.classList.remove("active");
      document
        .getElementById(activeTabButton.dataset.tab)
        .classList.remove("active");

      if (!textTabButton.disabled) {
        // Check if the Text tab is now an option
        textTabButton.classList.add("active");
        document.getElementById("text-ai").classList.add("active");
      } else if (!imageTabButton.disabled) {
        // Otherwise, check if the Image tab is an option
        imageTabButton.classList.add("active");
        document.getElementById("image-ai").classList.add("active");
      }
    }
  }

  // Helper function to get available text models
  function getAvailableTextModels() {
    const textModels = [];

    // Check static models from AI_MODELS
    for (const model in AI_MODELS) {
      const info = AI_MODELS[model];
      if (info.type === "text" && aiSettings.keys[info.provider]) {
        textModels.push(model);
      }
    }

    // Add dynamic Groq models if Groq key is available
    if (aiSettings.keys.groq && aiSettings.dynamic.groq) {
      textModels.push(...aiSettings.dynamic.groq);
    }

    return textModels;
  }

  // Helper function to get available image models
  function getAvailableImageModels() {
    const imageModels = [];

    // Check static models from AI_MODELS
    for (const model in AI_MODELS) {
      const info = AI_MODELS[model];
      if (info.type === "image" && aiSettings.keys[info.provider]) {
        imageModels.push(model);
      }
    }

    return imageModels;
  }

  async function saveAiSettings() {
    // 1. Read all new values from the UI to create a "snapshot" of the desired state.
    const newKeys = {
      openai: openaiApiKeyInput.value.trim(),
      groq: groqApiKeyInput.value.trim(),
      hf: hfApiKeyInput.value.trim(),
      gemini: geminiApiKeyInput.value.trim(),
    };
    const newModels = {
      text: defaultTextModelSelect.getValue(),
      image: defaultImageModelSelect.getValue(),
    };

    // 2. Determine what has changed. This is ONLY for providing smart user feedback.
    const keysHaveChanged =
      JSON.stringify(aiSettings.keys) !== JSON.stringify(newKeys);
    const modelsHaveChanged =
      JSON.stringify(aiSettings.models) !== JSON.stringify(newModels);

    // 3. Atomically update the entire settings object in memory. This is the safest step.
    aiSettings.keys = newKeys;
    aiSettings.models = newModels;

    // 4. Perform actions ONLY if keys have changed.
    if (keysHaveChanged) {
      await testApiKeysAndPopulateModels();
    }

    // 5. Save the entire, consistent settings object to localStorage.
    localStorage.setItem("aiSettings", JSON.stringify(aiSettings));

    // 6. Finalize UI updates and provide specific feedback based on what changed.
    toggleAiFeatures();

    // Determine if we should close the modal
    let shouldCloseModal = false;

    if (keysHaveChanged && anyKeySucceeded) {
      showNotification({
        type: "success",
        title: "Keys Validated",
        message:
          "New models are available. You can now select your preferred models.",
      });
      // Keep modal open so user can select models
      shouldCloseModal = false;
    } else if (!keysHaveChanged) {
      // No key changes, check if model selection changed
      if (modelsHaveChanged) {
        showNotification({
          type: "success",
          title: "Model Selection Updated",
          message: "Your model preferences have been saved.",
        });
      } else {
        showNotification({
          type: "success",
          title: "Settings Saved",
          message: "No changes were made to your settings.",
        });
      }
      shouldCloseModal = true;
    } else if (keysHaveChanged && !anyKeySucceeded) {
      // Keys changed but all failed validation
      shouldCloseModal = false;
    }

    if (shouldCloseModal) {
      aiSettingsModal.style.display = "none";
    }
  }

  function autoSelectModels() {
    const availableTextModels = getAvailableTextModels();
    const availableImageModels = getAvailableImageModels();

    // Handle text models
    if (availableTextModels.length > 0) {
      // If no model selected or current model no longer available, select first available
      if (
        !aiSettings.models.text ||
        !availableTextModels.includes(aiSettings.models.text)
      ) {
        const firstTextModel = availableTextModels[0];
        defaultTextModelSelect.setValue(firstTextModel);
        aiSettings.models.text = firstTextModel;
      }
      // Enable the dropdown
      defaultTextModelSelect.setEnabled(true);
    } else {
      // No models available, clear selection and disable dropdown
      aiSettings.models.text = "";
      defaultTextModelSelect.setValue("");
      defaultTextModelSelect.setEnabled(false);
      defaultTextModelSelect.setPlaceholder("No API key provided");
    }

    // Handle image models
    if (availableImageModels.length > 0) {
      // If no model selected or current model no longer available, select first available
      if (
        !aiSettings.models.image ||
        !availableImageModels.includes(aiSettings.models.image)
      ) {
        const firstImageModel = availableImageModels[0];
        defaultImageModelSelect.setValue(firstImageModel);
        aiSettings.models.image = firstImageModel;
      }
      // Enable the dropdown
      defaultImageModelSelect.setEnabled(true);
    } else {
      // No models available, clear selection and disable dropdown
      aiSettings.models.image = "";
      defaultImageModelSelect.setValue("");
      defaultImageModelSelect.setEnabled(false);
      defaultImageModelSelect.setPlaceholder("No API key provided");
    }
  }

  function loadAiSettings() {
    const stored = localStorage.getItem("aiSettings");
    if (stored) {
      aiSettings = JSON.parse(stored);
    }
    if (!aiSettings.dynamic) {
      aiSettings.dynamic = { groq: [] };
    }

    // Load API keys into form fields
    openaiApiKeyInput.value = aiSettings.keys.openai || "";
    groqApiKeyInput.value = aiSettings.keys.groq || "";
    hfApiKeyInput.value = aiSettings.keys.hf || "";
    geminiApiKeyInput.value = aiSettings.keys.gemini || "";
  }

  async function testApiKeysAndPopulateModels() {
    let oneOrMoreKeysValid = false;
    aiSettings.dynamic.groq = [];

    const providersToTest = [
      {
        name: "Groq",
        key: aiSettings.keys.groq,
        endpoint: "https://api.groq.com/openai/v1/models",
        keyProperty: "groq",
      },
      {
        name: "OpenAI",
        key: aiSettings.keys.openai,
        endpoint: "https://api.openai.com/v1/models",
        keyProperty: "openai",
      },
      {
        name: "Gemini",
        key: aiSettings.keys.gemini,
        endpoint: `https://generativelanguage.googleapis.com/v1beta/models?key=${aiSettings.keys.gemini}`,
        keyProperty: "gemini",
      },
      {
        name: "Hugging Face",
        key: aiSettings.keys.hf,
        endpoint: "https://huggingface.co/api/whoami-v2",
        keyProperty: "hf",
      },
    ];

    for (const provider of providersToTest) {
      if (provider.key) {
        try {
          const headers =
            provider.name !== "Gemini"
              ? { Authorization: `Bearer ${provider.key}` }
              : {};

          const response = await fetch(provider.endpoint, { headers });

          if (!response.ok) {
            throw new Error(`${provider.name} key is invalid.`);
          }

          const data = await response.json();

          if (provider.name === "Groq") {
            aiSettings.dynamic.groq = data.data.map((model) => model.id);
          }

          showNotification({
            type: "success",
            title: `${provider.name} Key Accepted`,
            message: `Successfully connected to ${provider.name}.`,
          });

          oneOrMoreKeysValid = true;
        } catch (e) {
          showNotification({
            type: "error",
            title: `${provider.name} Key Error`,
            message: `The ${provider.name} API key is invalid or a network error occurred.`,
          });

          // Clear the invalid key
          aiSettings.keys[provider.keyProperty] = "";
        }
      } else {
        // Clear models associated with providers that have no key
        if (provider.name === "Groq") {
          aiSettings.dynamic.groq = [];
        }

        // Clear selected models if their provider key is removed
        for (const model in AI_MODELS) {
          if (AI_MODELS[model].provider === provider.keyProperty) {
            if (aiSettings.models.text === model) {
              aiSettings.models.text = "";
            }
            if (aiSettings.models.image === model) {
              aiSettings.models.image = "";
            }
          }
        }
      }
    }

    populateModelSelects();
    return oneOrMoreKeysValid;
  }

  function populateModelSelects() {
    const textModels = [];
    const imageModels = [];

    // Add static models from AI_MODELS
    for (const model in AI_MODELS) {
      const info = AI_MODELS[model];
      if (aiSettings.keys[info.provider]) {
        const option = {
          id: model,
          name: model.replace(/-/g, " ").toUpperCase(),
        };

        if (info.type === "text") {
          textModels.push(option);
        } else if (info.type === "image") {
          imageModels.push(option);
        }
      }
    }

    // Add dynamic Groq models
    if (aiSettings.keys.groq && aiSettings.dynamic.groq) {
      aiSettings.dynamic.groq.forEach((modelId) => {
        textModels.push({
          id: modelId,
          name: `${modelId.replace(/-/g, " ")} (GROQ)`,
        });
      });
    }

    // Populate the dropdowns with models (even if empty)
    defaultTextModelSelect.populate(textModels, aiSettings.models.text);
    defaultImageModelSelect.populate(imageModels, aiSettings.models.image);

    // Handle dropdown state based on availability
    if (textModels.length === 0) {
      defaultTextModelSelect.setEnabled(false);
      defaultTextModelSelect.setPlaceholder("No API key provided");
    } else {
      defaultTextModelSelect.setEnabled(true);
      defaultTextModelSelect.setPlaceholder("Select a model...");
    }

    if (imageModels.length === 0) {
      defaultImageModelSelect.setEnabled(false);
      defaultImageModelSelect.setPlaceholder("No API key provided");
    } else {
      defaultImageModelSelect.setEnabled(true);
      defaultImageModelSelect.setPlaceholder("Select a model...");
    }
  }

  aiSettingsBtn.addEventListener("click", () => {
    loadAiSettings();
    aiSettingsModal.style.display = "block";
  });
  closeModalBtn.addEventListener("click", () => {
    aiSettingsModal.style.display = "none";
  });
  saveAiSettingsBtn.addEventListener("click", saveAiSettings);
  openAiSettingsLink.addEventListener("click", (e) => {
    e.preventDefault();
    aiSettingsModal.style.display = "block";
  });
  aiTabsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("ai-tab-btn")) {
      const targetTab = e.target.dataset.tab;
      aiTabsContainer
        .querySelectorAll(".ai-tab-btn")
        .forEach((btn) => btn.classList.remove("active"));
      document
        .querySelectorAll(".ai-tab-content")
        .forEach((content) => content.classList.remove("active"));
      e.target.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    }
  });

  // --- CONTENT ADDERS & LINK BUTTON ---
  function addContent(type, props) {
    const newContent = { type, ...props };
    if (
      activeContentIndex !== null &&
      activeContentIndex < post.content.length
    ) {
      post.content.splice(activeContentIndex + 1, 0, newContent);
      activeContentIndex++;
    } else {
      post.content.push(newContent);
      activeContentIndex = post.content.length - 1;
    }
    updatePreviewWithAnimation(() => {
      const newElement = preview.querySelector(
        `.content-block[data-index="${activeContentIndex}"]`
      );
      if (newElement)
        newElement.scrollIntoView({ behavior: "instant", block: "center" });
    });
  }
  document
    .getElementById("addParagraphBtn")
    .addEventListener("click", () => addContent("p", { text: "" }));
  document
    .getElementById("addBoldParagraphBtn")
    .addEventListener("click", () => addContent("p-bold", { text: "" }));
  document
    .getElementById("addH2Btn")
    .addEventListener("click", () => addContent("h2", { text: "" }));
  document.getElementById("addImageBtn").addEventListener("click", () => {
    post.content.forEach((el) => (el.isEditing = false));
    addContent("img", {
      src: placeholders.imgSrc,
      caption: placeholders.caption,
      isEditing: true,
    });
  });
  addBulletListBtn.addEventListener("click", () =>
    addContent("ul", { text: "" })
  );
  addSpacerBtn.addEventListener("click", () => addContent("spacer", {}));
  addLinkBtn.addEventListener("mousedown", (event) => {
    event.preventDefault();
    if (!lastFocusedTextarea) {
      alert("Please click into a text field to insert a link.");
      return;
    }
    const linkText = prompt("Enter the link text:", "");
    if (!linkText) return;
    const linkUrl = prompt("Enter the link URL:", "https://");
    if (!linkUrl) return;
    const markdownLink = `[${linkText}](${linkUrl})`;
    const textarea = lastFocusedTextarea;
    const index = parseInt(textarea.dataset.index);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value =
      textarea.value.substring(0, start) +
      markdownLink +
      textarea.value.substring(end);
    post.content[index].text = textarea.value;
    textarea.focus();
    textarea.selectionEnd = start + markdownLink.length;
  });

  // --- CATEGORY & FILE HANDLING ---
  async function loadCategoriesFromFile() {
    try {
      const response = await fetch(`categories.json?v=${new Date().getTime()}`);
      if (!response.ok) throw new Error("categories.json not found!");
      categories = await response.json();
      categories.sort();
      updateCategoryDatalist();
    } catch (error) {
      console.error(error);
    }
  }
  function updateCategoryDatalist() {
    categorySelect.populate(categories, post.category);
  }
  addCategoryBtn.addEventListener("click", () => {
    const newCategory = newCategoryInput.value.trim();
    if (newCategory && !categories.includes(newCategory)) {
      categories.push(newCategory);
      categories.sort();
      post.category = newCategory;
      updateCategoryDatalist();
      newCategoryInput.value = "";
      updatePostFromInputs();
      downloadFile(
        JSON.stringify(categories, null, 2),
        "categories.json",
        "application/json"
      );
      alert(
        `Category "${newCategory}" added. Please overwrite your old categories.json with the downloaded file!`
      );
    }
  });

  document
    .getElementById("loadPostInput")
    .addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const doc = new DOMParser().parseFromString(
            e.target.result,
            "text/html"
          );
          const newPost = { content: [] };
          filenameInput.value = file.name.replace(".html", "");
          newPost.title = doc.querySelector(".blog-post h1").textContent;
          const metaText = doc.querySelector(".post-meta").textContent;
          newPost.author = metaText.match(/By: (.*?)\s*\|/)[1].trim();
          newPost.category = doc.querySelector(".post-meta a").textContent;
          // Safely find the meta tag and get its content, or default to empty string
          const cardImageMetaTag = doc.querySelector('meta[name="card-image"]');
          newPost.cardImage = cardImageMetaTag ? cardImageMetaTag.getAttribute('content') : '';
          Array.from(doc.querySelector(".post-body").children).forEach((el) => {
            const textContent = el.innerHTML.replace(/<br\s*\/?>/gi, "\n");
            if (el.tagName === "P") {
              newPost.content.push({
                type: el.querySelector("strong") ? "p-bold" : "p",
                text: textContent.replace(/<strong>|<\/strong>/g, "").trim(),
              });
            } else if (el.tagName === "H2") {
              newPost.content.push({ type: "h2", text: textContent.trim() });
            } else if (el.tagName === "UL") {
              const items = Array.from(el.querySelectorAll("li"))
                .map((li) => li.textContent)
                .join("\n");
              newPost.content.push({ type: "ul", text: items.trim() });
            } else if (el.tagName === "HR") {
              newPost.content.push({ type: "spacer" });
            } else if (el.tagName === "FIGURE") {
              let loadedSrc = el.querySelector("img").src;
              const url = new URL(loadedSrc, window.location.origin);
              if (url.pathname.includes("/posts/")) {
                loadedSrc = url.pathname.substring(
                  url.pathname.lastIndexOf("/posts/") + 7
                );
              }
              newPost.content.push({
                type: "img",
                src: loadedSrc,
                caption: el.querySelector("figcaption").textContent.trim(),
              });
            }
          });
          post = newPost;
          updatePreviewWithAnimation();
        } catch (error) {
          alert("Error parsing file.");
          console.error(error);
        }
      };
      reader.readAsText(file);
    });

  document.getElementById("generateBtn").addEventListener("click", () => {
    if (!post.title || !filenameInput.value)
      return alert("Title and Filename are required!");
    if (!indexHtmlContent || !blogHtmlContent)
      return alert("Please load index.html and blog.html to publish!");
    const postHTML = generatePostHTML(post);
    downloadFile(postHTML, `${filenameInput.value}.html`, "text/html");
    const cardHTML = generateCardHTML(post, filenameInput.value);
    const newIndexHTML = updateIndexPage(cardHTML, filenameInput.value);
    if (newIndexHTML) downloadFile(newIndexHTML, "index.html", "text/html");
    const newBlogHTML = updateBlogPage(cardHTML, filenameInput.value);
    if (newBlogHTML) downloadFile(newBlogHTML, "blog.html", "text/html");
  });
  function handleFileLoad(event, pageType) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (pageType === "index") {
        indexHtmlContent = e.target.result;
        document.getElementById("indexStatus").textContent =
          "Loaded: " + file.name;
        document.getElementById("indexStatus").style.color = "green";
      } else if (pageType === "blog") {
        blogHtmlContent = e.target.result;
        document.getElementById("blogStatus").textContent =
          "Loaded: " + file.name;
        document.getElementById("blogStatus").style.color = "green";
      }
    };
    reader.readAsText(file);
  }
  document
    .getElementById("loadIndexInput")
    .addEventListener("change", (e) => handleFileLoad(e, "index"));
  document
    .getElementById("loadBlogInput")
    .addEventListener("change", (e) => handleFileLoad(e, "blog"));
  function createCardElement(htmlString) {
    const div = document.createElement("div");
    div.innerHTML = htmlString.trim();
    return div.querySelector(".post-card");
  }
  function updateIndexPage(cardHTML, filename) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(indexHtmlContent, "text/html");
    const postsGrid = doc.querySelector(".posts-grid");
    if (!postsGrid) return null;
    const newCardElement = createCardElement(cardHTML);
    if (!newCardElement) return null;
    let postReplaced = false;
    const targetHref = `posts/${filename}.html`;
    postsGrid.querySelectorAll(".post-card").forEach((card) => {
      if (card.querySelector(`a[href="${targetHref}"]`)) {
        card.replaceWith(newCardElement);
        postReplaced = true;
      }
    });
    if (!postReplaced) {
      postsGrid.prepend(newCardElement);
      if (postsGrid.querySelectorAll(".post-card").length > 4) {
        postsGrid.lastElementChild.remove();
      }
    }
    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  }
  function updateBlogPage(cardHTML, filename) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(blogHtmlContent, "text/html");
    const postsGrid = doc.querySelector(".posts-grid");
    if (!postsGrid) return null;
    const newCardElement = createCardElement(cardHTML);
    if (!newCardElement) return null;
    let postReplaced = false;
    const targetHref = `posts/${filename}.html`;
    postsGrid.querySelectorAll(".post-card").forEach((card) => {
      if (card.querySelector(`a[href="${targetHref}"]`)) {
        card.replaceWith(newCardElement);
        postReplaced = true;
      }
    });
    if (!postReplaced) {
      postsGrid.prepend(newCardElement);
    }
    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  }
  function downloadFile(content, filename, contentType) {
    const a = document.createElement("a");
    a.href =
      typeof content === "string"
        ? `data:${contentType};charset=utf-8,${encodeURIComponent(content)}`
        : URL.createObjectURL(content);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  document.getElementById("saveDraftBtn").addEventListener("click", () => {
    localStorage.setItem("blogPostDraft", JSON.stringify(post));
    alert("Draft saved!");
  });
  function loadDraft() {
    const draft = localStorage.getItem("blogPostDraft");
    if (draft) {
      post = JSON.parse(draft);
    }
  }
  document.getElementById("newPostBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to start a new post?")) {
      post = {
        title: "",
        author: "",
        category: "",
        cardImage: "",
        content: [],
      };
      filenameInput.value = "";
      updatePreviewWithAnimation();
    }
  });

  // --- INITIALIZATION ---
  document.fonts.ready.then(async () => {
    loadDraft();
    await loadCategoriesFromFile();

    loadAiSettings();
    await testApiKeysAndPopulateModels();
    autoSelectModels();

    // Final state sync before initial render
    aiSettings.models.text = defaultTextModelSelect.getValue();
    aiSettings.models.image = defaultImageModelSelect.getValue();

    renderPreview();
    toggleAiFeatures();

    addLinkBtn.disabled = true;
  });
});

// --- TEMPLATE GENERATORS ---
function generatePostHTML(post) {
  const cleanRender = (el) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let textWithHtmlLinks = el.text
      ? el.text.replace(linkRegex, '<a href="$2" target="_blank">$1</a>')
      : "";
    let textWithBreaks = textWithHtmlLinks.replace(/\n/g, "<br>");
    switch (el.type) {
      case "p":
        return `<p>${textWithBreaks}</p>`;
      case "p-bold":
        return `<p><strong>${textWithBreaks}</strong></p>`;
      case "h2":
        return `<h2>${textWithBreaks}</h2>`;
      case "ul":
        const items = el.text
          .split("\n")
          .map((item) => `<li>${item.replace(/^- /, "")}</li>`)
          .join("\n                        ");
        return `<ul>\n                        ${items}\n                    </ul>`;
      case "spacer":
        return `<hr class="post-spacer">`;
      case "img":
        let finalSrc = el.src;
        if (
          finalSrc &&
          !finalSrc.startsWith("http") &&
          !finalSrc.startsWith("/")
        ) {
          finalSrc = `../${finalSrc}`;
        }
        return `<figure class="in-post-figure"><img src="${finalSrc}" alt="${el.caption}"><figcaption>${el.caption}</figcaption></figure>`;
      default:
        return "";
    }
  };
  const postBody = post.content.map(cleanRender).join("\n                    ");
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // Create a meta tag for the card image IF it exists.
  const cardImageMeta = post.cardImage 
    ? `<meta name="card-image" content="${post.cardImage}">` 
    : '';
  return `<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${
    post.title
  } | ModernBlog</title>${cardImageMeta}<link rel="stylesheet" href="../css/style.css"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Lato:wght@400;700&display=swap" rel="stylesheet"></head><body><header><div class="container"><a href="../index.html" class="logo">ModernBlog</a><nav><button class="menu-toggle" aria-label="Toggle Navigation">☰</button><ul><li><a href="../index.html">Home</a></li><li><a href="../about.html">About Us</a></li><li><a href="../services.html">Services</a></li><li><a href="../blog.html" class="active">Blog</a></li><li><a href="../contact.html">Contact</a></li></ul></nav></div></header><main><div class="blog-post-container"><article class="blog-post"><h1>${
    post.title
  }</h1><div class="post-meta"><span>By: ${
    post.author
  }</span> | <span>Published: ${today}</span> | <span>Category: <a href="#">${
    post.category
  }</a></span></div><div class="post-body">${postBody}</div><a href="../blog.html" class="back-to-blog">← Back to Blog</a></article></div></main><footer><div class="container"><p>© ${new Date().getFullYear()} ModernBlog. All Rights Reserved.</p></div></footer><script src="../js/script.js"></script></body></html>`;
}
function generateCardHTML(post, filename) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const plainText =
    post.content
      .find((el) => el.type === "p" || el.type === "p-bold")
      ?.text.replace(linkRegex, "$1")
      .replace(/\n/g, " ") || "A short description of the post...";
  const cardImage =
    post.cardImage ||
    `https://placehold.co/600x400/3498db/ffffff?text=${encodeURIComponent(
      post.category
    )}`;
  return `<!-- Post Card: ${
    post.title
  } -->\n<article class="post-card">\n    <a href="posts/${filename}.html" aria-label="Read more about ${
    post.title
  }">\n        <img src="${cardImage}" alt="${
    post.title
  }">\n    </a>\n    <div class="post-content">\n        <span class="post-category">${
    post.category
  }</span>\n        <h3><a href="posts/${filename}.html">${
    post.title
  }</a></h3>\n        <p>${plainText.substring(
    0,
    120
  )}...</p>\n        <a href="posts/${filename}.html" class="read-more">Read More →</a>\n    </div>\n</article>`;
}
