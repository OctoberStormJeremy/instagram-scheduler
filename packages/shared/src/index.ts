export * from './post';
export * from './queue';

export type PostStatus = 'draft' | 'scheduled' | 'processing' | 'published' | 'failed' | 'canceled';

export interface ScheduledPost {
  id: string;
  caption: string;
  scheduledFor: string;
  timezone: string;
  status: PostStatus;
}
