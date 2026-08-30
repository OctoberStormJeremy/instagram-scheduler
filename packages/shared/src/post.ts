export const createPostSchema = {
  parse(data: unknown): CreatePostInput {
    return data as CreatePostInput;
  }
};

export type CreatePostInput = {
  instagramAccountId: string;
  mediaAssetId: string;
  caption: string;
  scheduledFor: string;
  timezone: string;
};
