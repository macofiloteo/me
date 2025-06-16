'use client';
import React from 'react';
import CurrentPostMeta from './meta';


export default function Post() {
  return (
    <div className="mx-auto px-12 gap-10 place-content-center max-w-5xl">
      <div className="mt-6">
        <h1 className="text-4xl mb-1">{CurrentPostMeta.title}</h1>
        <h3 className="text-gray-400 mb-4">
          {CurrentPostMeta.date.toLocaleDateString('en-us', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis non iaculis arcu, non cursus lorem. Proin ac fringilla erat. Sed sed aliquet orci, eu efficitur mi. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut convallis scelerisque dolor, vitae convallis odio condimentum eget. Sed molestie tristique nunc, vel mattis ligula. Sed egestas turpis mollis tincidunt ultrices. Etiam dapibus rhoncus elit a pretium. Phasellus commodo purus ac faucibus vulputate. Suspendisse id suscipit sem. Donec ornare nisl in quam condimentum auctor. Ut finibus quis tortor eu tincidunt. Maecenas ac dui id velit iaculis fermentum a sed est.
        </p>
      </div>
    </div>
  );
}
