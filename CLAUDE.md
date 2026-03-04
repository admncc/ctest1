# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Repository Status

This is a newly initialized repository with no source code yet. When the project is set up, update this file to reflect the actual structure, commands, and conventions.

## Getting Started

When a project is bootstrapped here, document the following sections:

### Project Overview

- **Purpose**: _[Describe what this project does]_
- **Language/Runtime**: _[e.g., TypeScript/Node.js, Python 3.11, Go 1.21]_
- **Framework**: _[e.g., Next.js, FastAPI, Gin]_
- **Key dependencies**: _[List major libraries and their purpose]_

## Development Commands

Once the project is set up, update this section with the actual commands:

```bash
# Install dependencies
# e.g., npm install / pip install -r requirements.txt / go mod download

# Run in development mode
# e.g., npm run dev / uvicorn main:app --reload

# Run tests
# e.g., npm test / pytest / go test ./...

# Build for production
# e.g., npm run build / go build ./...

# Lint / format
# e.g., npm run lint / ruff check . / golangci-lint run
```

## Repository Structure

_Document the directory layout here once files exist. Example:_

```
/
├── src/              # Source code
│   ├── components/   # UI components (if applicable)
│   ├── api/          # API routes or handlers
│   └── lib/          # Shared utilities
├── tests/            # Test files
├── docs/             # Documentation
└── scripts/          # Build or utility scripts
```

## Code Conventions

Document conventions as they are established. Key areas to cover:

- **Naming**: file, variable, function, and class naming conventions
- **Formatting**: indentation, line length, tool (Prettier, Black, gofmt, etc.)
- **Imports**: ordering and grouping rules
- **Types**: whether types/interfaces are required and where they live
- **Error handling**: preferred patterns for error propagation

## Testing

- **Framework**: _[e.g., Jest, pytest, go test]_
- **Coverage requirement**: _[e.g., 80% minimum]_
- **Test file location**: _[e.g., co-located with source, or in tests/]_
- **Running a single test**: _[command]_

## Git Workflow

- **Branch naming**: `feature/<description>`, `fix/<description>`, `chore/<description>`
- **Commit style**: Use conventional commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- **PR process**: _[describe review requirements, CI gates, etc.]_

## Environment Variables

Document required environment variables here. Example:

```
DATABASE_URL=       # PostgreSQL connection string
SECRET_KEY=         # Application secret key
API_BASE_URL=       # Upstream API endpoint
```

Never commit `.env` files or secrets to the repository.

## CI/CD

_Document pipelines, deployment targets, and any required secrets once configured._

## Notes for AI Assistants

- This file should be kept up to date as the project evolves.
- When adding new features, check existing patterns before introducing new ones.
- Prefer editing existing files over creating new ones unless a new file is clearly warranted.
- Run tests and linting before marking any implementation task complete.
- Do not commit `.env`, credentials, or any secrets.
- When uncertain about conventions, check existing code for precedent.
