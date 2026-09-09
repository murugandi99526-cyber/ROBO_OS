/* =========================================================
   RoboOS — 3D Electronics Lab
   Version 1.0
   ========================================================= */

/* ---------- THREE.JS SETUP ---------- */

const canvas = document.getElementById("threeCanvas");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e16);

const camera = new THREE.PerspectiveCamera(
  45,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000
);

camera.position.set(7, 6, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const ambientLight = new THREE.AmbientLight(0x8fa8d8, 1.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 2);
mainLight.position.set(5, 10, 5);
mainLight.castShadow = true;
scene.add(mainLight);

const blueLight = new THREE.PointLight(0x527fff, 2, 20);
blueLight.position.set(-4, 4, 3);
scene.add(blueLight);

const purpleLight = new THREE.PointLight(0x9b6cff, 1.5, 20);
purpleLight.position.set(5, 3, -4);
scene.add(purpleLight);

/* ---------- WORKSPACE ---------- */

const workspace = new THREE.Group();
scene.add(workspace);

const componentGroup = new THREE.Group();
workspace.add(componentGroup);

const wireGroup = new THREE.Group();
workspace.add(wireGroup);

const grid = new THREE.GridHelper(14, 28, 0x273449, 0x182131);
grid.position.y = -0.25;
workspace.add(grid);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 14),
  new THREE.MeshStandardMaterial({
    color: 0x0d131e,
    roughness: 1
  })
);

floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.27;
floor.receiveShadow = true;
workspace.add(floor);

/* ---------- STATE ---------- */

let components = [];
let wires = [];
let selectedObject = null;
let componentId = 0;
let isRunning = false;
let wireMode = false;

const componentData = {
  arduino: {
    name: "Arduino Uno",
    type: "Controller",
    color: 0x1c8c78,
    shape: "arduino"
  },
  breadboard: {
    name: "Breadboard",
    type: "Prototype",
    color: 0xe8e2c9,
    shape: "breadboard"
  },
  servo: {
    name: "Servo Motor",
    type: "Actuator",
    color: 0x6c7cff,
    shape: "servo"
  },
  led: {
    name: "LED",
    type: "Output",
    color: 0xff4d70,
    shape: "led"
  },
  ultrasonic: {
    name: "Ultrasonic Sensor",
    type: "Sensor",
    color: 0x4de0a5,
    shape: "ultrasonic"
  },
  temperature: {
    name: "Temperature Sensor",
    type: "Sensor",
    color: 0xffb45c,
    shape: "sensor"
  },
  resistor: {
    name: "Resistor",
    type: "Passive",
    color: 0xd4a66a,
    shape: "resistor"
  },
  buzzer: {
    name: "Buzzer",
    type: "Output",
    color: 0x9b6cff,
    shape: "buzzer"
  },
  tilt: {
    name: "Tilt Sensor",
    type: "Sensor",
    color: 0x4dd9ff,
    shape: "sensor"
  },
  motor: {
    name: "DC Motor",
    type: "Actuator",
    color: 0xff8b5c,
    shape: "motor"
  },
  battery: {
    name: "Battery",
    type: "Power",
    color: 0x8c9aaa,
    shape: "battery"
  },
  lcd: {
    name: "LCD Display",
    type: "Display",
    color: 0x4de0a5,
    shape: "lcd"
  }
};

/* ---------- MATERIAL HELPERS ---------- */

function material(color, metalness = 0.2, roughness = 0.55) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness
  });
}

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material(color)
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(r, h, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h, 32),
    material(color)
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

/* ---------- 3D COMPONENT CREATION ---------- */

function createComponent(type) {

  const data = componentData[type];

  if (!data) return null;

  const group = new THREE.Group();

  group.userData = {
    type,
    name: data.name,
    componentId: ++componentId
  };

  if (data.shape === "arduino") {

    group.add(box(3.2, 0.18, 1.8, 0x1c8c78));

    group.add(box(0.75, 0.35, 0.75, 0x202936, -0.7, 0.25, 0));
    group.add(box(0.45, 0.35, 0.45, 0x151b25, 0.8, 0.25, 0));

    for (let i = -1.3; i <= 1.3; i += 0.2) {
      group.add(cylinder(0.035, 0.08, 0xdddddd, i, 0.15, -0.7));
      group.add(cylinder(0.035, 0.08, 0xdddddd, i, 0.15, 0.7));
    }

    const usb = box(0.45, 0.35, 0.65, 0xaaaaaa, -1.8, 0.2, 0);
    group.add(usb);

    const led = cylinder(0.08, 0.08, 0x5b8cff, 1.1, 0.2, -0.3);
    group.add(led);

  } else if (data.shape === "breadboard") {

    group.add(box(3.4, 0.28, 2.1, 0xe8e2c9));

    for (let x = -1.3; x <= 1.3; x += 0.2) {
      for (let z = -0.65; z <= 0.65; z += 0.2) {
        group.add(cylinder(0.025, 0.04, 0x555555, x, 0.17, z));
      }
    }

    group.add(box(0.05, 0.03, 1.7, 0xdddddd, 0, 0.17, 0));

  } else if (data.shape === "servo") {

    group.add(box(1.3, 0.8, 1.3, 0x596bff));

    group.add(cylinder(0.35, 0.15, 0xeeeeee, 0, 0.48, 0));

    group.add(box(0.12, 1.1, 0.08, 0xffffff, 0, 0.9, 0));

    group.add(box(0.1, 0.5, 0.1, 0xeeeeee, -0.45, 0.1, 0));
    group.add(box(0.1, 0.5, 0.1, 0xeeeeee, 0.45, 0.1, 0));

  } else if (data.shape === "led") {

    group.add(cylinder(0.18, 0.45, 0xff4d70, 0, 0.3, 0));

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      material(0xff7894, 0.1, 0.2)
    );

    dome.position.y = 0.52;
    group.add(dome);

    group.add(cylinder(0.035, 0.8, 0xaaaaaa, -0.08, -0.15, 0));
    group.add(cylinder(0.035, 0.8, 0xaaaaaa, 0.08, -0.15, 0));

  } else if (data.shape === "ultrasonic") {

    group.add(box(1.5, 0.15, 0.9, 0x4de0a5));

    group.add(cylinder(0.28, 0.25, 0x202b3d, -0.4, 0.25, 0));
    group.add(cylinder(0.28, 0.25, 0x202b3d, 0.4, 0.25, 0));

  } else if (data.shape === "sensor") {

    group.add(box(0.8, 0.45, 0.8, data.color));

    group.add(cylinder(0.1, 0.2, 0x222222, 0, 0.35, 0));

  } else if (data.shape === "resistor") {

    group.add(cylinder(0.15, 0.7, 0xd4a66a, 0, 0.25, 0));
    group.add(cylinder(0.025, 0.8, 0xaaaaaa, 0, -0.15, 0));

  } else if (data.shape === "buzzer") {

    group.add(cylinder(0.5, 0.3, 0x9b6cff, 0, 0.15, 0));
    group.add(cylinder(0.08, 0.35, 0x222222, 0, 0.35, 0));

  } else if (data.shape === "motor") {

    group.add(cylinder(0.5, 1.1, 0xff8b5c, 0, 0.4, 0));
    group.add(cylinder(0.08, 0.5, 0xdddddd, 0, 1.1, 0));

  } else if (data.shape === "battery") {

    group.add(box(1.1, 0.8, 0.7, 0x8c9aaa));
    group.add(cylinder(0.1, 0.2, 0xff4d70, -0.3, 0.55, 0));
    group.add(cylinder(0.1, 0.2, 0x222222, 0.3, 0.55, 0));

  } else if (data.shape === "lcd") {

    group.add(box(1.8, 0.2, 1.1, 0x263449));

    const screen = box(1.4, 0.04, 0.65, 0x123d43, 0, 0.13, 0);
    group.add(screen);

    for (let i = -0.5; i <= 0.5; i += 0.2) {
      group.add(box(0.08, 0.04, 0.04, 0x4de0a5, i, 0.16, 0));
    }
  }

  // Selection outline
  const outline = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.01, 0.01),
    new THREE.MeshBasicMaterial({
      color: 0x6f9aff,
      wireframe: true,
      transparent: true,
      opacity: 0
    })
  );

  outline.name = "selectionOutline";
  group.add(outline);

  group.position.set(
    (Math.random() - 0.5) * 4,
    0,
    (Math.random() - 0.5) * 2
  );

  return group;
}

/* ---------- ADD COMPONENT ---------- */

function addComponent(type) {

  const group = createComponent(type);

  if (!group) return;

  componentGroup.add(group);

  components.push(group);

  selectComponent(group);

  updateStats();

  addActivity(
    "Added " + componentData[type].name,
    "Component placed in workspace"
  );

  showToast(
    "Component Added",
    componentData[type].name + " added to your lab."
  );
}

/* ---------- SELECTION ---------- */

function selectComponent(object) {

  if (selectedObject) {
    const oldOutline = selectedObject.getObjectByName("selectionOutline");
    if (oldOutline) oldOutline.material.opacity = 0;
  }

  selectedObject = object;

  if (!object) {
    document.getElementById("selectedSubtitle").textContent = "Nothing selected";
    document.getElementById("selectedComponent").innerHTML = `
      <div class="empty-selection">
        <div>◈</div>
        <p>Select a component<br>to view its properties</p>
      </div>
    `;
    return;
  }

  const outline = object.getObjectByName("selectionOutline");

  if (outline) {
    const box3 = new THREE.Box3().setFromObject(object);
    const size = box3.getSize(new THREE.Vector3());

    outline.geometry.dispose();
    outline.geometry = new THREE.BoxGeometry(
      size.x + 0.15,
      size.y + 0.15,
      size.z + 0.15
    );

    outline.position.set(0, size.y / 2, 0);
    outline.material.opacity = 0.7;
  }

  const data = componentData[object.userData.type];

  document.getElementById("selectedSubtitle").textContent = data.type;

  document.getElementById("selectedComponent").innerHTML = `
    <div class="selected-info">
      <div class="component-icon sensor-icon">◈</div>
      <div>
        <strong>${data.name}</strong>
        <p>${data.type}</p>
      </div>
      <button class="delete-selected" id="deleteSelected">⌫</button>
    </div>

    <div class="property-list">
      <div class="property-row">
        <span>Component ID</span>
        <strong>#${object.userData.componentId}</strong>
      </div>
      <div class="property-row">
        <span>Position</span>
        <strong>${object.position.x.toFixed(1)}, ${object.position.z.toFixed(1)}</strong>
      </div>
      <div class="property-row">
        <span>Status</span>
        <strong style="color:#4de0a5">Ready</strong>
      </div>
    </div>
  `;

  document.getElementById("deleteSelected").onclick = deleteSelected;
}

/* ---------- DELETE ---------- */

function deleteSelected() {

  if (!selectedObject) return;

  const index = components.indexOf(selectedObject);

  if (index !== -1) {
    components.splice(index, 1);
  }

  componentGroup.remove(selectedObject);

  selectedObject = null;

  selectComponent(null);

  updateStats();

  showToast("Component Removed", "The component was removed.");
}

/* ---------- WIRES ---------- */

function createWire(a, b) {

  const start = a.position.clone();
  const end = b.position.clone();

  const points = [
    start,
    new THREE.Vector3(start.x, 0.8, start.z),
    new THREE.Vector3(end.x, 0.8, end.z),
    end
  ];

  const curve = new THREE.CatmullRomCurve3(points);

  const geometry = new THREE.TubeGeometry(
    curve,
    20,
    0.035,
    8,
    false
  );

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xff4d70,
      emissive: 0x330000
    })
  );

  wireGroup.add(mesh);
  wires.push(mesh);

  updateStats();

  showToast("Wire Connected", "Connection added to your circuit.");
}

/* ---------- STATS ---------- */

function updateStats() {

  document.getElementById("componentCount").textContent = components.length;
  document.getElementById("connectionCount").textContent = wires.length;
  document.getElementById("objectCount").textContent = components.length;

  let progress = Math.min(100, components.length * 15 + wires.length * 10);

  document.getElementById("progressFill").style.width = progress + "%";
  document.getElementById("progressText").textContent = progress + "%";
}

/* ---------- ACTIVITY ---------- */

function addActivity(title, subtitle) {

  const list = document.getElementById("activityList");

  const item = document.createElement("div");
  item.className = "activity-item";

  item.innerHTML = `
    <div class="activity-icon">⚡</div>
    <div>
      <strong>${title}</strong>
      <p>${subtitle}</p>
    </div>
    <span>Now</span>
  `;

  list.prepend(item);

  while (list.children.length > 3) {
    list.removeChild(list.lastChild);
  }
}

/* ---------- TOAST ---------- */

let toastTimer;

function showToast(title, message) {

  const toast = document.getElementById("toast");

  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastMessage").textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* ---------- SIMULATION ---------- */

function runSimulation() {

  if (isRunning) return;

  isRunning = true;

  document.getElementById("simulationOverlay").classList.add("show");

  document.getElementById("runText").textContent = "Running...";
  document.getElementById("simulationStatus").textContent = "Running";
  document.getElementById("engineText").textContent = "Simulation active";

  showToast(
    "Simulation Started",
    "Your invention is running in the 3D workspace."
  );

  setTimeout(() => {

    document.getElementById("simulationOverlay").classList.remove("show");

    document.getElementById("runText").textContent = "Run Simulation";
    document.getElementById("simulationStatus").textContent = "Ready";
    document.getElementById("engineText").textContent = "Engine ready";

    isRunning = false;

    showToast(
      "Simulation Complete",
      "Your 3D model finished running."
    );

  }, 3500);
}

/* ---------- MODALS ---------- */

function openModal(id) {
  document.getElementById(id).classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

/* ---------- CLEAR ---------- */

function clearWorkspace() {

  if (!components.length && !wires.length) {
    showToast("Workspace Empty", "There is nothing to clear.");
    return;
  }

  componentGroup.clear();
  wireGroup.clear();

  components = [];
  wires = [];
  selectedObject = null;

  selectComponent(null);
  updateStats();

  showToast("Workspace Cleared", "You can start a new invention.");
}

/* ---------- SAVE ---------- */

function saveProject() {

  const project = {
    name: document.getElementById("projectName").textContent,
    components: components.map(c => ({
      type: c.userData.type,
      x: c.position.x,
      y: c.position.y,
      z: c.position.z
    })),
    savedAt: new Date().toISOString()
  };

  localStorage.setItem("roboOSProject", JSON.stringify(project));

  document.getElementById("saveStatus").textContent = "All changes saved";

  showToast("Project Saved", "Your invention is saved in this browser.");
}

/* ---------- CAMERA ---------- */

let isDragging = false;
let previousMouse = { x: 0, y: 0 };

canvas.addEventListener("pointerdown", e => {
  isDragging = true;
  previousMouse.x = e.clientX;
  previousMouse.y = e.clientY;
});

canvas.addEventListener("pointerup", () => {
  isDragging = false;
});

canvas.addEventListener("pointermove", e => {

  if (!isDragging) return;

  const dx = e.clientX - previousMouse.x;
  const dy = e.clientY - previousMouse.y;

  workspace.rotation.y += dx * 0.008;
  workspace.rotation.x += dy * 0.004;

  workspace.rotation.x = Math.max(
    -0.5,
    Math.min(0.5, workspace.rotation.x)
  );

  previousMouse.x = e.clientX;
  previousMouse.y = e.clientY;
});

canvas.addEventListener("wheel", e => {

  e.preventDefault();

  camera.position.multiplyScalar(e.deltaY > 0 ? 1.08 : 0.92);

  camera.position.clampLength(4, 18);

}, { passive: false });

document.getElementById("zoomIn").onclick = () => {
  camera.position.multiplyScalar(0.85);
};

document.getElementById("zoomOut").onclick = () => {
  camera.position.multiplyScalar(1.15);
};

document.getElementById("resetCamera").onclick = () => {
  workspace.rotation.set(0, 0, 0);
  camera.position.set(7, 6, 8);
  camera.lookAt(0, 0, 0);
};

document.getElementById("fitView").onclick = () => {
  camera.position.set(7, 6, 8);
  camera.lookAt(0, 0, 0);
};

/* ---------- RAYCASTING ---------- */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener("click", e => {

  const rect = canvas.getBoundingClientRect();

  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(
    componentGroup.children,
    true
  );

  if (intersects.length > 0) {

    let object = intersects[0].object;

    while (object.parent && object.parent !== componentGroup) {
      object = object.parent;
    }

    if (wireMode) {

      if (!window.wireStart) {
        window.wireStart = object;
        showToast("Wire Mode", "Select another component to connect.");
      } else if (window.wireStart !== object) {
        createWire(window.wireStart, object);
        window.wireStart = null;
      }

    } else {
      selectComponent(object);
    }

  }

});

/* ---------- EVENT LISTENERS ---------- */

document.querySelectorAll(".component-card, .modal-component").forEach(btn => {

  btn.addEventListener("click", () => {

    addComponent(btn.dataset.component);

    closeModal("componentModal");

  });

});

document.getElementById("runBtn").onclick = runSimulation;

document.getElementById("viewAllBtn").onclick = () => {
  openModal("componentModal");
};

document.getElementById("componentMore").onclick = () => {
  openModal("componentModal");
};

document.getElementById("modalClose").onclick = () => {
  closeModal("componentModal");
};

document.getElementById("codeBtn").onclick = () => {
  openModal("codeModal");
};

document.getElementById("codeClose").onclick = () => {
  closeModal("codeModal");
};

document.getElementById("runCode").onclick = () => {
  closeModal("codeModal");
  runSimulation();
};

document.getElementById("copyCode").onclick = () => {
  navigator.clipboard.writeText(
    document.getElementById("codeArea").value
  );

  showToast("Code Copied", "Your program was copied.");
};

document.getElementById("clearBtn").onclick = clearWorkspace;
document.getElementById("saveBtn").onclick = saveProject;

document.getElementById("newProjectBtn").onclick = () => {

  clearWorkspace();

  document.getElementById("projectName").textContent =
    "Untitled Invention";

  showToast("New Project", "Your new workspace is ready.");
};

document.getElementById("helpBtn").onclick = () => {
  showToast(
    "RoboOS Help",
    "Add components, connect them, and run your simulation."
  );
};

document.getElementById("aiBtn").onclick = () => {
  showToast(
    "AI Inventor",
    "AI invention assistance will be added in a future version."
  );
};

document.querySelectorAll(".idea-suggestions button").forEach(btn => {

  btn.onclick = () => {

    document.getElementById("ideaInput").value =
      btn.dataset.idea;

    showToast(
      "Idea Selected",
      "Your invention idea is ready."
    );

  };

});

document.getElementById("ideaBtn").onclick = () => {

  const idea = document.getElementById("ideaInput").value.trim();

  if (!idea) {
    showToast("Enter an Idea", "Describe what you want to create.");
    return;
  }

  showToast(
    "Idea Saved",
    "Your invention idea has been added to the workspace."
  );

  addActivity("New invention idea", idea);

};

/* ---------- TOOL BUTTONS ---------- */

document.getElementById("selectTool").onclick = () => {

  wireMode = false;

  document.getElementById("selectTool").classList.add("active");
  document.getElementById("wireTool").classList.remove("active");

  showToast("Select Mode", "Click components to select them.");
};

document.getElementById("wireTool").onclick = () => {

  wireMode = true;

  document.getElementById("wireTool").classList.add("active");
  document.getElementById("selectTool").classList.remove("active");

  showToast("Wire Mode", "Select two components to connect them.");
};

/* ---------- VIEW BUTTONS ---------- */

document.querySelectorAll(".view-btn").forEach(btn => {

  btn.onclick = () => {

    document.querySelectorAll(".view-btn").forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    if (btn.dataset.view === "top") {
      camera.position.set(0, 12, 0);
      camera.lookAt(0, 0, 0);
    }

    if (btn.dataset.view === "front") {
      camera.position.set(0, 4, 12);
      camera.lookAt(0, 0, 0);
    }

    if (btn.dataset.view === "perspective") {
      camera.position.set(7, 6, 8);
      camera.lookAt(0, 0, 0);
    }

  };

});

/* ---------- RESIZE ---------- */

window.addEventListener("resize", () => {

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);

});

/* ---------- ANIMATION ---------- */

function animate() {

  requestAnimationFrame(animate);

  // Slowly rotate the 3D workspace
  // Remove this line if you want a fixed model.
  workspace.rotation.y += 0.0008;

  renderer.render(scene, camera);

}

animate();

/* ---------- STARTUP ---------- */

addComponent("arduino");
addComponent("breadboard");

selectComponent(null);

console.log("RoboOS 3D Electronics Lab initialized.");
