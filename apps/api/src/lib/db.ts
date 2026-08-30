import { PrismaClient } from '@instagram-scheduler/db';

// Single shared PrismaClient instance for the API process.
export const prisma = new PrismaClient();
