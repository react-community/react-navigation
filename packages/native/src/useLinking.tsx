import * as React from 'react';
import {
  getStateFromPath as getStateFromPathDefault,
  getPathFromState as getPathFromStateDefault,
  getActionFromState as getActionFromStateDefault,
  NavigationContainerRef,
  NavigationState,
} from '@react-navigation/core';
import { nanoid } from 'nanoid/non-secure';
import ServerContext from './ServerContext';
import type { LinkingOptions } from './types';

type ResultState = ReturnType<typeof getStateFromPathDefault>;

type HistoryRecord = {
  // Unique identifier for this record to match it with window.history.state
  id: string;
  // Navigation state object for the history entry
  state: NavigationState;
  // Path of the history entry
  path: string;
};

const createMemoryHistory = () => {
  let index = 0;
  let items: HistoryRecord[] = [];

  // Pending callbacks for `history.go(n)`
  // We might modify the callback stored if it was interrupted, so we have a ref to identify it
  const pending: { ref: unknown; cb: (interrupted?: boolean) => void }[] = [];

  const interrupt = () => {
    // If another history operation was performed we need to interrupt existing ones
    // This makes sure that calls such as `history.replace` after `history.go` don't happen
    // Since otherwise it won't be correct if something else has changed
    pending.forEach((it) => {
      const cb = it.cb;
      it.cb = () => cb(true);
    });
  };

  const history = {
    get index(): number {
      // We store an id in the state instead of an index
      // Index could get out of sync with in-memory values if page reloads
      const id = window.history.state?.id;

      if (id) {
        let currentIndex = items.findIndex((item) => item.id === id);
        if (currentIndex < 0) {
          currentIndex = 0;
        }

        // Fix createMemoryHistory.index variable's value, because it will go out of sync, when navigating
        // with the browser. The 'popstate' event not sets the createMemoryHistory.index variable, but
        // calls this function, so the corrrect value can be set.
        index = currentIndex;
        return currentIndex;
      }

      return 0;
    },

    get(index: number) {
      return items[index];
    },

    backIndex({ path }: { path: string }) {
      // We need to find the index from the element before current to get closest path to go back to
      for (let i = index - 1; i >= 0; i--) {
        const item = items[i];

        if (item.path === path) {
          return i;
        }
      }

      return -1;
    },

    push({ path, state }: { path: string; state: NavigationState }) {
      interrupt();

      const id = nanoid();

      // When a new entry is pushed, all the existing entries after index will be inaccessible
      // So we remove any existing entries after the current index to clean them up
      items = items.slice(0, index + 1);

      items.push({ path, state, id });
      index = items.length - 1;

      // We pass empty string for title because it's ignored in all browsers except safari
      // We don't store state object in history.state because:
      // - browsers have limits on how big it can be, and we don't control the size
      // - while not recommended, there could be non-serializable data in state
      window.history.pushState({ id }, '', path);
    },

    replace({ path, state }: { path: string; state: NavigationState }) {
      interrupt();

      const id = window.history.state?.id ?? nanoid();

      if (items.findIndex((item) => item.id === id) < 0) {
        // When loaded id not found in the items array, this function by default will replace
        // the first item. We need to keep only the new updated object, otherwise it will break
        // the page when navigating forward in history.
        items = [{ path, state, id }];
      } else if (items.length) {
        items[index] = { path, state, id };
      } else {
        // This is the first time any state modifications are done
        // So we need to push the entry as there's nothing to replace
        items.push({ path, state, id });
      }

      window.history.replaceState({ id }, '', path);
    },

    // `history.go(n)` is asynchronous, there are couple of things to keep in mind:
    // - it won't do anything if we can't go `n` steps, the `popstate` event won't fire.
    // - each `history.go(n)` call will trigger a separate `popstate` event with correct location.
    // - the `popstate` event fires before the next frame after calling `history.go(n)`.
    // This method differs from `history.go(n)` in the sense that it'll go back as many steps it can.
    go(n: number) {
      interrupt();

      if (n > 0) {
        // We shouldn't go forward more than available index
        n = Math.min(n, items.length - 1);
      } else if (n < 0) {
        // We shouldn't go back more than the 0 index
        // Otherwise we'll exit the page
        n = index + n < 0 ? -index : n;
      }

      if (n === 0) {
        return;
      }

      index += n;

      // When we call `history.go`, `popstate` will fire when there's history to go back to
      // So we need to somehow handle following cases:
      // - There's history to go back, `history.go` is called, and `popstate` fires
      // - `history.go` is called multiple times, we need to resolve on respective `popstate`
      // - No history to go back, but `history.go` was called, browser has no API to detect it
      return new Promise<void>((resolve, reject) => {
        const done = (interrupted?: boolean) => {
          clearTimeout(timer);

          if (interrupted) {
            reject(new Error('History was changed during navigation.'));
            return;
          }

          // There seems to be a bug in Chrome regarding updating the title
          // If we set a title just before calling `history.go`, the title gets lost
          // However the value of `document.title` is still what we set it to
          // It's just not displayed in the tab bar
          // To update the tab bar, we need to reset the title to something else first (e.g. '')
          // And set the title to what it was before so it gets applied
          // It won't work without setting it to empty string coz otherwise title isn't changing
          // Which means that the browser won't do anything after setting the title
          const { title } = window.document;

          window.document.title = '';
          window.document.title = title;

          resolve();
        };

        pending.push({ ref: done, cb: done });

        // If navigation didn't happen within 100ms, assume that it won't happen
        // This may not be accurate, but hopefully it won't take so much time
        // In Chrome, navigation seems to happen instantly in next microtask
        // But on Firefox, it seems to take much longer, around 50ms from our testing
        // We're using a hacky timeout since there doesn't seem to be way to know for sure
        const timer = setTimeout(() => {
          const index = pending.findIndex((it) => it.ref === done);

          if (index > -1) {
            pending[index].cb();
            pending.splice(index, 1);
          }
        }, 100);

        const onPopState = () => {
          const last = pending.pop();

          window.removeEventListener('popstate', onPopState);
          last?.cb();
        };

        window.addEventListener('popstate', onPopState);
        window.history.go(n);
      });
    },

    // The `popstate` event is triggered when history changes, except `pushState` and `replaceState`
    // If we call `history.go(n)` ourselves, we don't want it to trigger the listener
    // Here we normalize it so that only external changes (e.g. user pressing back/forward) trigger the listener
    listen(listener: () => void) {
      const onPopState = () => {
        if (pending.length) {
          // This was triggered by `history.go(n)`, we shouldn't call the listener
          return;
        }

        listener();
      };

      window.addEventListener('popstate', onPopState);

      return () => window.removeEventListener('popstate', onPopState);
    },
  };

  return history;
};

/**
 * Find the matching navigation state that changed between 2 navigation states
 * e.g.: a -> b -> c -> d and a -> b -> c -> e -> f, if history in b changed, b is the matching state
 */
const findMatchingState = <T extends NavigationState>(
  a: T | undefined,
  b: T | undefined
): [T | undefined, T | undefined] => {
  if (a === undefined || b === undefined || a.key !== b.key) {
    return [undefined, undefined];
  }

  // Tab and drawer will have `history` property, but stack will have history in `routes`
  const aHistoryLength = a.history ? a.history.length : a.routes.length;
  const bHistoryLength = b.history ? b.history.length : b.routes.length;

  const aRoute = a.routes[a.index];
  const bRoute = b.routes[b.index];

  const aChildState = aRoute.state as T | undefined;
  const bChildState = bRoute.state as T | undefined;

  // Stop here if this is the state object that changed:
  // - history length is different
  // - focused routes are different
  // - one of them doesn't have child state
  // - child state keys are different
  if (
    aHistoryLength !== bHistoryLength ||
    aRoute.key !== bRoute.key ||
    aChildState === undefined ||
    bChildState === undefined ||
    aChildState.key !== bChildState.key
  ) {
    return [a, b];
  }

  return findMatchingState(aChildState, bChildState);
};

/**
 * Run async function in series as it's called.
 */
const series = (cb: () => Promise<void>) => {
  // Whether we're currently handling a callback
  let handling = false;
  let queue: (() => Promise<void>)[] = [];

  const callback = async () => {
    try {
      if (handling) {
        // If we're currently handling a previous event, wait before handling this one
        // Add the callback to the beginning of the queue
        queue.unshift(callback);
        return;
      }

      handling = true;

      await cb();
    } finally {
      handling = false;

      if (queue.length) {
        // If we have queued items, handle the last one
        const last = queue.pop();

        last?.();
      }
    }
  };

  return callback;
};

let isUsingLinking = false;

export default function useLinking(
  ref: React.RefObject<NavigationContainerRef>,
  {
    enabled = true,
    config,
    getStateFromPath = getStateFromPathDefault,
    getPathFromState = getPathFromStateDefault,
    getActionFromState = getActionFromStateDefault,
  }: LinkingOptions
) {
  React.useEffect(() => {
    if (enabled !== false && isUsingLinking) {
      throw new Error(
        [
          'Looks like you have configured linking in multiple places. This is likely an error since URL integration should only be handled in one place to avoid conflicts. Make sure that:',
          "- You are not using both 'linking' prop and 'useLinking'",
          "- You don't have 'useLinking' in multiple components",
        ]
          .join('\n')
          .trim()
      );
    } else {
      isUsingLinking = enabled !== false;
    }

    return () => {
      isUsingLinking = false;
    };
  });

  const [history] = React.useState(createMemoryHistory);

  // We store these options in ref to avoid re-creating getInitialState and re-subscribing listeners
  // This lets user avoid wrapping the items in `React.useCallback` or `React.useMemo`
  // Not re-creating `getInitialState` is important coz it makes it easier for the user to use in an effect
  const enabledRef = React.useRef(enabled);
  const configRef = React.useRef(config);
  const getStateFromPathRef = React.useRef(getStateFromPath);
  const getActionFromStateRef = React.useRef(getActionFromState);
  const getPathFromStateRef = React.useRef(getPathFromState);

  React.useEffect(() => {
    enabledRef.current = enabled;
    configRef.current = config;
    getStateFromPathRef.current = getStateFromPath;
    getActionFromStateRef.current = getActionFromState;
    getPathFromStateRef.current = getPathFromState;
  });

  const server = React.useContext(ServerContext);

  const getInitialState = React.useCallback(() => {
    let value: ResultState | undefined;

    if (enabledRef.current) {
      const location =
        server?.location ??
        (typeof window !== 'undefined' ? window.location : undefined);

      const path = location ? location.pathname + location.search : undefined;

      if (path) {
        value = getStateFromPathRef.current(path, configRef.current);
      }
    }

    const thenable = {
      then(onfulfilled?: (state: ResultState | undefined) => void) {
        return Promise.resolve(onfulfilled ? onfulfilled(value) : value);
      },
      catch() {
        return thenable;
      },
    };

    return thenable as PromiseLike<ResultState | undefined>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previousIndexRef = React.useRef<number | undefined>(undefined);
  const previousStateRef = React.useRef<NavigationState | undefined>(undefined);
  const pendingPopStatePathRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    previousIndexRef.current = history.index;

    return history.listen(() => {
      const navigation = ref.current;

      if (!navigation || !enabled) {
        return;
      }

      const path = location.pathname + location.search;
      const index = history.index;

      const previousIndex = previousIndexRef.current ?? 0;

      previousIndexRef.current = index;
      pendingPopStatePathRef.current = path;

      // When browser back/forward is clicked, we first need to check if state object for this index exists
      // If it does we'll reset to that state object
      // Otherwise, we'll handle it like a regular deep link
      const record = history.get(index);

      if (record?.path === path && record?.state) {
        navigation.resetRoot(record.state);
        return;
      }

      const state = getStateFromPathRef.current(path, configRef.current);

      // We should only dispatch an action when going forward
      // Otherwise the action will likely add items to history, which would mess things up
      if (state) {
        // Make sure that the routes in the state exist in the root navigator
        // Otherwise there's an error in the linking configuration
        const rootState = navigation.getRootState();

        if (state.routes.some((r) => !rootState?.routeNames.includes(r.name))) {
          console.warn(
            "The navigation state parsed from the URL contains routes not present in the root navigator. This usually means that the linking configuration doesn't match the navigation structure. See https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration."
          );
          return;
        }

        if (index > previousIndex) {
          const action = getActionFromStateRef.current(
            state,
            configRef.current
          );

          if (action !== undefined) {
            try {
              navigation.dispatch(action);
            } catch (e) {
              // Ignore any errors from deep linking.
              // This could happen in case of malformed links, navigation object not being initialized etc.
              console.warn(
                `An error occurred when trying to handle the link '${path}': ${e.message}`
              );
            }
          } else {
            navigation.resetRoot(state);
          }
        } else {
          navigation.resetRoot(state);
        }
      } else {
        // if current path didn't return any state, we should revert to initial state
        navigation.resetRoot(state);
      }
    });
  }, [enabled, history, ref]);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    if (ref.current) {
      // We need to record the current metadata on the first render if they aren't set
      // This will allow the initial state to be in the history entry
      const state = ref.current.getRootState();

      if (state) {
        const path = getPathFromStateRef.current(state, configRef.current);

        if (previousStateRef.current === undefined) {
          previousStateRef.current = state;
        }

        history.replace({ path, state });
      }
    }

    const onStateChange = async () => {
      const navigation = ref.current;

      if (!navigation || !enabled) {
        return;
      }

      const previousState = previousStateRef.current;
      const state = navigation.getRootState();

      const pendingPath = pendingPopStatePathRef.current;
      const path = getPathFromStateRef.current(state, configRef.current);

      previousStateRef.current = state;
      pendingPopStatePathRef.current = undefined;

      // To detect the kind of state change, we need to:
      // - Find the common focused navigation state in previous and current state
      // - If only the route keys changed, compare history/routes.length to check if we go back/forward/replace
      // - If no common focused navigation state found, it's a replace
      const [previousFocusedState, focusedState] = findMatchingState(
        previousState,
        state
      );

      if (
        previousFocusedState &&
        focusedState &&
        // We should only handle push/pop if path changed from what was in last `popstate`
        // Otherwise it's likely a change triggered by `popstate`
        path !== pendingPath
      ) {
        const historyDelta =
          (focusedState.history
            ? focusedState.history.length
            : focusedState.routes.length) -
          (previousFocusedState.history
            ? previousFocusedState.history.length
            : previousFocusedState.routes.length);

        if (historyDelta > 0) {
          // If history length is increased, we should pushState
          // Note that path might not actually change here, for example, drawer open should pushState
          history.push({ path, state });
        } else if (historyDelta < 0) {
          // If history length is decreased, i.e. entries were removed, we want to go back

          const nextIndex = history.backIndex({ path });
          const currentIndex = history.index;

          try {
            if (nextIndex !== -1 && nextIndex < currentIndex) {
              // An existing entry for this path exists and it's less than current index, go back to that
              await history.go(nextIndex - currentIndex);
            } else {
              // We couldn't find an existing entry to go back to, so we'll go back by the delta
              // This won't be correct if multiple routes were pushed in one go before
              // Usually this shouldn't happen and this is a fallback for that
              await history.go(historyDelta);
            }

            // Store the updated state as well as fix the path if incorrect
            history.replace({ path, state });
          } catch (e) {
            // The navigation was interrupted
          }
        } else {
          // If history length is unchanged, we want to replaceState
          history.replace({ path, state });
        }
      } else {
        // If no common navigation state was found, assume it's a replace
        // This would happen if the user did a reset/conditionally changed navigators
        history.replace({ path, state });
      }
    };

    // We debounce onStateChange coz we don't want multiple state changes to be handled at one time
    // This could happen since `history.go(n)` is asynchronous
    // If `pushState` or `replaceState` were called before `history.go(n)` completes, it'll mess stuff up
    return ref.current?.addListener('state', series(onStateChange));
  });

  return {
    getInitialState,
  };
}
