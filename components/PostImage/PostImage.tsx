import React from 'react';

export default function PostImage(props: { src: string; alt: string; figureNo: number }) {
  return (
    <>
      <div className="flex justify-center mt-4 mb-2"><img src={props.src} alt={props.alt} /></div>
      <div className="text-center text-md text-gray-500 mb-2">Figure {props.figureNo}. {props.alt}</div>
    </>
  );
}
