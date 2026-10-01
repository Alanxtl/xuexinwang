const STORAGE_KEY = "higher-education-record-demo";

const defaultState = {
  name: "李雪涛",
  gender: "男",
  birthDate: "2006-01-27",
  ethnicity: "汉族",
  idNumber: "",
  school: "北京理工大学",
  major: "软件工程",
  degree: "本科",
  studyMode: "普通全日制",
  duration: "4 年",
  educationType: "普通高等教育",
  college: "",
  department: "",
  className: "",
  studentNumber: "1120211603",
  enrollmentDate: "2026-08-27",
  status: "在籍（注册学籍）",
  leavingDate: "2030-06-20",
  admissionPhoto: "",
  degreePhoto: ""
};

let state = loadState();
let toastTimer;
const ARCHIVE_KEY = `${STORAGE_KEY}-archives`;
let archives = loadArchives();
let activeName = Object.hasOwn(archives, state.name) ? state.name : "";

function loadArchives() {
  try {
    const saved = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}

function renderArchives() {
  const select = document.getElementById("archiveSelect");
  select.replaceChildren(new Option("请选择档案", ""));
  Object.keys(archives).forEach((name) => select.add(new Option(name, name)));
  select.value = activeName;
}

function storeArchive() {
  const name = state.name.trim();
  if (!name) { showToast("请先填写姓名"); return false; }
  const updated = { ...archives, [name]: { ...state, name } };
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
    archives = updated;
    activeName = name;
    renderArchives();
    return true;
  } catch {
    showToast("存档失败：浏览器存储空间不足，请尝试使用较小的照片");
    return false;
  }
}

const displayEmptyText = {
  idNumber: "待填写",
  college: "—",
  department: "—",
  className: "—",
  status: "未设置"
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return { ...defaultState };

    // Update only values that still match the previous built-in examples.
    // User-edited values remain untouched in localStorage.
    const legacyDefaults = {
      birthDate: "2003-01-27",
      enrollmentDate: "2021-08-27",
      leavingDate: "2025-06-20"
    };
    Object.entries(legacyDefaults).forEach(([key, legacyValue]) => {
      if (saved[key] === legacyValue) saved[key] = defaultState[key];
    });
    if (saved.status === "在籍" || saved.status === "不在籍（毕业）") {
      saved.status = defaultState.status;
    }

    return { ...defaultState, ...saved };
  } catch (error) {
    return { ...defaultState };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Private browsing or a full storage quota should not prevent editing.
  }
  if (activeName && state.name.trim() === activeName) storeArchive();
}

function formatDate(value) {
  if (!value) return "未设置";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[0]}年${parts[1]}月${parts[2]}日`;
}

function displayValue(key, element) {
  const value = state[key] || "";
  if (element.dataset.displayDate === "true") {
    return formatDate(value);
  }
  if (value) return value;
  return displayEmptyText[key] || "未设置";
}

function renderText() {
  document.querySelectorAll("[data-display]").forEach((element) => {
    const key = element.dataset.display;
    const value = displayValue(key, element);
    element.textContent = value;
    element.classList.toggle("empty", !state[key]);
  });
}

function placeholderMarkup() {
  return `
    <span class="photo-placeholder" aria-hidden="true">
      <svg viewBox="0 0 80 96">
        <circle cx="40" cy="31" r="16" />
        <path d="M12 87c2-20 13-30 28-30s26 10 28 30Z" />
      </svg>
      <small>上传</small>
    </span>`;
}

function renderPhoto(kind) {
  document.querySelector(`[data-clear-photo="${kind}"]`).hidden = !state[`${kind}Photo`];
  const frame = document.querySelector(`[data-photo-frame="${kind}"]`);
  if (!frame) return;
  frame.innerHTML = "";
  if (state[`${kind}Photo`]) {
    const image = document.createElement("img");
    image.src = state[`${kind}Photo`];
    image.alt = kind === "admission" ? "录取照片预览" : "学历照片预览";
    frame.appendChild(image);
  } else {
    frame.innerHTML = placeholderMarkup();
  }
}

function renderInputs() {
  document.querySelectorAll("[data-input]").forEach((input) => {
    input.value = state[input.dataset.input] || "";
  });
}

function render() {
  renderText();
  renderInputs();
  renderPhoto("admission");
  renderPhoto("degree");
}

function setField(key, value) {
  state[key] = value;
  renderText();
  saveState();
}

function bindInputs() {
  document.querySelectorAll("[data-input]").forEach((input) => {
    input.addEventListener("input", () => setField(input.dataset.input, input.value));
    input.addEventListener("change", () => setField(input.dataset.input, input.value));
  });
}

function bindPhotos() {
  document.querySelectorAll("[data-clear-photo]").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.clearPhoto;
      state[`${kind}Photo`] = "";
      document.querySelector(`[data-photo-input="${kind}"]`).value = "";
      renderPhoto(kind);
      saveState();
      showToast(kind === "admission" ? "已清除录取照片" : "已清除学历照片");
    });
  });
  document.querySelectorAll("[data-photo-input]").forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        state[`${input.dataset.photoInput}Photo`] = reader.result;
        renderPhoto(input.dataset.photoInput);
        saveState();
      });
      reader.readAsDataURL(file);
    });
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setEditorOpen(open) {
  const panel = document.getElementById("editorPanel");
  const toggle = document.getElementById("toggleEditor");
  panel.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "完成" : "编辑";
  if (open) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

document.getElementById("toggleEditor").addEventListener("click", () => {
  const panel = document.getElementById("editorPanel");
  setEditorOpen(panel.hidden);
});

document.getElementById("closeEditor").addEventListener("click", () => setEditorOpen(false));

document.getElementById("saveArchive").addEventListener("click", () => {
  const name = state.name.trim();
  if (Object.hasOwn(archives, name) && activeName !== name &&
      !window.confirm(`已有“${name}”的档案，确定覆盖吗？`)) return;
  if (storeArchive()) showToast("档案已保存");
});

document.getElementById("archiveSelect").addEventListener("change", (event) => {
  const name = event.target.value;
  if (!Object.hasOwn(archives, name)) return;
  if (state.name.trim() && !storeArchive()) { renderArchives(); return; }
  activeName = name;
  state = { ...defaultState, ...archives[name] };
  document.querySelectorAll("[data-photo-input]").forEach((input) => { input.value = ""; });
  saveState();
  render();
  renderArchives();
  showToast(`已切换到${name}`);
});

document.getElementById("newArchive").addEventListener("click", () => {
  if (state.name.trim() && !storeArchive()) return;
  activeName = "";
  state = { ...defaultState, name: "" };
  document.querySelectorAll("[data-photo-input]").forEach((input) => { input.value = ""; });
  saveState();
  render();
  renderArchives();
  document.querySelector('[data-input="name"]').focus();
});

document.getElementById("resetButton").addEventListener("click", () => {
  if (!window.confirm("确定重置为默认资料吗？已填写的信息和上传的照片将被清除。")) return;
  state = { ...defaultState };
  activeName = "";
  document.querySelectorAll("[data-photo-input]").forEach((input) => {
    input.value = "";
  });
  saveState();
  render();
  renderArchives();
  showToast("已重置为默认资料");
});

document.getElementById("reportButton").addEventListener("click", () => {
  showToast("网络错误！");
});

document.querySelector(".back-button").addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    showToast("已是当前页面");
  }
});

bindInputs();
bindPhotos();
render();
renderArchives();
