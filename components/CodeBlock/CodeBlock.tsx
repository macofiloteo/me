import React from 'react';
import * as fs from 'fs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { twilight } from 'react-syntax-highlighter/dist/esm/styles/prism';

var openedCode: { [key: string]: string } = {};

function getCodeByPath(codePath: string, lineFrom?: number, lineTo?: number): string {
  let code = '';
  if (openedCode[codePath]) {
    code = openedCode[codePath];
  } else {
    code = fs.readFileSync(codePath, 'utf8');
    openedCode[codePath] = code;
  }
  if (lineFrom !== undefined && lineTo !== undefined) {
    const lines = code.split('\n');
    if (lineFrom < 1 || lineTo > lines.length || lineFrom > lineTo) {
      throw new Error('Invalid line range specified');
    }
    code = lines.slice(lineFrom - 1, lineTo).join('\n');
  }
  return code;
}



export default function CodeBlock(props: {
  codePath?: string;
  language?: string;
  lineFrom?: number;
  lineTo?: number;
  caption?: string;
}) {
  return (
    <>
      <SyntaxHighlighter
        language={props.language}
        style={twilight}
        showLineNumbers={true}
      >
        {props.codePath && getCodeByPath(props.codePath, props.lineFrom, props.lineTo)}
      </SyntaxHighlighter>
      {props.caption && <div className="text-center text-md text-gray-500 mt-2 mb-2">{props.caption}</div>}
    </>
  )
};
