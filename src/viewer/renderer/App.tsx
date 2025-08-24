import React from 'react';
import MillerColumns from './components/MillerColumns';
import ExpandedGrid from './components/ExpandedGrid';
import DetailPanel from './components/DetailPanel';

function App() {
  return (
    <div className="h-screen bg-background-primary text-foreground-primary grid grid-cols-[3fr_1fr] gap-0 min-w-[800px] min-h-[600px] overflow-hidden">
      {/* Left Panel - 75% */}
      <div className="flex flex-col overflow-hidden">
        {/* Miller Columns - 55% of left panel height */}
        <div className="flex-[0.55] bg-background-secondary border-r border-border-primary min-h-0 overflow-hidden">
          <div className="h-full p-2">
            <div className="h-full rounded border border-border-secondary overflow-hidden">
              <MillerColumns />
            </div>
          </div>
        </div>
        
        {/* Expanded Grid - 45% of left panel height */}
        <div className="flex-[0.45] bg-background-secondary border-r border-t border-border-primary min-h-0 overflow-hidden">
          <div className="h-full p-2">
            <div className="h-full rounded border border-border-secondary overflow-hidden">
              <ExpandedGrid />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - 25% */}
      <div className="bg-background-primary overflow-hidden min-w-0">
        <div className="h-full p-2">
          <div className="h-full rounded border border-border-primary overflow-hidden">
            <DetailPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;