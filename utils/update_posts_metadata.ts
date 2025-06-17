import * as fs from 'fs';
import * as path from 'path';
import { PostMetadata } from '@types';

const POSTS_DIR = './app/posts';

async function getAllPosts(): Promise<PostMetadata[]> {
  try {
    const items = await fs.promises.readdir(POSTS_DIR, { withFileTypes: true });
    const postsPromise: Promise<PostMetadata>[] = items
      .filter(item => item.isDirectory())
      .map(async (item) => {
        const postMedataPath = `../${path.join(POSTS_DIR, item.name, 'meta')}`;
        const postMetadata = await import(postMedataPath);
        return postMetadata.default;
      });
    const posts = await Promise.all(postsPromise);
    console.log(`Found ${posts.length} posts.`);
    return posts;
  } catch (err) {
    console.error('Error reading posts directory:', err);
    return [];
  }
}

getAllPosts().then((posts: PostMetadata[]) => {
  const postsAsJSON: string = JSON.stringify(posts);
  fs.writeFileSync(path.join(POSTS_DIR, 'posts-metadata.json'), postsAsJSON, 'utf8');
  console.log('Posts metadata has been updated successfully.');
});
