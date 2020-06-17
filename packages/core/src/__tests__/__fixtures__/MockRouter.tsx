import {
  BaseRouter,
  Router,
  CommonNavigationAction,
  NavigationState,
  Route,
} from '@react-navigation/routers';

export type MockActions = CommonNavigationAction | { type: 'NOOP' | 'UPDATE' };

export const MockRouterKey = { current: 0 };

export default function MockRouter() {
  const router: Router<NavigationState, MockActions> = {
    type: 'test',

    getInitialState({ initialRouteName, routeNames, routeParamList }) {
      const index =
        initialRouteName === undefined
          ? 0
          : routeNames.indexOf(initialRouteName);

      return {
        stale: false,
        type: 'test',
        key: String(MockRouterKey.current++),
        index,
        routeNames,
        routes: routeNames.map((name) => ({
          name,
          key: name,
          params: routeParamList[name],
        })),
      };
    },

    getRehydratedState(partialState, { routeNames, routeParamList }) {
      let state = partialState;

      if (state.stale === false) {
        return state as NavigationState;
      }

      const routes = state.routes
        .filter((route) => routeNames.includes(route.name))
        .map(
          (route) =>
            ({
              ...route,
              key: route.key || `${route.name}-${MockRouterKey.current++}`,
              params:
                routeParamList[route.name] !== undefined
                  ? {
                      ...routeParamList[route.name],
                      ...route.params,
                    }
                  : route.params,
            } as Route<string>)
        );

      return {
        stale: false,
        type: 'test',
        key: String(MockRouterKey.current++),
        index:
          typeof state.index === 'number' && state.index < routes.length
            ? state.index
            : 0,
        routeNames,
        routes,
      };
    },

    getStateForRouteNamesChange(state, { routeNames }) {
      const routes = state.routes.filter((route) =>
        routeNames.includes(route.name)
      );

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

      return { ...state, index };
    },

    getStateForAction(state, action) {
      switch (action.type) {
        case 'UPDATE':
          return { ...state };

        case 'NOOP':
          return state;

        case 'NAVIGATE': {
          const index = state.routes.findIndex(
            (route) => route.name === action.payload.name
          );

          if (index === -1) {
            return null;
          }

          return {
            ...state,
            index,
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
          };
        }

        default:
          return BaseRouter.getStateForAction(state, action);
      }
    },

    shouldActionChangeFocus() {
      return false;
    },
  };

  return router;
}
