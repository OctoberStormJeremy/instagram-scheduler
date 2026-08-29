# Instagram Scheduler

MVP web app for scheduling and publishing Instagram posts for Instagram Professional accounts.

## Stack
- Next.js
- Node.js + TypeScript
- PostgreSQL
- Redis + BullMQ
- S3-compatible media storage

## Repo layout
- `apps/web` - frontend app
- `apps/api` - backend API
- `apps/worker` - background jobs
- `packages/shared` - shared types and validation
- `packages/db` - database schema and migrations

## Getting started
1. Install dependencies
2. Copy environment variables
3. Run database and Redis
4. Start the apps

## MVP scope
- Auth
- Instagram OAuth connection
- Media uploads
- Scheduled posts
- Auto publishing
- Status tracking
- Retry handling
