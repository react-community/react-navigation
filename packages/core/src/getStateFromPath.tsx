import escape from 'escape-string-regexp';
import * as queryString from 'query-string';
import type {
  NavigationState,
  PartialState,
  InitialState,
} from '@react-navigation/routers';
import findFocusedRoute from './findFocusedRoute';
import type { PathConfigMap } from './types';

type Options = {
  initialRouteName?: string;
  screens: PathConfigMap;
};

type ParseConfig = Record<string, (value: string) => any>;

type RouteConfig = {
  screen: string;
  regex?: RegExp;
  path: string;
  pattern: string;
  routeNames: string[];
  parse?: ParseConfig;
};

type InitialRouteConfig = {
  initialRouteName: string;
  connectedRoutes: string[];
};

type ResultState = PartialState<NavigationState> & {
  state?: ResultState;
};

type ParsedRoute = {
  name: string;
  path?: string;
  params?: Record<string, any> | undefined;
};

/**
 * Utility to parse a path string to initial state object accepted by the container.
 * This is useful for deep linking when we need to handle the incoming URL.
 *
 * @example
 * ```js
 * getStateFromPath(
 *   '/chat/jane/42',
 *   {
 *     screens: {
 *       Chat: {
 *         path: 'chat/:author/:id',
 *         parse: { id: Number }
 *       }
 *     }
 *   }
 * )
 * ```
 * @param path Path string to parse and convert, e.g. /foo/bar?count=42.
 * @param options Extra options to fine-tune how to parse the path.
 */
export default function getStateFromPath(
  path: string,
  options?: Options
): ResultState | undefined {
  let initialRoutes: InitialRouteConfig[] = [];

  if (options?.initialRouteName) {
    initialRoutes.push({
      initialRouteName: options.initialRouteName,
      connectedRoutes: Object.keys(options.screens),
    });
  }

  const screens = options?.screens;

  let remaining = path
    .replace(/\/+/g, '/') // Replace multiple slash (//) with single ones
    .replace(/^\//, '') // Remove extra leading slash
    .replace(/\?.*$/, ''); // Remove query params which we will handle later

  // Make sure there is a trailing slash
  remaining = remaining.endsWith('/') ? remaining : `${remaining}/`;

  if (screens === undefined) {
    // When no config is specified, use the path segments as route names
    const routes = remaining
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        const name = decodeURIComponent(segment);
        return { name };
      });

    if (routes.length) {
      return createNestedStateObject(path, routes, initialRoutes);
    }

    return undefined;
  }

  // Create a normalized configs array which will be easier to use
  const configs = ([] as RouteConfig[])
    .concat(
      ...Object.keys(screens).map((key) =>
        createNormalizedConfigs(
          key,
          screens as PathConfigMap,
          [],
          initialRoutes
        )
      )
    )
    .sort((a, b) => {
      // Sort config so that:
      // - the most exhaustive ones are always at the beginning
      // - patterns with wildcard are always at the end

      // If 2 patterns are same, move the one with less route names up
      // This is an error state, so it's only useful for consistent error messages
      if (a.pattern === b.pattern) {
        return b.routeNames.join('>').localeCompare(a.routeNames.join('>'));
      }

      // If one of the patterns starts with the other, it's more exhaustive
      // So move it up
      if (a.pattern.startsWith(b.pattern)) {
        return -1;
      }

      if (b.pattern.startsWith(a.pattern)) {
        return 1;
      }

      const aParts = a.pattern.split('/');
      const bParts = b.pattern.split('/');

      const aWildcardIndex = aParts.indexOf('*');
      const bWildcardIndex = bParts.indexOf('*');

      // If only one of the patterns has a wildcard, move it down in the list
      if (aWildcardIndex === -1 && bWildcardIndex !== -1) {
        return -1;
      }

      if (aWildcardIndex !== -1 && bWildcardIndex === -1) {
        return 1;
      }

      if (aWildcardIndex === bWildcardIndex) {
        // If `b` has more `/`, it's more exhaustive
        // So we move it up in the list
        return bParts.length - aParts.length;
      }

      // If the wildcard appears later in the pattern (has higher index), it's more specific
      // So we move it up in the list
      return bWildcardIndex - aWildcardIndex;
    });

  // Check for duplicate patterns in the config
  configs.reduce<Record<string, RouteConfig>>((acc, config) => {
    if (acc[config.pattern]) {
      const a = acc[config.pattern].routeNames;
      const b = config.routeNames;

      // It's not a problem if the path string omitted from a inner most screen
      // For example, it's ok if a path resolves to `A > B > C` or `A > B`
      const intersects =
        a.length > b.length
          ? b.every((it, i) => a[i] === it)
          : a.every((it, i) => b[i] === it);

      if (!intersects) {
        throw new Error(
          `Found conflicting screens with the same pattern. The pattern '${
            config.pattern
          }' resolves to both '${a.join(' > ')}' and '${b.join(
            ' > '
          )}'. Patterns must be unique and cannot resolve to more than one screen.`
        );
      }
    }

    return Object.assign(acc, {
      [config.pattern]: config,
    });
  }, {});

  if (remaining === '/') {
    // We need to add special handling of empty path so navigation to empty path also works
    // When handling empty path, we should only look at the root level config
    const match = configs.find(
      (config) =>
        config.path === '' &&
        config.routeNames.every(
          // Make sure that none of the parent configs have a non-empty path defined
          (name) => !configs.find((c) => c.screen === name)?.path
        )
    );

    if (match) {
      return createNestedStateObject(
        path,
        match.routeNames.map((name) => ({ name })),
        initialRoutes,
        configs
      );
    }

    return undefined;
  }

  let result: PartialState<NavigationState> | undefined;
  let current: PartialState<NavigationState> | undefined;

  // We match the whole path against the regex instead of segments
  // This makes sure matches such as wildcard will catch any unmatched routes, even if nested
  const { routes, remainingPath } = matchAgainstConfigs(
    remaining,
    configs.map((c) => ({
      ...c,
      // Add `$` to the regex to make sure it matches till end of the path and not just beginning
      regex: c.regex ? new RegExp(c.regex.source + '$') : undefined,
    }))
  );

  if (routes !== undefined) {
    // This will always be empty if full path matched
    current = createNestedStateObject(path, routes, initialRoutes, configs);
    remaining = remainingPath;
    result = current;
  }

  if (current == null || result == null) {
    return undefined;
  }

  return result;
}

const joinPaths = (...paths: string[]): string =>
  ([] as string[])
    .concat(...paths.map((p) => p.split('/')))
    .filter(Boolean)
    .join('/');

const matchAgainstConfigs = (remaining: string, configs: RouteConfig[]) => {
  let routes: ParsedRoute[] | undefined;
  let remainingPath = remaining;

  // Go through all configs, and see if the next path segment matches our regex
  for (const config of configs) {
    if (!config.regex) {
      continue;
    }

    const match = remainingPath.match(config.regex);

    // If our regex matches, we need to extract params from the path
    if (match) {
      const matchedParams = config.pattern
        ?.split('/')
        .filter((p) => p.startsWith(':'))
        .reduce<Record<string, any>>(
          (acc, p, i) =>
            Object.assign(acc, {
              // The param segments appear every second item starting from 2 in the regex match result
              [p]: match![(i + 1) * 2].replace(/\//, ''),
            }),
          {}
        );

      routes = config.routeNames.map((name) => {
        const config = configs.find((c) => c.screen === name);
        const params = config?.path
          ?.split('/')
          .filter((p) => p.startsWith(':'))
          .reduce<Record<string, any>>((acc, p) => {
            const value = matchedParams[p];

            if (value) {
              const key = p.replace(/^:/, '').replace(/\?$/, '');
              acc[key] = config.parse?.[key] ? config.parse[key](value) : value;
            }

            return acc;
          }, {});

        if (params && Object.keys(params).length) {
          return { name, params };
        }

        return { name };
      });

      remainingPath = remainingPath.replace(match[1], '');

      break;
    }
  }

  return { routes, remainingPath };
};

const createNormalizedConfigs = (
  screen: string,
  routeConfig: PathConfigMap,
  routeNames: string[] = [],
  initials: InitialRouteConfig[],
  parentPattern?: string
): RouteConfig[] => {
  const configs: RouteConfig[] = [];

  routeNames.push(screen);

  const config = routeConfig[screen];

  if (typeof config === 'string') {
    // If a string is specified as the value of the key(e.g. Foo: '/path'), use it as the pattern
    const pattern = parentPattern ? joinPaths(parentPattern, config) : config;

    configs.push(createConfigItem(screen, routeNames, pattern, config));
  } else if (typeof config === 'object') {
    let pattern: string | undefined;

    // if an object is specified as the value (e.g. Foo: { ... }),
    // it can have `path` property and
    // it could have `screens` prop which has nested configs
    if (typeof config.path === 'string') {
      if (config.exact && config.path === undefined) {
        throw new Error(
          "A 'path' needs to be specified when specifying 'exact: true'. If you don't want this screen in the URL, specify it as empty string, e.g. `path: ''`."
        );
      }

      pattern =
        config.exact !== true
          ? joinPaths(parentPattern || '', config.path || '')
          : config.path || '';

      configs.push(
        createConfigItem(screen, routeNames, pattern, config.path, config.parse)
      );
    }

    if (config.screens) {
      // property `initialRouteName` without `screens` has no purpose
      if (config.initialRouteName) {
        initials.push({
          initialRouteName: config.initialRouteName,
          connectedRoutes: Object.keys(config.screens),
        });
      }

      Object.keys(config.screens).forEach((nestedConfig) => {
        const result = createNormalizedConfigs(
          nestedConfig,
          config.screens as PathConfigMap,
          routeNames,
          initials,
          pattern ?? parentPattern
        );

        configs.push(...result);
      });
    }
  }

  routeNames.pop();

  return configs;
};

const createConfigItem = (
  screen: string,
  routeNames: string[],
  pattern: string,
  path: string,
  parse?: ParseConfig
): RouteConfig => {
  // Normalize pattern to remove any leading, trailing slashes, duplicate slashes etc.
  pattern = pattern.split('/').filter(Boolean).join('/');

  const regex = pattern
    ? new RegExp(
        `^(${pattern
          .split('/')
          .map((it) => {
            if (it.startsWith(':')) {
              return `(([^/]+\\/)${it.endsWith('?') ? '?' : ''})`;
            }

            return `${it === '*' ? '.*' : escape(it)}\\/`;
          })
          .join('')})`
      )
    : undefined;

  return {
    screen,
    regex,
    pattern,
    path,
    // The routeNames array is mutated, so copy it to keep the current state
    routeNames: [...routeNames],
    parse,
  };
};

const findParseConfigForRoute = (
  routeName: string,
  flatConfig: RouteConfig[]
): ParseConfig | undefined => {
  for (const config of flatConfig) {
    if (routeName === config.routeNames[config.routeNames.length - 1]) {
      return config.parse;
    }
  }

  return undefined;
};

// Try to find an initial route connected with the one passed
const findInitialRoute = (
  routeName: string,
  initialRoutes: InitialRouteConfig[]
): string | undefined => {
  for (const config of initialRoutes) {
    if (config.connectedRoutes.includes(routeName)) {
      return config.initialRouteName === routeName
        ? undefined
        : config.initialRouteName;
    }
  }
  return undefined;
};

// returns state object with values depending on whether
// it is the end of state and if there is initialRoute for this level
const createStateObject = (
  initialRoute: string | undefined,
  route: ParsedRoute,
  isEmpty: boolean
): InitialState => {
  if (isEmpty) {
    if (initialRoute) {
      return {
        index: 1,
        routes: [{ name: initialRoute }, route],
      };
    } else {
      return {
        routes: [route],
      };
    }
  } else {
    if (initialRoute) {
      return {
        index: 1,
        routes: [{ name: initialRoute }, { ...route, state: { routes: [] } }],
      };
    } else {
      return {
        routes: [{ ...route, state: { routes: [] } }],
      };
    }
  }
};

const createNestedStateObject = (
  path: string,
  routes: ParsedRoute[],
  initialRoutes: InitialRouteConfig[],
  flatConfig?: RouteConfig[]
) => {
  let state: InitialState;
  let route = routes.shift() as ParsedRoute;
  let initialRoute = findInitialRoute(route.name, initialRoutes);

  state = createStateObject(initialRoute, route, routes.length === 0);

  if (routes.length > 0) {
    let nestedState = state;

    while ((route = routes.shift() as ParsedRoute)) {
      initialRoute = findInitialRoute(route.name, initialRoutes);

      const nestedStateIndex =
        nestedState.index || nestedState.routes.length - 1;

      nestedState.routes[nestedStateIndex].state = createStateObject(
        initialRoute,
        route,
        routes.length === 0
      );

      if (routes.length > 0) {
        nestedState = nestedState.routes[nestedStateIndex]
          .state as InitialState;
      }
    }
  }

  route = findFocusedRoute(state) as ParsedRoute;
  route.path = path;

  const params = parseQueryParams(
    path,
    flatConfig ? findParseConfigForRoute(route.name, flatConfig) : undefined
  );

  if (params) {
    route.params = { ...route.params, ...params };
  }

  return state;
};

const parseQueryParams = (
  path: string,
  parseConfig?: Record<string, (value: string) => any>
) => {
  const query = path.split('?')[1];
  const params = queryString.parse(query);

  if (parseConfig) {
    Object.keys(params).forEach((name) => {
      if (parseConfig[name] && typeof params[name] === 'string') {
        params[name] = parseConfig[name](params[name] as string);
      }
    });
  }

  return Object.keys(params).length ? params : undefined;
};
