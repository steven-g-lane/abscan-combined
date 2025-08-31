import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeDisplayProps {
  content: string;
  languageHint?: string;
  isCode?: boolean;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ content, languageHint, isCode = false }) => {
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

  // If not a code file or no language hint, display as plain text
  if (!isCode || !languageHint) {
    return (
      <div className="h-full overflow-auto p-4">
        <pre className="text-foreground-primary text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>
    );
  }

  // Get the appropriate language for syntax highlighting
  const language = mapLanguageHint(languageHint);

  try {
    return (
      <div className="h-full overflow-auto">
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
      <div className="h-full overflow-auto p-4">
        <pre className="text-foreground-primary text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>
    );
  }
};

export default CodeDisplay;