/**
 * Vaishnav Deshmukh Portfolio v2 — Core Interaction Architecture
 * Minimalist, high-performance, zero-dependency vanilla JS
 */

(function () {
  'use strict';

  // ── 1. Case Studies Data ─────────────────────────────────────
  const CASE_STUDIES = {
  "datumatelier": {
    "title": "Datum Atelier \u2014 Sovereign Vehicle Provenance",
    "domain": "AUTOMOTIVE SYSTEMS \u00b7 PRIVACY-FIRST TELEMETRY \u00b7 OFFLINE STORAGE",
    "category": "Automotive Systems \u00b7 Vehicle Provenance",
    "badge": "FOUNDER PLATFORM",
    "year": "2026",
    "problem": "Vehicle service and maintenance histories are fragmented across proprietary dealer silos, vulnerable to odometer fraud, lost paper invoices, and unauthorized personal data aggregation.",
    "architecture": "A decentralized vehicle provenance ledger where vehicle owners maintain sovereign control over maintenance records, diagnostic telemetry, and ownership transfer. Designed offline-first using client-side encryption and local IndexedDB caching with digital certificate verification.",
    "techDecisions": [
      "Offline-first client architecture using IndexedDB for private records without continuous cloud dependency.",
      "Cryptographic ownership transfer ensuring tamper-evident digital vehicle handovers.",
      "High-contrast tactile dashboard design for automotive workshops and enthusiast collectors."
    ],
    "tags": [
      "Vehicle Provenance",
      "Owner Records",
      "Offline-First",
      "TypeScript",
      "IndexedDB"
    ],
    "links": [
      {
        "label": "Live Site \u2197",
        "href": "https://datumatelier.uk/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/datum-intro"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-datumatelier.svg"
  },
  "babycarl": {
    "title": "BabyCarl \u2014 Calming Circadian Telemetry",
    "domain": "PEDIATRIC HEALTH \u00b7 SLEEP TELEMETRY \u00b7 CALM UX",
    "category": "Pediatric Health \u00b7 Circadian Telemetry",
    "badge": "PATENT-INSPIRED BIOMETRICS",
    "year": "2026",
    "problem": "Modern baby monitors bombard exhausted new parents with high-friction push notifications, anxiety-inducing graphs, and invasive cloud video streaming.",
    "architecture": "A gentle ambient telemetry interface that visualizes newborn sleep cycles, feeding intervals, and temperature trends through calm tactile typography and local-only SQLite/IndexedDB persistence.",
    "techDecisions": [
      "Zero notification anxiety policy: ambient glanceable UI rather than alarming sounds.",
      "100% on-device data storage protecting sensitive infant biometric telemetry.",
      "Circadian color adaptation: screen luminescence scales with nighttime ambient light."
    ],
    "tags": [
      "Circadian Telemetry",
      "Local Storage",
      "Tactile UX",
      "Offline-First"
    ],
    "links": [
      {
        "label": "Inquire \u2197",
        "href": "mailto:deshmukhvaishnav@gmail.com?subject=BabyCarl%20Inquiry",
        "primary": true
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-babycarl.svg"
  },
  "datumadas": {
    "title": "Datum ADAS \u2014 Edge Perception Engine",
    "domain": "AUTOMOTIVE SYSTEMS \u00b7 REAL-TIME COMPUTER VISION \u00b7 KINEMATICS",
    "category": "Automotive Systems \u00b7 Perception",
    "badge": "ON-DEVICE PERCEPTION",
    "year": "2026",
    "problem": "Modern vehicular safety suites depend on centralized cloud telemetry or high-latency processing, making edge response times sluggish under poor network connectivity.",
    "architecture": "Client-side perception pipeline running quantized neural object detection models in-browser with WebGL/WebGPU acceleration, calculating Time-to-Collision (TTC) and lane divergence locally.",
    "techDecisions": [
      "Quantized real-time inference delivering consistent 30+ FPS directly in the browser viewport.",
      "Kinematic safety algorithms calculating distance vectors and closing speed differentials.",
      "Stark, distraction-free HUD interface optimized for rapid driver scanning."
    ],
    "tags": [
      "Computer Vision",
      "On-Device Kinematics",
      "YOLOv8",
      "Edge Vision"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://aigroupchathq.github.io/datum-adas/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/datum-adas"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-datumadas.svg"
  },
  "ithink": {
    "title": "iTHINK \u2014 Spatial Neuroanatomy & Flow Lab",
    "domain": "COGNITIVE SCIENCE \u00b7 THREE.JS GLTF \u00b7 INTERACTIVE 3D",
    "category": "Cognitive Practice \u00b7 Neuroscience Lab",
    "badge": "60 FPS 3D WEBGL",
    "year": "2023\u20132024",
    "problem": "Neuroscience models and cognitive attention theory are typically locked in static textbook diagrams or clunky academic software that fails to communicate volumetric relationships.",
    "architecture": "A hardware-accelerated 3D exploration interface using Three.js and custom GLSL vertex shaders, allowing users to slice through cortical layers, inspect neurotransmitter pathways, and engage in scripted focus exercises.",
    "techDecisions": [
      "Draco-compressed GLTF 2.0 assets loaded over Web Workers to preserve fluid 60 FPS interactions.",
      "Dynamic spatial clipping planes exposing deep limbic structures in real time.",
      "Zero-dependency audio cues using Web Audio API synthesis for meditative tactile feedback."
    ],
    "tags": [
      "Three.js",
      "WebGL 60 FPS",
      "TypeScript",
      "GLTF Shaders"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://aigroupchathq.github.io/vaishnavdeshmukh-portfolio/ithink/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/ithinkstudio"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-ithink.svg"
  },
  "civicflow": {
    "title": "CivicFlow & lawpt \u2014 Public Infrastructure Automation",
    "domain": "CIVIC TECH \u00b7 GEOSPATIAL CLUSTERING \u00b7 LEGAL REASONING",
    "category": "Civic Infrastructure \u00b7 Municipal Triage",
    "badge": "MUNICIPAL TRIAGE",
    "year": "2026",
    "problem": "Local councils receive hundreds of duplicate citizen reports for the same pothole or broken streetlight, overwhelming dispatch coordinators and causing wasted contractor callouts.",
    "architecture": "Geographic clustering engine utilizing the DBSCAN algorithm over Turf.js and PostGIS coordinates to group nearby defect reports within a 15-meter radius and generate batch maintenance manifests.",
    "techDecisions": [
      "Automated spatial deduplication reducing council manual triage workload by over 60%.",
      "High-density responsive data grid allowing operators to inspect photos and approve batches in seconds.",
      "Integrated lawpt legal explainer engine clarifying citizen rights under the Highways Act 1980."
    ],
    "tags": [
      "DBSCAN Spatial",
      "GeoJSON",
      "Turf.js",
      "FastAPI / SQLite"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "civicflow.html",
        "primary": true
      },
      {
        "label": "Inquire \u2197",
        "href": "mailto:deshmukhvaishnav@gmail.com?subject=CivicFlow"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-civicflow.svg"
  },
  "groupchat": {
    "title": "Ai Group Chat \u2014 Multi-Agent Systems R&D",
    "domain": "CREATIVE TECHNOLOGY \u00b7 MULTI-AGENT ORCHESTRATION \u00b7 TECHNICAL MEDIA",
    "category": "Creative Technology \u00b7 YouTube & Research",
    "badge": "MEDIA & R&D",
    "year": "2023\u20132024",
    "problem": "Most AI tutorials remain superficial prompt demonstrations without addressing state synchronization, consensus verification, or real-world software engineering constraints.",
    "architecture": "An educational laboratory and media channel creating production-grade multi-agent prototypes, exploring vector embeddings, consensus synthesis graphs, and developer workflows.",
    "techDecisions": [
      "Engineered reproducible code harnesses for multi-model benchmark evaluation.",
      "Produced editorial video content breaking down cognitive ergonomics and systems thinking.",
      "Built an active developer community centered on privacy-first local AI architectures."
    ],
    "tags": [
      "Multi-Agent AI",
      "Vector Embeddings",
      "Video Production",
      "Prompt Engineering"
    ],
    "links": [
      {
        "label": "YouTube \u2197",
        "href": "https://youtube.com/@aigroupchathq",
        "primary": true
      },
      {
        "label": "Inquire \u2197",
        "href": "mailto:deshmukhvaishnav@gmail.com?subject=Ai%20Group%20Chat"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-groupchat.svg"
  },
  "cranfield": {
    "title": "Cranfield MSc Supply Chain Simulation \u2014 1st Place Winner",
    "domain": "OPERATIONS RESEARCH \u00b7 INVENTORY OPTIMIZATION \u00b7 BEHAVIORAL LEAN",
    "category": "Supply Chain \u00b7 Operations Research",
    "badge": "1ST PLACE AWARD",
    "year": "2026",
    "problem": "Supply chain networks suffer from severe bullwhip effects, stockouts, and capital paralysis when inventory buffers are placed reactively without stochastic demand modeling.",
    "architecture": "Designed a dynamic multi-echelon replenishment strategy balancing safety stock holding costs against stockout penalties during simulated geopolitical disruptions and supplier failures.",
    "techDecisions": [
      "Implemented dynamic reorder point (ROP) calculation accounting for upstream lead-time variance.",
      "Applied Lean Six Sigma Green Belt root-cause analysis to eliminate purchase order backlog gaps.",
      "Achieved #1 highest service level and lowest total cost of ownership across all competing university teams."
    ],
    "tags": [
      "Operations Research",
      "Supply Chain Simulation",
      "Lean Six Sigma",
      "Inventory Optimization"
    ],
    "links": [
      {
        "label": "Inquire \u2197",
        "href": "mailto:deshmukhvaishnav@gmail.com?subject=Cranfield%20Supply%20Chain",
        "primary": true
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-vision.svg"
  },
  "ward": {
    "title": "Predictive Ward Logistics \u2014 NHS Device Discovery",
    "domain": "NHS HEALTHCARE SYSTEMS \u00b7 OFFLINE-FIRST HL7 FHIR v4 \u00b7 SCAN4SAFETY GS1",
    "category": "Healthcare Logistics \u00b7 Systems R&D",
    "badge": "HEALTHCARE LOGISTICS",
    "year": "2026",
    "problem": "Nurses in acute hospital wards spend up to 45 minutes every shift hunting for infusion pumps and telemetry monitors. When devices go missing, critical medication is delayed.",
    "architecture": "An offline-first progressive web application combining BLE beacon signal triangulation with local-first IndexedDB syncing. Caches NHS Trust floorplans and serializes telemetry into HL7 FHIR DeviceMetric resources.",
    "techDecisions": [
      "Local-First IndexedDB persistence to withstand hospital steel and concrete Wi-Fi dead zones.",
      "Scan4Safety GS1-128 barcode parsing supporting GTIN, Serial, and Expiration data identifiers.",
      "Cryptographic state reconciliation syncing local device telemetry when network connectivity is restored."
    ],
    "tags": [
      "HL7 FHIR v4",
      "Scan4Safety GS1-128",
      "IndexedDB",
      "BLE Telemetry"
    ],
    "links": [
      {
        "label": "Inquire \u2197",
        "href": "mailto:deshmukhvaishnav@gmail.com?subject=Ward%20Logistics",
        "primary": true
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-ward.svg"
  },
  "rulers": {
    "title": "Rulers Language \u2014 Directive Prompt Scaffolding",
    "domain": "AI COGNITIVE ERGONOMICS \u00b7 PROMPT METRIC EVALUATION \u00b7 TEACHING LAB",
    "category": "AI Guidance \u00b7 Prompt Studio",
    "badge": "AI METHODOLOGY",
    "year": "2026",
    "problem": "Users struggle with unguided LLM prompting, relying on conversational politeness or vague adjectives that produce hallucinated code and unverified assumptions.",
    "architecture": "A three-phase prompt methodology (Design, Implementation, Verification) that enforces strict negative boundaries, observable success metrics, and structured evidence capture.",
    "techDecisions": [
      "Separates exploration from code generation, preventing uncontrolled file modifications.",
      "Includes browser-local lesson logging to track prompt drift and output regression.",
      "Minimalist, zero-latency static interface deployed globally with instant accessibility."
    ],
    "tags": [
      "Mission Paths",
      "Prompt Studio",
      "Original Design",
      "Verification Rules"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://aigroupchathq.github.io/rulers-language/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/rulers-language"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-vision.svg"
  },
  "velum": {
    "title": "Checkmate (Velum Labs) \u2014 Explainable Compatibility",
    "domain": "HUMAN DECISION SCIENCE \u00b7 RECIPROCAL MATCHING \u00b7 REACT 19",
    "category": "Human Decisions \u00b7 Compatibility",
    "badge": "REASONING ENGINE",
    "year": "2026",
    "problem": "Dating and relationship applications exploit addictive slot-machine gamification, opaque algorithmic sorting, and superficial image swiping that degrades long-term decision making.",
    "architecture": "An explainable matching engine that evaluates mutual alignment across core ethical values, financial goals, and conflict resolution models with full algorithmic transparency.",
    "techDecisions": [
      "Built on React 19 with optimistic state transitions and accessible focus ergonomics.",
      "Zero-knowledge preference comparison preserving sensitive personal disclosures.",
      "Explainability matrix visually detailing why two profiles match or diverge on critical values."
    ],
    "tags": [
      "Explainable Matching",
      "React 19",
      "TypeScript",
      "Cognitive Ergonomics"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://aigroupchathq.github.io/velum-labs/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/velum-labs"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-velum.svg"
  },
  "observer": {
    "title": "The Observer \u2014 Metacognitive Visual Interface",
    "domain": "COGNITIVE PHILOSOPHY \u00b7 INTERACTIVE NARRATIVE \u00b7 PROCEDURAL CANVAS",
    "category": "Cognitive Science \u00b7 Metacognition",
    "badge": "COGNITIVE SCIENCE",
    "year": "2023\u20132024",
    "problem": "People rarely observe their own cognitive biases, default reactive loops, or mental conditioning in everyday software interactions.",
    "architecture": "A self-guided contemplative narrative powered by pure Canvas 2D particle dynamics that mirror user input pacing, pauses, and cursor hesitation to foster self-awareness.",
    "techDecisions": [
      "Zero external dependencies for instant sub-100ms cold start performance.",
      "Dynamic typography that scales and shifts based on user typing cadence and dwell time.",
      "Non-coercive UX architecture designed to calm cognitive load rather than capture screen-time."
    ],
    "tags": [
      "Interactive Narrative",
      "Canvas 2D",
      "Vanilla JS",
      "Philosophy"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://itsyou.ai.studio/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/its-you-ai"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-observer.svg"
  },
  "consciousness": {
    "title": "The Unexplored Interior \u2014 Awareness Lab",
    "domain": "PERCEPTION THEORY \u00b7 PROCEDURAL AUDIO \u00b7 LIGHT SCULPTURE",
    "category": "Cognitive Science \u00b7 Interactive Inquiry",
    "badge": "VISUAL INQUIRY",
    "year": "2026",
    "problem": "Abstract models of conscious attention, optical illusion, and sensory thresholding are difficult to grasp without interactive participatory visual experiments.",
    "architecture": "A suite of generative canvas shaders and synchronized Web Audio oscillators modeling focal attention, blind-spot phenomena, and optical saccade suppression.",
    "techDecisions": [
      "Procedural sound generation mapped directly to user gaze and cursor coordinates.",
      "Lightweight mathematical matrix calculations for real-time luminance field distortion.",
      "Minimalist monochromatic design language inspired by Dieter Rams and Japanese editorial aesthetics."
    ],
    "tags": [
      "HTML Canvas",
      "Web Audio API",
      "Vanilla JS",
      "Cognitive R&D"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://aigroupchathq.github.io/consciousness-mechanism/",
        "primary": true
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-itsyou.svg"
  },
  "hiddenleaf": {
    "title": "Hidden Leaf Studio \u2014 Bilingual Metrical Lab",
    "domain": "CREATIVE TOOLS \u00b7 PHONETIC ANALYSIS \u00b7 DESI HIP-HOP ARCHITECTURE",
    "category": "Creative Tools \u00b7 Bilingual Studio",
    "badge": "AUDIO & LYRIC LAB",
    "year": "2023\u20132024",
    "problem": "South Asian hip-hop lyricists blending Hindi, Urdu, and English struggle with conventional Western songwriting tools that fail to parse matra weight, conjunct consonants, or Devanagari meter.",
    "architecture": "An intelligent metronome and rhyme matrix parser that computes syllable weights across Hindi and English phonemes, matching rhyme cadences against customizable BPM drum loops.",
    "techDecisions": [
      "Custom bilingual syllable syllabification engine handling Devanagari conjuncts and slang transliterations.",
      "Low-latency Web Audio API beat synthesizer with micro-timing swing controls.",
      "Distraction-free dark mode lyric editor with real-time rhyme scheme highlighting."
    ],
    "tags": [
      "Web Audio API",
      "Phoneme Parser",
      "Rhythm Studio",
      "Bilingual UX"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://aigroupchathq.github.io/hidden-leaf-studio/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/hidden-leaf-studio"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-hiddenleaf.svg"
  },
  "scriptstudio": {
    "title": "AI Script Studio \u2014 Browser-Based DAW",
    "domain": "AUDIO WORKLET \u00b7 MULTI-TRACK ARRANGEMENT \u00b7 GENERATIVE VOICE",
    "category": "Creative Technology \u00b7 Generative Audio",
    "badge": "BROWSER WORKSTATION",
    "year": "2026",
    "problem": "Video creators and podcasters waste hours jumping between text script editors and bloated desktop digital audio workstations (DAWs) to pace vocal delivery and sound design.",
    "architecture": "A unified browser-based audio workstation where text script blocks are directly linked to audio tracks on an interactive 60 FPS HTML5 Canvas timeline.",
    "techDecisions": [
      "AudioWorklet thread processing ensuring glitch-free playback even during intensive UI redraws.",
      "Custom zoomable and pannable waveform canvas capable of rendering hours of audio stems.",
      "Script-to-timeline synchronization automatically mapping word count to target speaker cadence."
    ],
    "tags": [
      "Web Audio API",
      "Canvas Timeline",
      "TypeScript",
      "AudioWorklet"
    ],
    "links": [
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/gstudio",
        "primary": true
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-scriptstudio.svg"
  },
  "roadtriage": {
    "title": "RoadTriage \u2014 On-Device Municipal Scanner",
    "domain": "EDGE COMPUTER VISION \u00b7 MUNICIPAL HIGHWAYS \u00b7 OFFLINE CACHING",
    "category": "Civic Infrastructure \u00b7 Edge Vision",
    "badge": "EDGE COMPUTER VISION",
    "year": "2026",
    "problem": "Highway maintenance inspectors driving rural and council roads often lose 4G/5G signal, preventing standard cloud-dependent defect logging and photo analysis.",
    "architecture": "Mobile-first progressive web application leveraging client-side TensorFlow.js to classify road cracks and potholes locally from vehicle dashboard mounts, storing geotagged evidence in IndexedDB.",
    "techDecisions": [
      "Quantized MobileNet classification running at 24+ FPS on standard smartphone browsers.",
      "Offline-first store-and-forward architecture queuing GPS-stamped road defects until Wi-Fi dock.",
      "Strict privacy preservation: automated on-device blurring of pedestrian faces and vehicle license plates."
    ],
    "tags": [
      "Computer Vision",
      "TensorFlow.js",
      "IndexedDB",
      "Municipal Flow"
    ],
    "links": [
      {
        "label": "Inquire \u2197",
        "href": "mailto:deshmukhvaishnav@gmail.com?subject=RoadTriage",
        "primary": true
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-roadtriage.svg"
  },
  "vtsystem": {
    "title": "Vedic Tree OS \u2014 Institutional Management Architecture",
    "domain": "ENTERPRISE SAAS \u00b7 MULTI-CAMPUS RBAC \u00b7 STUDENT PROGRESS",
    "category": "Education Systems \u00b7 Institutional OS",
    "badge": "INSTITUTIONAL OS",
    "year": "2023\u20132024",
    "problem": "Multi-campus educational institutions endure fractured administrative tools: attendance sheets in spreadsheets, fees in clunky ERPs, and learning logs lost across disconnected apps.",
    "architecture": "A cohesive institutional operating system with multi-tenant role-based access control (RBAC), unifying fee reconciliation, attendance metrics, and qualitative student portfolios.",
    "techDecisions": [
      "Strict role hierarchy separating campus branch managers, faculty, accountants, and guardians.",
      "Real-time operational dashboard visualizing student attendance drop-off and fee collections.",
      "Designed with high-density tabular ergonomics allowing bulk actions without modal fatigue."
    ],
    "tags": [
      "Multi-Tenant",
      "RBAC Security",
      "TypeScript",
      "Educational Flow"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://aigroupchathq.github.io/vtsystem/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/vtsystem"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-vtsystem.svg"
  },
  "driver": {
    "title": "The Driver of God \u2014 Philosophical Interaction Design",
    "domain": "CONTEMPLATIVE COMPUTING \u00b7 PROCEDURAL SOUND \u00b7 PHILOSOPHY",
    "category": "Interactive Philosophy \u00b7 Procedural Sound",
    "badge": "AUDIOVISUAL INQUIRY",
    "year": "2026",
    "problem": "Digital interactions are overwhelmingly transactional, designed for compulsion and urgency rather than introspection, attention restoration, and philosophical contemplation.",
    "architecture": "An experimental meditative web interface where user mouse deceleration triggers procedural binaural audio harmonics and subtle geometric canvas distortions exploring agency and control.",
    "techDecisions": [
      "Real-time procedural additive synthesis using Web Audio API polyphonic oscillators.",
      "Calculated friction and inertia physics modeling the illusion of free-will and resistance.",
      "Monastic, calm visual styling stripping away all gamified user interfaces."
    ],
    "tags": [
      "Web Audio API",
      "Interactive Philosophy",
      "Canvas 2D",
      "Contemplative Tech"
    ],
    "links": [
      {
        "label": "Live Demo \u2197",
        "href": "https://aigroupchathq.github.io/the-driver-of-god/",
        "primary": true
      },
      {
        "label": "Source \u2197",
        "href": "https://github.com/aigroupchathq/the-driver-of-god"
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-driver.svg"
  },
  "consensus": {
    "title": "GroupChat HQ \u2014 Semantic Consensus Engine",
    "domain": "DISTRIBUTED SYSTEMS \u00b7 VECTOR EMBEDDINGS \u00b7 CONSENSUS GRAPHS",
    "category": "Collaboration Systems \u00b7 Semantic Sync",
    "badge": "SEMANTIC CRDT STATE",
    "year": "2023\u20132024",
    "problem": "Long technical discussions on Slack, Discord, and GitHub issues become messy and repetitive, burying critical consensus agreements under hundreds of conversational replies.",
    "architecture": "A semantic sync engine that transforms stream-of-consciousness chat transcripts into dynamic directed acyclic graphs (DAGs) of agreed-upon decisions and open questions.",
    "techDecisions": [
      "Vector cosine similarity clustering to group redundant discussion points automatically.",
      "Conflict-free replicated data type (CRDT) state architecture supporting real-time collaborative editing.",
      "Summary synthesis extraction providing instantly reviewable architectural decision records (ADRs)."
    ],
    "tags": [
      "Vector Embeddings",
      "Semantic Graphs",
      "CRDT State",
      "Consensus Algorithms"
    ],
    "links": [
      {
        "label": "Inquire \u2197",
        "href": "mailto:deshmukhvaishnav@gmail.com?subject=GroupChat%20Consensus",
        "primary": true
      },
      {
        "label": "Case Study \u2197",
        "href": "#",
        "is_drawer": true
      }
    ],
    "img": "assets/work-groupchat.svg"
  }
};

  // ── 2. Custom Cursor ─────────────────────────────────────────
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isHoveringInteractive = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (cursorDot) {
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }
  });

  // Lerp loop for fluid cursor ring
  function animateCursor() {
    const ease = 0.18;
    ringX += (mouseX - ringX) * ease;
    ringY += (mouseY - ringY) * ease;

    if (cursorRing) {
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
    }

    requestAnimationFrame(animateCursor);
  }
  requestAnimationFrame(animateCursor);

  // Hover states on links and buttons
  function setupCursorHover() {
    const interactives = document.querySelectorAll('a, button, .work-row, .filter-pill');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        isHoveringInteractive = true;
        if (cursorRing) cursorRing.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        isHoveringInteractive = false;
        if (cursorRing) cursorRing.classList.remove('hovering');
      });
    });
  }
  setupCursorHover();

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    if (cursorDot) cursorDot.style.opacity = '0';
    if (cursorRing) cursorRing.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    if (cursorDot) cursorDot.style.opacity = '1';
    if (cursorRing) cursorRing.style.opacity = '1';
  });

  // ── 3. Floating Work Preview Image ───────────────────────────
  const workPreview = document.getElementById('work-preview');
  const previewImg = workPreview ? workPreview.querySelector('img') : null;
  const workRows = document.querySelectorAll('.work-row');

  workRows.forEach((row) => {
    const previewSrc = row.getAttribute('data-preview');

    row.addEventListener('mouseenter', () => {
      if (!workPreview || !previewImg || !previewSrc) return;
      previewImg.src = previewSrc;
      previewImg.alt = row.querySelector('.work-title')?.textContent.trim() || 'Project preview';
      workPreview.classList.add('visible');
    });

    row.addEventListener('mousemove', (e) => {
      if (!workPreview) return;
      const offset = 24;
      const previewWidth = 260;
      const previewHeight = 170;

      let x = e.clientX + offset;
      let y = e.clientY - previewHeight / 2;

      // Keep within viewport boundaries
      if (x + previewWidth > window.innerWidth - 20) {
        x = e.clientX - previewWidth - offset;
      }
      if (y + previewHeight > window.innerHeight - 20) {
        y = window.innerHeight - previewHeight - 20;
      }
      if (y < 20) y = 20;

      workPreview.style.left = `${x}px`;
      workPreview.style.top = `${y}px`;
    });

    row.addEventListener('mouseleave', () => {
      if (workPreview) workPreview.classList.remove('visible');
    });
  });

  // ── 4. Project Filters (All, Live, Concept) ───────────────────
  const filterPills = document.querySelectorAll('.filter-pill');
  const workItems = document.querySelectorAll('.work-item');

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const filter = pill.getAttribute('data-filter');

      filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      workItems.forEach((item) => {
        const status = item.getAttribute('data-status');
        if (filter === 'all' || status === filter) {
          item.classList.remove('hidden-item');
        } else {
          item.classList.add('hidden-item');
        }
      });
    });
  });

  // ── 5. Case Study Slide-Over Drawer ──────────────────────────
  const drawer = document.getElementById('case-study-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerCloseBtn = document.getElementById('drawer-close');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerCategory = document.getElementById('drawer-category');
  const drawerBadge = document.getElementById('drawer-badge');
  const drawerDomain = document.getElementById('drawer-domain');
  const drawerProblem = document.getElementById('drawer-problem');
  const drawerArchitecture = document.getElementById('drawer-architecture');
  const drawerDecisions = document.getElementById('drawer-decisions');
  const drawerTags = document.getElementById('drawer-tags');
  const drawerActions = document.getElementById('drawer-actions');

  function openCaseStudy(projectId) {
    const data = CASE_STUDIES[projectId];
    if (!data || !drawer) return;

    if (drawerTitle) drawerTitle.textContent = data.title;
    if (drawerCategory) drawerCategory.textContent = data.category;
    if (drawerBadge) {
      drawerBadge.textContent = data.badge || 'SYSTEM R&D';
      drawerBadge.className = `work-badge badge-${data.badge?.toLowerCase().includes('live') ? 'live' : 'concept'}`;
    }
    if (drawerDomain) drawerDomain.textContent = data.domain;
    if (drawerProblem) drawerProblem.textContent = data.problem;
    if (drawerArchitecture) drawerArchitecture.textContent = data.architecture;

    // Decisions
    if (drawerDecisions) {
      drawerDecisions.innerHTML = '';
      (data.techDecisions || []).forEach((dec) => {
        const li = document.createElement('li');
        li.textContent = dec;
        drawerDecisions.appendChild(li);
      });
    }

    // Tags
    if (drawerTags) {
      drawerTags.innerHTML = '';
      (data.tags || []).forEach((tag) => {
        const span = document.createElement('span');
        span.className = 'tech-chip';
        span.textContent = tag;
        drawerTags.appendChild(span);
      });
    }

    // Action links
    if (drawerActions) {
      drawerActions.innerHTML = '';
      (data.links || []).forEach((lnk) => {
        if (!lnk.is_drawer && lnk.href && lnk.href !== '#') {
          const a = document.createElement('a');
          a.href = lnk.href;
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = `drawer-action-btn ${lnk.primary ? 'primary' : 'secondary'}`;
          a.textContent = lnk.label;
          drawerActions.appendChild(a);
        }
      });
    }

    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCaseStudy() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Delegate click for Case Study buttons
  document.addEventListener('click', (e) => {
    const csBtn = e.target.closest('.cs-btn');
    if (csBtn) {
      e.preventDefault();
      const projId = csBtn.getAttribute('data-project');
      if (projId) openCaseStudy(projId);
      return;
    }

    // Also support clicking on the work-row title/body if not clicking a link
    const workRow = e.target.closest('.work-row');
    if (workRow && !e.target.closest('a') && !e.target.closest('button')) {
      const projId = workRow.getAttribute('data-project');
      if (projId && CASE_STUDIES[projId]) {
        openCaseStudy(projId);
      }
    }
  });

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeCaseStudy);
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeCaseStudy);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeCaseStudy();
    }
  });

  // ── 6. Navbar Scroll Blur & Shadow ───────────────────────────
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // ── 7. Mobile Menu Toggle ────────────────────────────────────
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── 8. London Real-Time Clock ────────────────────────────────
  const londonTimeEl = document.getElementById('london-time');
  function updateLondonTime() {
    if (!londonTimeEl) return;
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      londonTimeEl.textContent = `${timeStr} London UK`;
    } catch (err) {
      londonTimeEl.textContent = 'London, UK';
    }
  }
  updateLondonTime();
  setInterval(updateLondonTime, 1000);

  // ── 9. Seamless Infinite Marquee Loop ────────────────────────
  const tickerTrack = document.querySelector('.hero-ticker-track');
  if (tickerTrack) {
    // Duplicate track content once to prevent any seam
    tickerTrack.innerHTML += tickerTrack.innerHTML;
  }

  // ── 10. Scroll Fade-Up Intersection Observer ─────────────────
  const fadeUps = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    fadeUps.forEach((el) => observer.observe(el));
  } else {
    fadeUps.forEach((el) => el.classList.add('visible'));
  }

  // ── 11. Smooth Scroll for Anchor Links ───────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
