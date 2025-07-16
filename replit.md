# Teleprompter - Replit Project Guide

## Overview

Teleprompter is a modern web application built for professional teleprompter functionality. It features a clean, Apple-style interface with light blue pastel gradient background and minimalist design using Inter font. The app provides an intuitive interface for importing scripts (text/Word documents) and displaying them in a white Script Editor box with real-time controls for speed, text size, and display preferences. The application successfully supports Bluetooth keyboard controls for hands-free operation and horizontal text flipping functionality.

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
  * Updated keyboard shortcuts documentation with all available shortcuts
  * Improved navigation with dual key support (H/Home, B/End keys)
  * Fixed text persistence issue - content now properly preserved when exiting teleprompter
  * Removed redundant paste button while maintaining Ctrl+V functionality
  * Improved state management with parent component handling content state
- July 08, 2025. Violet marker system implementation completed:
  * Added 'Add Marker' button with violet gradient styling beside 'Choose File' button
  * Violet square markers (■) inserted at cursor position in Script Editor
  * Updated keyboard navigation: N key = Next Marker, P key = Previous Marker
  * Markers display as violet squares in both Script Editor and Teleprompter display
  * Text-based marker navigation system working with content positioning
- July 08, 2025. Rebranded to Vibe Prompting:
  * Updated application name from TelePrompter Pro to Vibe Prompting
  * Integrated new Vibe Prompting logo with blue gradient design
  * Updated page title, headers, and welcome message
  * Refreshed branding throughout the application interface
- July 10, 2025. Rebranded to Vibe Teleprompter with Apple-style UI:
  * Updated application name from Vibe Prompting to Vibe Teleprompter
  * Integrated updated logo design with enhanced blue gradient
  * Implemented Apple-style UI with pastel colors and round corners
  * Added Inter font integration for minimalist, professional look
  * Enhanced glass morphism effects and backdrop blur
  * Improved button styling with Apple-style rounded corners
  * Updated gradient text styling with enhanced visual appeal
- July 10, 2025. Final design refinements:
  * Changed app name from "Vibe Teleprompter" to "Teleprompter"
  * Applied light blue pastel vertical gradient background (#dbeafe to #93c5fd)
  * Kept Script Editor box pure white for optimal contrast
  * Updated "Teleprompter" text with blue vertical gradient matching logo
  * Maintained logo design as requested by user
- July 10, 2025. Updated to cyan color scheme:
  * Applied cyan vertical gradient background from nearly white to RGB(3, 146, 212)
  * Changed "Teleprompter" text color to #0392d4 (matching cyan theme)
  * Maintained white Script Editor box for optimal readability
- July 11, 2025. Final branding update:
  * Changed app name from "Teleprompter" to "Teleprompter / Autocue"
  * Moved logo and name positioning closer to the left for better visual balance
  * Updated page title and welcome message to reflect new branding
- July 11, 2025. Smooth scrolling implementation:
  * Completely removed line height feature from application (schema, settings, controls, shortcuts)
  * Added default speed reset button (1.0x) as leftmost control in teleprompter
  * Fixed smooth scrolling implementation using requestAnimationFrame for ultra-smooth 60fps animation
  * Enhanced settings switches to show green when enabled for better UX
  * Improved scroll timing and reduced jerkiness with consistent delta time calculations
- July 11, 2025. Final teleprompter refinements:
  * Removed settings button from both main page and teleprompter controls to eliminate conflicts
  * Reverted speed range to 0.1x-3.0x for better responsiveness and control
  * Implemented 12-layer interpolation system for ultra-smooth scrolling
  * Real-time speed updates with instant response (no delays)
  * Optimized animation loop with delta time capping for stability
  * Ultra-smooth interpolation with optimized smoothing factors (0.06-0.28) to eliminate jerkiness
  * Exponential speed scaling: current speed represents 1.5x, with dramatic increases toward 3.0x
  * Base 160 pixels/second with exponential scaling for significant speed differences
  * 0.1x-1.0x range now twice as fast as previous implementation
  * Moved Shortcuts button from front page to teleprompter floating panel
  * Streamlined floating control panel with essential controls only
  * Fixed all speed controls to enforce 0.1x-3.0x range limits
  * Fixed floating panel controls API integration with correct parameter order
  * All teleprompter controls now fully functional with database persistence
- July 16, 2025. Real-time speech-to-text implementation completed:
  * Added microphone button to the left of "Choose File" button
  * Implemented WebSocket-based real-time speech-to-text using Google Speech API
  * Live transcription appears in script editor as you speak
  * Added visual feedback with pulsing red recording indicator
  * Text appears instantly during speech and gets added to script when finalized
  * Separate audio upload configuration for speech files with 50MB limit
  * Support for various audio formats (webm, ogg, wav, mp3, m4a)
  * Real-time audio streaming with 16kHz LINEAR16 encoding for optimal quality
  * Enhanced WebSocket stability with keep-alive pings and auto-reconnection
  * Improved stream management to handle speech pauses and continuous recording
  * Reduced audio buffer size for more responsive real-time transcription
  * Fixed text accumulation issues - sentences now properly append without overwriting
  * Implemented proper state management with refs to prevent stale content issues
  * Voice input now works continuously across speech pauses with automatic reconnection
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```