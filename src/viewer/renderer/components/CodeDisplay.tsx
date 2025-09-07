import React, { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeDisplayProps {
  content: string;
  languageHint?: string;
  isCode?: boolean;
  scrollToLine?: number; // Line number to scroll to (1-based)
  highlightLine?: number; // Line number to highlight with background (1-based)
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ content, languageHint, isCode = false, scrollToLine, highlightLine }) => {
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
  // Effect to scroll to specific line and apply highlighting
  useEffect(() => {
    if ((scrollToLine || highlightLine) && containerRef.current && isCode && languageHint) {
      // Small delay to ensure the content is rendered
      const timer = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        console.log('🔍 SCROLL/HIGHLIGHT DEBUG: Starting scroll to line', scrollToLine, 'highlight line', highlightLine);

        // Find all line elements in the syntax highlighter structure
        const codeLines = container.querySelectorAll('.token-line, .code-line, span[class*="line"]');
        console.log(`🔍 SCROLL/HIGHLIGHT DEBUG: Found ${codeLines.length} code lines`);

        // Also find line number spans for reference
        const lineNumberSpans = container.querySelectorAll('span.linenumber');
        console.log(`🔍 SCROLL/HIGHLIGHT DEBUG: Found ${lineNumberSpans.length} line number spans`);
        
        // Apply line highlighting if specified
        if (highlightLine) {
          // Remove existing highlights
          const existingHighlights = container.querySelectorAll('[data-highlighted-line]');
          existingHighlights.forEach(el => {
            (el as HTMLElement).style.backgroundColor = '';
            el.removeAttribute('data-highlighted-line');
          });

          // Find and highlight the target line
          let highlightedElement: Element | null = null;

          // Try to find the line by matching line number spans
          for (let i = 0; i < lineNumberSpans.length; i++) {
            const span = lineNumberSpans[i];
            const lineText = span.textContent?.trim();
            if (lineText === highlightLine.toString()) {
              // Find the corresponding code line element
              const lineRow = span.closest('tr') || span.parentElement;
              if (lineRow) {
                highlightedElement = lineRow;
                break;
              }
            }
          }

          // Fallback: try to find by nth-child if we have a reasonable line count
          if (!highlightedElement && highlightLine <= codeLines.length) {
            // react-syntax-highlighter usually uses 1-based indexing for display
            highlightedElement = codeLines[highlightLine - 1];
          }

          if (highlightedElement) {
            console.log('🔍 HIGHLIGHT DEBUG: Found element to highlight:', highlightedElement);
            (highlightedElement as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; // 60% black background
            highlightedElement.setAttribute('data-highlighted-line', highlightLine.toString());
            console.log('🔍 HIGHLIGHT DEBUG: Applied highlighting to line', highlightLine);
          } else {
            console.warn('🔍 HIGHLIGHT DEBUG: Could not find element to highlight for line', highlightLine);
          }
        }

        // Handle scrolling if specified
        if (scrollToLine) {
          // Search for the span with matching text content
          let targetLineSpan: Element | null = null;
          for (const span of lineNumberSpans) {
            const lineText = span.textContent?.trim();
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
            
            // Use 'center' to position the line in the middle of the viewport when possible
            targetLineSpan.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' // Try to center the line in viewport
            });
            
            console.log('🔍 SCROLL DEBUG: scrollIntoView completed with center positioning');
          } else {
            console.log('🔍 SCROLL DEBUG: Line number span not found, using fallback calculation');
            // Enhanced fallback: calculate position based on line height and attempt centering
            const lineHeight = 20; // Approximate line height in pixels  
            const containerHeight = container.clientHeight;
            const targetScrollTop = Math.max(0, (scrollToLine - 1) * lineHeight - containerHeight / 2);
            
            console.log('🔍 SCROLL DEBUG: Fallback calculation with centering:', {
              scrollToLine,
              lineHeight,
              containerHeight,
              targetScrollTop,
              containerScrollHeight: container.scrollHeight
            });
            
            container.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [scrollToLine, highlightLine, content, isCode, languageHint]);

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