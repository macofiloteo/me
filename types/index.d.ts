interface PostMetadataType {
  title: string;
  description: string;
  date: Date;
  tags: string[];
  route: string;
}

export type PostMetadata = PostMetadataType;
