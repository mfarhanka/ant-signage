const state = {
  layers: [
    { id: crypto.randomUUID(), text: "ANT SIGNAGE", size: 84 },
    { id: crypto.randomUUID(), text: "OPEN LATE", size: 44, subtle: true }
  ],
  selectedLayerId: null,
  texture: "grid",
  lighting: "halo",
  toolbarExpanded: true,
  toolbarSide: "left",
  zoom: 100
};

const elements = {
  appShell: document.querySelector(".app-shell"),
  previewShell: document.querySelector(".preview-shell"),
  toolbar: document.querySelector("#toolbar"),
  toolbarToggle: document.querySelector("#toolbarToggle"),
  toolbarToggleIcon: document.querySelector("#toolbarToggleIcon"),
  toolbarSide: document.querySelector("#toolbarSide"),
  zoomSlider: document.querySelector("#zoomSlider"),
  zoomValue: document.querySelector("#zoomValue"),
  zoomOutButton: document.querySelector("#zoomOutButton"),
  zoomResetButton: document.querySelector("#zoomResetButton"),
  zoomInButton: document.querySelector("#zoomInButton"),
  textInput: document.querySelector("#textInput"),
  fontSize: document.querySelector("#fontSize"),
  textColor: document.querySelector("#textColor"),
  glowColor: document.querySelector("#glowColor"),
  bgColor: document.querySelector("#bgColor"),
  lightingColor: document.querySelector("#lightingColor"),
  textureSelect: document.querySelector("#textureSelect"),
  lightPreset: document.querySelector("#lightPreset"),
  lightingIntensity: document.querySelector("#lightingIntensity"),
  glowStrength: document.querySelector("#glowStrength"),
  addTextButton: document.querySelector("#addTextButton"),
  updateTextButton: document.querySelector("#updateTextButton"),
  removeTextButton: document.querySelector("#removeTextButton"),
  layerList: document.querySelector("#layerList"),
  stage: document.querySelector("#signStage"),
  stageViewport: document.querySelector("#stageViewport"),
  signTextStack: document.querySelector("#signTextStack"),
  stageSummary: document.querySelector("#stageSummary"),
  layerItemTemplate: document.querySelector("#layerItemTemplate")
};

state.selectedLayerId = state.layers[0].id;

function renderToolbar() {
  elements.toolbar.classList.toggle("is-expanded", state.toolbarExpanded);
  elements.toolbar.classList.toggle("toolbar-left", state.toolbarSide === "left");
  elements.toolbar.classList.toggle("toolbar-right", state.toolbarSide === "right");
  elements.toolbarToggle.setAttribute("aria-expanded", String(state.toolbarExpanded));
  elements.toolbarToggleIcon.textContent = state.toolbarExpanded ? "Collapse" : "Expand";
  elements.toolbarSide.value = state.toolbarSide;

  const isNarrowViewport = window.innerWidth <= 760;
  const collapsedToolbarWidth = elements.toolbarToggle.offsetWidth;
  const expandedToolbarWidth = Math.min(420, Math.max(280, window.innerWidth * 0.3));
  const toolbarWidth = state.toolbarExpanded ? expandedToolbarWidth : collapsedToolbarWidth;
  const toolbarHeight = state.toolbarExpanded ? elements.toolbar.getBoundingClientRect().height : elements.toolbarToggle.offsetHeight;
  const topOffset = isNarrowViewport ? `${toolbarHeight + 16}px` : "0px";
  const desktopOffset = `${toolbarWidth + 16}px`;
  const leftOffset = !isNarrowViewport && state.toolbarSide === "left" ? desktopOffset : "0px";
  const rightOffset = !isNarrowViewport && state.toolbarSide === "right" ? desktopOffset : "0px";
  const horizontalOffset = !isNarrowViewport ? toolbarWidth + 16 : 0;
  elements.appShell.style.setProperty("--toolbar-offset-top", topOffset);
  elements.appShell.style.setProperty("--toolbar-offset-left", leftOffset);
  elements.appShell.style.setProperty("--toolbar-offset-right", rightOffset);
  elements.previewShell.style.marginTop = topOffset;
  elements.previewShell.style.marginLeft = leftOffset;
  elements.previewShell.style.marginRight = rightOffset;
  elements.previewShell.style.width = isNarrowViewport ? "auto" : `calc(100% - ${horizontalOffset}px)`;
}

function clampZoom(value) {
  return Math.min(200, Math.max(50, value));
}

function renderZoom() {
  elements.zoomSlider.value = String(state.zoom);
  elements.zoomValue.textContent = `${state.zoom}%`;
  document.documentElement.style.setProperty("--stage-scale", String(state.zoom / 100));
}

function setZoom(nextZoom) {
  state.zoom = clampZoom(nextZoom);
  renderZoom();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function syncInputsWithSelection() {
  const selectedLayer = state.layers.find((layer) => layer.id === state.selectedLayerId) ?? state.layers[0];

  if (!selectedLayer) {
    elements.textInput.value = "";
    return;
  }

  elements.textInput.value = selectedLayer.text;
  elements.fontSize.value = selectedLayer.size;
}

function renderLayers() {
  elements.layerList.innerHTML = "";

  state.layers.forEach((layer, index) => {
    const fragment = elements.layerItemTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".layer-chip");
    button.textContent = `${index + 1}. ${layer.text}`;
    button.classList.toggle("active", layer.id === state.selectedLayerId);
    button.addEventListener("click", () => {
      state.selectedLayerId = layer.id;
      syncInputsWithSelection();
      renderLayers();
    });
    elements.layerList.appendChild(fragment);
  });
}

function renderStage() {
  elements.signTextStack.innerHTML = state.layers
    .map((layer) => {
      const className = layer.subtle ? "sign-text subtle" : "sign-text";
      return `<div class="${className}" style="font-size:${layer.size}px;">${escapeHtml(layer.text)}</div>`;
    })
    .join("");

  elements.stage.className = `sign-stage texture-${state.texture} light-${state.lighting}`;
  elements.stageSummary.textContent = `${state.layers.length} layer${state.layers.length === 1 ? "" : "s"} · ${elements.textureSelect.selectedOptions[0].textContent.toLowerCase()} · ${elements.lightPreset.selectedOptions[0].textContent.toLowerCase()} · ${state.zoom}% zoom`;
}

function updateStageVariables() {
  document.documentElement.style.setProperty("--text-color", elements.textColor.value);
  document.documentElement.style.setProperty("--glow-color", elements.glowColor.value);
  document.documentElement.style.setProperty("--stage-bg", elements.bgColor.value);
  document.documentElement.style.setProperty("--lighting-color", elements.lightingColor.value);
  document.documentElement.style.setProperty("--lighting-intensity", String(Number(elements.lightingIntensity.value) / 100));
  document.documentElement.style.setProperty("--glow-strength", elements.glowStrength.value);
}

function addLayer() {
  const text = elements.textInput.value.trim() || `NEW LAYER ${state.layers.length + 1}`;
  const layer = {
    id: crypto.randomUUID(),
    text,
    size: Number(elements.fontSize.value),
    subtle: state.layers.length > 0
  };

  state.layers.push(layer);
  state.selectedLayerId = layer.id;
  renderLayers();
  renderStage();
}

function updateSelectedLayer() {
  const layer = state.layers.find((item) => item.id === state.selectedLayerId);

  if (!layer) {
    return;
  }

  layer.text = elements.textInput.value.trim() || layer.text;
  layer.size = Number(elements.fontSize.value);
  renderLayers();
  renderStage();
}

function removeSelectedLayer() {
  if (state.layers.length === 1) {
    return;
  }

  state.layers = state.layers.filter((layer) => layer.id !== state.selectedLayerId);
  state.selectedLayerId = state.layers[0]?.id ?? null;
  syncInputsWithSelection();
  renderLayers();
  renderStage();
}

elements.addTextButton.addEventListener("click", addLayer);
elements.updateTextButton.addEventListener("click", updateSelectedLayer);
elements.removeTextButton.addEventListener("click", removeSelectedLayer);
elements.zoomSlider.addEventListener("input", () => {
  setZoom(Number(elements.zoomSlider.value));
  renderStage();
});
elements.zoomOutButton.addEventListener("click", () => {
  setZoom(state.zoom - 10);
  renderStage();
});
elements.zoomResetButton.addEventListener("click", () => {
  setZoom(100);
  renderStage();
});
elements.zoomInButton.addEventListener("click", () => {
  setZoom(state.zoom + 10);
  renderStage();
});
elements.toolbarToggle.addEventListener("click", () => {
  state.toolbarExpanded = !state.toolbarExpanded;
  renderToolbar();
});

elements.toolbarSide.addEventListener("change", () => {
  state.toolbarSide = elements.toolbarSide.value;
  renderToolbar();
});

elements.textureSelect.addEventListener("change", () => {
  state.texture = elements.textureSelect.value;
  renderStage();
});

elements.lightPreset.addEventListener("change", () => {
  state.lighting = elements.lightPreset.value;
  renderStage();
});

[
  elements.textColor,
  elements.glowColor,
  elements.bgColor,
  elements.lightingColor,
  elements.lightingIntensity,
  elements.glowStrength
].forEach((control) => {
  control.addEventListener("input", updateStageVariables);
});

elements.fontSize.addEventListener("input", () => {
  const layer = state.layers.find((item) => item.id === state.selectedLayerId);

  if (!layer) {
    return;
  }

  layer.size = Number(elements.fontSize.value);
  renderStage();
});

elements.stage.addEventListener("wheel", (event) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -10 : 10;
  setZoom(state.zoom + delta);
  renderStage();
}, { passive: false });

window.addEventListener("resize", renderToolbar);

syncInputsWithSelection();
updateStageVariables();
renderToolbar();
renderZoom();
renderLayers();
renderStage();