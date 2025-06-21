# AI-Powered Job Matcher

## Overview

This is a full-stack web application that uses AI to match resumes with job opportunities. Users can upload their resume, which gets analyzed using OpenAI's GPT-4o model to extract skills and experience. The system then uses vector similarity matching to find relevant job positions from a curated job database.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and bundling
- **File Uploads**: react-dropzone for drag-and-drop resume uploads

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o for resume parsing and vector generation
- **File Processing**: Multer for handling file uploads (PDF, DOC, DOCX, TXT)
- **Vector Matching**: Custom cosine similarity algorithm for job matching

### Database Schema
The application uses three main tables:
- **jobs**: Stores job listings with title, company, requirements, skills, and vector embeddings
- **resumes**: Stores uploaded resumes with parsed data and vector embeddings
- **jobMatches**: Stores matching results between resumes and jobs with confidence scores

## Key Components

### Resume Processing Pipeline
1. File upload via drag-and-drop interface
2. Text extraction from various file formats
3. AI-powered parsing using OpenAI GPT-4o to extract:
   - Technical skills
   - Experience level
   - Primary role
   - Years of experience
   - Industry background
4. Vector embedding generation for similarity matching

### Job Matching Engine
1. Vector similarity calculation using cosine similarity
2. Skill overlap analysis between resume and job requirements
3. Experience level compatibility checking
4. Confidence scoring (High/Medium/Low)
5. Ranked results with match percentages

### User Interface
- Modern, responsive design using Tailwind CSS
- Real-time statistics dashboard
- Interactive job listings with filtering
- Drag-and-drop resume upload
- Job match results with detailed scoring

## Data Flow

1. **Job Data Initialization**: Pre-populated job database with tech positions
2. **Resume Upload**: User uploads resume file
3. **AI Processing**: OpenAI API processes resume text and generates embeddings
4. **Vector Matching**: System compares resume vectors with job vectors
5. **Results Display**: Ranked job matches presented with confidence scores
6. **Real-time Updates**: Statistics and matches update automatically

## External Dependencies

### Core Dependencies
- **OpenAI API**: GPT-4o model for resume parsing and vector generation
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **@tanstack/react-query**: Server state management and caching
- **shadcn/ui**: Pre-built accessible UI components
- **react-dropzone**: File upload handling

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast JavaScript bundling for production
- **PostCSS & Autoprefixer**: CSS processing pipeline

## Deployment Strategy

### Development Environment
- Replit-based development with hot module replacement
- Automatic database migrations using Drizzle Kit
- Environment variable management for API keys
- Live reload for both client and server code

### Production Build
- Vite builds optimized client bundle
- ESBuild creates server bundle with external dependencies
- Static assets served from Express server
- PostgreSQL database with connection pooling

### Scaling Considerations
- Vector operations can be moved to specialized vector databases
- AI processing can be cached to reduce API costs
- Job database can be expanded with real-time job feeds
- File storage can be moved to cloud services for larger files

## Recent Changes
- June 21, 2025: Completed AI-powered job matching application
  - Built full-stack application with 48 diverse job positions
  - Integrated OpenAI GPT-4o for resume parsing and vector generation
  - Implemented cosine similarity matching algorithm
  - Created professional Eightfold-inspired UI with split-pane layout
  - Added comprehensive file upload support (PDF, DOC, DOCX, TXT)
  - Validated end-to-end functionality with successful resume processing

## User Preferences

Preferred communication style: Simple, everyday language.