/* =========================================
   ROBOFORGE AI LAB
   Main JavaScript Controller
========================================= */

const state = {
  currentPage: "dashboard",
  currentTool: "select",
  components: [],
  simulationRunning: false,
  projectCount: 12,
  likedPosts: []
};

/* =========================================
   PAGE NAVIGATION
========================================= */

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const pageName = item.dataset.page;
    navigateTo(pageName);
  });
});

function navigateTo(pageName) {
  state.currentPage = pageName;

  pages.forEach(page => {
    page.classList.remove("active-page");
  });

  const selectedPage = document.getElementById(pageName);

  if (selectedPage) {
    selectedPage.classList.add("active-page");
  }

  navItems.forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === pageName
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function openBuilder() {
  navigateTo("builder");
}

function openSimulator() {
  navigateTo("simulator");
}

function openProjects() {
  navigateTo("projects");
}

function openComponents() {
  navigateTo("components");
}

/* =========================================
   TOAST NOTIFICATIONS
========================================= */

let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toastText");

  toastText.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* =========================================
   THEME
========================================= */

function toggleTheme() {
  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("light-mode")) {
    showToast("Light mode preview enabled");
  } else {
    showToast("Futuristic dark mode enabled");
  }
}

/* =========================================
   MODAL
========================================= */

function openProjectModal() {
  document.getElementById("projectModal").classList.add("active");
}

function closeModal() {
  document.getElementById("projectModal").classList.remove("active");
}

function createProject() {
  const projectName = document.getElementById("projectName").value.trim();

  if (!projectName) {
    showToast("Please enter a project name");
    return;
  }

  state.projectCount++;

  closeModal();

  document.getElementById("projectName").value = "";

  showToast(`${projectName} created successfully`);

  navigateTo("builder");
}

function saveProject() {
  showToast("Project saved to your inventor workspace");
}

/* =========================================
   COMPONENT BUILDER
========================================= */

const workspace = document.getElementById("threeWorkspace");
const placedComponents = document.getElementById("placedComponents");
const workspaceEmpty = document.getElementById("workspaceEmpty");

let componentId = 0;

function addComponent(componentName) {
  componentId++;

  const component = {
    id: componentId,
    name: componentName
  };

  state.components.push(component);

  renderPlacedComponent(component);

  workspaceEmpty.style.display = "none";

  showToast(`${componentName} added to workspace`);
}

function renderPlacedComponent(component) {
  const element = document.createElement("div");

  element.className = "placed-component";
  element.dataset.id = component.id;
  element.draggable = true;

  const randomLeft = 25 + Math.random() * 50;
  const randomTop = 25 + Math.random() * 45;

  element.style.left = `${randomLeft}%`;
  element.style.top = `${randomTop}%`;

  element.innerHTML = `
    <button class="component-remove" title="Remove">×</button>
    <strong>${component.name}</strong>
    <small>Drag to move component</small>
  `;

  element.querySelector(".component-remove").addEventListener("click", event => {
    event.stopPropagation();
    removeComponent(component.id);
  });

  makeComponentMovable(element);

  placedComponents.appendChild(element);
}

function removeComponent(id) {
  state.components = state.components.filter(component => component.id !== id);

  const element = document.querySelector(
    `.placed-component[data-id="${id}"]`
  );

  if (element) {
    element.remove();
  }

  if (state.components.length === 0) {
    workspaceEmpty.style.display = "block";
  }

  showToast("Component removed");
}

function clearWorkspace() {
  state.components = [];
  placedComponents.innerHTML = "";
  workspaceEmpty.style.display = "block";

  document.querySelectorAll(".connection-line").forEach(line => {
    line.style.display = "none";
  });

  showToast("Workspace cleared");
}

function makeComponentMovable(element) {
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  element.addEventListener("dragstart", event => {
    dragging = true;

    const rect = element.getBoundingClientRect();

    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    event.dataTransfer.setData("text/plain", element.dataset.id);
  });

  element.addEventListener("dragend", () => {
    dragging = false;
  });

  element.addEventListener("mousedown", event => {
    if (event.target.classList.contains("component-remove")) return;

    dragging = true;

    const rect = element.getBoundingClientRect();

    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    function move(eventMove) {
      if (!dragging) return;

      const workspaceRect = workspace.getBoundingClientRect();

      let x = eventMove.clientX - workspaceRect.left - offsetX;
      let y = eventMove.clientY - workspaceRect.top - offsetY;

      x = Math.max(0, Math.min(x, workspaceRect.width - element.offsetWidth));
      y = Math.max(0, Math.min(y, workspaceRect.height - element.offsetHeight));

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    }

    function stop() {
      dragging = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  });
}

/* =========================================
   DRAG FROM LIBRARY
========================================= */

const draggableItems = document.querySelectorAll(
  ".component-card, .library-item"
);

draggableItems.forEach(item => {
  item.addEventListener("dragstart", event => {
    const name = item.dataset.component;
    event.dataTransfer.setData("component-name", name);
  });

  item.addEventListener("dblclick", () => {
    addComponent(item.dataset.component);
  });
});

workspace.addEventListener("dragover", event => {
  event.preventDefault();
});

workspace.addEventListener("drop", event => {
  event.preventDefault();

  const componentName = event.dataTransfer.getData("component-name");

  if (componentName) {
    addComponent(componentName);
  }
});

/* =========================================
   BUILDER TOOLS
========================================= */

function setTool(button, toolName) {
  document.querySelectorAll(".tool-button").forEach(btn => {
    btn.classList.remove("active");
  });

  button.classList.add("active");

  state.currentTool = toolName;

  showToast(`${toolName} tool selected`);
}

function resetCamera() {
  document.querySelectorAll(".placed-component").forEach((element, index) => {
    element.style.left = `${25 + index * 18}%`;
    element.style.top = `${35 + (index % 2) * 20}%`;
  });

  showToast("3D camera reset");
}

/* =========================================
   AI ASSISTANT
========================================= */

function useSuggestion(text) {
  document.getElementById("aiInput").value = text;
  askAI();
}

function askAI() {
  const input = document.getElementById("aiInput");
  const text = input.value.trim();

  if (!text) {
    showToast("Describe your invention first");
    return;
  }

  input.value = "";

  showToast("Inventor AI is analyzing your idea...");

  setTimeout(() => {
    showToast("AI created a suggested circuit plan");

    if (text.toLowerCase().includes("obstacle")) {
      addComponent("Arduino Uno");
      addComponent("Ultrasonic Sensor");
      addComponent("Servo Motor");
    } else if (text.toLowerCase().includes("water")) {
      addComponent("Arduino Uno");
      addComponent("Temperature Sensor");
      addComponent("LED Module");
    } else {
      addComponent("Arduino Uno");
      addComponent("LED Module");
    }
  }, 1200);
}

/* =========================================
   SIMULATION
========================================= */

function runSimulation() {
  const overlay = document.getElementById("simulationOverlay");

  if (overlay) {
    overlay.classList.add("active");

    setTimeout(() => {
      overlay.classList.remove("active");
      showToast("Simulation completed successfully");
    }, 1800);
  }

  state.simulationRunning = true;

  animateSensorValues();
}

function resetSimulation() {
  state.simulationRunning = false;

  const distance = document.getElementById("distanceReading");
  const servo = document.getElementById("servoReading");

  if (distance) distance.textContent = "42.0 cm";
  if (servo) servo.textContent = "90°";

  showToast("Simulation reset");
}

function animateSensorValues() {
  const distance = document.getElementById("distanceReading");
  const servo = document.getElementById("servoReading");

  if (!distance || !servo) return;

  let counter = 0;

  const interval = setInterval(() => {
    if (!state.simulationRunning || counter > 8) {
      clearInterval(interval);
      return;
    }

    const distanceValue = Math.floor(20 + Math.random() * 70);
    const servoValue = Math.floor(45 + Math.random() * 100);

    distance.textContent = `${distanceValue}.0 cm`;
    servo.textContent = `${servoValue}°`;

    counter++;
  }, 300);
}

/* =========================================
   CODE STUDIO
========================================= */

const codeEditor = document.getElementById("codeEditor");
const lineNumbers = document.getElementById("lineNumbers");

function updateLineNumbers() {
  if (!codeEditor || !lineNumbers) return;

  const lines = codeEditor.value.split("\n").length;

  lineNumbers.innerHTML = "";

  for (let i = 1; i <= lines; i++) {
    const line = document.createElement("div");
    line.textContent = i;
    lineNumbers.appendChild(line);
  }
}

if (codeEditor) {
  codeEditor.addEventListener("input", updateLineNumbers);

  codeEditor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = codeEditor.scrollTop;
  });

  updateLineNumbers();
}

function formatCode() {
  if (!codeEditor) return;

  const formatted = codeEditor.value
    .replace(/\{/g, " {\n")
    .replace(/\}/g, "\n}\n");

  codeEditor.value = formatted;

  updateLineNumbers();

  showToast("Code formatted");
}

function runCode() {
  showToast("Code compiled successfully");
}

function downloadCode() {
  if (!codeEditor) return;

  const code = codeEditor.value;

  const blob = new Blob([code], {
    type: "text/plain"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "roboforge-main.ino";

  link.click();

  URL.revokeObjectURL(url);

  showToast("Arduino code exported");
}

/* =========================================
   SEARCH
========================================= */

const globalSearch = document.getElementById("globalSearch");

if (globalSearch) {
  globalSearch.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      const searchText = globalSearch.value.trim();

      if (searchText) {
        showToast(`Searching for "${searchText}"`);
      }
    }
  });
}

const componentSearch = document.getElementById("componentSearch");

if (componentSearch) {
  componentSearch.addEventListener("input", () => {
    const value = componentSearch.value.toLowerCase();

    document.querySelectorAll(".library-item").forEach(item => {
      const name = item.dataset.component.toLowerCase();

      item.style.display = name.includes(value) ? "flex" : "none";
    });
  });
}

const largeComponentSearch = document.getElementById("largeComponentSearch");

if (largeComponentSearch) {
  largeComponentSearch.addEventListener("input", () => {
    const value = largeComponentSearch.value.toLowerCase();

    document.querySelectorAll(".universe-card").forEach(card => {
      const text = card.textContent.toLowerCase();

      card.style.display = text.includes(value) ? "block" : "none";
    });
  });
}

/* =========================================
   COMMUNITY LIKES
========================================= */

function likePost(button) {
  const currentText = button.textContent;

  if (currentText.includes("♡")) {
    button.textContent = currentText.replace("♡", "♥");
    button.style.color = "#ec4899";
    showToast("Post liked");
  } else {
    button.textContent = currentText.replace("♥", "♡");
    button.style.color = "";
    showToast("Like removed");
  }
}

/* =========================================
   KEYBOARD SHORTCUTS
========================================= */

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();

    if (globalSearch) {
      globalSearch.focus();
    }
  }

  if (event.key === "Escape") {
    closeModal();
  }
});

/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  showToast("Welcome to RoboForge AI Lab");

  setTimeout(() => {
    const toast = document.getElementById("toast");
    toast.classList.remove("show");
  }, 2500);
});
