import { nanoid } from 'nanoid/non-secure';
import BaseRouter from './BaseRouter';
import {
  NavigationState,
  PartialState,
  CommonNavigationAction,
  Router,
  DefaultRouterOptions,
  Route,
  ParamListBase,
} from './types';

export type TabActionType = {
  type: 'JUMP_TO';
  payload: { name: string; params?: object };
  source?: string;
  target?: string;
};

export type BackBehavior = 'initialRoute' | 'order' | 'history' | 'none';

export type TabRouterOptions = DefaultRouterOptions & {
  backBehavior?: BackBehavior;
};

export type TabNavigationState = Omit<NavigationState, 'history'> & {
  /**
   * Type of the router, in this case, it's tab.
   */
  type: 'tab';
  /**
   * List of previously visited route keys.
   */
  history: { type: 'route'; key: string }[];
};

export type TabActionHelpers<ParamList extends ParamListBase> = {
  /**
   * Jump to an existing tab.
   *
   * @param name Name of the route for the tab.
   * @param [params] Params object for the route.
   */
  jumpTo<RouteName extends Extract<keyof ParamList, string>>(
    ...args: ParamList[RouteName] extends undefined | any
      ? [RouteName] | [RouteName, ParamList[RouteName]]
      : [RouteName, ParamList[RouteName]]
  ): void;
};

const TYPE_ROUTE = 'route' as const;

export const TabActions = {
  jumpTo(name: string, params?: object): TabActionType {
    return { type: 'JUMP_TO', payload: { name, params } };
  },
};

const getRouteHistory = (
  routes: Route<string>[],
  index: number,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined
) => {
  const history = [{ type: TYPE_ROUTE, key: routes[index].key }];
  let initialRouteIndex;

  switch (backBehavior) {
    case 'order':
      for (let i = index; i > 0; i--) {
        history.unshift({ type: TYPE_ROUTE, key: routes[i - 1].key });
      }
      break;
    case 'initialRoute':
      initialRouteIndex = routes.findIndex(
        (route) => route.name === initialRouteName
      );
      initialRouteIndex = initialRouteIndex === -1 ? 0 : initialRouteIndex;

      if (initialRouteIndex !== index) {
        history.unshift({
          type: TYPE_ROUTE,
          key: routes[initialRouteIndex].key,
        });
      }
      break;
    case 'history':
      // The history will fill up on navigation
      break;
  }

  return history;
};

const changeIndex = (
  state: TabNavigationState,
  index: number,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined
) => {
  let history;

  if (backBehavior === 'history') {
    const currentKey = state.routes[index].key;

    history = state.history
      .filter((it) => (it.type === 'route' ? it.key !== currentKey : false))
      .concat({ type: TYPE_ROUTE, key: currentKey });
  } else {
    history = getRouteHistory(
      state.routes,
      index,
      backBehavior,
      initialRouteName
    );
  }

  return {
    ...state,
    index,
    history,
  };
};

export default function TabRouter({
  backBehavior = 'history',
  ...options
}: TabRouterOptions = {}) {
  const router: Router<
    TabNavigationState,
    TabActionType | CommonNavigationAction
  > = {
    ...BaseRouter,

    type: 'tab',

    getInitialState({ initialRouteName, routeNames, routeParamList }) {
      const index =
        initialRouteName !== undefined && routeNames.includes(initialRouteName)
          ? routeNames.indexOf(initialRouteName)
          : 0;

      const routes = routeNames.map((name) => ({
        name,
        key: `${name}-${nanoid()}`,
        params: routeParamList[name],
      }));

      const history = getRouteHistory(
        routes,
        index,
        backBehavior,
        initialRouteName
      );

      return {
        stale: false,
        type: 'tab',
        key: `tab-${nanoid()}`,
        index,
        routeNames,
        history,
        routes,
      };
    },

    getRehydratedState(
      partialState,
      { initialRouteName, routeNames, routeParamList }
    ) {
      let state = partialState;

      if (state.stale === false) {
        return state;
      }

      const routes = routeNames.map((name) => {
        const route = (state as PartialState<TabNavigationState>).routes.find(
          (r) => r.name === name
        );

        return {
          ...route,
          name,
          key:
            route && route.name === name && route.key
              ? route.key
              : `${name}-${nanoid()}`,
          params:
            routeParamList[name] !== undefined
              ? {
                  ...routeParamList[name],
                  ...(route ? route.params : undefined),
                }
              : route
              ? route.params
              : undefined,
        } as Route<string>;
      });

      const index = Math.min(
        Math.max(
          typeof state.index === 'number'
            ? state.index
            : routeNames.indexOf(state.routes[0].name),
          0
        ),
        routes.length - 1
      );

      let history = state.history?.filter((it) =>
        routes.find((r) => r.key === it.key)
      );

      if (!history?.length) {
        history = getRouteHistory(
          routes,
          index,
          backBehavior,
          initialRouteName
        );
      }

      return {
        stale: false,
        type: 'tab',
        key: `tab-${nanoid()}`,
        index,
        routeNames,
        history,
        routes,
      };
    },

    getStateForRouteNamesChange(
      state,
      { initialRouteName, routeNames, routeParamList }
    ) {
      const routes = routeNames.map(
        (name) =>
          state.routes.find((r) => r.name === name) || {
            name,
            key: `${name}-${nanoid()}`,
            params: routeParamList[name],
          }
      );

      const currentRouteName = state.routes[state.index].name;
      const index = routeNames.includes(currentRouteName)
        ? routeNames.indexOf(currentRouteName)
        : initialRouteName && routeNames.includes(initialRouteName)
        ? routeNames.indexOf(initialRouteName)
        : 0;

      let history = state.history.filter((it) =>
        routes.find((r) => r.key === it.key)
      );

      if (!history.length) {
        history = getRouteHistory(
          routes,
          index,
          backBehavior,
          initialRouteName
        );
      }

      return {
        ...state,
        history,
        routeNames,
        routes,
        index,
      };
    },

    getStateForRouteFocus(state, key) {
      const index = state.routes.findIndex((r) => r.key === key);

      if (index === -1 || index === state.index) {
        return state;
      }

      return changeIndex(state, index, backBehavior, options.initialRouteName);
    },

    getStateForAction(state, action, { initialRouteName }) {
      switch (action.type) {
        case 'JUMP_TO':
        case 'NAVIGATE': {
          let index = -1;

          if (action.type === 'NAVIGATE' && action.payload.key) {
            index = state.routes.findIndex(
              (route) => route.key === action.payload.key
            );
          } else {
            index = state.routes.findIndex(
              (route) => route.name === action.payload.name
            );
          }

          if (index === -1) {
            return null;
          }

          return changeIndex(
            {
              ...state,
              routes:
                action.payload.params !== undefined
                  ? state.routes.map((route, i) =>
                      i === index
                        ? {
                            ...route,
                            params: {
                              ...route.params,
                              ...action.payload.params,
                            },
                          }
                        : route
                    )
                  : state.routes,
            },
            index,
            backBehavior,
            initialRouteName
          );
        }

        case 'GO_BACK': {
          if (state.history.length === 1) {
            return null;
          }

          const previousKey = state.history[state.history.length - 2].key;
          const index = state.routes.findIndex(
            (route) => route.key === previousKey
          );

          if (index === -1) {
            return null;
          }

          return {
            ...state,
            history: state.history.slice(0, -1),
            index,
          };
        }

        default:
          return BaseRouter.getStateForAction(state, action);
      }
    },

    shouldActionChangeFocus(action) {
      return action.type === 'NAVIGATE';
    },

    actionCreators: TabActions,
  };

  return router;
}
