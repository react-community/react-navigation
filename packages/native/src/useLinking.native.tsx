import * as React from 'react';
import { Linking, Platform } from 'react-native';
import {
  getActionFromState as getActionFromStateDefault,
  getStateFromPath as getStateFromPathDefault,
  NavigationContainerRef,
} from '@react-navigation/core';
import extractPathFromURL from './extractPathFromURL';
import type { LinkingOptions } from './types';

type ResultState = ReturnType<typeof getStateFromPathDefault>;

let isUsingLinking = false;

export default function useLinking(
  ref: React.RefObject<NavigationContainerRef>,
  {
    enabled = true,
    prefixes,
    config,
    getInitialURL = () =>
      Promise.race([
        Linking.getInitialURL(),
        new Promise<undefined>((resolve) =>
          // Timeout in 150ms if `getInitialState` doesn't resolve
          // Workaround for https://github.com/facebook/react-native/issues/25675
          setTimeout(resolve, 150)
        ),
      ]),
    subscribe = (listener) => {
      const callback = ({ url }: { url: string }) => listener(url);

      const subscription = Linking.addEventListener('url', callback) as
        | { remove(): void }
        | undefined;

      return () => {
        // https://github.com/facebook/react-native/commit/6d1aca806cee86ad76de771ed3a1cc62982ebcd7
        if (subscription?.remove) {
          subscription.remove();
        } else {
          Linking.removeEventListener('url', callback);
        }
      };
    },
    getStateFromPath = getStateFromPathDefault,
    getActionFromState = getActionFromStateDefault,
  }: LinkingOptions
) {
  React.useEffect(() => {
    if (enabled !== false && isUsingLinking) {
      throw new Error(
        [
          'Looks like you have configured linking in multiple places. This is likely an error since deep links should only be handled in one place to avoid conflicts. Make sure that:',
          "- You are not using both 'linking' prop and 'useLinking'",
          "- You don't have 'useLinking' in multiple components",
          Platform.OS === 'android'
            ? "- You have set 'android:launchMode=singleTask' in the '<activity />' section of the 'AndroidManifest.xml' file to avoid launching multiple instances"
            : '',
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

  // We store these options in ref to avoid re-creating getInitialState and re-subscribing listeners
  // This lets user avoid wrapping the items in `React.useCallback` or `React.useMemo`
  // Not re-creating `getInitialState` is important coz it makes it easier for the user to use in an effect
  const enabledRef = React.useRef(enabled);
  const prefixesRef = React.useRef(prefixes);
  const configRef = React.useRef(config);
  const getInitialURLRef = React.useRef(getInitialURL);
  const getStateFromPathRef = React.useRef(getStateFromPath);
  const getActionFromStateRef = React.useRef(getActionFromState);

  React.useEffect(() => {
    enabledRef.current = enabled;
    prefixesRef.current = prefixes;
    configRef.current = config;
    getInitialURLRef.current = getInitialURL;
    getStateFromPathRef.current = getStateFromPath;
    getActionFromStateRef.current = getActionFromState;
  });

  const getInitialState = React.useCallback(() => {
    let state: ResultState | undefined;

    if (enabledRef.current) {
      const url = getInitialURLRef.current();

      if (url != null && typeof url !== 'string') {
        return url.then((url) => {
          const path = url
            ? extractPathFromURL(prefixesRef.current, url)
            : null;

          return path
            ? getStateFromPathRef.current(path, configRef.current)
            : undefined;
        });
      }

      const path = url ? extractPathFromURL(prefixesRef.current, url) : null;

      state = path
        ? getStateFromPathRef.current(path, configRef.current)
        : undefined;
    }

    const thenable = {
      then(onfulfilled?: (state: ResultState | undefined) => void) {
        return Promise.resolve(onfulfilled ? onfulfilled(state) : state);
      },
      catch() {
        return thenable;
      },
    };

    return thenable as PromiseLike<ResultState | undefined>;
  }, []);

  React.useEffect(() => {
    function isRouteExist(deepLinkState, routeState): boolean {
      const routeExist = deepLinkState.routes.some((r) => !routeState?.routeNames.includes(r.name))
      const nestedRouteState = routeState.routes[routeState.index]?.state
      if (!routeExist && nestedRouteState) {
        return isRouteExist(deepLinkState, nestedRouteState)
      } else {
        return routeExist
      }
    }
    const listener = (url: string) => {
      if (!enabled) {
        return;
      }

      const path = extractPathFromURL(prefixesRef.current, url);
      const navigation = ref.current;

      if (navigation && path) {
        const state = getStateFromPathRef.current(path, configRef.current);

        if (state) {
          // Make sure that the routes in the state exist in the root navigator
          // Otherwise there's an error in the linking configuration
          const rootState = navigation.getRootState();

          if (!isRouteExist(state, rootState)) {
            console.warn(
              "The navigation state parsed from the URL contains routes not present in the root navigator. This usually means that the linking configuration doesn't match the navigation structure. See https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration."
            );
            return;
          }

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
        }
      }
    };

    return subscribe(listener);
  }, [enabled, ref, subscribe]);

  return {
    getInitialState,
  };
}
