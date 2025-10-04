import { useState, useEffect } from "react";
import { TopBar } from "./components/TopBar";
import { MainCanvas } from "./components/MainCanvas";
import { ToolboxWidget } from "./components/ToolboxWidget";

import { AnnotationsWidget } from "./components/AnnotationsWidget";
import { MinimapWidget } from "./components/MinimapWidget";
import { ValidatorWidget } from "./components/ValidatorWidget";
import { AuthModal } from "./components/AuthModal";
import { SaveAnnotationModal } from "./components/SaveAnnotationModal";
import { ExportModal } from "./components/ExportModal";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";

export default function App() {
  // User and authentication state
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<
    "guest" | "user" | "validator"
  >("guest");
  const [currentMode, setCurrentMode] = useState<
    "public" | "validator"
  >("public");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Canvas and annotation state
  const [selectedTool, setSelectedTool] = useState("brush");
  const [brushSize, setBrushSize] = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(0.6);
  const [zoom, setZoom] = useState(1);
  const [coordinates, setCoordinates] = useState({
    lat: 18.38,
    lon: 77.58,
  });
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentAnnotationPath, setCurrentAnnotationPath] =
    useState<any>(null);

  // Helper function to clamp widget positions within viewport
  const clampWidgetPosition = (pos: { x: number; y: number }, widgetSize: { width: number; height: number }) => {
    const margin = 16;
    const maxX = window.innerWidth - widgetSize.width - margin;
    const maxY = window.innerHeight - widgetSize.height - margin;
    
    return {
      x: Math.max(margin, Math.min(pos.x, maxX)),
      y: Math.max(80, Math.min(pos.y, maxY)) // 80px to account for top bar
    };
  };

  // Widget positions and states - use safe initial positions
  const [widgetPositions, setWidgetPositions] = useState(() => {
    const safeWidth = Math.max(window.innerWidth, 1200);
    const safeHeight = Math.max(window.innerHeight, 800);
    
    return {
      toolbox: { x: 16, y: 96 },
      annotations: clampWidgetPosition(
        { x: safeWidth - 350, y: 96 }, 
        { width: 320, height: 400 }
      ),
      minimap: clampWidgetPosition(
        { x: safeWidth - 200, y: safeHeight - 300 },
        { width: 200, height: 200 }
      ),
      validator: clampWidgetPosition(
        { x: safeWidth - 412, y: 136 },
        { width: 400, height: 500 }
      ),
    };
  });

  const [minimizedWidgets, setMinimizedWidgets] = useState({
    toolbox: false,
    annotations: false,
    minimap: false,
    validator: false,
  });

  // Previous positions and sizes for restore functionality
  const [previousWidgetStates, setPreviousWidgetStates] =
    useState(() => {
      const safeWidth = Math.max(window.innerWidth, 1200);
      const safeHeight = Math.max(window.innerHeight, 800);
      
      return {
        toolbox: {
          position: { x: 16, y: 96 },
          size: { width: 288, height: 0 },
        },
        annotations: {
          position: clampWidgetPosition(
            { x: safeWidth - 350, y: 96 }, 
            { width: 320, height: 400 }
          ),
          size: { width: 320, height: 400 },
        },
        minimap: {
          position: clampWidgetPosition(
            { x: safeWidth - 200, y: safeHeight - 300 },
            { width: 200, height: 200 }
          ),
          size: { width: 200, height: 200 },
        },
        validator: {
          position: clampWidgetPosition(
            { x: safeWidth - 412, y: 136 },
            { width: 400, height: 500 }
          ),
          size: { width: 400, height: 500 },
        },
      };
    });

  // Validation queue (mock data)
  const [validationQueue, setValidationQueue] = useState([
    {
      id: "1",
      title: "Posible cráter de impacto",
      description: "Estructura circular con borde elevado",
      author: {
        name: "Ana García",
        avatar:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
      },
      timestamp: "2 horas",
      type: "crater",
      thumbnail:
        "https://images.unsplash.com/photo-1590484375193-e874932dee5e?w=300&h=300&fit=crop",
    },
    {
      id: "2",
      title: "Duna de arena",
      description: "Formación eólica con patrón característico",
      author: {
        name: "Carlos López",
        avatar:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
      },
      timestamp: "4 horas",
      type: "dune",
      thumbnail:
        "https://images.unsplash.com/photo-1625428354222-ce52b4227b26?w=300&h=300&fit=crop",
    },
    {
      id: "3",
      title: "Depósito de hielo",
      description: "Área brillante en región polar",
      author: {
        name: "María Silva",
        avatar:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
      },
      timestamp: "6 horas",
      type: "ice",
      thumbnail:
        "https://images.unsplash.com/photo-1590484375193-e874932dee5e?w=300&h=300&fit=crop",
    },
  ]);

  // Initialize with sample annotations
  useEffect(() => {
    const sampleAnnotations = [
      {
        id: "sample-1",
        title: "Cráter Jezero",
        description:
          "Cráter principal de la misión Perseverance",
        author: {
          name: "Usuario Demo",
          avatar:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
        },
        timestamp: "1 día",
        score: 85,
        votes: { up: 12, down: 1 },
        status: "validada",
        tags: ["crater", "impacto", "perseverance"],
        type: "crater",
      },
      {
        id: "sample-2",
        title: "Formación sedimentaria",
        description: "Posibles depósitos de un antiguo lago",
        author: {
          name: "Usuario Demo",
          avatar:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
        },
        timestamp: "3 días",
        score: 42,
        votes: { up: 5, down: 0 },
        status: "pendiente",
        tags: ["sedimento", "agua", "geológico"],
        type: "geological",
      },
      {
        id: "sample-3",
        title: "Estructura erosiva",
        description: "Canal formado por erosión hídrica",
        author: {
          name: "Usuario Demo",
          avatar:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
        },
        timestamp: "1 semana",
        score: 15,
        votes: { up: 2, down: 1 },
        status: "rechazada",
        tags: ["erosión", "agua", "canal"],
        type: "geological",
      },
    ];
    setAnnotations(sampleAnnotations);
  }, []);

  // Authentication handlers
  const handleLogin = (userData: any) => {
    setUser(userData);
    setUserRole(userData.role);
    toast.success(`¡Bienvenido, ${userData.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole("guest");
    setCurrentMode("public");
    toast.info("Sesión cerrada");
  };

  // Navigation handlers
  const handleGoToCoordinate = (lat: number, lon: number) => {
    setCoordinates({ lat, lon });
    toast.success(
      `Navegando a ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
    );
  };

  const handleModeChange = (mode: "public" | "validator") => {
    setCurrentMode(mode);
    toast.info(
      `Cambiado a modo ${mode === "public" ? "público" : "validador"}`,
    );
  };

  // Canvas handlers
  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
    toast.info(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    toast.info(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const lastAction = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, lastAction]);
      setUndoStack((prev) => prev.slice(0, -1));
      toast.info("Acción deshecha");
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const lastUndone = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [...prev, lastUndone]);
      setRedoStack((prev) => prev.slice(0, -1));
      toast.info("Acción rehecha");
    }
  };

  const handleAnnotationDraw = (path: any) => {
    if (!user) {
      toast.error(
        "Debes iniciar sesión para guardar anotaciones",
      );
      setShowAuthModal(true);
      return;
    }
    setCurrentAnnotationPath(path);
    setShowSaveModal(true);
  };

  const handleSaveAnnotation = () => {
    if (!user) {
      toast.error(
        "Debes iniciar sesión para guardar anotaciones",
      );
      setShowAuthModal(true);
      return;
    }
    setShowSaveModal(true);
  };

  const handleSaveAnnotationData = (annotationData: any) => {
    const newAnnotation = {
      ...annotationData,
      author: user,
      path: currentAnnotationPath,
    };

    setAnnotations((prev) => [newAnnotation, ...prev]);
    setCurrentAnnotationPath(null);
    toast.success("Anotación guardada correctamente");
    toast.info("Enviada a cola de validación");
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleAnnotationSelect = (annotation: any) => {
    // Focus on annotation in canvas
    toast.info(`Enfocando en: ${annotation.title}`);
  };

  // Validator handlers
  const handleValidation = (
    itemId: string,
    action: "accept" | "reject",
    score: number,
    comment: string,
  ) => {
    setValidationQueue((prev) =>
      prev.filter((item) => item.id !== itemId),
    );

    if (action === "accept") {
      toast.success("Anotación validada correctamente");
      // Update annotation status in the system
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === itemId
            ? { ...ann, status: "validada", score }
            : ann,
        ),
      );
    } else {
      toast.info("Anotación rechazada");
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === itemId
            ? { ...ann, status: "rechazada" }
            : ann,
        ),
      );
    }
  };

  const handleViewAnnotation = (item: any) => {
    toast.info(`Visualizando anotación: ${item.title}`);
  };

  // Widget handlers
  const updateWidgetPosition = (
    widgetName: keyof typeof widgetPositions,
    position: { x: number; y: number },
  ) => {
    // Clamp position to ensure widget stays within viewport
    const widgetSizes: Record<keyof typeof widgetPositions, { width: number; height: number }> = {
      toolbox: { width: 288, height: 400 },
      annotations: { width: 320, height: 400 },
      minimap: { width: 200, height: 200 },
      validator: { width: 400, height: 500 }
    };
    
    const clampedPosition = clampWidgetPosition(position, widgetSizes[widgetName]);
    
    setWidgetPositions((prev) => ({
      ...prev,
      [widgetName]: clampedPosition,
    }));
  };

  const toggleWidgetMinimized = (widgetName: keyof typeof minimizedWidgets) => {
    if (!minimizedWidgets[widgetName]) {
      // Save current state before minimizing
      setPreviousWidgetStates((prev) => ({
        ...prev,
        [widgetName]: {
          position: widgetPositions[widgetName],
          size: prev[widgetName].size,
        },
      }));
    }

    setMinimizedWidgets((prev) => ({
      ...prev,
      [widgetName]: !prev[widgetName],
    }));
  };

  const restoreWidget = (widgetName: keyof typeof minimizedWidgets) => {
    const prevState = previousWidgetStates[widgetName];
    if (prevState) {
      const widgetSizes: Record<keyof typeof widgetPositions, { width: number; height: number }> = {
        toolbox: { width: 288, height: 400 },
        annotations: { width: 320, height: 400 },
        minimap: { width: 200, height: 200 },
        validator: { width: 400, height: 500 }
      };
      
      const clampedPosition = clampWidgetPosition(prevState.position, widgetSizes[widgetName]);
      
      setWidgetPositions((prev) => ({
        ...prev,
        [widgetName]: clampedPosition,
      }));
    }

    setMinimizedWidgets((prev) => ({
      ...prev,
      [widgetName]: false,
    }));
  };

  // Emergency restore function to bring widgets back to safe positions
  const emergencyRestoreAllWidgets = () => {
    const safePositions = {
      toolbox: { x: 16, y: 96 },
      annotations: { x: Math.max(16, window.innerWidth - 350), y: 96 },
      minimap: { x: Math.max(16, window.innerWidth - 216), y: Math.max(80, window.innerHeight - 300) },
      validator: { x: Math.max(16, window.innerWidth - 428), y: 136 }
    };
    
    setWidgetPositions(safePositions);
    setMinimizedWidgets({
      toolbox: false,
      annotations: false,
      minimap: false,
      validator: false
    });
    
    toast.success("Todos los widgets restaurados a posiciones seguras");
  };

  // Auto-adjust widget positions on window resize
  useEffect(() => {
    const handleResize = () => {
      setWidgetPositions((prev) => {
        const newPositions = { ...prev };
        
        // Clamp all widgets to new viewport bounds
        Object.keys(newPositions).forEach((widgetName) => {
          const widgetSizes: Record<keyof typeof widgetPositions, { width: number; height: number }> = {
            toolbox: { width: 288, height: 400 },
            annotations: { width: 320, height: 400 },
            minimap: { width: 200, height: 200 },
            validator: { width: 400, height: 500 }
          };
          
          const typedWidgetName = widgetName as keyof typeof widgetPositions;
          newPositions[typedWidgetName] = clampWidgetPosition(
            newPositions[typedWidgetName], 
            widgetSizes[typedWidgetName]
          );
        });
        
        return newPositions;
      });
    };

    window.addEventListener("resize", handleResize);
    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return; // Don't trigger shortcuts when typing in inputs
      }

      switch (e.key.toLowerCase()) {
        case "b":
          handleToolSelect("brush");
          toast.info("Herramienta: Pincel");
          break;
        case "e":
          handleToolSelect("eraser");
          toast.info("Herramienta: Borrador");
          break;
        case "m":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Find a minimized widget to restore (toolbox has priority)
            const minimizedWidgetNames = Object.keys(
              minimizedWidgets,
            ).filter((name) => minimizedWidgets[name]);
            if (minimizedWidgetNames.length > 0) {
              const widgetToRestore =
                minimizedWidgetNames.includes("toolbox")
                  ? "toolbox"
                  : minimizedWidgetNames[0];
              restoreWidget(widgetToRestore);
              toast.info(
                `Widget ${widgetToRestore} restaurado`,
              );
            }
          } else {
            handleToolSelect("move");
            toast.info("Herramienta: Mover");
          }
          break;
        case "t":
          handleToolSelect("tag");
          toast.info("Herramienta: Etiqueta");
          break;
        case "v":
          handleToolSelect("picker");
          toast.info("Herramienta: Selector");
          break;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case "y":
            e.preventDefault();
            handleRedo();
            break;
          case "s":
            e.preventDefault();
            if (user) {
              handleSaveAnnotation();
            } else {
              toast.error("Debes iniciar sesión para guardar");
            }
            break;
          case "r":
            e.preventDefault();
            emergencyRestoreAllWidgets();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [user, undoStack, redoStack, minimizedWidgets]);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <TopBar
        user={user}
        userRole={userRole}
        onLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onGoToCoordinate={handleGoToCoordinate}
        onModeChange={handleModeChange}
        currentMode={currentMode}
      />

      <div className="flex-1 relative overflow-hidden pt-16">
        <MainCanvas
          selectedTool={selectedTool}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          zoom={zoom}
          onCoordinateChange={setCoordinates}
          coordinates={coordinates}
          onAnnotationDraw={handleAnnotationDraw}
        />

        {/* Floating Widgets */}
        <ToolboxWidget
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          onBrushSizeChange={setBrushSize}
          onBrushOpacityChange={setBrushOpacity}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSaveAnnotation}
          onExport={handleExport}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          position={widgetPositions.toolbox}
          onPositionChange={(pos) =>
            updateWidgetPosition("toolbox", pos)
          }
          isMinimized={minimizedWidgets.toolbox}
          onMinimize={() => toggleWidgetMinimized("toolbox")}
          onRestore={() => restoreWidget("toolbox")}
          zoom={zoom}
        />

        <AnnotationsWidget
          annotations={annotations}
          onAnnotationSelect={handleAnnotationSelect}
          position={widgetPositions.annotations}
          onPositionChange={(pos) =>
            updateWidgetPosition("annotations", pos)
          }
          isMinimized={minimizedWidgets.annotations}
          onMinimize={() =>
            toggleWidgetMinimized("annotations")
          }
          onRestore={() => restoreWidget("annotations")}
        />

        <MinimapWidget
          coordinates={coordinates}
          zoom={zoom}
          position={widgetPositions.minimap}
          onPositionChange={(pos) =>
            updateWidgetPosition("minimap", pos)
          }
          isMinimized={minimizedWidgets.minimap}
          onMinimize={() => toggleWidgetMinimized("minimap")}
          onRestore={() => restoreWidget("minimap")}
        />

        {currentMode === "validator" &&
          userRole === "validator" && (
            <ValidatorWidget
              validationQueue={validationQueue}
              onValidate={handleValidation}
              onViewAnnotation={handleViewAnnotation}
              position={widgetPositions.validator}
              onPositionChange={(pos) =>
                updateWidgetPosition("validator", pos)
              }
              isMinimized={minimizedWidgets.validator}
              onMinimize={() =>
                toggleWidgetMinimized("validator")
              }
              onRestore={() => restoreWidget("validator")}
            />
          )}
      </div>

      {/* Modals */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      <SaveAnnotationModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveAnnotationData}
      />

      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        annotations={annotations}
      />

      <Toaster />
    </div>
  );
}