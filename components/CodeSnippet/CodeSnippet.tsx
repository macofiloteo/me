import React from 'react';

export default function CodeSnippet(props: { children: React.ReactNode }) {
  return (
    <code className="code-snippet">
      {props.children}
    </code>
  );
}
