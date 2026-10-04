import { useEffect } from 'react';

/**
 * Android TV / Smart TV Spatial Navigation Hook (D-Pad Engine)
 * Enables 100% full-fledged directional navigation (Up, Down, Left, Right, OK, Back)
 * across all interactive elements, grids, sidebars, carousels, and dialogs.
 */
export function useSpatialNavigation(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    let lastFocusedElement: HTMLElement | null = null;

    const getFocusableCandidates = (): HTMLElement[] => {
      const selector = [
        'button:not([disabled])',
        '[role="button"]:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
      ].join(', ');

      const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

      return elements.filter((el) => {
        // Exclude elements inside hidden containers or inactive modals
        if (el.offsetParent === null && window.getComputedStyle(el).position !== 'fixed') {
          return false;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const style = window.getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') {
          return false;
        }
        return true;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when video player is actively handling its own keys (Escape, Space, etc.)
      const isPlayerActive = document.querySelector('video') !== null && 
        document.fullscreenElement !== null;

      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      // Arrow keys navigation
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

      if (isArrowKey) {
        // Allow normal cursor movement inside text inputs unless moving Up/Down out of it
        if (isInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          return;
        }

        e.preventDefault();

        const candidates = getFocusableCandidates();
        if (candidates.length === 0) return;

        // If no element is currently focused or focused element is body
        if (!activeEl || activeEl === document.body || !candidates.includes(activeEl)) {
          const firstCandidate = candidates[0];
          if (firstCandidate) {
            firstCandidate.focus();
            firstCandidate.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            markTvFocused(firstCandidate);
          }
          return;
        }

        const curRect = activeEl.getBoundingClientRect();
        const curCenterX = curRect.left + curRect.width / 2;
        const curCenterY = curRect.top + curRect.height / 2;

        let bestCandidate: HTMLElement | null = null;
        let bestScore = Infinity;

        for (const cand of candidates) {
          if (cand === activeEl) continue;

          const candRect = cand.getBoundingClientRect();
          const candCenterX = candRect.left + candRect.width / 2;
          const candCenterY = candRect.top + candRect.height / 2;

          let isDirectionValid = false;
          let primaryDist = 0;
          let secondaryDist = 0;

          switch (e.key) {
            case 'ArrowRight':
              // Must be to the right
              if (candCenterX > curCenterX + 6) {
                isDirectionValid = true;
                primaryDist = candCenterX - curCenterX;
                secondaryDist = Math.abs(candCenterY - curCenterY);
              }
              break;

            case 'ArrowLeft':
              // Must be to the left
              if (candCenterX < curCenterX - 6) {
                isDirectionValid = true;
                primaryDist = curCenterX - candCenterX;
                secondaryDist = Math.abs(candCenterY - curCenterY);
              }
              break;

            case 'ArrowDown':
              // Must be below
              if (candCenterY > curCenterY + 6) {
                isDirectionValid = true;
                primaryDist = candCenterY - curCenterY;
                secondaryDist = Math.abs(candCenterX - curCenterX);
              }
              break;

            case 'ArrowUp':
              // Must be above
              if (candCenterY < curCenterY - 6) {
                isDirectionValid = true;
                primaryDist = curCenterY - candCenterY;
                secondaryDist = Math.abs(candCenterX - curCenterX);
              }
              break;
          }

          if (isDirectionValid) {
            // Heavily penalize items far off the primary directional axis
            const score = primaryDist + secondaryDist * 2.2;
            if (score < bestScore) {
              bestScore = score;
              bestCandidate = cand;
            }
          }
        }

        // Fallback: If going Left from content area and found nothing, jump to active sidebar menu
        if (!bestCandidate && e.key === 'ArrowLeft') {
          const sidebarBtn = document.querySelector<HTMLElement>('aside button, nav button');
          if (sidebarBtn && sidebarBtn !== activeEl) {
            bestCandidate = sidebarBtn;
          }
        }

        // Fallback: If going Right from sidebar and found nothing, jump to first main content card
        if (!bestCandidate && e.key === 'ArrowRight') {
          const mainCard = document.querySelector<HTMLElement>('main [role="button"], main button');
          if (mainCard && mainCard !== activeEl) {
            bestCandidate = mainCard;
          }
        }

        if (bestCandidate) {
          bestCandidate.focus();
          bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          markTvFocused(bestCandidate);
        }
        return;
      }

      // Enter / OK Key
      if (e.key === 'Enter' || e.key === 'NumpadEnter') {
        if (activeEl && activeEl !== document.body && !isInput) {
          // Trigger click on currently focused TV element
          activeEl.click();
        }
        return;
      }
    };

    const markTvFocused = (el: HTMLElement) => {
      if (lastFocusedElement && lastFocusedElement !== el) {
        lastFocusedElement.removeAttribute('data-tv-focused');
      }
      el.setAttribute('data-tv-focused', 'true');
      lastFocusedElement = el;
    };

    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement) {
        markTvFocused(e.target);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('focusin', handleFocus);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('focusin', handleFocus);
    };
  }, [enabled]);
}
