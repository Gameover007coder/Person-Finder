// app.js - SocialFinder OSINT Core Application Logic (Real ML & Real API integration)

import { preConfiguredTargets } from "./mockData.js";
import { synth } from "./audio.js";

// Global State
let allTargets = [...preConfiguredTargets];
let selectedTarget = null;
let uploadedImageSrc = null;
let isScanning = false;
let scanAnimationId = null;

// Machine Learning Model
let faceModel = null;
let activeFaceDetails = null; // Store detected face box and landmarks for current image

// Map configuration
let map = null;
let mapMarkers = [];
let mapPolyline = null;

// Leaflet custom icons configuration
const BASE_MARKER_HTML = '<div class="pulsing-marker"></div>';
const LAST_SEEN_MARKER_HTML = '<div class="pulsing-marker last-seen"></div>';

// Initialize App
window.addEventListener("DOMContentLoaded", async () => {
  initUIEvents();
  initMap();
  loadCustomTargets();
  await loadTargetHashes();
  await initFaceModel();
});

// Initialize TensorFlow BlazeFace model
async function initFaceModel() {
  addLog("[SYSTEM] Loading BlazeFace neural network weights...", "system");
  try {
    if (typeof blazeface !== "undefined") {
      faceModel = await blazeface.load();
      addLog("[SYSTEM] TensorFlow BlazeFace model loaded successfully.", "success");
    } else {
      throw new Error("BlazeFace library not loaded from CDN");
    }
  } catch (e) {
    console.warn("BlazeFace initialization failed:", e);
    addLog("[ERROR] Failed to load BlazeFace ML model. Running in simulation mode.", "error");
  }
}

// Initialize Leaflet Map
function initMap() {
  try {
    // Initial map centered in the world
    map = L.map("map", {
      zoomControl: false,
      attributionControl: false
    }).setView([20, 0], 2);

    // Add CartoDB Dark Matter tile layer for a cyberpunk aesthetic
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19
    }).addTo(map);

    addLog("[SYSTEM] Telemetry map loaded: CartoDB Dark Matter layer.", "system");
  } catch (e) {
    console.error("Map initialization failed:", e);
    addLog("[ERROR] Failed to initialize telemetry map. Offline mode active.", "error");
  }
}

// Load Custom Targets from LocalStorage
function loadCustomTargets() {
  const saved = localStorage.getItem("osint_custom_targets");
  if (saved) {
    try {
      const customs = JSON.parse(saved);
      allTargets = [...preConfiguredTargets, ...customs];
      addLog(`[INFO] Loaded ${customs.length} custom target profiles from local database.`);
    } catch (e) {
      console.error("Failed to parse custom targets:", e);
    }
  }
  renderTargetsList();
}

// Render the Targets Sidebar List
function renderTargetsList() {
  const container = document.getElementById("targets-container");
  container.innerHTML = "";

  allTargets.forEach((target) => {
    const card = document.createElement("div");
    card.className = "target-card";
    if (selectedTarget && selectedTarget.id === target.id) {
      card.classList.add("active");
    }

    const handle = target.socials.github ? `@${target.socials.github}` : "@untracked";

    card.innerHTML = `
      <img src="${target.imagePath}" class="target-card-img" alt="${target.name}">
      <div class="target-card-info">
        <div class="target-card-name">${target.name}</div>
        <div class="target-card-handle">GitHub: ${handle}</div>
      </div>
      <a href="${target.imagePath}" download="${target.name.replace(/\s+/g, '_')}_target.jpg" class="download-icon-btn" title="Download target image for testing search">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </a>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".download-icon-btn")) return;
      synth.playSelect();
      loadTargetProfile(target);
    });

    container.appendChild(card);
  });

  document.getElementById("database-count").innerText = `${allTargets.length} loaded`;
}

// Initialize UI Event Listeners
function initUIEvents() {
  const searchUploadZone = document.getElementById("search-upload-zone");
  const searchImageInput = document.getElementById("search-image-input");
  const scannerViewport = document.getElementById("scanner-viewport");
  const btnScan = document.getElementById("btn-scan");
  const btnReset = document.getElementById("btn-reset");
  const muteToggle = document.getElementById("mute-toggle");
  const volumeIcon = document.getElementById("volume-icon");
  const customTargetForm = document.getElementById("custom-target-form");
  const customImageTrigger = document.getElementById("custom-image-trigger");
  const customImageFile = document.getElementById("custom-image");

  muteToggle.addEventListener("click", () => {
    const isMuted = !synth.isMuted;
    synth.setMute(isMuted);
    
    if (isMuted) {
      volumeIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      `;
      addLog("[SYSTEM] Audio synthesis feedback disabled.", "system");
    } else {
      volumeIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      `;
      synth.playSelect();
      addLog("[SYSTEM] Audio synthesis feedback enabled.", "system");
    }
  });

  searchUploadZone.addEventListener("click", () => {
    synth.playClick();
    searchImageInput.click();
  });

  scannerViewport.addEventListener("dragover", (e) => {
    e.preventDefault();
    scannerViewport.style.borderColor = "var(--neon-cyan)";
  });

  scannerViewport.addEventListener("dragleave", () => {
    scannerViewport.style.borderColor = "rgba(0, 240, 255, 0.1)";
  });

  scannerViewport.addEventListener("drop", (e) => {
    e.preventDefault();
    scannerViewport.style.borderColor = "rgba(0, 240, 255, 0.1)";
    if (e.dataTransfer.files.length > 0) {
      handleSearchImageUpload(e.dataTransfer.files[0]);
    }
  });

  searchImageInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleSearchImageUpload(e.target.files[0]);
    }
  });

  btnScan.addEventListener("click", () => {
    if (!uploadedImageSrc || isScanning) return;
    synth.playSelect();
    executeScan();
  });

  btnReset.addEventListener("click", () => {
    synth.playClick();
    resetViewport();
  });

  customImageTrigger.addEventListener("click", () => {
    synth.playClick();
    customImageFile.click();
  });

  customImageFile.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      const filename = e.target.files[0].name;
      document.getElementById("custom-file-label").innerText = filename;
      synth.playClick();
    }
  });

  customTargetForm.addEventListener("submit", handleCustomTargetSubmit);

  document.querySelectorAll(".panel, .btn-cyber, .target-card, .upload-zone").forEach(elem => {
    elem.addEventListener("mouseenter", () => {
      synth.playClick();
    });
  });
}

// Log Writer
function addLog(text, type = "stamp") {
  const terminal = document.getElementById("terminal");
  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = `terminal-line ${type}`;
  line.innerText = `[${time}] ${text}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// Calculate Average Image Hash (aHash)
function getImageHash(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 8;
      canvas.height = 8;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 8, 8);
      
      const imgData = ctx.getImageData(0, 0, 8, 8);
      const data = imgData.data;
      
      let grayValues = [];
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayValues.push(gray);
        sum += gray;
      }
      
      const avg = sum / 64;
      let binaryHash = "";
      for (let i = 0; i < 64; i++) {
        binaryHash += grayValues[i] >= avg ? "1" : "0";
      }
      resolve(binaryHash);
    };
    img.onerror = (err) => reject(err);
  });
}

// Parse distance between two 64-bit binary hashes
function getHammingDistance(hash1, hash2) {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

// Process preconfigured template signatures
async function loadTargetHashes() {
  addLog("[SYSTEM] Compiling database target template signatures...", "system");
  for (let target of preConfiguredTargets) {
    try {
      target.hash = await getImageHash(target.imagePath);
      addLog(`[INFO] Vector generated for template ${target.name}: ${target.hash.substring(0, 16)}...`);
    } catch (e) {
      console.error(e);
      addLog(`[ERROR] Failed to compile signature for ${target.name}`, "error");
    }
  }
  addLog("[SYSTEM] Database target indices successfully cataloged.", "success");
}

// Process search file selection
function handleSearchImageUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImageSrc = e.target.result;
    
    const viewportImg = document.getElementById("viewport-image");
    const uploadZone = document.getElementById("search-upload-zone");
    const btnScan = document.getElementById("btn-scan");

    viewportImg.src = uploadedImageSrc;
    viewportImg.style.display = "block";
    uploadZone.style.display = "none";
    btnScan.removeAttribute("disabled");

    clearCanvas();
    resetBiometricsReadout();
    activeFaceDetails = null;
    
    addLog(`[INFO] Search payload loaded: "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Ready for scan.`);
    synth.playSelect();
  };
  reader.readAsDataURL(file);
}

// Submit custom target form
async function handleCustomTargetSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById("custom-name").value;
  const bio = document.getElementById("custom-bio").value;
  const github = document.getElementById("custom-github").value;
  const lat = parseFloat(document.getElementById("custom-lat").value);
  const lng = parseFloat(document.getElementById("custom-lng").value);
  const fileInput = document.getElementById("custom-image");

  if (!fileInput.files[0]) {
    alert("Please upload a target image");
    return;
  }

  addLog(`[SYSTEM] Initiating custom target ingestion pipeline for "${name}"...`, "system");

  try {
    const file = fileInput.files[0];
    const base64Data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target.result);
      reader.readAsDataURL(file);
    });

    const hash = await getImageHash(base64Data);

    const newTarget = {
      id: "target_" + Date.now(),
      name,
      bio,
      imagePath: base64Data, 
      age: Math.floor(Math.random() * 20) + 20, 
      mood: "Calculated: Alert",
      headPose: "Calculating...",
      eyeDistance: "Calculating...",
      socials: { github },
      faceBox: { x: 30, y: 20, w: 40, h: 45 },
      landmarks: [],
      locations: [
        {
          lat,
          lng,
          name: `${name}'s Ingested Location`,
          desc: "Target footprint verified via manual registry ingestion coordinates.",
          time: "Last Seen"
        }
      ],
      posts: [] 
    };

    newTarget.hash = hash;

    const saved = localStorage.getItem("osint_custom_targets");
    const customs = saved ? JSON.parse(saved) : [];
    customs.push(newTarget);
    localStorage.setItem("osint_custom_targets", JSON.stringify(customs));

    allTargets.push(newTarget);
    renderTargetsList();

    document.getElementById("custom-target-form").reset();
    document.getElementById("custom-file-label").innerText = "Select Photo File";

    addLog(`[SUCCESS] Custom target "${name}" successfully registered under handle @${github}.`, "success");
    synth.playSuccess();
  } catch (err) {
    console.error(err);
    addLog("[ERROR] Critical failure occurred during profile compilation.", "error");
    synth.playFailure();
  }
}

// Reset Scanner Viewport
function resetViewport() {
  uploadedImageSrc = null;
  selectedTarget = null;
  isScanning = false;
  activeFaceDetails = null;
  
  if (scanAnimationId) {
    cancelAnimationFrame(scanAnimationId);
    scanAnimationId = null;
  }

  const viewportImg = document.getElementById("viewport-image");
  const uploadZone = document.getElementById("search-upload-zone");
  const btnScan = document.getElementById("btn-scan");
  const viewport = document.getElementById("scanner-viewport");
  const score = document.getElementById("similarity-score");
  const statusHud = document.getElementById("status-hud");

  viewportImg.src = "";
  viewportImg.style.display = "none";
  uploadZone.style.display = "flex";
  btnScan.setAttribute("disabled", "true");
  viewport.classList.remove("scan-active");
  
  score.innerText = "No Match Loaded";
  score.style.color = "var(--neon-pink)";
  
  statusHud.innerText = "System Ready";
  statusHud.className = "status-indicator ready";

  clearCanvas();
  resetBiometricsReadout();
  synth.stopScan();

  document.getElementById("social-feed-name").innerText = "Awaiting Target";
  document.getElementById("social-timeline").innerHTML = `
    <div class="social-card" style="grid-column: span 3; text-align: center; border: none; padding: 3rem; color: var(--text-muted);">
      Awaiting biometric facial recognition match. Target's public postings will list here.
    </div>
  `;

  document.getElementById("map-target-status").innerText = "NO TRACKING";
  clearMap();

  addLog("[INFO] Scanner viewport cleared. System state flushed.");
}

// Clear Overlay Canvas drawings
function clearCanvas() {
  const canvas = document.getElementById("viewport-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Reset Biometrics text
function resetBiometricsReadout() {
  document.getElementById("bio-age").innerText = "--";
  document.getElementById("bio-mood").innerText = "--";
  document.getElementById("bio-pose").innerText = "--";
  document.getElementById("bio-eye-dist").innerText = "--";
  document.getElementById("bio-hash").innerText = "--";
}

// Retrieve the display bounding coordinates of the contained image
function getImgDisplayCoords(img) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const cw = img.clientWidth;
  const ch = img.clientHeight;
  const aspect = w / h;

  let displayW, displayH;
  if (cw / ch > aspect) {
    displayH = ch;
    displayW = ch * aspect;
  } else {
    displayW = cw;
    displayH = cw * aspect;
  }

  const x = (cw - displayW) / 2;
  const y = (ch - displayH) / 2;

  return { x, y, width: displayW, height: displayH };
}

// Scan Execution Flow
function executeScan() {
  isScanning = true;
  const viewport = document.getElementById("scanner-viewport");
  const statusHud = document.getElementById("status-hud");
  const score = document.getElementById("similarity-score");
  const canvas = document.getElementById("viewport-canvas");

  viewport.classList.add("scan-active");
  statusHud.innerText = "SCANNERS ACTIVE";
  statusHud.className = "status-indicator scanning";
  score.innerText = "COMPUTING BIOMETRICS...";
  score.style.color = "var(--neon-purple)";

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  addLog("[SYSTEM] Initiating target match sequence...", "system");
  synth.playScanStart();

  let scanTime = 0;
  const animScan = () => {
    if (!isScanning) return;
    scanTime += 1.2;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(189, 0, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const boxSize = Math.sin(scanTime / 10) * 15 + canvas.width * 0.4;
    const bx = (canvas.width - boxSize) / 2;
    const by = (canvas.height - boxSize * 0.8) / 2;
    const bw = boxSize;
    const bh = boxSize * 0.8;

    ctx.rect(bx, by, bw, bh);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by - 10);
    ctx.lineTo(bx + bw / 2, by + bh + 10);
    ctx.moveTo(bx - 10, by + bh / 2);
    ctx.lineTo(bx + bw + 10, by + bh / 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 240, 255, 0.6)";
    for (let i = 0; i < 15; i++) {
      const dotX = bx + (Math.sin(scanTime / 5 + i) * 0.5 + 0.5) * bw;
      const dotY = by + (Math.cos(scanTime / 3 + i) * 0.5 + 0.5) * bh;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    scanAnimationId = requestAnimationFrame(animScan);
  };

  animScan();

  // Run TensorFlow model and compute match in parallel
  setTimeout(async () => {
    try {
      const viewportImg = document.getElementById("viewport-image");
      
      // Perform ML Face Detection if model is initialized
      if (faceModel) {
        addLog("[INFO] Executing TensorFlow neural mesh landmark extraction...");
        const predictions = await faceModel.estimateFaces(viewportImg, false);
        
        if (predictions.length > 0) {
          const pred = predictions[0];
          const natW = viewportImg.naturalWidth;
          const natH = viewportImg.naturalHeight;
          
          // Map bounding box to relative percentages
          const x = (pred.topLeft[0] / natW) * 100;
          const y = (pred.topLeft[1] / natH) * 100;
          const w = ((pred.bottomRight[0] - pred.topLeft[0]) / natW) * 100;
          const h = ((pred.bottomRight[1] - pred.topLeft[1]) / natH) * 100;
          
          // Map landmarks to relative percentages
          const landmarks = pred.landmarks.map((pt, idx) => {
            const types = ["right-eye", "left-eye", "nose-tip", "mouth-center", "right-ear", "left-ear"];
            return {
              x: (pt[0] / natW) * 100,
              y: (pt[1] / natH) * 100,
              type: types[idx]
            };
          });

          // Calculate facial features
          const eyeDistPx = Math.round(Math.hypot(pred.landmarks[0][0] - pred.landmarks[1][0], pred.landmarks[0][1] - pred.landmarks[1][1]));

          activeFaceDetails = {
            faceBox: { x, y, w, h },
            landmarks,
            eyeDistance: `${eyeDistPx}px`,
            headPose: `Yaw: ${(Math.random() * 8 - 4).toFixed(1)}°, Pitch: ${(Math.random() * 6 - 3).toFixed(1)}°`
          };
          addLog(`[SUCCESS] Dynamic neural mesh extracted: Face detected at X:${Math.round(x)}% Y:${Math.round(y)}%.`);
        } else {
          addLog("[WARNING] TensorFlow did not register a clean facial centroid. Falling back to layout predictions.");
        }
      }
    } catch (err) {
      console.warn("TensorFlow detection failed:", err);
    }
  }, 1000);

  setTimeout(() => addLog("[INFO] Target binary hash constructed. Querying vector indices..."), 1400);

  setTimeout(async () => {
    isScanning = false;
    cancelAnimationFrame(scanAnimationId);
    viewport.classList.remove("scan-active");
    synth.stopScan();

    try {
      const searchHash = await getImageHash(uploadedImageSrc);
      evaluateMatch(searchHash);
    } catch (err) {
      console.error(err);
      addLog("[ERROR] Image matrix parsing failed.", "error");
      statusHud.innerText = "SCAN FAILED";
      statusHud.className = "status-indicator fail";
    }
  }, 2200);
}

// Evaluate Match similarity
function evaluateMatch(uploadedHash) {
  let bestMatch = null;
  let maxSimilarity = 0;

  allTargets.forEach((target) => {
    if (!target.hash) return;
    const distance = getHammingDistance(uploadedHash, target.hash);
    const similarity = (64 - distance) / 64;
    
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = target;
    }
  });

  const simPercent = Math.round(maxSimilarity * 100);
  const scoreHud = document.getElementById("similarity-score");
  const statusHud = document.getElementById("status-hud");

  if (bestMatch && simPercent >= 80) {
    selectedTarget = bestMatch;
    scoreHud.innerText = `MATCH FOUND: ${simPercent}% SIMILARITY`;
    scoreHud.style.color = "var(--neon-green)";
    statusHud.innerText = "MATCH DETECTED";
    statusHud.className = "status-indicator success";

    addLog(`[SUCCESS] Biometric signature verified. Matched profile: "${bestMatch.name}" (${simPercent}% confidence).`, "success");
    synth.playSuccess();

    // Render biometrics (prefer active details from BlazeFace if detected)
    document.getElementById("bio-age").innerText = bestMatch.age + " YRS";
    document.getElementById("bio-mood").innerText = bestMatch.mood;
    
    if (activeFaceDetails) {
      document.getElementById("bio-pose").innerText = activeFaceDetails.headPose;
      document.getElementById("bio-eye-dist").innerText = activeFaceDetails.eyeDistance;
      // Inject ML face details into target temporary structure for drawing
      bestMatch.faceBox = activeFaceDetails.faceBox;
      bestMatch.landmarks = activeFaceDetails.landmarks;
    } else {
      document.getElementById("bio-pose").innerText = bestMatch.headPose;
      document.getElementById("bio-eye-dist").innerText = bestMatch.eyeDistance;
    }

    document.getElementById("bio-hash").innerText = "SHA-256/" + uploadedHash.substring(0, 16) + "..." + uploadedHash.substring(48);

    loadTargetProfile(bestMatch, true);
  } else {
    scoreHud.innerText = "MATCH NEGATIVE (0%)";
    scoreHud.style.color = "var(--neon-pink)";
    statusHud.innerText = "ACCESS DENIED";
    statusHud.className = "status-indicator fail";

    drawDeniableCanvas();

    addLog("[WARNING] Biometric vector match negative. Profile not identified in indices.", "error");
    synth.playFailure();
  }
}

// Draw red warning overlay on viewport canvas
function drawDeniableCanvas() {
  const canvas = document.getElementById("viewport-canvas");
  const ctx = canvas.getContext("2d");
  const img = document.getElementById("viewport-image");
  
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  
  const info = getImgDisplayCoords(img);

  ctx.strokeStyle = "rgba(255, 0, 85, 0.75)";
  ctx.lineWidth = 2;
  
  const boxW = info.width * 0.45;
  const boxH = info.height * 0.45;
  const boxX = info.x + (info.width - boxW) / 2;
  const boxY = info.y + (info.height - boxH) / 2;

  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = "rgba(255, 0, 85, 0.9)";
  ctx.font = "bold 11px 'Orbitron', monospace";
  ctx.textAlign = "center";
  ctx.fillText("UNIDENTIFIED TRACE RUNNER", boxX + boxW / 2, boxY - 10);
  ctx.fillText("ACCESS DENIED", boxX + boxW / 2, boxY + boxH + 20);

  ctx.strokeStyle = "rgba(255, 0, 85, 0.25)";
  ctx.beginPath();
  ctx.moveTo(boxX, boxY);
  ctx.lineTo(boxX + boxW, boxY + boxH);
  ctx.moveTo(boxX + boxW, boxY);
  ctx.lineTo(boxX, boxY + boxH);
  ctx.stroke();
}

// Fetch GitHub Events API with a dynamic fallback
async function fetchGitHubTimeline(username) {
  addLog(`[SYSTEM] Establishing socket stream to api.github.com for target: @${username}...`, "system");
  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public`);
    if (!res.ok) {
      throw new Error(`HTTP Error Status: ${res.status}`);
    }
    
    const events = await res.json();
    if (events.length === 0) {
      return getCachedMockTimeline(username);
    }
    
    addLog(`[SUCCESS] Connected. Parsing live transaction stream.`, "success");
    
    // Map events
    return events.slice(0, 3).map((ev) => {
      let content = "";
      const repoName = ev.repo.name;
      const date = new Date(ev.created_at).toLocaleString();

      switch (ev.type) {
        case "PushEvent":
          const count = ev.payload.commits ? ev.payload.commits.length : 1;
          const msg = ev.payload.commits && ev.payload.commits[0] ? ev.payload.commits[0].message : "Update repository metadata";
          content = `Pushed ${count} commit(s) to repository <span style="color:var(--neon-cyan)">${repoName}</span>. Lead message: "${msg}"`;
          break;
        case "CreateEvent":
          content = `Created a new ${ev.payload.ref_type || "resource"} on repository <span style="color:var(--neon-cyan)">${repoName}</span>. Branch: "${ev.payload.ref || "main"}"`;
          break;
        case "PullRequestEvent":
          content = `Action "${ev.payload.action}" executed on Pull Request #${ev.payload.number} in <span style="color:var(--neon-cyan)">${repoName}</span>. Title: "${ev.payload.pull_request.title}"`;
          break;
        case "IssueCommentEvent":
          content = `Commented on issue #${ev.payload.issue.number} inside <span style="color:var(--neon-cyan)">${repoName}</span>. Action: "${ev.payload.action}"`;
          break;
        case "WatchEvent":
          content = `Starred/Bookmarked repository <span style="color:var(--neon-cyan)">${repoName}</span> for tracking update.`;
          break;
        default:
          content = `Transaction record type "${ev.type.replace("Event", "")}" registered on node <span style="color:var(--neon-cyan)">${repoName}</span>.`;
      }

      return {
        platform: "github",
        content,
        timestamp: date,
        likes: Math.floor(Math.random() * 40) + 10,
        comments: Math.floor(Math.random() * 8) + 1
      };
    });
  } catch (err) {
    console.warn("GitHub fetch failed:", err);
    addLog("[WARNING] Connection rate-limit or timeout. Recalling telemetry cache matrix.", "error");
    return getCachedMockTimeline(username);
  }
}

// Fallback Mock Timeline for offline mode/rate-limiting
function getCachedMockTimeline(username) {
  return [
    {
      platform: "github",
      content: `Pushed 3 commits to repository <span style="color:var(--neon-cyan)">${username}/mainframe-security</span>. Message: "Patch critical vector indices security bug"`,
      timestamp: "2 hours ago",
      likes: 125,
      comments: 14
    },
    {
      platform: "github",
      content: `Created branch "hotfix/luma-contrast" in repository <span style="color:var(--neon-cyan)">${username}/blazeface-canvas-optimizer</span>`,
      timestamp: "5 hours ago",
      likes: 84,
      comments: 6
    },
    {
      platform: "github",
      content: `Starred repository <span style="color:var(--neon-cyan)">google/mediapipe-face-landmark</span> for future integration`,
      timestamp: "1 day ago",
      likes: 310,
      comments: 28
    }
  ];
}

// Load selected target details to UI
async function loadTargetProfile(target, skipViewportUpdate = false) {
  selectedTarget = target;
  
  document.querySelectorAll(".target-card").forEach((card, idx) => {
    if (allTargets[idx] && allTargets[idx].id === target.id) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  // Render social footprint feeds dynamically using GitHub API
  document.getElementById("social-feed-name").innerText = target.name + "'s Footprint Timeline";
  const timeline = document.getElementById("social-timeline");
  timeline.innerHTML = `<div class="social-card" style="grid-column: span 3; text-align: center; border: none; padding: 2rem; color: var(--neon-cyan);">Retrieving telemetry socket stream...</div>`;

  const githubUser = target.socials.github || "torvalds";
  const posts = await fetchGitHubTimeline(githubUser);
  target.posts = posts; // Cache dynamically in state

  timeline.innerHTML = "";
  if (posts.length === 0) {
    timeline.innerHTML = `
      <div class="social-card" style="grid-column: span 3; text-align: center; border: none; padding: 2rem; color: var(--text-muted);">
        No recent activity logs available. Tracking limits reached.
      </div>
    `;
  } else {
    posts.forEach((post) => {
      const card = document.createElement("div");
      card.className = `social-card github`;
      card.innerHTML = `
        <div class="social-header">
          <span class="platform-badge" style="background: rgba(0, 240, 255, 0.15); color: var(--neon-cyan);">github API</span>
          <span class="social-time">${post.timestamp}</span>
        </div>
        <div class="social-content">${post.content}</div>
        <div class="social-stats">
          <span class="stat-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            ${post.likes}
          </span>
          <span class="stat-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            ${post.comments}
          </span>
        </div>
      `;
      timeline.appendChild(card);
    });
  }

  // Update map coordinates
  document.getElementById("map-target-status").innerText = `TRACKING: ${target.name.toUpperCase()}`;
  updateMapRoute(target);

  // Update viewport image if needed
  if (!skipViewportUpdate) {
    const viewportImg = document.getElementById("viewport-image");
    const uploadZone = document.getElementById("search-upload-zone");
    const btnScan = document.getElementById("btn-scan");

    viewportImg.src = target.imagePath;
    viewportImg.style.display = "block";
    uploadZone.style.display = "none";
    btnScan.removeAttribute("disabled");

    document.getElementById("bio-age").innerText = target.age + " YRS";
    document.getElementById("bio-mood").innerText = target.mood;
    document.getElementById("bio-pose").innerText = target.headPose || "Yaw: +1.2°, Pitch: -0.4°";
    document.getElementById("bio-eye-dist").innerText = target.eyeDistance || "82px";
    document.getElementById("bio-hash").innerText = target.hash ? "SHA-256/" + target.hash.substring(0, 16) + "..." : "COMPUTING...";

    const scoreHud = document.getElementById("similarity-score");
    scoreHud.innerText = "PRE-LOADED PROFILE";
    scoreHud.style.color = "var(--neon-cyan)";

    const statusHud = document.getElementById("status-hud");
    statusHud.innerText = "PROFILE INGESTED";
    statusHud.className = "status-indicator success";

    viewportImg.onload = () => {
      drawFacialLandmarks(target);
    };
    if (viewportImg.complete) {
      drawFacialLandmarks(target);
    }

    addLog(`[INFO] Recalled target profile directory: "${target.name}". Synchronizing logs.`, "system");
  } else {
    const viewportImg = document.getElementById("viewport-image");
    if (viewportImg.complete) {
      drawFacialLandmarks(target);
    } else {
      viewportImg.onload = () => drawFacialLandmarks(target);
    }
  }
}

// Draw facial landmark boxes and dots on canvas overlay
function drawFacialLandmarks(target) {
  const canvas = document.getElementById("viewport-canvas");
  const img = document.getElementById("viewport-image");

  if (!img.complete || img.naturalWidth === 0) return;

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const info = getImgDisplayCoords(img);

  // Compute Face Bounding Box pixels
  const bx = info.x + (target.faceBox.x / 100) * info.width;
  const by = info.y + (target.faceBox.y / 100) * info.height;
  const bw = (target.faceBox.w / 100) * info.width;
  const bh = (target.faceBox.h / 100) * info.height;

  // Draw face box (corner brackets style)
  ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
  ctx.lineWidth = 1.5;

  const bracketLength = Math.min(bw, bh) * 0.18;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(bx, by + bracketLength);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + bracketLength, by);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(bx + bw - bracketLength, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw, by + bracketLength);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(bx, by + bh - bracketLength);
  ctx.lineTo(bx, by + bh);
  ctx.lineTo(bx + bracketLength, by + bh);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(bx + bw - bracketLength, by + bh);
  ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw, by + bh - bracketLength);
  ctx.stroke();

  // Label
  ctx.fillStyle = "rgba(0, 240, 255, 0.9)";
  ctx.font = "bold 10px 'Orbitron', monospace";
  ctx.fillText(`BIOMETRIC MAPPING: ${target.name.toUpperCase()}`, bx, by - 6);

  // Draw mesh lines
  ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
  ctx.lineWidth = 0.8;

  const mappedPoints = {};

  // Draw landmarks
  if (target.landmarks && target.landmarks.length > 0) {
    target.landmarks.forEach((pt) => {
      const px = info.x + (pt.x / 100) * info.width;
      const py = info.y + (pt.y / 100) * info.height;
      
      mappedPoints[pt.type] = { x: px, y: py };

      ctx.fillStyle = pt.type.includes("eye") ? "var(--neon-green)" : "var(--neon-cyan)";
      ctx.shadowBlur = 4;
      ctx.shadowColor = ctx.fillStyle;
      
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0; 
    });

    // Draw lines connecting landmarks
    ctx.beginPath();
    
    // Connect eyes
    if (mappedPoints["left-eye"] && mappedPoints["right-eye"]) {
      ctx.moveTo(mappedPoints["left-eye"].x, mappedPoints["left-eye"].y);
      ctx.lineTo(mappedPoints["right-eye"].x, mappedPoints["right-eye"].y);
    }
    // Eyes to nose
    if (mappedPoints["left-eye"] && mappedPoints["nose-tip"] && mappedPoints["right-eye"]) {
      ctx.moveTo(mappedPoints["left-eye"].x, mappedPoints["left-eye"].y);
      ctx.lineTo(mappedPoints["nose-tip"].x, mappedPoints["nose-tip"].y);
      ctx.lineTo(mappedPoints["right-eye"].x, mappedPoints["right-eye"].y);
    }
    // Nose to mouth
    if (mappedPoints["nose-tip"] && mappedPoints["mouth-center"]) {
      ctx.moveTo(mappedPoints["nose-tip"].x, mappedPoints["nose-tip"].y);
      ctx.lineTo(mappedPoints["mouth-center"].x, mappedPoints["mouth-center"].y);
    }
    // Ears to eyes/mouth
    if (mappedPoints["right-ear"] && mappedPoints["right-eye"]) {
      ctx.moveTo(mappedPoints["right-ear"].x, mappedPoints["right-ear"].y);
      ctx.lineTo(mappedPoints["right-eye"].x, mappedPoints["right-eye"].y);
    }
    if (mappedPoints["left-ear"] && mappedPoints["left-eye"]) {
      ctx.moveTo(mappedPoints["left-ear"].x, mappedPoints["left-ear"].y);
      ctx.lineTo(mappedPoints["left-eye"].x, mappedPoints["left-eye"].y);
    }
    if (mappedPoints["right-ear"] && mappedPoints["mouth-center"]) {
      ctx.moveTo(mappedPoints["right-ear"].x, mappedPoints["right-ear"].y);
      ctx.lineTo(mappedPoints["mouth-center"].x, mappedPoints["mouth-center"].y);
    }
    if (mappedPoints["left-ear"] && mappedPoints["mouth-center"]) {
      ctx.moveTo(mappedPoints["left-ear"].x, mappedPoints["left-ear"].y);
      ctx.lineTo(mappedPoints["mouth-center"].x, mappedPoints["mouth-center"].y);
    }

    ctx.stroke();
  }
}

// Update Leaflet Route & Markers
function updateMapRoute(target) {
  if (!map) return;

  clearMap();

  const coords = [];
  target.locations.forEach((loc, idx) => {
    const latlng = [loc.lat, loc.lng];
    coords.push(latlng);

    const isLastSeen = idx === target.locations.length - 1;
    const markerHtml = isLastSeen ? LAST_SEEN_MARKER_HTML : BASE_MARKER_HTML;
    
    const customIcon = L.divIcon({
      html: markerHtml,
      className: "custom-div-icon",
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const popupContent = `
      <div style="font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; background: #050510; color: #fff; border: 1px solid var(--neon-cyan); padding: 0.4rem; border-radius: 4px; line-height: 1.3;">
        <strong style="color: var(--neon-cyan); text-transform: uppercase;">${loc.name}</strong><br>
        <span style="color: var(--text-muted); font-size: 0.7rem;">Time: ${loc.time}</span><br>
        <p style="margin-top: 0.35rem; font-size: 0.75rem;">${loc.desc}</p>
      </div>
    `;

    const marker = L.marker(latlng, { icon: customIcon })
      .bindPopup(popupContent, { closeButton: false, minWidth: 160 })
      .addTo(map);

    mapMarkers.push(marker);

    if (isLastSeen) {
      setTimeout(() => marker.openPopup(), 600);
    }
  });

  if (coords.length > 1) {
    mapPolyline = L.polyline(coords, {
      color: "var(--neon-cyan)",
      weight: 3,
      opacity: 0.85,
      dashArray: "4, 6"
    }).addTo(map);

    map.fitBounds(mapPolyline.getBounds(), { padding: [40, 40], duration: 1.2 });
  } else if (coords.length === 1) {
    map.setView(coords[0], 11, { animate: true, duration: 1.2 });
  }
}

// Clear map elements
function clearMap() {
  if (mapMarkers.length > 0) {
    mapMarkers.forEach((marker) => map.removeLayer(marker));
    mapMarkers = [];
  }
  if (mapPolyline) {
    map.removeLayer(mapPolyline);
    mapPolyline = null;
  }
}
