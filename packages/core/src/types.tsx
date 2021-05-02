import type * as React from 'react';
import type {
  DefaultRouterOptions,
  NavigationState,
  NavigationAction,
  InitialState,
  PartialState,
  Route,
  ParamListBase,
} from '@react-navigation/routers';

type Keyof<T extends {}> = Extract<keyof T, string>;

export type DefaultNavigatorOptions<
  ScreenOptions extends {},
  ParamList extends ParamListBase = ParamListBase
> = DefaultRouterOptions<Keyof<ParamList>> & {
  /**
   * Children React Elements to extract the route configuration from.
   * Only `Screen` components are supported as children.
   */
  children: React.ReactNode;
  /**
   * Default options for all screens under this navigator.
   */
  screenOptions?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamList>;
        navigation: any;
      }) => ScreenOptions);
  /**
   * Default options specified by the navigator.
   * It receives the custom options in the arguments if a function is specified.
   */
  defaultScreenOptions?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamList>;
        navigation: any;
        options: ScreenOptions;
      }) => ScreenOptions);
};

export type EventMapBase = Record<
  string,
  { data?: any; canPreventDefault?: boolean }
>;

export type EventMapCore<State extends NavigationState> = {
  focus: { data: undefined };
  blur: { data: undefined };
  state: { data: { state: State } };
  beforeRemove: { data: { action: NavigationAction }; canPreventDefault: true };
};

export type EventArg<
  EventName extends string,
  CanPreventDefault extends boolean | undefined = false,
  Data = undefined
> = {
  /**
   * Type of the event (e.g. `focus`, `blur`)
   */
  readonly type: EventName;
  readonly target?: string;
} & (CanPreventDefault extends true
  ? {
      /**
       * Whether `event.preventDefault()` was called on this event object.
       */
      readonly defaultPrevented: boolean;
      /**
       * Prevent the default action which happens on this event.
       */
      preventDefault(): void;
    }
  : {}) &
  (undefined extends Data
    ? { readonly data?: Readonly<Data> }
    : { readonly data: Readonly<Data> });

export type EventListenerCallback<
  EventMap extends EventMapBase,
  EventName extends keyof EventMap
> = (
  e: EventArg<
    Extract<EventName, string>,
    EventMap[EventName]['canPreventDefault'],
    EventMap[EventName]['data']
  >
) => void;

export type EventConsumer<EventMap extends EventMapBase> = {
  /**
   * Subscribe to events from the parent navigator.
   *
   * @param type Type of the event (e.g. `focus`, `blur`)
   * @param callback Callback listener which is executed upon receiving the event.
   */
  addListener<EventName extends Keyof<EventMap>>(
    type: EventName,
    callback: EventListenerCallback<EventMap, EventName>
  ): () => void;
  removeListener<EventName extends Keyof<EventMap>>(
    type: EventName,
    callback: EventListenerCallback<EventMap, EventName>
  ): void;
};

export type EventEmitter<EventMap extends EventMapBase> = {
  /**
   * Emit an event to child screens.
   *
   * @param options.type Type of the event (e.g. `focus`, `blur`)
   * @param [options.data] Optional information regarding the event.
   * @param [options.target] Key of the target route which should receive the event.
   * If not specified, all routes receive the event.
   */
  emit<EventName extends Keyof<EventMap>>(
    options: {
      type: EventName;
      target?: string;
    } & (EventMap[EventName]['canPreventDefault'] extends true
      ? { canPreventDefault: true }
      : {}) &
      (undefined extends EventMap[EventName]['data']
        ? { data?: EventMap[EventName]['data'] }
        : { data: EventMap[EventName]['data'] })
  ): EventArg<
    EventName,
    EventMap[EventName]['canPreventDefault'],
    EventMap[EventName]['data']
  >;
};

export class PrivateValueStore<A, B, C> {
  /**
   * UGLY HACK! DO NOT USE THE TYPE!!!
   *
   * TypeScript requires a type to be used to be able to infer it.
   * The type should exist as its own without any operations such as union.
   * So we need to figure out a way to store this type in a property.
   * The problem with a normal property is that it shows up in intelliSense.
   * Adding private keyword works, but the annotation is stripped away in declaration.
   * Turns out if we use an empty string, it doesn't show up in intelliSense.
   */
  protected ''?: { a: A; b: B; c: C };
}

type NavigationHelpersCommon<
  ParamList extends ParamListBase,
  State extends NavigationState = NavigationState
> = {
  /**
   * Dispatch an action or an update function to the router.
   * The update function will receive the current state,
   *
   * @param action Action object or update function.
   */
  dispatch(
    action: NavigationAction | ((state: State) => NavigationAction)
  ): void;

  /**
   * Navigate to a route in current navigation tree.
   *
   * @param name Name of the route to navigate to.
   * @param [params] Params object for the route.
   */
  navigate<RouteName extends keyof ParamList>(
    ...args: undefined extends ParamList[RouteName]
      ? [screen: RouteName] | [screen: RouteName, params: ParamList[RouteName]]
      : [screen: RouteName, params: ParamList[RouteName]]
  ): void;

  /**
   * Navigate to a route in current navigation tree.
   *
   * @param route Object with `key` or `name` for the route to navigate to, and a `params` object.
   */
  navigate<RouteName extends keyof ParamList>(
    options:
      | { key: string; params?: ParamList[RouteName] }
      | { name: RouteName; key?: string; params: ParamList[RouteName] }
  ): void;

  /**
   * Reset the navigation state to the provided state.
   *
   * @param state Navigation state object.
   */
  reset(state: PartialState<State> | State): void;

  /**
   * Go back to the previous route in history.
   */
  goBack(): void;

  /**
   * Check if the screen is focused. The method returns `true` if focused, `false` otherwise.
   * Note that this method doesn't re-render screen when the focus changes. So don't use it in `render`.
   * To get notified of focus changes, use `addListener('focus', cb)` and `addListener('blur', cb)`.
   * To conditionally render content based on focus state, use the `useIsFocused` hook.
   */
  isFocused(): boolean;

  /**
   * Check if dispatching back action will be handled by navigation.
   * Note that this method doesn't re-render screen when the result changes. So don't use it in `render`.
   */
  canGoBack(): boolean;

  /**
   * Returns the navigation prop from the parent navigator,
   */
  getParent<T = NavigationProp<ParamListBase> | undefined>(): T;

  /**
   * Returns the navigator's state.
   * Note that this method doesn't re-render screen when the result changes. So don't use it in `render`.
   */
  getState(): State;
} & PrivateValueStore<ParamList, keyof ParamList, {}>;

export type NavigationHelpers<
  ParamList extends ParamListBase,
  EventMap extends EventMapBase = {}
> = NavigationHelpersCommon<ParamList> &
  EventEmitter<EventMap> & {
    /**
     * Update the param object for the route.
     * The new params will be shallow merged with the old one.
     *
     * @param params Params object for the current route.
     */
    setParams<RouteName extends keyof ParamList>(
      params: Partial<ParamList[RouteName]>
    ): void;
  };

export type NavigationContainerProps = {
  /**
   * Initial navigation state for the child navigators.
   */
  initialState?: InitialState;
  /**
   * Callback which is called with the latest navigation state when it changes.
   */
  onStateChange?: (state: NavigationState | undefined) => void;
  /**
   * Callback which is called when an action is not handled.
   */
  onUnhandledAction?: (action: NavigationAction) => void;
  /**
   * Whether this navigation container should be independent of parent containers.
   * If this is not set to `true`, this container cannot be nested inside another container.
   * Setting it to `true` disconnects any children navigators from parent container.
   */
  independent?: boolean;
  /**
   * Children elements to render.
   */
  children: React.ReactNode;
};

export type NavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = Keyof<ParamList>,
  State extends NavigationState = NavigationState<ParamList>,
  ScreenOptions extends {} = {},
  EventMap extends EventMapBase = {}
> = NavigationHelpersCommon<ParamList, State> & {
  /**
   * Update the param object for the route.
   * The new params will be shallow merged with the old one.
   *
   * @param params Params object for the current route.
   */
  setParams(params: Partial<ParamList[RouteName]>): void;

  /**
   * Update the options for the route.
   * The options object will be shallow merged with default options object.
   *
   * @param options Options object for the route.
   */
  setOptions(options: Partial<ScreenOptions>): void;
} & EventConsumer<EventMap & EventMapCore<State>> &
  PrivateValueStore<ParamList, RouteName, EventMap>;

export type RouteProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = Keyof<ParamList>
> = Route<Extract<RouteName, string>, ParamList[RouteName]>;

export type CompositeNavigationProp<
  A extends NavigationProp<ParamListBase, string, any, any>,
  B extends NavigationHelpersCommon<ParamListBase, any>
> = Omit<A & B, keyof NavigationProp<any>> &
  NavigationProp<
    /**
     * Param list from both navigation objects needs to be combined
     * For example, we should be able to navigate to screens in both A and B
     */
    (A extends NavigationHelpersCommon<infer T> ? T : never) &
      (B extends NavigationHelpersCommon<infer U> ? U : never),
    /**
     * The route name should refer to the route name specified in the first type
     * Ideally it should work for any of them, but it's not possible to infer that way
     */
    A extends NavigationProp<any, infer R> ? R : string,
    /**
     * The type of state should refer to the state specified in the first type
     */
    A extends NavigationProp<any, any, infer S> ? S : NavigationState,
    /**
     * Screen options from both navigation objects needs to be combined
     * This allows typechecking `setOptions`
     */
    (A extends NavigationProp<any, any, any, infer O> ? O : {}) &
      (B extends NavigationProp<any, any, any, infer P> ? P : {}),
    /**
     * Event consumer config should refer to the config specified in the first type
     * This allows typechecking `addListener`/`removeListener`
     */
    A extends NavigationProp<any, any, any, any, infer E> ? E : {}
  >;

export type CompositeScreenProps<
  A extends {
    navigation: NavigationProp<ParamListBase, string, any, any>;
    route: RouteProp<ParamListBase>;
  },
  B extends {
    navigation: NavigationHelpersCommon<ParamListBase, any>;
  }
> = {
  navigation: CompositeNavigationProp<A['navigation'], B['navigation']>;
  route: A['route'];
};

export type Descriptor<
  ScreenOptions extends {},
  Navigation extends NavigationProp<any, any, any, any, any>,
  Route extends RouteProp<any, any>
> = {
  /**
   * Render the component associated with this route.
   */
  render(): JSX.Element;

  /**
   * Options for the route.
   */
  options: ScreenOptions;

  /**
   * Route object for the screen
   */
  route: Route;

  /**
   * Navigation object for the screen
   */
  navigation: Navigation;
};

export type ScreenListeners<
  State extends NavigationState,
  EventMap extends EventMapBase
> = Partial<
  {
    [EventName in keyof (EventMap &
      EventMapCore<State>)]: EventListenerCallback<EventMap, EventName>;
  }
>;

export type RouteConfig<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase
> = {
  /**
   * Route name of this screen.
   */
  name: RouteName;

  /**
   * Navigator options for this screen.
   */
  options?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamList, RouteName>;
        navigation: NavigationProp<
          ParamList,
          RouteName,
          State,
          ScreenOptions,
          EventMap
        >;
      }) => ScreenOptions);

  /**
   * Event listeners for this screen.
   */
  listeners?:
    | ScreenListeners<State, EventMap>
    | ((props: {
        route: RouteProp<ParamList, RouteName>;
        navigation: NavigationProp<
          ParamList,
          RouteName,
          State,
          ScreenOptions,
          EventMap
        >;
      }) => ScreenListeners<State, EventMap>);

  /**
   * Function to return an unique ID for this screen.
   * Receives an object with the route params.
   * For a given screen name, there will always be only one screen corresponding to an ID.
   * If `undefined` is returned, it acts same as no `getId` being specified.
   */
  getId?: ({ params }: { params: ParamList[RouteName] }) => string | undefined;

  /**
   * Initial params object for the route.
   */
  initialParams?: Partial<ParamList[RouteName]>;
} & (
  | {
      /**
       * React component to render for this screen.
       */
      component: React.ComponentType<{
        route: RouteProp<ParamList, RouteName>;
        navigation: NavigationProp<
          ParamList,
          RouteName,
          State,
          ScreenOptions,
          EventMap
        >;
      }>;
      getComponent?: never;
      children?: never;
    }
  | {
      /**
       * Lazily get a React component to render for this screen.
       */
      getComponent: () => React.ComponentType<{
        route: RouteProp<ParamList, RouteName>;
        navigation: NavigationProp<
          ParamList,
          RouteName,
          State,
          ScreenOptions,
          EventMap
        >;
      }>;
      component?: never;
      children?: never;
    }
  | {
      /**
       * Render callback to render content of this screen.
       */
      children: (props: {
        route: RouteProp<ParamList, RouteName>;
        navigation: NavigationProp<
          ParamList,
          RouteName,
          State,
          ScreenOptions,
          EventMap
        >;
      }) => React.ReactNode;
      component?: never;
      getComponent?: never;
    }
);

export type NavigationContainerEventMap = {
  /**
   * Event which fires when the navigation state changes.
   */
  state: {
    data: {
      /**
       * The updated state object after the state change.
       */
      state: NavigationState | PartialState<NavigationState> | undefined;
    };
  };
  /**
   * Event which fires when current options changes.
   */
  options: { data: { options: object } };
  /**
   * Event which fires when an action is dispatched.
   * Only intended for debugging purposes, don't use it for app logic.
   * This event will be emitted before state changes have been applied.
   */
  __unsafe_action__: {
    data: {
      /**
       * The action object which was dispatched.
       */
      action: NavigationAction;
      /**
       * Whether the action was a no-op, i.e. resulted any state changes.
       */
      noop: boolean;
    };
  };
};

export type NavigationContainerRef<
  ParamList extends ParamListBase
> = NavigationHelpers<ParamList> &
  EventConsumer<NavigationContainerEventMap> & {
    /**
     * Reset the navigation state of the root navigator to the provided state.
     *
     * @param state Navigation state object.
     */
    resetRoot(state?: PartialState<NavigationState> | NavigationState): void;
    /**
     * Get the rehydrated navigation state of the navigation tree.
     */
    getRootState(): NavigationState;
    /**
     * Get the currently focused navigation route.
     */
    getCurrentRoute(): Route<string> | undefined;
    /**
     * Get the currently focused route's options.
     */
    getCurrentOptions(): object | undefined;
    /**
     * Whether the navigation container is ready to handle actions.
     */
    isReady(): boolean;
  };

export type NavigationContainerRefWithCurrent<
  ParamList extends ParamListBase
> = NavigationContainerRef<ParamList> & {
  current: NavigationContainerRef<ParamList> | null;
};

export type TypedNavigator<
  ParamList extends ParamListBase,
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase,
  Navigator extends React.ComponentType<any>
> = {
  /**
   * Navigator component which manages the child screens.
   */
  Navigator: React.ComponentType<
    Omit<
      React.ComponentProps<Navigator>,
      keyof DefaultNavigatorOptions<any, any>
    > &
      DefaultNavigatorOptions<ScreenOptions, ParamList>
  >;
  /**
   * Component used for specifying route configuration.
   */
  Screen: <RouteName extends keyof ParamList>(
    _: RouteConfig<ParamList, RouteName, State, ScreenOptions, EventMap>
  ) => null;
};

export type NavigatorScreenParams<
  ParamList,
  State extends NavigationState = NavigationState
> =
  | {
      screen?: never;
      params?: never;
      initial?: never;
      path?: string;
      state: PartialState<State> | State | undefined;
    }
  | {
      [RouteName in keyof ParamList]: undefined extends ParamList[RouteName]
        ? {
            screen: RouteName;
            params?: ParamList[RouteName];
            initial?: boolean;
            path?: string;
            state?: never;
          }
        : {
            screen: RouteName;
            params: ParamList[RouteName];
            initial?: boolean;
            path?: string;
            state?: never;
          };
    }[keyof ParamList];

export type PathConfig = {
  path?: string;
  exact?: boolean;
  parse?: Record<string, (value: string) => any>;
  stringify?: Record<string, (value: any) => string>;
  screens?: PathConfigMap;
  initialRouteName?: string;
};

export type PathConfigMap = {
  [routeName: string]: string | PathConfig;
};
