'use client';
import React, { useCallback } from 'react';
import Header from '@/components/layout/header/Header';

/**
 * Use the page component to wrap the components
 * that you want to render on the page.
 */
export default function HomePage() {
  const [text, setText] = React.useState('');
  const [output, setOutput] = React.useState('');

  const processText = useCallback(() => {
    // Process the text and set the output
    const processedText = text.toUpperCase(); // Example processing
    setOutput(processedText);
  }, [text]);
  
  return (
    <>
      <Header />
      <main className="container mx-auto flex flex-col px-8 py-16">
        <h2>Issue data</h2>
        <input
          id="textInput"
          type="text"
          placeholder="Enter text here"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button id="processBtn" type="button" onClick={processText}>
          Issue
        </button>
        <p id="output">{output}</p>
      </main>
    </>
  );
}
