# DecimalFold

## Overview

DecimalFold is an AI-powered job matching platform that analyzes resumes and finds relevant job opportunities using semantic similarity matching. The application processes resumes, extracts key information using AI, and matches candidates with jobs from a comprehensive database using vector embeddings.

## Key Features

### 🤖 AI-Powered Resume Analysis

- Automatic extraction of skills, experience level, job roles, and industries from resumes
- Support for PDF, DOCX, and TXT file formats (max 2MB)
- Intelligent parsing using OpenAI GPT-4 for accurate data extraction
- Multi-language support with automatic language detection and translation

### 🎯 Smart Job Matching

- Semantic similarity matching using OpenAI embeddings (text-embedding-ada-002)
- Vector-based job recommendations with confidence scores
- Support for both PostgreSQL-based and Pinecone vector search
- Matching statistics including average scores and processing time

### 📊 Comprehensive Job Database

- 20,000+ generated job listings across multiple industries
- Categories include Software Engineering, Data Science, Product Management, Marketing, Sales, and more
- Realistic job data with proper salary ranges, company information, and requirements
- Advanced filtering by experience level, work type, location, and keywords

### 🔍 Advanced Search & Filtering

- Real-time job search with pagination
- Filter by experience level, work type, company size, and location
- Keyword search across job titles, descriptions, and requirements
- Responsive UI with modern design patterns

## Technical Architecture

### Frontend Stack

- **React 18** with TypeScript for component-based UI development
- **Vite** for fast development builds and HMR
- **Tailwind CSS** + **shadcn/ui** for modern, accessible component library
- **TanStack Query** for server state management and caching
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod validation for form handling

### Backend Stack

- **Node.js** with **Express.js** for RESTful API server
- **TypeScript** for type-safe backend development
- **Drizzle ORM** with PostgreSQL for type-safe database operations
- **Multer** for efficient file upload handling
- **Express Sessions** for user session management

### Database & Storage

- **PostgreSQL** (Neon) as primary database for jobs, resumes, and matches
- **Pinecone** vector database for high-performance similarity search
- **Resume files stored in database** - full resume text is stored in the `originalText` field
- Optimized schema with proper indexing for fast queries

### AI & Machine Learning

- **OpenAI GPT-4** for intelligent resume parsing and data extraction
- **OpenAI Embeddings** (text-embedding-ada-002) for vector generation
- **Custom vector matching algorithms** with multiple similarity strategies
- **Language translation service** for multi-language resume support

### File Processing Pipeline

- **PDF extraction** using pdf2json and pdfjs-dist
- **Word document processing** with mammoth.js
- **Language detection** with automatic translation capabilities
- **Memory-optimized processing** - files processed in-memory and buffers cleared immediately

## Memory & Performance Optimizations

### Resume Handling

- **Optimized vector generation** using full processed text for high-quality embeddings

### Database Efficiency

- **Selective data storage** - Essential parsed data and vectors stored in database
- **Paginated queries** with proper indexing for fast job retrieval
- **Optimized vector operations** with batched processing for large datasets
- **Smart caching strategies** using React Query for reduced API calls

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Pinecone API key (optional, for vector search)

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=sk-your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key  # Optional
PINECONE_INDEX_NAME=smartcareermatch      # Optional
```

### Installation

```bash
# Install dependencies
npm install

# Set up database schema
npm run db:push

# Start development server (runs both client and server)
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # Type checking
npm run db:push      # Push schema changes to database
```

## API Documentation

### Core Endpoints

#### Jobs

- `GET /api/jobs` - Get paginated job listings with optional filtering
  - Query params: `search`, `experienceLevel`, `workType`, `page`, `limit`
- `GET /api/jobs/all` - Get all jobs (legacy endpoint)
- `GET /api/jobs/:id` - Get specific job details by ID
- `GET /api/jobs/stats` - Get job database statistics

#### Resume Processing

- `POST /api/resume/upload` - Upload and process resume file
  - Accepts: PDF, DOCX, TXT files (max 2MB)
  - Returns: Parsed resume data, language info, and vector

#### Job Matching

- `POST /api/resume/:id/matches` - Find job matches for a specific resume ID
  - Returns: Ranked job matches with scores and statistics

#### Vector Strategy Testing

- `POST /api/resume/:id/matches/strategy` - Test different vector strategies
  - Body: `{ strategy: "tfidf" | "skill" | "hybrid" }`
- `GET /api/strategies` - Get available matching strategies

#### Job Generation (Development)

- `POST /api/jobs/generate` - Generate sample jobs for testing
  - Body: `{ count: number, type: "general" | "tech" | "data" }`
  - Max count: 100,000 jobs

#### Health Check

- `GET /api/health` - Health check endpoint

## Data Models

### Job Schema

```typescript
{
  id: number;
  title: string;
  company: string;
  companySize?: string;        // e.g., "1000+ employees", "100-999 employees"
  location: string;
  workType: string;           // Full-time, Part-time, Contract, Remote
  experienceLevel: string;    // Entry Level, Mid-Level, Senior Level, Leadership
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements: string;
  skills: string[];
  postedDate: string;
  companyLogo?: string;
  industry: string;           // Default: "Technology"
  vector?: number[];          // OpenAI embedding (real array)
}
```

### Resume Schema

```typescript
{
  id: number;
  fileName: string;
  originalText: string;       // Full resume text IS stored in database
  parsedData: ParsedResumeData;
  vector?: number[];          // OpenAI embedding (real array)
  uploadedAt: string;
}
```

### Parsed Resume Data

```typescript
{
  skills: string[];
  experienceLevel: string;
  primaryRole: string;
  industries: string[];
  yearsOfExperience: number;
  languageProcessing?: {
    detectedLanguage: string;
    languageName: string;
    confidence: number;
    wasTranslated: boolean;
    translationError?: string;
  };
}
```

### Job Match Schema

```typescript
{
  id: number;
  resumeId: number;
  jobId: number;
  matchScore: number;         // Real number for similarity score
  matchingSkills: string[];
  confidence: string;         // "High", "Medium", "Low"
}
```

## Production Deployment

### Current Hosting Setup

The application is currently deployed using:

- **Vercel** - Frontend hosting with automatic deployments from Git
- **Render** - Backend API hosting with Node.js runtime
- **Neon** - Managed PostgreSQL database
- **Pinecone** - Vector database for similarity search

### Important: Render Cold Start Behavior

⚠️ **Note about backend availability**: The backend is hosted on Render's free tier, which has the following behavior:

- **Automatic Sleep**: The backend service goes to sleep after **15 minutes of inactivity**
- **Cold Start Delay**: When accessing the application after inactivity, the backend undergoes a **cold start process** that can take up to **1 minute**
- **User Experience**: During cold start, API requests may timeout or fail until the backend fully boots up

**What this means for users:**

- First-time visitors or users returning after 15+ minutes of site inactivity may experience slow initial load times
- Retrieving all jobs, resume uploads and job matching may fail on the first attempt after a cold start, but will work after around 50 seconds
- The application will work normally once the backend has fully started

### Build Optimizations

Build artifacts are optimized with:

- Client-side code splitting and tree shaking
- Server-side bundle optimization with esbuild
- Environment-specific configurations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

- **Cons**: May miss semantic similarities

#### 3. Hybrid Strategy

- **Best for**: Balanced approach combining multiple techniques
- **Approach**: 60% TF-IDF + 40% skill matching
- **Pros**: Best of both worlds, comprehensive matching
- **Cons**: Slightly more computation intensive

## 📊 API Endpoints

### Core Functionality

- `POST /api/resume/upload` - Upload and process resume files
- `GET /api/jobs` - Get all available jobs with optional filtering
- `POST /api/resume/:id/matches` - Get job matches for a specific resume

### Scalability & Testing

- `POST /api/jobs/generate` - Generate jobs for testing (up to 100k)
- `GET /api/jobs/stats` - Get job database statistics
- `POST /api/resume/:id/matches/strategy` - Test different vector strategies
- `GET /api/strategies` - Get available matching strategies

### Supported Job Generation Types

- `general` - Mixed roles across all industries and experience levels
- `tech` - Technology-focused positions (software engineering, development)
- `data` - Data science, machine learning, and AI positions

## 🏗 Architecture

### Data Flow

1. **Resume Upload** → File parsing (PDF/DOCX/TXT) → Text extraction
2. **AI Processing** → OpenAI GPT-4o analysis → Structured data extraction
3. **Vector Generation** → Embedding creation → Database storage
4. **Job Matching** → Vector similarity calculation → Ranked results
5. **UI Display** → Real-time updates → Interactive job listings

## 🔧 Development

### Project Structure

```
├── client/src/          # React frontend application
│   ├── components/      # Reusable UI components
│   ├── pages/          # Application pages and routes
│   └── lib/            # Utilities and configuration
├── server/             # Express.js backend
│   ├── services/       # Business logic and external integrations
│   └── routes.ts       # API endpoint definitions
├── shared/             # Shared types and schemas
└── package.json        # Dependencies and scripts
```

### Key Files

- `server/services/openai.ts` - OpenAI integration for resume parsing
- `server/services/vectorMatcher.ts` - Core matching algorithms
- `server/services/jobGenerator.ts` - Scalable job data generation
- `server/services/vectorStrategies.ts` - Alternative matching strategies
- `client/src/components/ResumeUpload.tsx` - File upload interface
- `client/src/components/JobMatches.tsx` - Match results display

### Development Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build production bundle
npm run preview      # Preview production build locally
```

## 📄 License

This project is for educational and demonstration purposes. Please ensure you have appropriate API keys and comply with OpenAI's usage policies when using this application.

## 🔑 Environment Variables

| Variable           | Description                              | Required                               |
| ------------------ | ---------------------------------------- | -------------------------------------- |
| `OPENAI_API_KEY`   | OpenAI API key for GPT-4o and embeddings | Yes                                    |
| `DATABASE_URL`     | PostgreSQL connection string             | No (uses in-memory storage by default) |
| `PINECONE_INDEX`   | Pinecone index name                      | Yes                                    |
| `PINECONE_API_KEY` | Pinecone API Key                         | Yes                                    |

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI Token Limit Errors**

   - The application automatically truncates text to fit within token limits
   - Check your OpenAI API key and rate limits

2. **File Upload Issues**

   - Ensure files are under 10MB
   - Supported formats: PDF, DOCX, TXT
   - Check file permissions and disk space

### macOS Rosetta Issues

If you're running on Apple Silicon (M1/M2/M3 Macs), some Node.js modules might have compatibility issues. The dotenv loading problem can sometimes be related to architecture-specific builds. You need to clean reinstall your dependencies outside Rosetta to get the correct native binary.
