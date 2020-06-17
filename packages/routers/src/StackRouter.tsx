import { nanoid } from 'nanoid/non-secure';
import BaseRouter from './BaseRouter';
import {
  NavigationState,
  CommonNavigationAction,
  Router,
  DefaultRouterOptions,
  Route,
  ParamListBase,
} from './types';

export type StackActionType =
  | {
      type: 'REPLACE';
      payload: { name: string; key?: string | undefined; params?: object };
      source?: string;
      target?: string;
    }
  | {
      type: 'PUSH';
      payload: { name: string; key?: string | undefined; params?: object };
      source?: string;
      target?: string;
    }
  | {
      type: 'POP';
      payload: { count: number };
      source?: string;
      target?: string;
    }
  | {
      type: 'POP_TO_TOP';
      source?: string;
      target?: string;
    };

export type StackRouterOptions = DefaultRouterOptions;

export type StackNavigationState = NavigationState & {
  /**
   * Type of the router, in this case, it's stack.
   */
  type: 'stack';
};

export type StackActionHelpers<ParamList extends ParamListBase> = {
  /**
   * Replace the current route with a new one.
   *
   * @param name Route name of the new route.
   * @param [params] Params object for the new route.
   */
  replace<RouteName extends keyof ParamList>(
    ...args: ParamList[RouteName] extends undefined
      ? [RouteName] | [RouteName, ParamList[RouteName]]
      : [RouteName, ParamList[RouteName]]
  ): void;

  /**
   * Push a new screen onto the stack.
   *
   * @param name Name of the route for the tab.
   * @param [params] Params object for the route.
   */
  push<RouteName extends keyof ParamList>(
    ...args: ParamList[RouteName] extends undefined | any
      ? [RouteName] | [RouteName, ParamList[RouteName]]
      : [RouteName, ParamList[RouteName]]
  ): void;

  /**
   * Pop a screen from the stack.
   */
  pop(count?: number): void;

  /**
   * Pop to the first route in the stack, dismissing all other screens.
   */
  popToTop(): void;
};

export const StackActions = {
  replace(name: string, params?: object): StackActionType {
    return { type: 'REPLACE', payload: { name, params } };
  },
  push(name: string, params?: object): StackActionType {
    return { type: 'PUSH', payload: { name, params } };
  },
  pop(count: number = 1): StackActionType {
    return { type: 'POP', payload: { count } };
  },
  popToTop(): StackActionType {
    return { type: 'POP_TO_TOP' };
  },
};

export default function StackRouter() {
  const router: Router<
    StackNavigationState,
    CommonNavigationAction | StackActionType
  > = {
    ...BaseRouter,

    type: 'stack',

    getInitialState({
      initialRouteName: _initialRouteName,
      routeNames,
      routeParamList,
    }) {
      const initialRouteName =
        _initialRouteName !== undefined &&
        routeNames.includes(_initialRouteName)
          ? _initialRouteName
          : routeNames[0];

      return {
        stale: false,
        type: 'stack',
        key: `stack-${nanoid()}`,
        index: 0,
        routeNames,
        routes: [
          {
            key: `${initialRouteName}-${nanoid()}`,
            name: initialRouteName,
            params: routeParamList[initialRouteName],
          },
        ],
      };
    },

    getRehydratedState(
      partialState,
      { initialRouteName: _initialRouteName, routeNames, routeParamList }
    ) {
      let state = partialState;

      if (state.stale === false) {
        return state;
      }

      const routes = state.routes
        .filter((route) => routeNames.includes(route.name))
        .map(
          (route) =>
            ({
              ...route,
              key: route.key || `${route.name}-${nanoid()}`,
              params:
                routeParamList[route.name] !== undefined
                  ? {
                      ...routeParamList[route.name],
                      ...route.params,
                    }
                  : route.params,
            } as Route<string>)
        );

      if (routes.length === 0) {
        const initialRouteName =
          _initialRouteName !== undefined ? _initialRouteName : routeNames[0];

        routes.push({
          key: `${initialRouteName}-${nanoid()}`,
          name: initialRouteName,
          params: routeParamList[initialRouteName],
        });
      }

      return {
        stale: false,
        type: 'stack',
        key: `stack-${nanoid()}`,
        index: routes.length - 1,
        routeNames,
        routes,
      };
    },

    getStateForRouteNamesChange(
      state,
      { initialRouteName: _initialRouteName, routeNames, routeParamList }
    ) {
      const routes = state.routes.filter((route) =>
        routeNames.includes(route.name)
      );

      if (routes.length === 0) {
        const initialRouteName =
          _initialRouteName !== undefined &&
          routeNames.includes(_initialRouteName)
            ? _initialRouteName
            : routeNames[0];

        routes.push({
          key: `${initialRouteName}-${nanoid()}`,
          name: initialRouteName,
          params: routeParamList[initialRouteName],
        });
      }

      return {
        ...state,
        routeNames,
        routes,
        index: Math.min(state.index, routes.length - 1),
      };
    },

    getStateForRouteFocus(state, key) {
      const index = state.routes.findIndex((r) => r.key === key);

      if (index === -1 || index === state.index) {
        return state;
      }

      return {
        ...state,
        index,
        routes: state.routes.slice(0, index + 1),
      };
    },

    getStateForAction(state, action, options) {
      const { routeParamList } = options;

      switch (action.type) {
        case 'REPLACE': {
          const index =
            action.target === state.key && action.source
              ? state.routes.findIndex((r) => r.key === action.source)
              : state.index;

          if (index === -1) {
            return null;
          }

          const { name, key, params } = action.payload;

          if (!state.routeNames.includes(name)) {
            return null;
          }

          return {
            ...state,
            routes: state.routes.map((route, i) =>
              i === index
                ? {
                    key: key !== undefined ? key : `${name}-${nanoid()}`,
                    name,
                    params:
                      routeParamList[name] !== undefined
                        ? {
                            ...routeParamList[name],
                            ...params,
                          }
                        : params,
                  }
                : route
            ),
          };
        }

        case 'PUSH':
          if (state.routeNames.includes(action.payload.name)) {
            return {
              ...state,
              index: state.index + 1,
              routes: [
                ...state.routes,
                {
                  key:
                    action.payload.key === undefined
                      ? `${action.payload.name}-${nanoid()}`
                      : action.payload.key,
                  name: action.payload.name,
                  params:
                    routeParamList[action.payload.name] !== undefined
                      ? {
                          ...routeParamList[action.payload.name],
                          ...action.payload.params,
                        }
                      : action.payload.params,
                },
              ],
            };
          }

          return null;

        case 'POP': {
          const index =
            action.target === state.key && action.source
              ? state.routes.findIndex((r) => r.key === action.source)
              : state.index;

          if (index > 0) {
            const count = Math.max(index - action.payload.count + 1, 1);
            const routes = state.routes
              .slice(0, count)
              .concat(state.routes.slice(index + 1));

            return {
              ...state,
              index: routes.length - 1,
              routes,
            };
          }

          return null;
        }

        case 'POP_TO_TOP':
          return router.getStateForAction(
            state,
            {
              type: 'POP',
              payload: { count: state.routes.length - 1 },
            },
            options
          );

        case 'NAVIGATE':
          if (
            action.payload.key ||
            (action.payload.name &&
              state.routeNames.includes(action.payload.name))
          ) {
            // If the route already exists, navigate to that
            let index = -1;

            if (
              (state.routes[state.index].name === action.payload.name &&
                action.payload.key === undefined) ||
              state.routes[state.index].key === action.payload.key
            ) {
              index = state.index;
            } else {
              for (let i = state.routes.length - 1; i >= 0; i--) {
                if (
                  (state.routes[i].name === action.payload.name &&
                    action.payload.key === undefined) ||
                  state.routes[i].key === action.payload.key
                ) {
                  index = i;
                  break;
                }
              }
            }

            if (
              index === -1 &&
              action.payload.key &&
              action.payload.name === undefined
            ) {
              return null;
            }

            if (index === -1 && action.payload.name !== undefined) {
              return router.getStateForAction(
                state,
                {
                  type: 'PUSH',
                  payload: {
                    key: action.payload.key,
                    name: action.payload.name,
                    params: action.payload.params,
                  },
                },
                options
              );
            }

            return {
              ...state,
              index,
              routes: [
                ...state.routes.slice(0, index),
                action.payload.params !== undefined
                  ? {
                      ...state.routes[index],
                      params: {
                        ...state.routes[index].params,
                        ...action.payload.params,
                      },
                    }
                  : state.routes[index],
              ],
            };
          }

          return null;

        case 'GO_BACK':
          if (state.index > 0) {
            return router.getStateForAction(
              state,
              {
                type: 'POP',
                payload: { count: 1 },
                target: action.target,
                source: action.source,
              },
              options
            );
          }

          return null;

        default:
          return BaseRouter.getStateForAction(state, action);
      }
    },

    actionCreators: StackActions,
  };

  return router;
}
