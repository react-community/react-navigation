import queryString from 'query-string';
import {
  NavigationState,
  PartialState,
  Route,
} from '@react-navigation/routers';

type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>;

type StringifyConfig = Record<string, (value: any) => string>;

type OptionsItem = {
  path?: string;
  exact?: boolean;
  stringify?: StringifyConfig;
  screens?: Options;
};

type Options = Record<string, string | OptionsItem>;

/**
 * Utility to serialize a navigation state object to a path string.
 *
 * Example:
 * ```js
 * getPathFromState(
 *   {
 *     routes: [
 *       {
 *         name: 'Chat',
 *         params: { author: 'Jane', id: 42 },
 *       },
 *     ],
 *   },
 *   {
 *     Chat: {
 *       path: 'chat/:author/:id',
 *       stringify: { author: author => author.toLowerCase() }
 *     }
 *   }
 * )
 * ```
 *
 * @param state Navigation state to serialize.
 * @param options Extra options to fine-tune how to serialize the path.
 * @returns Path representing the state, e.g. /foo/bar?count=42.
 */
export default function getPathFromState(
  state?: State,
  options: Options = {}
): string {
  if (state === undefined) {
    throw Error('NavigationState not passed');
  }

  // Create a normalized configs array which will be easier to use
  const configs: Record<string, ConfigItem> = Object.fromEntries(
    Object.keys(options).map((screen) => [
      screen,
      createNormalizedConfig(options[screen]),
    ])
  );

  let path = '/';
  let current: State | undefined = state;

  const allParams: Record<string, any> = {};

  while (current) {
    let index = typeof current.index === 'number' ? current.index : 0;
    let route = current.routes[index] as Route<string> & {
      state?: State;
    };

    let pattern: string | undefined;

    let currentParams: Record<string, any> = { ...route.params };
    let currentOptions = configs;

    // Keep all the route names that appeared during going deeper in config in case the pattern is resolved to undefined
    let nestedRouteNames = [];

    let hasNext = true;

    while (route.name in currentOptions && hasNext) {
      pattern = currentOptions[route.name].pattern;

      nestedRouteNames.push(route.name);

      if (route.params) {
        const stringify = currentOptions[route.name]?.stringify;

        currentParams = Object.fromEntries(
          Object.entries(route.params).map(([key, value]) => [
            key,
            stringify?.[key] ? stringify[key](value) : String(value),
          ])
        );

        if (pattern) {
          Object.assign(allParams, currentParams);
        }
      }

      // If there is no `screens` property or no nested state, we return pattern
      if (!currentOptions[route.name].screens || route.state === undefined) {
        hasNext = false;
      } else {
        index =
          typeof route.state.index === 'number'
            ? route.state.index
            : route.state.routes.length - 1;

        const nextRoute = route.state.routes[index];
        const nestedConfig = currentOptions[route.name].screens;

        // if there is config for next route name, we go deeper
        if (nestedConfig && nextRoute.name in nestedConfig) {
          route = nextRoute as Route<string> & { state?: State };
          currentOptions = nestedConfig;
        } else {
          // If not, there is no sense in going deeper in config
          hasNext = false;
        }
      }
    }

    if (pattern === undefined) {
      pattern = nestedRouteNames.join('/');
    }

    if (currentOptions[route.name] !== undefined) {
      path += pattern
        .split('/')
        .map((p) => {
          const name = p.replace(/^:/, '').replace(/\?$/, '');

          // If the path has a pattern for a param, put the param in the path
          if (name in allParams && p.startsWith(':')) {
            const value = allParams[name];

            // Remove the used value from the params object since we'll use the rest for query string
            if (currentParams) {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete currentParams[name];
            }

            return encodeURIComponent(value);
          } else if (p.endsWith('?')) {
            // Optional params without value assigned in route.params should be ignored
            return '';
          }

          return encodeURIComponent(p);
        })
        .join('/');
    } else {
      path += encodeURIComponent(route.name);
    }

    if (route.state) {
      path += '/';
    } else if (currentParams) {
      for (let param in currentParams) {
        if (currentParams[param] === 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete currentParams[param];
        }
      }

      const query = queryString.stringify(currentParams);

      if (query) {
        path += `?${query}`;
      }
    }

    current = route.state;
  }

  // Remove multiple as well as trailing slashes
  path = path.replace(/\/+/g, '/');
  path = path.length > 1 ? path.replace(/\/$/, '') : path;

  return path;
}

type ConfigItem = {
  pattern?: string;
  stringify?: StringifyConfig;
  screens?: Record<string, ConfigItem>;
};

function joinPaths(...paths: string[]): string {
  return paths
    .map((p) => p.split('/'))
    .flat()
    .filter(Boolean)
    .join('/');
}

function createNormalizedConfig(
  config: OptionsItem | string,
  parentPattern?: string
): ConfigItem {
  if (typeof config === 'string') {
    // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
    const pattern = parentPattern ? joinPaths(parentPattern, config) : config;

    return { pattern };
  }

  // If an object is specified as the value (e.g. Foo: { ... }),
  // It can have `path` property and `screens` prop which has nested configs
  const pattern =
    config.exact !== true && parentPattern && config.path
      ? joinPaths(parentPattern, config.path)
      : config.path;

  const screens = config.screens
    ? Object.fromEntries(
        Object.entries(config.screens).map(([name, c]) => {
          const result = createNormalizedConfig(c, pattern);

          return [name, result];
        })
      )
    : undefined;

  return {
    pattern,
    stringify: config.stringify,
    screens,
  };
}
