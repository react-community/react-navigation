import * as React from 'react';
import { isValidElementType } from 'react-is';
import {
  CommonActions,
  DefaultRouterOptions,
  NavigationState,
  ParamListBase,
  Router,
  RouterFactory,
  PartialState,
  NavigationAction,
  Route,
} from '@react-navigation/routers';
import NavigationStateContext from './NavigationStateContext';
import NavigationRouteContext from './NavigationRouteContext';
import Screen from './Screen';
import useEventEmitter from './useEventEmitter';
import useRegisterNavigator from './useRegisterNavigator';
import useDescriptors from './useDescriptors';
import useNavigationHelpers from './useNavigationHelpers';
import useOnAction from './useOnAction';
import useFocusEvents from './useFocusEvents';
import useOnRouteFocus from './useOnRouteFocus';
import useChildActionListeners from './useChildActionListeners';
import useFocusedListeners from './useFocusedListeners';
import useFocusedListenersChildrenAdapter from './useFocusedListenersChildrenAdapter';
import {
  DefaultNavigatorOptions,
  RouteConfig,
  PrivateValueStore,
  EventMapBase,
} from './types';
import useStateGetters from './useStateGetters';
import useOnGetState from './useOnGetState';
import useScheduleUpdate from './useScheduleUpdate';
import useCurrentRender from './useCurrentRender';
import isArrayEqual from './isArrayEqual';

// This is to make TypeScript compiler happy
// eslint-disable-next-line babel/no-unused-expressions
PrivateValueStore;

type NavigatorRoute = {
  key: string;
  params?: {
    screen?: string;
    params?: object;
    initial?: boolean;
  };
};

/**
 * Extract route config object from React children elements.
 *
 * @param children React Elements to extract the config from.
 */
const getRouteConfigsFromChildren = <
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase
>(
  children: React.ReactNode
) => {
  const configs = React.Children.toArray(children).reduce<
    RouteConfig<ParamListBase, string, State, ScreenOptions, EventMap>[]
  >((acc, child) => {
    if (React.isValidElement(child)) {
      if (child.type === Screen) {
        // We can only extract the config from `Screen` elements
        // If something else was rendered, it's probably a bug
        acc.push(
          child.props as RouteConfig<
            ParamListBase,
            string,
            State,
            ScreenOptions,
            EventMap
          >
        );
        return acc;
      }

      if (child.type === React.Fragment) {
        // When we encounter a fragment, we need to dive into its children to extract the configs
        // This is handy to conditionally define a group of screens
        acc.push(
          ...getRouteConfigsFromChildren<State, ScreenOptions, EventMap>(
            child.props.children
          )
        );
        return acc;
      }
    }

    throw new Error(
      `A navigator can only contain 'Screen' components as its direct children (found '${
        // @ts-ignore
        child.type && child.type.name ? child.type.name : String(child)
      }')`
    );
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    configs.forEach((config) => {
      const { name, children, component } = config as any;

      if (typeof name !== 'string' || !name) {
        throw new Error(
          `Got an invalid name (${JSON.stringify(
            name
          )}) for the screen. It must be a non-empty string.`
        );
      }

      if (children != null || component !== undefined) {
        if (children != null && component !== undefined) {
          throw new Error(
            `Got both 'component' and 'children' props for the screen '${name}'. You must pass only one of them.`
          );
        }

        if (children != null && typeof children !== 'function') {
          throw new Error(
            `Got an invalid value for 'children' prop for the screen '${name}'. It must be a function returning a React Element.`
          );
        }

        if (component !== undefined && !isValidElementType(component)) {
          throw new Error(
            `Got an invalid value for 'component' prop for the screen '${name}'. It must be a valid React Component.`
          );
        }

        if (typeof component === 'function' && component.name === 'component') {
          // Inline anonymous functions passed in the `component` prop will have the name of the prop
          // It's relatively safe to assume that it's not a component since it should also have PascalCase name
          // We won't catch all scenarios here, but this should catch a good chunk of incorrect use.
          console.warn(
            `Looks like you're passing an inline function for 'component' prop for the screen '${name}' (e.g. component={() => <SomeComponent />}). Passing an inline function will cause the component state to be lost on re-render and cause perf issues since it's re-created every render. You can pass the function as children to 'Screen' instead to achieve the desired behaviour.`
          );
        }
      } else {
        throw new Error(
          `Couldn't find a 'component' or 'children' prop for the screen '${name}'. This can happen if you passed 'undefined'. You likely forgot to export your component from the file it's defined in, or mixed up default import and named import when importing.`
        );
      }
    });
  }

  return configs;
};

/**
 * Hook for building navigators.
 *
 * @param createRouter Factory method which returns router object.
 * @param options Options object containing `children` and additional options for the router.
 * @returns An object containing `state`, `navigation`, `descriptors` objects.
 */
export default function useNavigationBuilder<
  State extends NavigationState,
  RouterOptions extends DefaultRouterOptions,
  ScreenOptions extends {},
  EventMap extends Record<string, any>
>(
  createRouter: RouterFactory<State, any, RouterOptions>,
  options: DefaultNavigatorOptions<ScreenOptions> & RouterOptions
) {
  const navigatorKey = useRegisterNavigator();

  const route = React.useContext(NavigationRouteContext) as
    | NavigatorRoute
    | undefined;

  const previousNestedParamsRef = React.useRef(route?.params);

  React.useEffect(() => {
    previousNestedParamsRef.current = route?.params;
  }, [route]);

  const { children, ...rest } = options;
  const routerOptions = {
    ...((rest as unknown) as RouterOptions),
    ...(route?.params &&
    route.params.initial !== false &&
    typeof route.params.screen === 'string'
      ? { initialRouteName: route.params.screen }
      : null),
  };
  const { current: router } = React.useRef<Router<State, any>>(
    createRouter(routerOptions)
  );

  const { initialRouteName } = routerOptions;

  const routeConfigs = getRouteConfigsFromChildren<
    State,
    ScreenOptions,
    EventMap
  >(children);

  const screens = routeConfigs.reduce<
    Record<
      string,
      RouteConfig<ParamListBase, string, State, ScreenOptions, EventMap>
    >
  >((acc, config) => {
    if (config.name in acc) {
      throw new Error(
        `A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named '${config.name}')`
      );
    }

    acc[config.name] = config;
    return acc;
  }, {});

  const routeNames = routeConfigs.map((config) => config.name);
  const routeParamList = routeNames.reduce<Record<string, object | undefined>>(
    (acc, curr) => {
      const { initialParams } = screens[curr];
      const initialParamsFromParams =
        route?.params?.initial !== false && route?.params?.screen === curr
          ? route.params.params
          : undefined;

      acc[curr] =
        initialParams !== undefined || initialParamsFromParams !== undefined
          ? {
              ...initialParams,
              ...initialParamsFromParams,
            }
          : undefined;

      return acc;
    },
    {}
  );

  if (!routeNames.length) {
    throw new Error(
      "Couldn't find any screens for the navigator. Have you defined any screens as its children?"
    );
  }

  const isStateValid = React.useCallback(
    (state) => state.type === undefined || state.type === router.type,
    [router.type]
  );

  const isStateInitialized = React.useCallback(
    (state) =>
      state !== undefined && state.stale === false && isStateValid(state),
    [isStateValid]
  );

  const {
    state: currentState,
    getState: getCurrentState,
    setState,
    setKey,
    getKey,
  } = React.useContext(NavigationStateContext);

  const [initializedState, isFirstStateInitialization] = React.useMemo(() => {
    // If the current state isn't initialized on first render, we initialize it
    // We also need to re-initialize it if the state passed from parent was changed (maybe due to reset)
    // Otherwise assume that the state was provided as initial state
    // So we need to rehydrate it to make it usable
    if (currentState === undefined || !isStateValid(currentState)) {
      return [
        router.getInitialState({
          initialRouteName,
          routeNames,
          routeParamList,
        }),
        true,
      ];
    } else {
      return [
        router.getRehydratedState(currentState as PartialState<State>, {
          initialRouteName,
          routeNames,
          routeParamList,
        }),
        false,
      ];
    }
    // We explicitly don't include routeNames/routeParamList in the dep list
    // below. We want to avoid forcing a new state to be calculated in cases
    // where routeConfigs change without affecting routeNames/routeParamList.
    // Instead, we handle changes to these in the nextState code below. Note
    // that some changes to routeConfigs are explicitly ignored, such as changes
    // to initialParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, router, isStateValid]);

  let state =
    // If the state isn't initialized, or stale, use the state we initialized instead
    // The state won't update until there's a change needed in the state we have initalized locally
    // So it'll be `undefined` or stale until the first navigation event happens
    isStateInitialized(currentState)
      ? (currentState as State)
      : (initializedState as State);

  let nextState: State = state;

  if (!isArrayEqual(state.routeNames, routeNames)) {
    // When the list of route names change, the router should handle it to remove invalid routes
    nextState = router.getStateForRouteNamesChange(state, {
      initialRouteName,
      routeNames,
      routeParamList,
    });
  }

  if (
    typeof route?.params?.screen === 'string' &&
    (route.params !== previousNestedParamsRef.current ||
      (route.params.initial === false && isFirstStateInitialization))
  ) {
    // If the route was updated with new name and/or params, we should navigate there
    // The update should be limited to current navigator only, so we call the router manually
    const updatedState = router.getStateForAction(
      nextState,
      CommonActions.navigate(route.params.screen, route.params.params),
      {
        routeNames,
        routeParamList,
      }
    );

    nextState =
      updatedState !== null
        ? router.getRehydratedState(updatedState, {
            initialRouteName,
            routeNames,
            routeParamList,
          })
        : nextState;
  }

  const shouldUpdate = state !== nextState;

  useScheduleUpdate(() => {
    if (shouldUpdate) {
      // If the state needs to be updated, we'll schedule an update
      setState(nextState);
    }
  });

  // The up-to-date state will come in next render, but we don't need to wait for it
  // We can't use the outdated state since the screens have changed, which will cause error due to mismatched config
  // So we override the state object we return to use the latest state as soon as possible
  state = nextState;

  React.useEffect(() => {
    setKey(navigatorKey);

    return () => {
      // We need to clean up state for this navigator on unmount
      // We do it in a timeout because we need to detect if another navigator mounted in the meantime
      // For example, if another navigator has started rendering, we should skip cleanup
      // Otherwise, our cleanup step will cleanup state for the other navigator and re-initialize it
      setTimeout(() => {
        if (getCurrentState() !== undefined && getKey() === navigatorKey) {
          setState(undefined);
        }
      }, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // We initialize this ref here to avoid a new getState getting initialized
  // whenever initializedState changes. We want getState to have access to the
  // latest initializedState, but don't need it to change when that happens
  const initializedStateRef = React.useRef<State>();
  initializedStateRef.current = initializedState;

  const getState = React.useCallback((): State => {
    const currentState = getCurrentState();

    return isStateInitialized(currentState)
      ? (currentState as State)
      : (initializedStateRef.current as State);
  }, [getCurrentState, isStateInitialized]);

  const emitter = useEventEmitter((e) => {
    let routeNames = [];

    let route: Route<string> | undefined;

    if (e.target) {
      route = state.routes.find((route) => route.key === e.target);

      if (route?.name) {
        routeNames.push(route.name);
      }
    } else {
      route = state.routes[state.index];
      routeNames.push(
        ...Object.keys(screens).filter((name) => route?.name === name)
      );
    }

    if (route == null) {
      return;
    }

    const navigation = descriptors[route.key].navigation;

    const listeners = ([] as (((e: any) => void) | undefined)[])
      .concat(
        ...routeNames.map((name) => {
          const { listeners } = screens[name];
          const map =
            typeof listeners === 'function'
              ? listeners({ route: route as any, navigation })
              : listeners;

          return map
            ? Object.keys(map)
                .filter((type) => type === e.type)
                .map((type) => map?.[type])
            : undefined;
        })
      )
      .filter((cb, i, self) => cb && self.lastIndexOf(cb) === i);

    listeners.forEach((listener) => listener?.(e));
  });

  useFocusEvents({ state, emitter });

  React.useEffect(() => {
    emitter.emit({ type: 'state', data: { state } });
  }, [emitter, state]);

  const {
    listeners: actionListeners,
    addListener: addActionListener,
  } = useChildActionListeners();

  const {
    listeners: focusedListeners,
    addListener: addFocusedListener,
  } = useFocusedListeners();

  const { getStateForRoute, addStateGetter } = useStateGetters();

  const onAction = useOnAction({
    router,
    getState,
    setState,
    key: route?.key,
    listeners: actionListeners,
    routerConfigOptions: {
      initialRouteName,
      routeNames,
      routeParamList,
    },
  });

  const onRouteFocus = useOnRouteFocus({
    router,
    key: route?.key,
    getState,
    setState,
  });

  const navigation = useNavigationHelpers<State, NavigationAction, EventMap>({
    onAction,
    getState,
    emitter,
    router,
  });

  useFocusedListenersChildrenAdapter({
    navigation,
    focusedListeners,
  });

  useOnGetState({
    getState,
    getStateForRoute,
  });

  const descriptors = useDescriptors<State, ScreenOptions, EventMap>({
    state,
    screens,
    navigation,
    screenOptions: options.screenOptions,
    onAction,
    getState,
    setState,
    onRouteFocus,
    addActionListener,
    addFocusedListener,
    addStateGetter,
    router,
    emitter,
  });

  useCurrentRender({
    state,
    navigation,
    descriptors,
  });

  return {
    state,
    navigation,
    descriptors,
  };
}
