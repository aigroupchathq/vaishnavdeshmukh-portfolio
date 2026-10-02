# Vaishnav Workspace · Systems Architecture & UX Engineering

[![Live Portfolio](https://img.shields.io/badge/Live_Portfolio-aigroupchathq.github.io%2Fvaishnavdeshmukh--portfolio-2f81f7?style=flat-square&logo=github)](https://aigroupchathq.github.io/vaishnavdeshmukh-portfolio/)
[![Node Version](https://img.shields.io/badge/Node-20+-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Active_Prototypes_on_GitHub-ff3358?style=flat-square)](https://github.com/aigroupchathq/vaishnavdeshmukh-portfolio)
[![Location](https://img.shields.io/badge/Location-London%2C_UK-a78bfa?style=flat-square)](#)

> **Live Portfolio**: [https://aigroupchathq.github.io/vaishnavdeshmukh-portfolio/](https://aigroupchathq.github.io/vaishnavdeshmukh-portfolio/)

---

## About Vaishnav Deshmukh

I view software through the lens of interdependent systems: the physical tolerances of an engine, the throughput of a supply chain, and the cognitive load on a human mind. With a master’s in logistics and a foundation in market behavior, my work begins by observing flow, bottlenecks, and the unwritten patterns of daily operations.

But mechanical efficiency means nothing if the interaction feels hostile. Guided by psychology, design fundamentals, and practical philosophy, I care deeply about how an interface feels in human hands—its cadence, clarity, and tactile feedback. I spend my time building working prototypes and architectural case studies. My goal is to create responsive, quiet tools that respect human attention, absorb operational friction, and give genuine value back to the community.

---

## Core Focus Areas

- **Healthcare Logistics & Clinical Flows**: Offline-first asset telemetry, HL7 FHIR v4 data schemas, GS1-128 DataMatrix verification, and low-latency Bluetooth Low Energy (BLE) RSSI triangulation models.
- **Spatial 3D & Interactive Tooling**: Browser-native WebGL shaders, Three.js 60 FPS pipelines, procedural geometric dissection, and low-latency Web Audio API Worklet DSP synthesis.
- **Civic Infrastructure & Municipal Triage**: Spatial DBSCAN clustering algorithms, perceptual image deduplication, and high-density operator triage workflows.
- **Applied Cryptography & Privacy**: Client-side zero-knowledge proof generation (zk-SNARK Groth16 with Circom 2.1 & SnarkJS) and decentralized verifiable credentials with 0 bytes of plaintext data leaked.

---

## 10 Prototypes & Architectural Case Studies (Under Active Development)

All projects represent personal concepts, working prototypes, and architectural case studies under active development on GitHub:

| # | Prototype | Domain & Architecture | Key Engineering Targets |
|---|---|---|---|
| **01** | **Predictive Ward Logistics Engine** | Health Systems · Offline BLE Telemetry | `<9s` search time target · 100% offline cache · HL7 FHIR v4 schema · GS1 DataMatrix |
| **02** | **The Unexplored Interior** | Cognitive Neuroscience · IIT 4.0 Benchmark | `IIT 4.0` \(\Phi\) state engine · 5 sensory awareness tests · 3D gyroscopic gimbal · 528Hz Solfeggio sound synth |
| **03** | **iTHINK: 3D Neuroanatomy Atlas** | Cognitive Neuroscience · WebGL Shaders | `60 FPS` WebGL render cadence · GLTF Draco compression · Zero external plugins · Web Audio spatial cues |
| **04** | **CivicFlow: Municipal Triage** | Civic Systems · Spatial Clustering | `Sub-sec` DBSCAN clustering · PostGIS geospatial deduplication · Offline field PWA |
| **05** | **AI Script Studio** | Generative Audio · In-Browser DAW | `Sub-12ms` AudioWorklet DSP latency · Multi-track stem matrix · Canvas waveform rendering |
| **06** | **RoadTriage: Pavement Distress Vision** | Civic Infrastructure · Edge ML | `YOLOv8` edge segmentation · ONNX Runtime Web client inference · Sub-meter GPS geotag |
| **07** | **It's You: Zero-Knowledge Identity Vault** | Privacy Engineering · zk-SNARK Groth16 | `0 Bytes` plaintext personal data leaked · Circom 2.1 arithmetic circuits · SnarkJS mobile prover (~1.4s) |
| **08** | **BabyCarl: Circadian Telemetry** | Connected Hardware · Ambient Sensing | Non-contact optical micro-motion · Local Kalman filter DSP · Zero cloud storage dependency |
| **09** | **GroupChat HQ** | Collaborative Architecture · Semantic Clustering | Vector similarity embeddings · CRDT local state synchronization · Local-first cache |
| **10** | **VISION: Prompt Lab** | AI Systems Ergonomics · Prompt Framework | 14 operational prompt patterns · Deterministic tool schema outputs · XML parameter scaffolding |

---

## Planned Open-Source Roadmap & Technical Deliverables

| Milestone | Target Horizon | Open-Source Package / Repo | Primary Architectural Focus |
|---|---|---|---|
| **01** | **Q3 2026** (Active Dev) | `github.com/deshmukhvaishnav/ward-engine-core` (Apache 2.0) | Web Bluetooth Gateway daemon, P2P CRDT vector clock sync (Yjs), HL7 FHIR v4 schema validation. |
| **02** | **Q4 2026** (Active Dev) | `github.com/deshmukhvaishnav/ithink-spatial-webgpu` (MIT) | WebGPU WGSL compute shaders, mathematical clipping planes, 60 FPS Draco decompression pipeline. |
| **03** | **Q1 2027** (RFC Open) | `github.com/deshmukhvaishnav/civicflow-edge-triage` (AGPLv3) | In-browser ONNX Runtime Web YOLOv8 pavement classifier, WebAssembly R-Tree spatial deduplication index. |
| **04** | **Q2 2027** (Research) | `github.com/deshmukhvaishnav/scriptstudio-dsp` (MIT) | Zero GC audio ring buffers, AudioWorklet DSP 16-stem mixing matrix, client-side vector embeddings. |

---

## System Heuristics & Design Principles

1. **Quiet Tools Over Alert Fatigue**: Software built for high-stakes environments (clinical wards, municipal works) should not scream for attention or freeze when Wi-Fi drops. Quiet software caches locally, triangulates passively, and stays responsive.
2. **Zero-Pill Discipline & Editorial Hierarchy**: Replace generic colored rounded tag spam with unboxed, high-contrast monospace metrics separated by middle dots (`·`). Prioritize typographic weight and structural alignment.
3. **High-Density Operational Ergonomics**: Provide clear keyboard accessibility, predictable ARIA navigation, sustained 60 FPS transitions, and tactile feedback.
4. **Verifiable Client-Side Privacy**: Minimize third-party trust boundaries. Move cryptographic proof generation and inference to the client device wherever computationally feasible.

---

## Technology Stack

- **Frontend & Interface**: HTML5, Vanilla JavaScript (ES2022+), Tailwind CSS (3.4+), Lucide Icons, Canvas API, Web Audio API, Three.js WebGL.
- **Backend & Serving**: Node.js HTTP runtime, Express, custom static streaming pipeline with MIME resolution and route normalization.
- **Interactive Demos**: Dedicated sub-applications for `CivicFlow` municipal incident simulator and `iTHINK` 3D neuroanatomy dissection atlas.

---

## Local Development & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or bun

### Running Locally
```bash
# Clone the repository
git clone https://github.com/deshmukhvaishnav/<your-repo-name>.git
cd <your-repo-name>

# Install dependencies
npm install

# Start the local development server (port 3000)
npm run dev

# Open in browser
# http://localhost:3000/vaishnav-workspace
```

---

## Direct Links & Contact

- **Live Portfolio**: [https://aigroupchathq.github.io/vaishnavdeshmukh-portfolio/](https://aigroupchathq.github.io/vaishnavdeshmukh-portfolio/)
- **GitHub**: [github.com/aigroupchathq/vaishnavdeshmukh-portfolio](https://github.com/aigroupchathq/vaishnavdeshmukh-portfolio)
- **Location**: Greater London, UK
