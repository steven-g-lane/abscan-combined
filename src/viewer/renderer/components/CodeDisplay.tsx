import React, { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeDisplayProps {
  content: string;
  languageHint?: string;
  isCode?: boolean;
  scrollToLine?: number; // Line number to scroll to (1-based)
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ content, languageHint, isCode = false, scrollToLine }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Language mapping from our detection hints to react-syntax-highlighter language IDs
  const mapLanguageHint = (hint: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'csharp': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'scala': 'scala',
      'ruby': 'ruby',
      'php': 'php',
      'perl': 'perl',
      'html': 'markup',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'markup',
      'svg': 'markup',
      'yaml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'markdown': 'markdown',
      'shell': 'bash',
      'bash': 'bash',
      'sql': 'sql',
      'r': 'r',
      'lua': 'lua',
      'vim': 'vim',
      'dockerfile': 'docker',
      'properties': 'properties'
    };

    return languageMap[hint?.toLowerCase()] || 'text';
  };

  // Custom dark theme style to match application
  const customDarkStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: 'transparent', // Use panel background
      margin: 0,
      padding: '1rem',
      fontSize: '12px',
      lineHeight: '1.4',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      background: 'transparent',
      fontSize: '12px',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
    }
  };

  // Get the appropriate language for syntax highlighting
  const language = mapLanguageHint(languageHint || '');

  // IMPORTANT: Always call useEffect hook to prevent hooks violation
  // Effect to scroll to specific line when scrollToLine changes
  useEffect(() => {
    if (scrollToLine && containerRef.current && isCode && languageHint) {
      // Small delay to ensure the content is rendered
      const timer = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        console.log('🔍 SCROLL DEBUG: Starting scroll to line', scrollToLine);

        // Find the line number element using the actual react-syntax-highlighter structure
        const lineNumberSpans = container.querySelectorAll('span.linenumber');
        console.log(`🔍 SCROLL DEBUG: Found ${lineNumberSpans.length} line number spans`);
        
        // Search for the span with matching text content
        let targetLineSpan: Element | null = null;
        for (const span of lineNumberSpans) {
          const lineText = span.textContent?.trim();
          console.log(`🔍 SCROLL DEBUG: Checking line span with text: "${lineText}"`);
          if (lineText === scrollToLine.toString()) {
            targetLineSpan = span;
            console.log('🔍 SCROLL DEBUG: Found matching line number span!');
            break;
          }
        }

        if (targetLineSpan) {
          console.log('🔍 SCROLL DEBUG: Scrolling to line number span:', {
            textContent: targetLineSpan.textContent,
            className: targetLineSpan.className,
            offsetTop: (targetLineSpan as HTMLElement).offsetTop,
            getBoundingClientRect: targetLineSpan.getBoundingClientRect()
          });
          
          targetLineSpan.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' // Position function start at top of viewport
          });
          
          console.log('🔍 SCROLL DEBUG: scrollIntoView completed');
        } else {
          console.log('🔍 SCROLL DEBUG: Line number span not found, using fallback calculation');
          // Enhanced fallback: calculate position based on line height and react-syntax-highlighter structure
          const lineHeight = 20; // Approximate line height in pixels  
          const scrollPosition = Math.max(0, (scrollToLine - 1) * lineHeight);
          
          console.log('🔍 SCROLL DEBUG: Fallback calculation:', {
            scrollToLine,
            lineHeight,
            calculatedPosition: scrollPosition,
            containerScrollHeight: container.scrollHeight
          });
          
          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [scrollToLine, content, isCode, languageHint]);

  // Render based on file type - but hooks are always called above
  if (!isCode || !languageHint) {
    return (
      <div ref={containerRef} className="h-full overflow-auto p-4">
        <pre className="text-foreground-primary text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>
    );
  }

  try {
    return (
      <div ref={containerRef} className="h-full overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={customDarkStyle}
          showLineNumbers={true}
          lineNumberStyle={{
            color: '#6b7280', // muted gray for line numbers
            backgroundColor: 'transparent',
            paddingRight: '1em',
            textAlign: 'right',
            userSelect: 'none',
            fontSize: '11px'
          }}
          customStyle={{
            background: 'transparent',
            margin: 0,
            padding: 0,
            fontSize: '12px',
            lineHeight: '1.4'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: '12px'
            }
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    );
  } catch (error) {
    // Graceful fallback to plain text if highlighting fails
    console.warn('Syntax highlighting failed, falling back to plain text:', error);
    return (
      <div ref={containerRef} className="h-full overflow-auto p-4">
        <pre className="text-foreground-primary text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>
    );
  }
};

export default CodeDisplay;