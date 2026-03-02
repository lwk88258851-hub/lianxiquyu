import { Whiteboard } from './components/Whiteboard';
import { RadialMenu } from './components/RadialMenu';
import { ImportQuestion } from './components/ImportQuestion';
import { PageControls } from './components/PageControls';
import { useWhiteboard } from './hooks/useWhiteboard';

export default function App() {
  const whiteboard = useWhiteboard();
  const { state, setTool, setShape, undo, redo, clearAll, setColor, setWidth, setMagnification } = whiteboard;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Main Whiteboard Canvas */}
      <Whiteboard whiteboard={whiteboard} />

      {/* Import Question UI */}
      <ImportQuestion onImport={whiteboard.addQuestion} />

      {/* Page Controls */}
      <PageControls
        currentPageIndex={state.currentPageIndex}
        totalPages={state.pages.length}
        columns={state.columns}
        onAddPage={whiteboard.addPage}
        onRemovePage={whiteboard.removePage}
        onSetPage={whiteboard.setPage}
        onSetColumns={whiteboard.setColumns}
      />

      {/* Radial Menu */}
      <RadialMenu 
        activeTool={state.activeTool}
        onToolSelect={setTool}
        onShapeSelect={setShape}
        onUndo={undo}
        onRedo={redo}
        onClear={clearAll}
        onColorSelect={setColor}
        onWidthSelect={setWidth}
        onMagnificationSelect={setMagnification}
        onResetColumns={() => whiteboard.setColumns(state.columns)}
        currentColor={state.color}
        currentWidth={state.width}
        currentMagnification={state.magnification}
      />
    </div>
  );
}
