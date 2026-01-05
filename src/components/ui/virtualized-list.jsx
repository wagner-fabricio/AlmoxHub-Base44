import React from 'react';
import { FixedSizeList } from 'react-window';

export function VirtualizedList({ 
  items, 
  renderItem, 
  itemHeight = 60, 
  height = 600,
  className = ''
}) {
  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      className={className}
    >
      {({ index, style }) => (
        <div style={style}>
          {renderItem(items[index], index)}
        </div>
      )}
    </FixedSizeList>
  );
}