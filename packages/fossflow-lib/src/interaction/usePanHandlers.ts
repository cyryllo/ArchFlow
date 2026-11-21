import { useCallback, useEffect, useRef } from 'react';
import { produce } from 'immer';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { CoordsUtils, setWindowCursor } from 'src/utils';
import { Mode, SlimMouseEvent } from 'src/types';

// The mode to restore after a temporary pan: drop any half-finished cursor
// interaction so releasing the button doesn't e.g. start dragging an item.
const getReturnMode = (mode: Mode): Mode => {
  if (mode.type === 'CURSOR') {
    return produce(mode, (draft) => {
      draft.mousedownItem = null;
    });
  }
  return mode;
};

export const usePanHandlers = () => {
  const uiState = useUiStateStore((state) => state);
  const isPanningRef = useRef(false);
  const returnModeRef = useRef<Mode | null>(null);
  // Space held down = temporary hand tool in every mode
  const spaceHeldRef = useRef(false);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return Boolean(
        el &&
          (el.tagName === 'INPUT' ||
            el.tagName === 'TEXTAREA' ||
            el.contentEditable === 'true' ||
            el.closest?.('.ql-editor'))
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isTyping(e.target)) return;
      e.preventDefault(); // don't scroll the page / press focused buttons
      spaceHeldRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceHeldRef.current = false;
    };
    const onBlur = () => {
      spaceHeldRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Helper to start a temporary pan, remembering the active tool
  const startPan = useCallback(() => {
    isPanningRef.current = true;
    returnModeRef.current = getReturnMode(uiState.mode);
    uiState.actions.setMode({
      type: 'PAN',
      showCursor: false,
      returnTo: returnModeRef.current
    });
    setWindowCursor('grabbing');
  }, [uiState.mode, uiState.actions]);

  // Helper to end panning and go back to the tool that was active before
  const endPan = useCallback(() => {
    if (!isPanningRef.current) return;

    isPanningRef.current = false;
    const returnMode = returnModeRef.current ?? {
      type: 'CURSOR',
      showCursor: true,
      mousedownItem: null
    };
    returnModeRef.current = null;
    setWindowCursor('default');
    uiState.actions.setMode(returnMode);
  }, [uiState.actions]);

  // Mouse down: start a temporary pan for the configured buttons/modifiers.
  // Panning by dragging empty space with the left button is handled by the
  // select (CURSOR) mode itself, so it never interferes with drawing tools.
  const handleMouseDown = useCallback(
    (e: SlimMouseEvent): boolean => {
      // The Pan tool (or an ongoing pan) already handles dragging itself
      if (uiState.mode.type === 'PAN') return false;

      const panSettings = uiState.panSettings;

      // Middle click pan (button 1)
      if (e.button === 1 && panSettings.middleClickPan) {
        e.preventDefault();
        startPan();
        return true;
      }

      // Right click pan (button 2)
      if (e.button === 2 && panSettings.rightClickPan) {
        e.preventDefault();
        startPan();
        return true;
      }

      // Left button (0) with Space held, or with modifiers
      if (e.button === 0) {
        if (spaceHeldRef.current) {
          e.preventDefault();
          startPan();
          return true;
        }

        if (panSettings.ctrlClickPan && e.ctrlKey) {
          e.preventDefault();
          startPan();
          return true;
        }

        if (panSettings.altClickPan && e.altKey) {
          e.preventDefault();
          startPan();
          return true;
        }
      }

      return false;
    },
    [uiState.mode.type, uiState.panSettings, startPan]
  );

  // Mouse up: finish a temporary pan started above
  const handleMouseUp = useCallback((): boolean => {
    if (isPanningRef.current) {
      endPan();
      return true;
    }
    return false;
  }, [endPan]);

  // Keyboard pan handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('.ql-editor')
      ) {
        return;
      }

      // With something selected the arrow keys move it instead (handled in
      // useInteractionManager), so don't pan as well
      const { mode, itemControls } = uiState;
      const hasSelection =
        ((mode.type === 'LASSO' || mode.type === 'FREEHAND_LASSO') &&
          Boolean(mode.selection?.items.length)) ||
        Boolean(itemControls && 'id' in itemControls);
      if (hasSelection && e.key.startsWith('Arrow')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const panSettings = uiState.panSettings;
      const speed = panSettings.keyboardPanSpeed;
      let dx = 0;
      let dy = 0;

      // Arrow keys
      if (panSettings.arrowKeysPan) {
        if (e.key === 'ArrowUp') {
          dy = speed;
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          dy = -speed;
          e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
          dx = speed;
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          dx = -speed;
          e.preventDefault();
        }
      }

      // WASD keys
      if (panSettings.wasdPan) {
        const key = e.key.toLowerCase();
        if (key === 'w') {
          dy = speed;
          e.preventDefault();
        } else if (key === 's') {
          dy = -speed;
          e.preventDefault();
        } else if (key === 'a') {
          dx = speed;
          e.preventDefault();
        } else if (key === 'd') {
          dx = -speed;
          e.preventDefault();
        }
      }

      // IJKL keys
      if (panSettings.ijklPan) {
        const key = e.key.toLowerCase();
        if (key === 'i') {
          dy = speed;
          e.preventDefault();
        } else if (key === 'k') {
          dy = -speed;
          e.preventDefault();
        } else if (key === 'j') {
          dx = speed;
          e.preventDefault();
        } else if (key === 'l') {
          dx = -speed;
          e.preventDefault();
        }
      }

      // Apply pan if any movement
      if (dx !== 0 || dy !== 0) {
        const newPosition = CoordsUtils.add(
          uiState.scroll.position,
          { x: dx, y: dy }
        );
        uiState.actions.setScroll({
          position: newPosition,
          offset: uiState.scroll.offset
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiState.panSettings, uiState.scroll, uiState.actions, uiState.mode, uiState.itemControls]);

  return {
    handleMouseDown,
    handleMouseUp,
    isPanning: isPanningRef.current
  };
};