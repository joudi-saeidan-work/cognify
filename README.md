## <img src="public/logo.svg" alt="Cognify Logo" width="32" height="32" style="vertical-align: middle; margin-right: 8px;"> Cognify – AI-Powered Task Management Platform

<div align="center">

**Transform your thoughts into organized tasks with AI-powered voice recording and intelligent task management, built with neurodivergent users in mind.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5--Turbo-412991?style=flat-square&logo=openai)](https://openai.com/)

[🎥 Watch Demo](https://youtu.be/E1bmHM1Wphw)

</div>

---

## Why Cognify?

Many productivity tools assume a linear, neurotypical way of thinking. For people with ADHD, the problem isn’t a lack of ideas, it’s turning chaotic thoughts into structured action. **Cognify** is a voice-first, AI-powered system built specifically to reduce **executive dysfunction**, **time blindness**, and **working memory overload**.

Designed as part of my Artificial Intelligence dissertation at the University of Manchester, Cognify integrates visual planning, voice input, and auditory feedback into a unified interface informed by ADHD research, inclusive UX, and cognitive psychology.

---

## Research & Methodology

Cognify was developed using an **Agile, participatory design process** grounded in inclusive design principles and cognitive accessibility. Seven iterative development stages involved:

- User surveys and UI walkthroughs
- MoSCoW feature prioritization
- Usability testing and accessibility audits
- Cognitive scaffolding evaluation (e.g., task initiation, memory offloading)

The project was guided by the following research question:

> _To what extent can a multimodal, voice-first productivity system reduce cognitive friction and improve executive functioning outcomes for users with ADHD?_

---

## Overview

Cognify is a cross-platform productivity environment that uses AI to convert **unstructured speech into organized tasks**. The system includes:

- A Kanban-based **web app** for structured planning
- A voice-first **Progressive Web App** (PWA) for instant task capture
- An AI-powered **assistant suite** for planning, decision-making, learning, and writing

---

## Key Features

- 🎙️ One-tap voice recording with real-time transcription
- 🧠 AI agents for task extraction, summarization, and decision scaffolding
- 📅 Calendar sync with drag-and-drop support
- 🗂️ Kanban boards with theming and card metadata
- 🔊 Text-to-speech with motivational daily briefings
- 📲 Installable voice recorder (PWA) with offline support
- 🧍‍♂️ Multi-user collaboration & organization boards
- ♿ Full accessibility: zoom, themes, colorblind mode, screen reader support

---

## AI Agent Suite

| Agent           | Purpose                                   |
| --------------- | ----------------------------------------- |
| Magic ToDo      | Turn speech into structured tasks         |
| The Consultant  | Weigh pros/cons and offer recommendations |
| The Professor   | Explain concepts and create lessons       |
| NoteWhiz        | Answer questions from your notes          |
| Text Formalizer | Improve tone and grammar in writing       |
| RoutineBuilder  | Create personalized habits and routines   |

---

## Technical Architecture

### Frontend

- Next.js 14.2.16 (App Router)
- TypeScript, Tailwind CSS, shadcn/ui, Radix UI
- Zustand (state), React Query (data), Framer Motion

### Backend

- MySQL + Prisma ORM
- Clerk authentication
- WebSockets for real-time sync
- IndexedDB for offline audio storage

### AI + APIs

- OpenAI GPT-3.5 Turbo (agents + summaries)
- Whisper API (transcription)
- RapidAPI (text-to-speech)
- Unsplash API (visual search)

### PWA & Offline Support

- Custom service worker
- IndexedDB for queued uploads
- Manifest-based install flow

---

## Testing

```bash
npm run test            # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Show test coverage
```

Includes:

- React component testing (RTL)
- Integration tests for AI pipelines
- Accessibility audits (Lighthouse, aXe)
- Manual end-to-end tests for voice capture + assistant flow

---

## Project Structure

```
cognify/
├── app/              # Next.js app routes
├── components/       # Shared UI
├── hooks/            # Custom React hooks
├── actions/          # Server-side actions
├── prisma/           # DB schema
├── public/           # Manifest + icons
└── __tests__/        # Test files
```

---

## Environment Variables

| Key                               | Description                       | Required |
| --------------------------------- | --------------------------------- | -------- |
| `DATABASE_URL`                    | MySQL connection                  | ✅       |
| `OPENAPI_API_KEY`                 | OpenAI key                        | ✅       |
| `GROQ_API_KEY`                    | Whisper transcription             | ✅       |
| `CLERK_SECRET_KEY`                | Auth secret                       | ✅       |
| `CLERK_PUBLISHABLE_KEY`           | Frontend auth                     | ✅       |
| `RAPIDAPI_KEY`                    | Text-to-speech                    | ✅       |
| `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` | Image search                      | ✅       |
| `PINECONE_API_KEY`                | Vector database (semantic memory) | ✅       |

---

## Getting Started

```bash
git clone https://github.com/joudi-saeidan-work/cognify.git
cd cognify
npm install
cp .env.example .env
```

Edit `.env`, then:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## Acknowledgments

- ADHD research: Barkley, Ptacek, Ramos-Galarza
- UI & HCI insights: Budiu, Lihou, Inclusive Design Toolkit
- OpenAI, Clerk, Tailwind Labs, Prisma
- The ADHD community for inspiration and feedback

---

<div align="center">

**Built with ❤️ for neurodivergent thinkers**

</div>
