import * as fs from 'fs';
import * as path from 'path';
import { PostMetadata } from '@types';

const POSTS_DIR = './app/posts';

export async function getLatestPosts(numberOfPosts: number): Promise<PostMetadata[]> {
  try {
    const items = await fs.promises.readdir(POSTS_DIR, { withFileTypes: true });
    const postsPromise: Promise<PostMetadata>[] = items
      .filter(item => item.isDirectory())
      .map(async (item) => {
        const postMedataPath = `./${path.join(item.name, 'meta')}`;
        const postMetadata = await import(postMedataPath);
        return postMetadata.default;
      });
    const posts = await Promise.all(postsPromise);
    return posts.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, numberOfPosts);
  } catch (err) {
    return [];
  }
}

