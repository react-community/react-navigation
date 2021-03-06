import * as React from 'react';
import type { View } from 'react-native';
import canUseDOM from './canUseDOM';

const FOCUSABLE_ELEMENT_SELECTORS =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, [tabindex="0"], [contenteditable]';

export default function useFocusTrap(
  ref: React.RefObject<View>,
  enabled: boolean
) {
  React.useEffect(() => {
    let cleanFocusLoopListener: VoidFunction | undefined;

    if (canUseDOM && enabled) {
      // @ts-expect-error: Assume that screenRef is containing a HTMLElement, because we're in web world
      cleanFocusLoopListener = loopFocus(ref.current as HTMLElement);
    }

    return () => cleanFocusLoopListener?.();
  }, [enabled, ref]);
}

// This function is based on https://gist.github.com/r3lk3r/0030bab99347a2326334e00b23188cab#file-focusloopingutil-js
function loopFocus(rootElement: HTMLElement) {
  if (!rootElement) {
    throw new Error(
      'Could not initialize focus-trapping - Root Element Missing'
    );
  }

  const focusableElements = rootElement.querySelectorAll(
    FOCUSABLE_ELEMENT_SELECTORS
  );

  // There can be containers without any focusable element
  if (focusableElements.length > 0) {
    const firstFocusableEl = focusableElements[0] as HTMLElement;
    const lastFocusableEl = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    firstFocusableEl.focus();

    const keyboardHandler = (event: KeyboardEvent) => {
      // keyCode used for legacy browsers compatibility
      if (event.key === 'Tab' || event.keyCode === 9) {
        // Cycle Focus
        if (event.shiftKey && document.activeElement === firstFocusableEl) {
          event.preventDefault();
          lastFocusableEl.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastFocusableEl
        ) {
          event.preventDefault();
          firstFocusableEl.focus();
        } else {
          // Do nothing & let the browser handle tabbing
        }
      }
    };

    rootElement.addEventListener('keydown', keyboardHandler);

    return () => {
      rootElement.removeEventListener('keydown', keyboardHandler);
    };
  } else {
    return () => {};
  }
}
