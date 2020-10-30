import * as React from 'react';
import {
  Animated,
  StyleSheet,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { NavigationState as StackNavigationState } from 'react-navigation';

import {
  MaybeScreenContainer,
  MaybeScreen,
  shouldUseActivityState,
} from '../Screens';
import { getDefaultHeaderHeight } from '../Header/HeaderSegment';
import type { Props as HeaderContainerProps } from '../Header/HeaderContainer';
import CardContainer from './CardContainer';
import {
  DefaultTransition,
  ModalTransition,
} from '../../TransitionConfigs/TransitionPresets';
import { forNoAnimation as forNoAnimationHeader } from '../../TransitionConfigs/HeaderStyleInterpolators';
import { forNoAnimation as forNoAnimationCard } from '../../TransitionConfigs/CardStyleInterpolators';
import getDistanceForDirection from '../../utils/getDistanceForDirection';
import type {
  Layout,
  StackHeaderMode,
  StackCardMode,
  Route,
  Scene,
  StackDescriptorMap,
  StackNavigationOptions,
  StackDescriptor,
} from '../../types';

type GestureValues = {
  [key: string]: Animated.Value;
};

type Props = {
  mode: StackCardMode;
  insets: EdgeInsets;
  state: StackNavigationState;
  descriptors: StackDescriptorMap;
  routes: Route<string>[];
  openingRouteKeys: string[];
  closingRouteKeys: string[];
  onOpenRoute: (props: { route: Route<string> }) => void;
  onCloseRoute: (props: { route: Route<string> }) => void;
  getPreviousRoute: (props: {
    route: Route<string>;
  }) => Route<string> | undefined;
  getGesturesEnabled: (props: { route: Route<string> }) => boolean;
  renderHeader: (props: HeaderContainerProps) => React.ReactNode;
  renderScene: (props: { route: Route<string> }) => React.ReactNode;
  headerMode: StackHeaderMode;
  isParentHeaderShown: boolean;
  onTransitionStart: (
    props: { route: Route<string> },
    closing: boolean
  ) => void;
  onTransitionEnd: (props: { route: Route<string> }, closing: boolean) => void;
  onPageChangeStart?: () => void;
  onPageChangeConfirm?: (closing: Boolean) => void;
  onPageChangeCancel?: () => void;
  onGestureStart?: (props: { route: Route<string> }) => void;
  onGestureEnd?: (props: { route: Route<string> }) => void;
  onGestureCancel?: (props: { route: Route<string> }) => void;
  detachInactiveScreens?: boolean;
};

type State = {
  routes: Route<string>[];
  descriptors: StackDescriptorMap;
  scenes: Scene<Route<string>>[];
  gestures: GestureValues;
  layout: Layout;
  headerHeights: Record<string, number>;
};

const EPSILON = 0.01;

const STATE_INACTIVE = 0;
const STATE_TRANSITIONING_OR_BELOW_TOP = 1;
const STATE_ON_TOP = 2;

const FALLBACK_DESCRIPTOR = Object.freeze({ options: {} });

const getHeaderHeights = (
  routes: Route<string>[],
  insets: EdgeInsets,
  isParentHeaderShown: boolean,
  descriptors: StackDescriptorMap,
  layout: Layout,
  previous: Record<string, number>
) => {
  return routes.reduce<Record<string, number>>((acc, curr) => {
    const { options = {} } = descriptors[curr.key] || {};
    const style: any = StyleSheet.flatten(options.headerStyle || {});

    const height =
      typeof style.height === 'number' ? style.height : previous[curr.key];

    const safeAreaInsets = {
      ...insets,
      ...options.safeAreaInsets,
    };

    const {
      headerStatusBarHeight = isParentHeaderShown ? 0 : safeAreaInsets.top,
    } = options;

    acc[curr.key] =
      typeof height === 'number'
        ? height
        : getDefaultHeaderHeight(layout, headerStatusBarHeight);

    return acc;
  }, {});
};

const getDistanceFromOptions = (
  mode: StackCardMode,
  layout: Layout,
  descriptor?: StackDescriptor
) => {
  const {
    gestureDirection = mode === 'modal'
      ? ModalTransition.gestureDirection
      : DefaultTransition.gestureDirection,
  } = descriptor?.options || {};

  return getDistanceForDirection(layout, gestureDirection);
};

const getProgressFromGesture = (
  mode: StackCardMode,
  gesture: Animated.Value,
  layout: Layout,
  descriptor?: StackDescriptor
) => {
  const distance = getDistanceFromOptions(
    mode,
    {
      // Make sure that we have a non-zero distance, otherwise there will be incorrect progress
      // This causes blank screen on web if it was previously inside container with display: none
      width: Math.max(1, layout.width),
      height: Math.max(1, layout.height),
    },
    descriptor
  );

  if (distance > 0) {
    return gesture.interpolate({
      inputRange: [0, distance],
      outputRange: [1, 0],
    });
  }

  return gesture.interpolate({
    inputRange: [distance, 0],
    outputRange: [0, 1],
  });
};

export default class CardStack extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    if (
      props.routes === state.routes &&
      props.descriptors === state.descriptors
    ) {
      return null;
    }

    const gestures = props.routes.reduce<GestureValues>((acc, curr) => {
      const descriptor = props.descriptors[curr.key];
      const { animationEnabled } = descriptor?.options || {};

      acc[curr.key] =
        state.gestures[curr.key] ||
        new Animated.Value(
          props.openingRouteKeys.includes(curr.key) &&
          animationEnabled !== false
            ? getDistanceFromOptions(props.mode, state.layout, descriptor)
            : 0
        );

      return acc;
    }, {});

    return {
      routes: props.routes,
      scenes: props.routes.map((route, index, self) => {
        const previousRoute = self[index - 1];
        const nextRoute = self[index + 1];

        const oldScene = state.scenes[index];

        const currentGesture = gestures[route.key];
        const previousGesture = previousRoute
          ? gestures[previousRoute.key]
          : undefined;
        const nextGesture = nextRoute ? gestures[nextRoute.key] : undefined;

        const descriptor =
          props.descriptors[route.key] ||
          state.descriptors[route.key] ||
          (oldScene ? oldScene.descriptor : FALLBACK_DESCRIPTOR);

        const nextDescriptor =
          props.descriptors[nextRoute?.key] ||
          state.descriptors[nextRoute?.key];

        const previousDescriptor =
          props.descriptors[previousRoute?.key] ||
          state.descriptors[previousRoute?.key];

        const scene = {
          route,
          descriptor,
          progress: {
            current: getProgressFromGesture(
              props.mode,
              currentGesture,
              state.layout,
              descriptor
            ),
            next: nextGesture
              ? getProgressFromGesture(
                  props.mode,
                  nextGesture,
                  state.layout,
                  nextDescriptor
                )
              : undefined,
            previous: previousGesture
              ? getProgressFromGesture(
                  props.mode,
                  previousGesture,
                  state.layout,
                  previousDescriptor
                )
              : undefined,
          },
          __memo: [
            route,
            state.layout,
            descriptor,
            nextDescriptor,
            previousDescriptor,
            currentGesture,
            nextGesture,
            previousGesture,
          ],
        };

        if (
          oldScene &&
          scene.__memo.every((it, i) => {
            // @ts-expect-error: we haven't added __memo to the annotation to prevent usage elsewhere
            return oldScene.__memo[i] === it;
          })
        ) {
          return oldScene;
        }

        return scene;
      }),
      gestures,
      descriptors: props.descriptors,
      headerHeights: getHeaderHeights(
        props.routes,
        props.insets,
        props.isParentHeaderShown,
        state.descriptors,
        state.layout,
        state.headerHeights
      ),
    };
  }

  constructor(props: Props) {
    super(props);

    const { height = 0, width = 0 } = Dimensions.get('window');

    this.state = {
      routes: [],
      scenes: [],
      gestures: {},
      layout: { height, width },
      descriptors: this.props.descriptors,
      // Used when card's header is null and mode is float to make transition
      // between screens with headers and those without headers smooth.
      // This is not a great heuristic here. We don't know synchronously
      // on mount what the header height is so we have just used the most
      // common cases here.
      headerHeights: {},
    };
  }

  private handleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    const layout = { width, height };

    this.setState((state, props) => {
      if (height === state.layout.height && width === state.layout.width) {
        return null;
      }

      return {
        layout,
        headerHeights: getHeaderHeights(
          props.routes,
          props.insets,
          props.isParentHeaderShown,
          state.descriptors,
          layout,
          state.headerHeights
        ),
      };
    });
  };

  private handleHeaderLayout = ({
    route,
    height,
  }: {
    route: Route<string>;
    height: number;
  }) => {
    this.setState(({ headerHeights }) => {
      const previousHeight = headerHeights[route.key];

      if (previousHeight === height) {
        return null;
      }

      return {
        headerHeights: {
          ...headerHeights,
          [route.key]: height,
        },
      };
    });
  };

  private getFocusedRoute = () => {
    const { state } = this.props;

    return state.routes[state.index];
  };

  private getPreviousScene = ({ route }: { route: Route<string> }) => {
    const { getPreviousRoute } = this.props;
    const { scenes } = this.state;

    const previousRoute = getPreviousRoute({ route });

    if (previousRoute) {
      const previousScene = scenes.find(
        (scene) => scene.route.key === previousRoute.key
      );

      return previousScene;
    }

    return undefined;
  };

  render() {
    const {
      mode,
      insets,
      descriptors,
      state,
      routes,
      closingRouteKeys,
      onOpenRoute,
      onCloseRoute,
      getGesturesEnabled,
      renderHeader,
      renderScene,
      headerMode,
      isParentHeaderShown,
      onTransitionStart,
      onTransitionEnd,
      onPageChangeStart,
      onPageChangeConfirm,
      onPageChangeCancel,
      onGestureStart,
      onGestureEnd,
      onGestureCancel,
      // Enable on new versions of screens or for non modals on older versions
      detachInactiveScreens = shouldUseActivityState || mode !== 'modal',
    } = this.props;

    const { scenes, layout, gestures, headerHeights } = this.state;

    const focusedRoute = state.routes[state.index];
    const focusedDescriptor = descriptors[focusedRoute.key];
    const focusedOptions = focusedDescriptor ? focusedDescriptor.options : {};
    const focusedHeaderHeight = headerHeights[focusedRoute.key];

    let defaultTransitionPreset =
      mode === 'modal' ? ModalTransition : DefaultTransition;

    if (headerMode === 'screen') {
      defaultTransitionPreset = {
        ...defaultTransitionPreset,
        headerStyleInterpolator: forNoAnimationHeader,
      };
    }

    const {
      top = insets.top,
      right = insets.right,
      bottom = insets.bottom,
      left = insets.left,
    } = focusedOptions.safeAreaInsets || {};

    let activeScreensLimit = 1;

    for (let i = scenes.length - 1; i >= 0; i--) {
      const {
        // By default, we don't want to detach the previous screen of the active one for modals
        detachPreviousScreen = mode === 'modal'
          ? i !== scenes.length - 1
          : true,
      } = scenes[i].descriptor.options;

      if (detachPreviousScreen === false) {
        activeScreensLimit++;
      } else {
        break;
      }
    }

    const isFloatHeaderAbsolute =
      headerMode === 'float'
        ? this.state.scenes.slice(-2).some((scene) => {
            const { descriptor } = scene;
            const options = descriptor ? descriptor.options : {};
            const {
              headerTransparent,
              headerShown = isParentHeaderShown === false,
            } = options;

            if (headerTransparent || headerShown === false) {
              return true;
            }

            return false;
          })
        : false;

    const floatingHeader =
      headerMode === 'float' ? (
        <React.Fragment key="header">
          {renderHeader({
            mode: 'float',
            layout,
            insets: { top, right, bottom, left },
            scenes,
            getPreviousScene: this.getPreviousScene,
            getFocusedRoute: this.getFocusedRoute,
            onContentHeightChange: this.handleHeaderLayout,
            gestureDirection:
              focusedOptions.gestureDirection !== undefined
                ? focusedOptions.gestureDirection
                : defaultTransitionPreset.gestureDirection,
            styleInterpolator:
              focusedOptions.headerStyleInterpolator !== undefined
                ? focusedOptions.headerStyleInterpolator
                : defaultTransitionPreset.headerStyleInterpolator,
            style: [
              styles.floating,
              isFloatHeaderAbsolute && [
                // Without this, the header buttons won't be touchable on Android when headerTransparent: true
                { height: focusedHeaderHeight },
                styles.absolute,
              ],
            ],
          })}
        </React.Fragment>
      ) : null;

    return (
      <React.Fragment>
        {isFloatHeaderAbsolute ? null : floatingHeader}
        <MaybeScreenContainer
          enabled={detachInactiveScreens}
          style={styles.container}
          onLayout={this.handleLayout}
        >
          {routes.map((route, index, self) => {
            const focused = focusedRoute.key === route.key;
            const gesture = gestures[route.key];
            const scene = scenes[index];

            // For the screens that shouldn't be active, the value is 0
            // For those that should be active, but are not the top screen, the value is 1
            // For those on top of the stack and with interaction enabled, the value is 2
            // For the old implementation, it stays the same it was
            let isScreenActive: Animated.AnimatedInterpolation | 2 | 1 | 0 = 1;

            if (shouldUseActivityState) {
              if (index < self.length - activeScreensLimit - 1) {
                // screen should be inactive because it is too deep in the stack
                isScreenActive = STATE_INACTIVE;
              } else {
                const sceneForActivity = scenes[self.length - 1];
                const outputValue =
                  index === self.length - 1
                    ? STATE_ON_TOP // the screen is on top after the transition
                    : index >= self.length - activeScreensLimit
                    ? STATE_TRANSITIONING_OR_BELOW_TOP // the screen should stay active after the transition, it is not on top but is in activeLimit
                    : STATE_INACTIVE; // the screen should be active only during the transition, it is at the edge of activeLimit
                isScreenActive = sceneForActivity
                  ? sceneForActivity.progress.current.interpolate({
                      inputRange: [0, 1 - EPSILON, 1],
                      outputRange: [1, 1, outputValue],
                      extrapolate: 'clamp',
                    })
                  : STATE_TRANSITIONING_OR_BELOW_TOP;
              }
            } else {
              isScreenActive = scene.progress.next
                ? scene.progress.next.interpolate({
                    inputRange: [0, 1 - EPSILON, 1],
                    outputRange: [1, 1, 0],
                    extrapolate: 'clamp',
                  })
                : 1;
            }

            const {
              safeAreaInsets,
              headerShown = isParentHeaderShown === false,
              headerTransparent,
              cardShadowEnabled,
              cardOverlayEnabled,
              cardOverlay,
              cardStyle,
              animationEnabled,
              gestureResponseDistance,
              gestureVelocityImpact,
              gestureDirection = defaultTransitionPreset.gestureDirection,
              transitionSpec = defaultTransitionPreset.transitionSpec,
              cardStyleInterpolator = animationEnabled === false
                ? forNoAnimationCard
                : defaultTransitionPreset.cardStyleInterpolator,
              headerStyleInterpolator = defaultTransitionPreset.headerStyleInterpolator,
            } = scene.descriptor
              ? scene.descriptor.options
              : ({} as StackNavigationOptions);

            let transitionConfig = {
              gestureDirection,
              transitionSpec,
              cardStyleInterpolator,
              headerStyleInterpolator,
            };

            // When a screen is not the last, it should use next screen's transition config
            // Many transitions also animate the previous screen, so using 2 different transitions doesn't look right
            // For example combining a slide and a modal transition would look wrong otherwise
            // With this approach, combining different transition styles in the same navigator mostly looks right
            // This will still be broken when 2 transitions have different idle state (e.g. modal presentation),
            // but majority of the transitions look alright
            if (index !== self.length - 1) {
              const nextScene = scenes[index + 1];

              if (nextScene) {
                const {
                  animationEnabled,
                  gestureDirection = defaultTransitionPreset.gestureDirection,
                  transitionSpec = defaultTransitionPreset.transitionSpec,
                  cardStyleInterpolator = animationEnabled === false
                    ? forNoAnimationCard
                    : defaultTransitionPreset.cardStyleInterpolator,
                  headerStyleInterpolator = defaultTransitionPreset.headerStyleInterpolator,
                } = nextScene.descriptor
                  ? nextScene.descriptor.options
                  : ({} as StackNavigationOptions);

                transitionConfig = {
                  gestureDirection,
                  transitionSpec,
                  cardStyleInterpolator,
                  headerStyleInterpolator,
                };
              }
            }

            const {
              top: safeAreaInsetTop = insets.top,
              right: safeAreaInsetRight = insets.right,
              bottom: safeAreaInsetBottom = insets.bottom,
              left: safeAreaInsetLeft = insets.left,
            } = safeAreaInsets || {};

            const headerHeight =
              headerMode !== 'none' && headerShown !== false
                ? headerHeights[route.key]
                : 0;

            return (
              <MaybeScreen
                key={route.key}
                style={StyleSheet.absoluteFill}
                enabled={detachInactiveScreens}
                active={isScreenActive}
                pointerEvents="box-none"
              >
                <CardContainer
                  index={index}
                  active={index === self.length - 1}
                  focused={focused}
                  closing={closingRouteKeys.includes(route.key)}
                  layout={layout}
                  gesture={gesture}
                  scene={scene}
                  safeAreaInsetTop={safeAreaInsetTop}
                  safeAreaInsetRight={safeAreaInsetRight}
                  safeAreaInsetBottom={safeAreaInsetBottom}
                  safeAreaInsetLeft={safeAreaInsetLeft}
                  cardOverlay={cardOverlay}
                  cardOverlayEnabled={cardOverlayEnabled}
                  cardShadowEnabled={cardShadowEnabled}
                  cardStyle={cardStyle}
                  onPageChangeStart={onPageChangeStart}
                  onPageChangeConfirm={onPageChangeConfirm}
                  onPageChangeCancel={onPageChangeCancel}
                  onGestureStart={onGestureStart}
                  onGestureCancel={onGestureCancel}
                  onGestureEnd={onGestureEnd}
                  gestureResponseDistance={gestureResponseDistance}
                  headerHeight={headerHeight}
                  isParentHeaderShown={isParentHeaderShown}
                  onHeaderHeightChange={this.handleHeaderLayout}
                  getPreviousScene={this.getPreviousScene}
                  getFocusedRoute={this.getFocusedRoute}
                  mode={mode}
                  headerMode={headerMode}
                  headerShown={headerShown}
                  hasAbsoluteHeader={
                    isFloatHeaderAbsolute && !headerTransparent
                  }
                  renderHeader={renderHeader}
                  renderScene={renderScene}
                  onOpenRoute={onOpenRoute}
                  onCloseRoute={onCloseRoute}
                  onTransitionStart={onTransitionStart}
                  onTransitionEnd={onTransitionEnd}
                  gestureEnabled={index !== 0 && getGesturesEnabled({ route })}
                  gestureVelocityImpact={gestureVelocityImpact}
                  {...transitionConfig}
                />
              </MaybeScreen>
            );
          })}
        </MaybeScreenContainer>
        {isFloatHeaderAbsolute ? floatingHeader : null}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  floating: {
    zIndex: 1,
  },
});
