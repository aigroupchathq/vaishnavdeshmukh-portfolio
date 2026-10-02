/* ==========================================================================
   VAISHNAV DESHMUKH — HIGH-PERFORMANCE ZERO-LAG PORTFOLIO INTERACTIONS
   - Live London UTC/BST Digital Clock Ticker
   - Fast Segmented Navigation Indicator
   - Zero-Lag Instant Project Filtering + Keyboard Shortcuts (1-5)
   - Interactive Audio DAW Timeline Playhead
   - Architecture Inspector Slide-Out Drawer with Deep-Dive Technical Case Studies
   - One-Click Email Copy with Visual Badge Feedback
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Live London Digital Clock Ticker
  const londonClockEl = document.getElementById("londonClock");
  function updateLondonTime() {
    if (!londonClockEl) return;
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      londonClockEl.textContent = `LON ${timeStr} GMT`;
    } catch (e) {
      londonClockEl.textContent = "LON 12:00:00 GMT";
    }
  }
  updateLondonTime();
  setInterval(updateLondonTime, 1000);

  // 2. High-Performance Segmented Navigation Indicator
  const navPill = document.getElementById("navPill");
  const navIndicator = document.getElementById("navIndicator");
  const navLinks = document.querySelectorAll(".nav-link");

  function setIndicatorPosition(activeLink) {
    if (!activeLink || !navIndicator || !navPill) return;
    const pillRect = navPill.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const leftOffset = linkRect.left - pillRect.left;
    const linkWidth = linkRect.width;

    navIndicator.style.transform = `translateX(${leftOffset}px)`;
    navIndicator.style.width = `${linkWidth}px`;

    navLinks.forEach((link) => {
      link.classList.toggle("active", link === activeLink);
    });
  }

  const initialActive = document.querySelector(".nav-link.active") || navLinks[0];
  if (initialActive) {
    requestAnimationFrame(() => {
      setTimeout(() => setIndicatorPosition(initialActive), 40);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setIndicatorPosition(link);
    });
  });

  // Scroll Spy for Nav using IntersectionObserver
  const sections = ["work", "concept", "capabilities", "about", "contact"];
  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -70% 0px",
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const matchingLink = document.querySelector(`.nav-link[data-section="${id}"]`);
        if (matchingLink) {
          setIndicatorPosition(matchingLink);
        }
      }
    });
  }, observerOptions);

  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
  });

  // 3. Instant Category Filter Tabs + Keyboard Shortcuts (1-5)
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card-container");

  function applyFilter(filterKey) {
    filterBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-filter") === filterKey);
    });

    projectCards.forEach((card) => {
      const category = card.getAttribute("data-category");
      if (filterKey === "all" || category === filterKey) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filterKey = btn.getAttribute("data-filter");
      applyFilter(filterKey);
    });
  });

  // Keyboard shortcut listener for filters (1-5)
  window.addEventListener("keydown", (e) => {
    // Only trigger if user is not focusing an input or textarea
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    if (e.key === "1") applyFilter("all");
    if (e.key === "2") applyFilter("health");
    if (e.key === "3") applyFilter("cognitive");
    if (e.key === "4") applyFilter("civic");
    if (e.key === "5") applyFilter("creative");
    if (e.key === "Escape") closeDrawer();
  });

  // 4. Interactive Audio DAW Timeline Play/Pause Simulation
  const dawPlayBtn = document.getElementById("dawPlayBtn");
  let isPlaying = false;
  let waveInterval = null;

  if (dawPlayBtn) {
    dawPlayBtn.addEventListener("click", () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        dawPlayBtn.textContent = "⏸ PAUSE WORKSPACE";
        dawPlayBtn.style.background = "var(--accent-mint)";
        dawPlayBtn.style.color = "#07090b";

        const waveBars = document.querySelectorAll(".wave-bar");
        waveInterval = setInterval(() => {
          waveBars.forEach((bar) => {
            const currentHeight = Math.floor(Math.random() * 80) + 20;
            bar.style.height = `${currentHeight}%`;
          });
        }, 120);
      } else {
        dawPlayBtn.textContent = "▶ PLAY WORKSPACE";
        dawPlayBtn.style.background = "";
        dawPlayBtn.style.color = "";
        if (waveInterval) clearInterval(waveInterval);
      }
    });
  }

  // 5. Architecture Inspector Slide-Out Drawer & Deep-Dive Data
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const architectureDrawer = document.getElementById("architectureDrawer");
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");
  const drawerProjectTitle = document.getElementById("drawerProjectTitle");
  const drawerProjectDomain = document.getElementById("drawerProjectDomain");
  const drawerBody = document.getElementById("drawerBody");

  const projectCaseStudies = {
    ward: {
      title: "Predictive Ward Logistics Engine",
      domain: "NHS HEALTHCARE SYSTEMS · OFFLINE-FIRST HL7 FHIR v4 · SCAN4SAFETY GS1",
      problem: "Nurses in acute hospital wards spend up to 45 minutes every shift hunting for infusion pumps and telemetry monitors. When critical devices go missing or lack charged batteries, patient medication is delayed, creating clinical safety risks and staff burnout.",
      architecture: "An offline-first progressive web application combining BLE beacon signal triangulation with local-first IndexedDB syncing. The system caches NHS Trust ward floorplans, ingests Scan4Safety GS1-128 DataMatrix barcodes, and synchronizes telemetry into HL7 FHIR DeviceMetric and Location resources over secure mTLS when Wi-Fi is available.",
      techDecisions: [
        "Local-First IndexedDB persistence to withstand hospital steel and concrete Wi-Fi dead zones.",
        "Scan4Safety GS1-128 barcode parsing supporting AI (01) GTIN, (21) Serial, and (17) Expiry.",
        "HL7 FHIR v4 resource mapping to integrate seamlessly into NHS Trust EPR systems."
      ],
      codeSnippet: `// HL7 FHIR v4 DeviceMetric Telemetry Mapping
export async function ingestGS1Telemetry(scanBuffer: string): Promise<FHIRDeviceMetric> {
  const parsedGS1 = parseGS1DataMatrix(scanBuffer);
  const localCache = await getOfflineDB();
  
  const metricPayload: FHIRDeviceMetric = {
    resourceType: "DeviceMetric",
    identifier: [{ system: "urn:oid:2.51.1.1", value: parsedGS1.serialNumber }],
    type: { text: "Volumetric Infusion Pump Battery & Flow" },
    source: { reference: \`Device/\${parsedGS1.gtin}\` },
    operationalStatus: "on",
    measurementPeriod: { start: new Date().toISOString() }
  };
  
  await localCache.put("metrics_queue", metricPayload);
  triggerBackgroundSync();
  return metricPayload;
}`
    },
    consciousness: {
      title: "The Unexplored Interior · Phenomenological Neuro-Engine",
      domain: "COGNITIVE NEUROSCIENCE · IIT 4.0 INTEGRATED INFO · GLOBAL NEURONAL WORKSPACE",
      problem: "Subjective conscious awareness and sensory bottleneck dynamics are typically discussed as philosophical abstractions, lacking rigorous, accessible tools to measure attentional bandwidth and phenomenological state transitions in real time.",
      architecture: "A high-precision client-side neuro-diagnostic engine and phenomenological benchmark uniting Integrated Information Theory (IIT 4.0) with Global Neuronal Workspace (GNW) models. Features 5 interactive visual awareness paradigms (Flicker Change Blindness, Motion-Induced Blindness, Bistable Necker dynamics, Continuous Flash Suppression, Binocular Rivalry) paired with an interactive 3D gyroscopic chronometer core and Web Audio binaural acoustic synthesizer.",
      techDecisions: [
        "Interactive 3D gyroscopic gimbal chronometer and crystalline core rendered with hardware-accelerated Canvas vector math.",
        "Empirical Integrated Information (IIT 4.0) Phi (Φ) state-partitioning and mutual information calculator.",
        "Harmonic 528Hz Solfeggio acoustic bell tone synthesizer via low-latency Web Audio API."
      ],
      codeSnippet: `// IIT 4.0 Integrated Information (Φ) & GNW Bandwidth Engine
export function calculateIntegratedInformation(transitionMatrix: number[][]): number {
  const wholeEntropy = calculateSystemEntropy(transitionMatrix);
  const partitions = generateBipartitions(transitionMatrix.length);
  
  let minInformationDistance = Infinity;
  for (const partition of partitions) {
    const partitionedEntropy = calculatePartitionedEntropy(transitionMatrix, partition);
    const distance = wholeEntropy - partitionedEntropy;
    if (distance < minInformationDistance) {
      minInformationDistance = distance;
    }
  }
  
  const phi = Math.max(0, minInformationDistance);
  return Number(phi.toFixed(2)); // bits of integrated conscious awareness
}`
    },
    ithink: {
      title: "iTHINK · 3D Neuroanatomy Atlas",
      domain: "COGNITIVE NEUROSCIENCE · THREE.JS WEBGL · 34 3D GLB BRAIN SUBSTRUCTURES",
      problem: "Concepts of attention, executive dysfunction, and default mode network mind-wandering are typically taught through dry 2D diagrams or pop-psychology listicles, failing to provide intuitive spatial understanding of mental states.",
      architecture: "A high-performance WebGL 3D volumetric explorer built on Three.js and custom GLTF models. Users can interactively dissect 34 distinct brain regions (Prefrontal Cortex, Hippocampus, Amygdala, ACC), simulate cognitive load frequencies (Alpha, Beta, Theta), and reflect on their focus habits.",
      techDecisions: [
        "Multi-LOD GLB geometry streaming to maintain locked 60 FPS on mobile and low-power hardware.",
        "Custom matcap shaders with interactive cross-section clipping planes (Axial, Coronal, Sagittal).",
        "Zero-telemetry client-side reflection journal preserving complete user privacy."
      ],
      codeSnippet: `// Three.js Volumetric Cross-Section Shader Setup
const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), sliceZPosition);
const brainMaterial = new THREE.MeshMatcapMaterial({
  matcap: matcapTexture,
  clippingPlanes: [clippingPlane],
  clipShadows: true
});

function highlightSubstructure(regionName: "Prefrontal" | "Hippocampus") {
  brainMesh.traverse((child) => {
    if (child.name === regionName) {
      child.material.color.setHex(0x3ae4af);
      child.material.emissive.setHex(0x124d3a);
    }
  });
}`
    },
    civicflow: {
      title: "CivicFlow · Municipal Highways Triage",
      domain: "CIVIC TECH · LOCAL GOVERNMENT AI · INFRASTRUCTURE DEFECT CLUSTERING",
      problem: "UK borough councils receive thousands of duplicate citizen reports for potholes, carriageway flooding, and streetlight failures. Highways inspectors waste weeks manually verifying repeat tickets instead of coordinating emergency repairs.",
      architecture: "An automated clustering and triage pipeline that ingests citizen photos and GPS coordinates, applies computer vision deduplication, groups reports within a 25-meter geospatial radius, and routes verified Cat 1 emergency hazards to maintenance contractors within SLAs.",
      techDecisions: [
        "Geospatial clustering algorithm grouping complaints within a 25m radius into a single master ticket.",
        "Automated risk scoring mapping defects to UK Well-Managed Highway Infrastructure standards.",
        "High-density municipal contractor dispatch dashboard with real-time SLA countdowns."
      ],
      codeSnippet: `// Geospatial Incident Clustering & SLA Assignment
export function clusterDefectReports(newReport: HazardReport, activeTickets: Ticket[]): Ticket {
  const nearbyReports = activeTickets.filter(t => 
    haversineDistance(t.coords, newReport.coords) <= 0.025 // 25 meters
  );
  
  if (nearbyReports.length > 0) {
    const parentTicket = nearbyReports[0];
    parentTicket.duplicateCount += 1;
    parentTicket.photos.push(newReport.photoUrl);
    return parentTicket;
  }
  
  return createNewTriageTicket(newReport, calculateRiskSLA(newReport.category));
}`
    },
    scriptstudio: {
      title: "AI Script Studio",
      domain: "CREATIVE COMPUTING · WEB AUDIO API · PHONEME SYNTHESIS SEQUENCER",
      problem: "Generative voice synthesis tools are typically trapped behind generic chat boxes where creators cannot adjust inflection, cadence, pauses, or phonetic pronunciation at the sub-second timeline level.",
      architecture: "A browser-based Digital Audio Workstation (DAW) uniting language model script generation with Web Audio API multi-track timelines. Creators can select individual phonemes, adjust speech pitch envelopes, and layer room tone ambience directly on a visual waveform canvas.",
      techDecisions: [
        "Web Audio API AudioContext graph with zero-latency buffer playback.",
        "Visual waveform rendering using hardware-accelerated Canvas2D and SVG paths.",
        "Phoneme alignment token mapping linking script text directly to audio millisecond offsets."
      ],
      codeSnippet: `// Web Audio Multi-Track Graph & Phoneme Timeline Sync
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const voiceGainNode = audioCtx.createGain();

export function scheduleVoiceCue(buffer: AudioBuffer, startTime: number, phonemes: PhonemeToken[]) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(voiceGainNode).connect(audioCtx.destination);
  source.start(startTime);
  
  phonemes.forEach((p) => {
    highlightTextTokenAtOffset(startTime + p.offsetMs);
  });
}`
    },
    roadtriage: {
      title: "RoadTriage · Edge Highway Inspection",
      domain: "EDGE COMPUTER VISION · YOLOV8 TENSORRT · MUNICIPAL DEFECT DETECTION",
      problem: "Specialized road surveying vehicles cost tens of thousands of pounds per survey, meaning rural and secondary council roads are only inspected once every two years, leaving severe potholes unaddressed.",
      architecture: "A mobile edge AI unit mounting behind the windscreen of regular council vehicles (e.g. refuse trucks). Running a quantized YOLOv8-Seg model on a Jetson Orin Nano, it segments potholes, longitudinal cracks, and calculates the International Roughness Index (IRI) at 60 FPS.",
      techDecisions: [
        "TensorRT FP16 quantization achieving 60 FPS at under 15W power consumption.",
        "Real-time GPS coordinate fusion timestamping road defects with sub-meter accuracy.",
        "Autonomous offline batching uploading GIS shapefiles when vehicle docks at council depot."
      ],
      codeSnippet: `// YOLOv8 TensorRT Inference Bounding Box Extraction
export function processInferenceFrame(frameTensor: Float32Array): RoadDefect[] {
  const detections = runTensorRTInference(frameTensor);
  return detections
    .filter(det => det.confidence >= 0.85)
    .map(det => ({
      class: det.classId === 0 ? "Pothole" : "Spalling",
      confidence: det.confidence,
      areaM2: calculateRealWorldSurfaceArea(det.boxCoords, cameraElevation),
      severity: det.areaM2 > 0.3 ? "Cat 1 High Risk" : "Cat 2"
    }));
}`
    },
    babycarl: {
      title: "BabyCarl · Pediatric AI & Circadian Health",
      domain: "PEDIATRIC HEALTH · ACOUSTIC CRY SPECTRUM · CIRCADIAN TIMELINES",
      problem: "New parents are bombarded with conflicting advice and overwhelming notifications, causing severe anxiety and disrupted sleep cycles rather than clear, actionable pediatric guidance.",
      architecture: "A calm, privacy-preserving infant telemetry dashboard that analyzes cry audio harmonics (fundamental frequency analysis around 440-520 Hz) and visualizes 24-hour circadian sleep spirals against WHO developmental percentiles.",
      techDecisions: [
        "On-device acoustic cry classification using FFT spectrogram harmonics.",
        "Calm interface design with zero alarmist alerts or notification badge spam.",
        "Encrypted local health database ensuring infant biometric data never leaves parent control."
      ],
      codeSnippet: `// Infant Acoustic Cry Fundamental Frequency Analysis
export function analyzeCryHarmonics(fftSpectrum: Float32Array): CryClassification {
  const fundamentalHz = detectPitchPeak(fftSpectrum, 350, 600);
  const harmonicRatios = computeHarmonics(fftSpectrum, fundamentalHz);
  
  if (fundamentalHz > 430 && fundamentalHz < 460 && harmonicRatios.r2 > 0.7) {
    return { type: "Hunger", confidence: 0.94, guidance: "Scheduled feeding window approaching" };
  }
  return { type: "Fatigue", confidence: 0.88, guidance: "Quiet environment recommended" };
}`
    },
    itsyou: {
      title: "It's You · Sovereign Identity Vault",
      domain: "CRYPTOGRAPHY & PRIVACY · ZERO-KNOWLEDGE PROOFS · W3C VERIFIABLE CREDENTIALS",
      problem: "Proving simple attributes (like being over 18 or having a valid license) currently forces people to expose their full legal name, home address, and national ID numbers, leading to identity theft and data leaks.",
      architecture: "A zero-knowledge identity credential vault using ZK-SNARK Groth16 circuits. Users generate mathematical proofs of claims (e.g. Age ≥ 18) directly on their personal device and present a verifiable cryptographic token without transmitting any raw PII.",
      techDecisions: [
        "Client-side ZK-SNARK proof generation executing in under 200ms using WebAssembly.",
        "Decentralized Identifiers (DID:ION) bound to user-held private key pairs.",
        "Selective attribute disclosure eliminating identity theft vectors at venues and websites."
      ],
      codeSnippet: `// ZK-SNARK Proof Generation for Age Majority
export async function generateAgeMajorityProof(secretBirthDate: number): Promise<ZKProof> {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const minRequiredAgeSeconds = 18 * 365.25 * 86400;
  
  const witness = {
    birthDate: secretBirthDate,
    currentDate: currentTimestamp,
    threshold: minRequiredAgeSeconds
  };
  
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    witness, 
    "circuit_age_verifier.wasm", 
    "circuit_final.zkey"
  );
  return { proof, isAdult: publicSignals[0] === "1" };
}`
    },
    groupchat: {
      title: "GroupChat HQ · Consensus Synthesizer",
      domain: "COLLABORATIVE INTELLIGENCE · GRAPH SUMMARIZATION · ASYNC DECISION LOGS",
      problem: "Cross-functional product teams operating across multiple timezones suffer from fragmented discussion threads where critical decisions get buried in 300+ unread chat messages.",
      architecture: "An asynchronous discussion clustering engine that analyzes unstructured chat logs, groups messages by semantic intent, extracts consensus agreements, and synthesizes unambiguous action item pipelines.",
      techDecisions: [
        "Semantic vector clustering grouping related debate threads into visual debate trees.",
        "Automated consensus threshold detection separating confirmed decisions from open questions.",
        "Exportable OpenAPI schemas and Markdown action logs with explicit owner attribution."
      ],
      codeSnippet: `// Discussion Thread Clustering & Consensus Graph
export async function synthesizeChatThread(messages: ChatMessage[]): Promise<ConsensusLog> {
  const semanticClusters = await clusterByIntent(messages);
  
  return {
    resolvedProposals: semanticClusters
      .filter(c => c.consensusScore >= 0.8)
      .map(c => ({ title: c.topic, agreedDecision: c.summary, votes: c.voteCount })),
    openDebates: semanticClusters
      .filter(c => c.consensusScore < 0.8)
      .map(c => ({ topic: c.topic, pendingQuestions: c.divergentPoints }))
  };
}`
    },
    vision: {
      title: "VISION · AI Learning & Prompt Lab",
      domain: "EDUCATIONAL TECHNOLOGY · PROMPT SCAFFOLDING · DEVELOPER PLAYGROUND",
      problem: "Most AI courses are either superficial hype or opaque math textbooks, leaving builders without practical heuristics for system prompts, context window management, and reliability benchmarks.",
      architecture: "An interactive, plain-language engineering guide featuring split-screen prompt testing sandboxes, context window visualizers, and step-by-step scaffolding lessons from zero-shot to multi-agent tool calling.",
      techDecisions: [
        "Real-time token streaming with millisecond latency and temperature telemetry.",
        "Interactive XML prompt scaffolding templates enforcing structured JSON outputs.",
        "Model benchmark matrices comparing token costs, reasoning speed, and failure modes."
      ],
      codeSnippet: `// Structured Prompt Scaffolding Helper
export function scaffoldSystemPrompt(domain: string, rules: string[], schema: object): string {
  return \`<role>Expert \${domain} Engineer</role>
<guidelines>
\${rules.map(r => \`  <rule>\${r}</rule>\`).join("\\n")}
</guidelines>
<response_format>
  Output strictly valid JSON matching:
  \${JSON.stringify(schema, null, 2)}
</response_format>\`;
}`
    },
    vsd: {
      title: "VSD Logistics · Dispatch Prototype",
      domain: "OPERATIONS SYSTEMS · GEOFENCING · PRIVACY-SCOPED TRACKING",
      problem: "Traditional delivery logistics platforms broadcast continuous real-time driver GPS coordinates, creating privacy intrusions for couriers and battery drain on mobile devices.",
      architecture: "A scoped dispatch and recipient tracking system using ephemeral cryptographic access tokens and coarse 250m geofence waypoints, giving recipients arrival clarity without invasive continuous tracking.",
      techDecisions: [
        "Ephemeral access tokens expiring automatically 15 minutes after delivery completion.",
        "Coarse geofencing displaying approximate 250m radius circles instead of exact street pins.",
        "ECDSA digital signature on glass providing tamper-proof proof of delivery."
      ],
      codeSnippet: `// Ephemeral Scoped Delivery Waypoint Token
export function generateRecipientTrackingToken(shipmentId: string, etaSeconds: number): string {
  const payload = {
    shipment: shipmentId,
    expiresAt: Math.floor(Date.now() / 1000) + etaSeconds + 900,
    geofencePrecision: "250m_coarse"
  };
  return signJwtToken(payload, process.env.DISPATCH_SECRET);
}`
    }
  };

  function openDrawer(projectId) {
    const study = projectCaseStudies[projectId] || projectCaseStudies.ward;
    drawerProjectTitle.textContent = study.title;
    drawerProjectDomain.textContent = study.domain;

    const techDecisionsHtml = study.techDecisions
      ? `<div class="drawer-block">
          <span class="drawer-block-label">KEY ARCHITECTURAL DECISIONS</span>
          <ul style="margin: 0; padding-left: 18px; font-size: 13.5px; color: var(--text-secondary);">
            ${study.techDecisions.map(d => `<li style="margin-bottom: 6px;">${d}</li>`).join("")}
          </ul>
        </div>`
      : "";

    drawerBody.innerHTML = `
      <div class="drawer-block">
        <span class="drawer-block-label">THE HUMAN &amp; OPERATIONAL FRICTION</span>
        <p style="margin: 0; font-size: 14px; color: #d8e2df; line-height: 1.6;">${study.problem}</p>
      </div>

      <div class="drawer-block">
        <span class="drawer-block-label">SYSTEMS ARCHITECTURE &amp; DATA FLOW</span>
        <p style="margin: 0; font-size: 14px; color: var(--text-secondary); line-height: 1.6;">${study.architecture}</p>
      </div>

      ${techDecisionsHtml}

      <div class="drawer-block">
        <span class="drawer-block-label">PRODUCTION CODE IMPLEMENTATION</span>
        <pre class="drawer-code-snippet"><code>${escapeHtml(study.codeSnippet)}</code></pre>
      </div>

      <div style="margin-top: 8px; display: flex; gap: 10px;">
        <a class="btn-nav-action primary" href="mailto:deshmukhvaishnav@gmail.com?subject=Discussing%20${encodeURIComponent(study.title)}" style="padding: 10px 18px; font-size: 13px;">Discuss this system with Vaishnav ↗</a>
      </div>
    `;

    drawerBackdrop.classList.add("active");
    architectureDrawer.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    drawerBackdrop.classList.remove("active");
    architectureDrawer.classList.remove("active");
    document.body.style.overflow = "";
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Bind all inspect buttons
  document.querySelectorAll(".btn-card-inspect").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const projectId = btn.getAttribute("data-project");
      openDrawer(projectId);
    });
  });

  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  // 6. One-Click Email Copy with Visual Badge Feedback
  const copyButtons = [
    document.getElementById("copyEmailNavBtn"),
    document.getElementById("copyEmailFooterBtn")
  ];

  copyButtons.forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      const email = "deshmukhvaishnav@gmail.com";
      navigator.clipboard.writeText(email).then(() => {
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<span>Copied! ✓</span>`;
        btn.style.background = "var(--accent-mint)";
        btn.style.color = "#07090b";
        btn.style.borderColor = "var(--accent-mint)";

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.style.background = "";
          btn.style.color = "";
          btn.style.borderColor = "";
        }, 2200);
      }).catch(() => {
        window.location.href = `mailto:${email}`;
      });
    });
  });

  // Mobile menu button scroll to navigation
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      const workSection = document.getElementById("work");
      if (workSection) {
        workSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Recalibrate on resize
  window.addEventListener("resize", () => {
    const active = document.querySelector(".nav-link.active");
    if (active) setIndicatorPosition(active);
  }, { passive: true });
});
