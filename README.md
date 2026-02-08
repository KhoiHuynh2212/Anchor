# Anchor | AI-Driven Student Wellness & Support 

# Overview

Anchor is a proactive mental wellness platform designed to bridge the gap between student distress and professional support. In high-pressure academic environments, students often struggle in silence. Anchor provides an immediate, "always-on" emotional harbor.

The system functions as an empathetic listener:

    Detection: It identifies emotional distress through text or voice input.

    Analysis: Using Google Gemini 2.0, it categorizes the "struggle type" (e.g., burnout, loneliness, or exam anxiety) and determines the appropriate psychological tone.

    Intervention: It delivers immediate relief via ElevenLabs' specialized "soft-voice" synthesis, providing grounding exercises and comforting dialogue to de-escalate stress in real-time.


## Features
    Gemini 2.0 Logic: High-context reasoning to analyze complex student "struggle" scenarios.

    Emotive Voice Synthesis: Integration with ElevenLabs using specialized "soft" and "mellow" models to provide a nurturing, human-like presence.

    Real-time Streaming: Node.js-powered backend for low-latency audio chunking, ensuring comfort is delivered without technical lag.

    Custom Training Pipeline: Planned implementation for fine-tuning local models to categorize struggle levels and improve response accuracy.

## Architecture

The system utilizes a modern JavaScript stack for end-to-end performance:

    Mobile Client: Expo Go (React Native) handling voice recording and audio playback.

    Orchestration Layer: Node.js managing API routing, streaming buffers, and service integration.

    Intelligence: Google Gemini 2.0 for text-based reasoning and empathy mapping.

    Voice Layer: ElevenLabs API for converting Gemini’s text output into comforting speech.

    Data Persistence: MongoDB for session history and user state tracking.

### Installation
1. Backend Setup:
   # Clone the repository
    git clone https://github.com/KhoiHuynh2212/Anchor.git
    cd anchor/backend 
    # Install dependencies
    npm install
2. Frontend Setup
  cd ../frontend
  npm install
  npx expo start

## Roadmap: Model Training

We are developing a local classification model to:

    Pre-process inputs: Categorize the severity of the situation (Low/Medium/High risk).

    Adaptive Voices: Automatically switch between different ElevenLabs "Soft Voices" based on the detected emotion (e.g., using a "mellow" voice for anxiety vs. a "warm" voice for sadness).

# Team members 
Khoi 
Youssef 
Asma 
Robert


