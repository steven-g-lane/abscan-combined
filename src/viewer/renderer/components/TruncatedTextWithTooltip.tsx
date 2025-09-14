import React, { useState, useRef, useEffect } from 'react';

interface TruncatedTextWithTooltipProps {
  text: string;
  className?: string;
  maxLength?: number;
  children?: React.ReactNode;
}

/**
 * A component that wraps text content with truncation and tooltip functionality.
 * Builds on the existing CSS truncate pattern used in grid configurations.
 *
 * Features:
 * - Uses CSS truncation (overflow: hidden, text-overflow: ellipsis, white-space: nowrap)
 * - Shows tooltip only when text is actually truncated
 * - Configurable max length for intelligent truncation decisions
 * - Responsive tooltip positioning within viewport boundaries
 * - No layout shifts or performance issues
 */
const TruncatedTextWithTooltip: React.FC<TruncatedTextWithTooltipProps> = ({
  text,
  className = '',
  maxLength,
  children
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  // Check if text is actually truncated - responsive to all layout changes
  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const element = textRef.current;
        const isTruncated = element.scrollWidth > element.clientWidth;
        setIsTextTruncated(isTruncated);
      }
    };

    // Check immediately
    checkTruncation();

    // Set up ResizeObserver for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (textRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(checkTruncation);
      resizeObserver.observe(textRef.current);
    }

    // Set up window resize listener as fallback
    window.addEventListener('resize', checkTruncation);

    // Cleanup
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', checkTruncation);
    };
  }, [text]);

  // Prefer CSS-based detection, fallback to maxLength if ResizeObserver unsupported
  const shouldShowTooltip = window.ResizeObserver
    ? isTextTruncated
    : (maxLength ? text.length > maxLength : isTextTruncated);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!shouldShowTooltip || !text) return;

    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();

      // Calculate initial position
      let x = rect.left;
      let y = rect.bottom + 4;

      // Create temporary tooltip element to measure dimensions
      const tempTooltip = document.createElement('div');
      tempTooltip.className = 'fixed z-[9999] max-w-md px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg border border-gray-700 whitespace-pre-wrap break-words pointer-events-none';
      tempTooltip.style.visibility = 'hidden';
      tempTooltip.textContent = text;
      document.body.appendChild(tempTooltip);

      const tooltipRect = tempTooltip.getBoundingClientRect();
      document.body.removeChild(tempTooltip);

      // Adjust if tooltip would go off right edge
      if (x + tooltipRect.width > window.innerWidth - 16) {
        x = window.innerWidth - tooltipRect.width - 16;
      }

      // Adjust if tooltip would go off left edge
      if (x < 16) {
        x = 16;
      }

      // Adjust if tooltip would go off bottom edge
      if (y + tooltipRect.height > window.innerHeight - 16) {
        y = rect.top - tooltipRect.height - 4;
      }

      // Adjust if tooltip would go off top edge
      if (y < 16) {
        y = rect.bottom + 4;
      }

      setTooltipPosition({ x, y });
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // If we have children, render them with tooltip capability
  if (children) {
    return (
      <>
        <span
          ref={textRef}
          className={shouldShowTooltip ? `${className} cursor-help` : className}
          onMouseEnter={shouldShowTooltip ? handleMouseEnter : undefined}
          onMouseLeave={shouldShowTooltip ? handleMouseLeave : undefined}
        >
          {children}
        </span>

        {showTooltip && shouldShowTooltip && text && (
          <div
            className="fixed z-[9999] max-w-md px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg border border-gray-700 whitespace-pre-wrap break-words pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            {text}
          </div>
        )}
      </>
    );
  }

  // Default text rendering with existing truncate pattern
  return (
    <>
      <span
        ref={textRef}
        className={shouldShowTooltip ? `truncate ${className} cursor-help` : `truncate ${className}`}
        onMouseEnter={shouldShowTooltip ? handleMouseEnter : undefined}
        onMouseLeave={shouldShowTooltip ? handleMouseLeave : undefined}
      >
        {text}
      </span>

      {showTooltip && shouldShowTooltip && text && (
        <div
          className="fixed z-[9999] max-w-md px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg border border-gray-700 whitespace-pre-wrap break-words pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          {text}
        </div>
      )}
    </>
  );
};

export default TruncatedTextWithTooltip;