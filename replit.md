# TelePrompter Pro - Replit Project Guide

## Overview

TelePrompter Pro is a modern web application built for professional teleprompter functionality. It features a clean, intuitive interface for importing scripts (text/Word documents) and displaying them in a customizable teleprompter view with real-time controls for speed, text size, and display preferences. The application successfully supports Bluetooth keyboard controls for hands-free operation and horizontal text flipping functionality.

## System Architecture

### Full-Stack Architecture
- **Frontend**: React 18 with TypeScript, built using Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state

### Monorepo Structure
The project uses a monorepo approach with clear separation:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui with Radix UI primitives for accessible, customizable components
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: Custom file parser supporting .txt and .docx formats with drag-and-drop functionality
- **Teleprompter Display**: Full-screen capable with keyboard shortcuts and real-time controls
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend Architecture
- **API Layer**: RESTful Express.js server with TypeScript
- **File Processing**: Multer for file uploads, mammoth for Word document parsing
- **Database Layer**: Drizzle ORM with PostgreSQL dialect
- **Storage Abstraction**: Interface-based storage system supporting both memory and database storage

### Database Schema
Two main entities:
- **teleprompter_settings**: User preferences (font size, scroll speed, display options)
- **scripts**: User-uploaded content with metadata

## Data Flow

1. **File Import**: Users upload .txt/.docx files via drag-and-drop or file selector
2. **Content Processing**: Backend parses files and extracts plain text content
3. **Settings Management**: User preferences stored and synced via API
4. **Teleprompter Display**: Real-time rendering with customizable controls
5. **Keyboard Controls**: Comprehensive shortcut system for hands-free operation

## External Dependencies

### Core Dependencies
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **shadcn/ui**: Component library with Radix UI primitives
- **TanStack Query**: Server state management and caching
- **Drizzle**: Type-safe ORM with schema validation
- **mammoth**: Word document parsing for .docx support

### Development Tools
- **Vite**: Fast build tool with hot reload
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Custom plugins for Replit environment

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public/`
- Backend: ESBuild bundles server code to `dist/index.js`
- Shared: TypeScript compilation with path mapping

### Environment Configuration
- Development: `npm run dev` - runs both frontend and backend with hot reload
- Production: `npm run build && npm start` - builds and serves production bundle
- Database: Drizzle migrations with `npm run db:push`

### Key Design Decisions

**Storage Strategy**: Implemented interface-based storage abstraction with PostgreSQL database using Drizzle ORM. The application now persists user settings and scripts across sessions, providing a professional-grade data layer.

**File Processing**: Chose mammoth for Word document parsing due to its reliability and ease of use, while maintaining support for plain text files for maximum compatibility.

**Component Architecture**: Selected shadcn/ui over other component libraries for its excellent TypeScript support, accessibility features, and customization capabilities without vendor lock-in.

**State Management**: Used TanStack Query for server state to leverage its caching, error handling, and optimistic updates, while keeping local component state simple with React hooks.

**Fullscreen Experience**: Designed teleprompter display to support native fullscreen API with comprehensive keyboard shortcuts for professional use cases.

## Changelog

```
Changelog:
- July 07, 2025. Initial setup
- July 07, 2025. Core teleprompter application completed and tested successfully:
  * File upload system (.txt, .docx) working
  * Teleprompter display with smooth scrolling
  * Bluetooth keyboard controls functional (Space, Arrow keys, +/-, F, Esc)
  * Horizontal text flipping feature operational
  * Settings panel with customizable font size, scroll speed, line height
  * TypeScript errors resolved
- July 08, 2025. Database integration completed:
  * PostgreSQL database provisioned and configured
  * Drizzle ORM database layer implemented
  * Data persistence for settings and scripts across sessions
  * Migrated from in-memory to database storage
- July 08, 2025. Apple-style UI redesign completed:
  * Modern gradient design with Inter font
  * Glass morphism effects and rounded corners
  * Gradient text titles and Apple-style cards
  * Enhanced teleprompter controls with better visual hierarchy
- July 08, 2025. Enhanced keyboard shortcuts and navigation:
  * Added 'Go to Top' (Home key) and 'Go to Bottom' (End key)
  * Implemented marker system with 'Add Marker' (M key)
  * Navigation between markers with 'Next Marker' (N key) and 'Previous Marker' (P key)
  * Visual marker indicators with blue dots in teleprompter display
  * Enhanced import interface with paste functionality in script editor
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```