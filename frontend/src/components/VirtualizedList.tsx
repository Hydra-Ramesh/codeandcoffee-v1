'use client';

import React, { useState, useEffect, useRef, useMemo, ReactNode } from 'react';

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number | string;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  keyExtractor?: (item: T, index: number) => string | number;
  emptyPlaceholder?: ReactNode;
}

/**
 * Item 97: Large-list virtualization / windowing
 * Renders only the items currently within the viewport container plus overscan buffer,
 * ensuring high frame rates and minimal DOM node memory usage for arbitrarily large collections.
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 4,
  className = '',
  keyExtractor,
  emptyPlaceholder,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const numericContainerHeight =
    typeof containerHeight === 'number'
      ? containerHeight
      : parseInt(containerHeight as string, 10) || 400;

  const { startIndex, endIndex } = useMemo(() => {
    if (items.length === 0) return { startIndex: 0, endIndex: 0 };

    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(numericContainerHeight / itemHeight);

    const boundedStart = Math.max(0, start - overscan);
    const boundedEnd = Math.min(items.length, start + visibleCount + overscan);

    return {
      startIndex: boundedStart,
      endIndex: boundedEnd,
    };
  }, [scrollTop, itemHeight, numericContainerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, localIndex) => {
      const actualIndex = startIndex + localIndex;
      const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;
      const topOffset = actualIndex * itemHeight;

      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            top: topOffset,
            left: 0,
            right: 0,
            height: itemHeight,
          }}
        >
          {renderItem(item, actualIndex)}
        </div>
      );
    });
  }, [items, startIndex, endIndex, itemHeight, keyExtractor, renderItem]);

  if (items.length === 0 && emptyPlaceholder) {
    return <div className={`overflow-hidden ${className}`}>{emptyPlaceholder}</div>;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`relative overflow-y-auto ${className}`}
      style={{
        height: containerHeight,
        willChange: 'transform',
      }}
      role="feed"
      aria-busy="false"
    >
      <div
        style={{
          height: totalHeight,
          width: '100%',
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

export default VirtualizedList;
