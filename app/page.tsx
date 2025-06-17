'use client';
import React from "react";
import Link from "next/link";
import { useVisitorTracker } from "@hooks";
import mypic from "@assets/mypic.jpg";
import postsMetadataJson from "./posts/posts-metadata.json";

export default function Home() {
  useVisitorTracker();
  const latestPosts = postsMetadataJson.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }).slice(0, 5);
  return (
    <div className="flex gap-10 place-content-center mt-20">
      <div>
        <img className="object-cover h-200" src={mypic.src} alt="A picture of me at Grindelwald" />
      </div>
      <div className="w-130 mr-2">
        <h3 className="text-6xl">Hello, I'm <span className="font-bold">Maco</span>.</h3>
        <br />
        <h3 className="text-gray-400">I'm a software engineer and a licensed electronics engineer. I love to assemble things but I love it more when I break things apart!</h3>
        <div className="mt-8">
          <ul>
            {latestPosts.map((post, index) => (
              <li key={index} className="mb-2">
                <Link href={post.route}>
                  <span className="mr-2 bg-gray-700 text-xs rounded-full pr-2 pl-2 pt-1 pb-1">{post.date}</span>
                  <span>{post.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
