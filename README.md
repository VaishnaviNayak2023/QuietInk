# QuietInk

> Offline Domestic Violence Escape Assistant powered by Gemma 4

QuietInk is a stealth offline AI safety assistant disguised as a minimal notes and journaling mobile application. It is designed for domestic violence survivors and individuals living in high-risk or coercive environments where digital surveillance, restricted internet access, or monitored devices make seeking help dangerous.

On the surface, QuietInk behaves like a simple offline notes and journaling application used for writing thoughts, checklists, and personal notes. Hidden beneath this ordinary interface is a secure offline environment called **Private Space**, which contains AI-powered safety tools, emergency planning systems, encrypted evidence storage, and silent emergency workflows powered by Gemma 4.

The project explores how modern AI systems can become:
- humanitarian technology
- offline safety infrastructure
- survivability-focused mobile systems

---

# Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Solution](#solution)
- [Core Features](#core-features)
- [AI Architecture](#ai-architecture)
- [Security Architecture](#security-architecture)
- [Stealth Design Philosophy](#stealth-design-philosophy)
- [Secure Vault](#secure-vault)
- [Emergency Systems](#emergency-systems)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Setup Instructions](#setup-instructions)
- [Future Roadmap](#future-roadmap)
- [Disclaimer](#disclaimer)
- [License](#license)

---

# Overview

QuietInk was built around one core principle:

> Survivors should be able to access safety tools privately, offline, and without drawing attention.

Most existing safety applications depend heavily on:
- internet connectivity
- cloud infrastructure
- visible interfaces
- obvious emergency branding

However, in real-world domestic violence situations:
- phones may be monitored
- search history may be checked
- messages may be read
- internet access may be restricted
- downloading visible “safety apps” can increase danger

QuietInk approaches this problem differently by functioning as:

1. A legitimate notes and journaling application  
2. A hidden AI-powered safety assistant  
3. A fully offline encrypted personal safety system

---

# The Problem

Domestic violence survivors often face:
- digital surveillance
- coercive control
- restricted communication
- financial dependence
- limited access to safe support systems

Traditional safety apps create multiple problems:
- suspicious app icons
- visible notifications
- cloud-based dependencies
- discoverable interfaces
- internet requirements
- unsafe metadata generation

AI systems introduce additional risks:
- hallucinated legal advice
- fabricated emergency resources
- unsafe responses
- privacy concerns

We wanted to design a system that minimizes these risks while still making AI practically useful.

---

# Solution

QuietInk transforms a simple offline notes app into a hidden private safety infrastructure platform.

The application contains two layers:

## 1. Visible Layer

A clean minimal notes and journaling application.

Users can:
- write notes
- create checklists
- organize folders
- maintain journals

The visible app must feel completely ordinary.

---

## 2. Hidden Layer — Private Space

A concealed secure environment accessible only through hidden triggers.

Private Space includes:
- AI safety assistant
- silent SOS system
- emergency planning workflows
- encrypted evidence storage
- device safety scanning
- offline legal/help resources

The hidden system is designed to:
- remain undiscoverable during casual inspection
- operate fully offline
- prioritize speed and discretion

---

# Core Features

# Minimal Notes & Journaling Application

The visible application supports:
- offline note creation
- journaling
- checklists
- search
- folders/tags
- lightweight markdown support

Design goals:
- minimalistic appearance
- no suspicious UI
- fast performance
- low resource usage
- familiar interaction patterns

---

# Hidden Entry System

Private Space is intentionally concealed.

Supported triggers:
- secret keywords inside notes
- hidden gestures
- secondary PIN system
- interaction sequences

Examples:

```text
safe://open
#private_mode
```

The system avoids visible buttons or suspicious menu items.

---

# Private Space

Private Space is the hidden offline security environment.

It includes:

## Emergency Contacts
- encrypted local storage
- trusted contacts
- coded emergency phrases

---

## Emergency Action System

Silent emergency workflows including:
- silent SMS alerts
- location sharing
- coded messages
- optional emergency audio recording

The UI is intentionally minimal:
- no animations
- no confirmation dialogs
- fast execution

---

## Safety Planning

Structured emergency preparation tools:
- emergency exit planning
- document preparation checklists
- transport planning
- emergency bag guidance
- safety timing workflows

---

## Device Safety Check

Detects potential monitoring indicators:
- accessibility abuse
- remote access tools
- screen monitoring software
- suspicious permissions

The interface avoids technical complexity and only shows:
- SAFE
- WARNING

---

# Secure Vault

QuietInk contains a fully encrypted Secure Vault for sensitive information.

Supports:
- photos
- voice recordings
- documents
- incident logs
- text entries

Security features:
- AES-256 encryption
- SQLCipher encrypted database
- biometric lock support
- Android Keystore integration
- local-only storage

The vault is designed to:
- minimize metadata exposure
- avoid cloud dependency
- support fast emergency access

---

# Offline AI Safety Assistant

The AI assistant is powered by multiple Gemma 4 models.

## Models Used
- Gemma 4 E2B
- Gemma 4 E4B
- Gemma 4 26B
- Gemma 4 31B

---

# AI Goals

The AI is designed specifically for:
- grounded safety guidance
- emergency planning
- device safety awareness
- structured risk assessment
- offline assistance

The assistant intentionally avoids:
- emotional over-generation
- hallucinated legal advice
- fabricated shelters/resources
- unsafe recommendations

---

# Retrieval-Augmented Generation (RAG)

To reduce hallucinations, QuietInk uses Retrieval-Augmented Generation.

The system retrieves grounded information from:
- offline legal datasets
- safety checklists
- emergency guidance documents
- digital security protocols

This retrieved information is passed into Gemma models before response generation.

---

# AI Routing Architecture

Different Gemma models handle different workloads.

```text
User Query
    ↓
Safety Classifier
    ↓
Offline Retrieval System
    ↓
Gemma Routing Layer
```

## Model Roles

| Model | Purpose |
|---|---|
| Gemma 4 E2B | Fast lightweight offline responses |
| Gemma 4 E4B | General reasoning |
| Gemma 4 26B | Structured planning |
| Gemma 4 31B | Complex reasoning and fallback |

---

# Security Architecture

QuietInk follows a local-first security model.

## Security Principles
- offline-first operation
- zero analytics
- minimal metadata
- encrypted local storage
- no mandatory cloud sync

---

## Encryption Stack

### Storage
- SQLCipher
- AES-256

### Secure Key Handling
- Android Keystore
- libsodium

### Authentication
- optional biometric lock
- secondary PIN system

---

# Stealth Design Philosophy

The application must remain non-suspicious.

## UX Requirements
- monochrome UI
- no flashy visuals
- no suspicious labels
- no emergency-themed branding
- no visible panic buttons

The app should appear indistinguishable from a normal productivity app.

---

# Performance Goals

QuietInk is optimized for:
- low-end Android devices
- offline environments
- fast startup time
- efficient inference
- reduced memory usage

Target constraints:
- lightweight installation size
- under 3-second local AI responses
- stable offline functionality

---

# Emergency Systems

QuietInk includes:
- silent SOS messaging
- trusted contact workflows
- coded emergency phrases
- emergency planning checklists
- discreet location sharing

The emergency system is designed for:
- speed
- discretion
- minimal interaction time

---

# Tech Stack

## Frontend
- React
- Vite
- TypeScript

## AI Runtime
- Gemma 4 E2B
- Gemma 4 E4B
- Gemma 4 26B
- Gemma 4 31B
- ONNX Runtime
- llama.cpp

## Backend
- Node.js
- Express.js

## Storage
- SQLite
- SQLCipher

## Security
- AES-256 Encryption
- Android Keystore
- libsodium

## AI Infrastructure
- Retrieval-Augmented Generation (RAG)
- Offline inference
- Local-first architecture

---

# Project Architecture

```text
QuietInk
│
├── Notes Layer
│   ├── Journals
│   ├── Checklists
│   └── Search
│
├── Hidden Entry System
│
├── Private Space
│   ├── AI Assistant
│   ├── Emergency Tools
│   ├── Secure Vault
│   ├── Device Safety Check
│   └── Offline Help Library
│
├── AI Layer
│   ├── Safety Classifier
│   ├── RAG Pipeline
│   └── Gemma Routing
│
└── Encryption Layer
    ├── SQLCipher
    ├── AES-256
    └── Android Keystore
```

---

# Setup Instructions

## Install Dependencies

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

---

## Build Application

```bash
npm run build
```

---

# Future Roadmap

Planned improvements include:
- Flutter native deployment
- multilingual support
- advanced offline retrieval
- improved mobile inference optimization
- encrypted offline exports
- enhanced device monitoring detection
- NGO and safety organization partnerships

---

# Disclaimer

QuietInk is an educational and research-oriented prototype.

It is not a replacement for:
- emergency services
- legal professionals
- law enforcement
- crisis intervention organizations

Always contact local authorities or trusted organizations in emergencies.

---

# Vision

QuietInk explores how AI can move beyond productivity and become:

> private safety infrastructure for vulnerable people.

---

# License

MIT License

---

# Built For

Gemma 4 Hackathon

Focused on:
- AI safety
- humanitarian technology
- offline AI systems
- privacy-first mobile UX
- survivability-focused design
