# Phoneme Activity Builder — Assessment 2

A full-stack web application for Speech Pathology teachers to create, manage, and deploy phoneme-based classroom activities (Wordle and Word Search).

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Next.js API Routes (REST API)
- **Database:** SQLite via Prisma ORM
- **Containerisation:** Docker (standalone output)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:push

# 3. Seed sample data (90 words + 2 sample activities)
npm run db:seed

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

```bash
# Build image
docker build -t phoneme-builder .

# Run container
docker run -p 3000:3000 phoneme-builder

# Health check
curl http://localhost:3000/api/health
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (returns 200 OK) |
| GET | `/api/word-lists` | List all word lists |
| POST | `/api/word-lists` | Create a word list |
| GET | `/api/word-lists/[id]` | Get word list with words |
| PUT | `/api/word-lists/[id]` | Update word list name/description |
| DELETE | `/api/word-lists/[id]` | Delete word list (cascades) |
| POST | `/api/word-lists/[id]/words` | Add word to list |
| DELETE | `/api/word-lists/[id]/words?wordId=x` | Remove word from list |
| GET | `/api/activities` | List all activities |
| POST | `/api/activities` | Create activity config |
| GET | `/api/activities/[id]` | Get activity with matching words |
| PUT | `/api/activities/[id]` | Update activity config |
| DELETE | `/api/activities/[id]` | Delete activity |

## Database Schema

- **WordList** — Collection of words (name, description)
- **Word** — Individual word with phoneme breakdown (stored as JSON array)
- **Activity** — Activity configuration (type, word length, guesses, grid size, etc.)

## Features

- **Phoneme Wordle** — Guess the phoneme sequence with colour-coded feedback and hover hints
- **Phoneme Word Search** — Find hidden phoneme words in a grid (horizontal, vertical, diagonal)
- **Word List Management** — Full CRUD on word lists and individual words via UI and API
- **Activity Configuration** — Create, save, and manage activity settings
- **Backend Data** — Activities load words from the database when available
- **Standalone HTML Export** — Download activities as self-contained HTML files
- **Dark Mode** — Light/Dark/System theme support via Settings
- **Accessibility** — ARIA labels, keyboard navigation, semantic HTML
- **Responsive Design** — Mobile hamburger menu, adaptive layouts
- **Docker Ready** — Standalone output with SQLite for easy deployment

## Assessment 1 Feedback Fixes

This version addresses all feedback from Assessment 1:

1. ✅ **README** — Comprehensive documentation (this file)
2. ✅ **Wordle export bug fixed** — Standalone HTML now uses the same two-pass duplicate phoneme algorithm as the React preview
3. ✅ **Theme flicker fixed** — Cookie read in root layout; added System theme option
4. ✅ **Hamburger hidden on desktop** — Only shows on mobile (`md:hidden`)
5. ✅ **Accessibility improvements** — ARIA labels on buttons, keyboard support on grid cells, semantic `<button>` elements
6. ✅ **Teacher custom content** — Word list CRUD lets teachers add arbitrary words/phonemes

## Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data (90 words)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/      # Health check endpoint
│   │   │   ├── word-lists/  # Word list CRUD + words
│   │   │   └── activities/  # Activity CRUD
│   │   ├── wordle/          # Wordle builder page
│   │   ├── word-search/     # Word search builder page
│   │   ├── word-lists/      # Word list management UI
│   │   ├── activities/      # Activity management UI
│   │   ├── settings/        # Theme & preferences
│   │   ├── about/           # Project info & API docs
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles + dark mode
│   ├── components/
│   │   ├── Header.tsx       # Responsive nav with hamburger
│   │   └── Footer.tsx       # Student info footer
│   ├── data/
│   │   └── phonemeCorpus.ts # Phoneme data & word lists
│   └── lib/
│       └── prisma.ts        # Prisma client singleton
├── Dockerfile               # Multi-stage Docker build
├── .dockerignore
├── .env                     # DATABASE_URL
└── package.json
```

## Author

**Name:** Mingxuan He
**Student ID:** 19884912
