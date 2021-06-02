import {
  Background,
  getDefaultHeaderHeight,
  SafeAreaProviderCompat,
} from '@react-navigation/elements';
import type {
  ParamListBase,
  Route,
  StackNavigationState,
} from '@react-navigation/native';
import Color from 'color';
import * as React from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
} from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

import {
  forModalPresentationIOS,
  forNoAnimation as forNoAnimationCard,
} from '../../TransitionConfigs/CardStyleInterpolators';
import {
  DefaultTransition,
  ModalFadeTransition,
  ModalTransition,
} from '../../TransitionConfigs/TransitionPresets';
import type {
  Layout,
  Scene,
  StackDescriptor,
  StackDescriptorMap,
  StackHeaderMode,
  StackNavigationOptions,
} from '../../types';
import getDistanceForDirection from '../../utils/getDistanceForDirection';
import type { Props as HeaderContainerProps } from '../Header/HeaderContainer';
import { MaybeScreen, MaybeScreenContainer } from '../Screens';
import CardContainer from './CardContainer';

type GestureValues = {
  [key: string]: Animated.Value;
};

type Props = {
  insets: EdgeInsets;
  state: StackNavigationState<ParamListBase>;
  descriptors: StackDescriptorMap;
  routes: Route<string>[];
  openingRouteKeys: string[];
  closingRouteKeys: string[];
  onOpenRoute: (props: { route: Route<string> }) => void;
  onCloseRoute: (props: { route: Route<string> }) => void;
  getPreviousRoute: (props: {
    route: Route<string>;
  }) => Route<string> | undefined;
  renderHeader: (props: HeaderContainerProps) => React.ReactNode;
  renderScene: (props: { route: Route<string> }) => React.ReactNode;
  isParentHeaderShown: boolean;
  onTransitionStart: (
    props: { route: Route<string> },
    closing: boolean
  ) => void;
  onTransitionEnd: (props: { route: Route<string> }, closing: boolean) => void;
  onGestureStart: (props: { route: Route<string> }) => void;
  onGestureEnd: (props: { route: Route<string> }) => void;
  onGestureCancel: (props: { route: Route<string> }) => void;
  detachInactiveScreens?: boolean;
};

type State = {
  routes: Route<string>[];
  descriptors: StackDescriptorMap;
  scenes: Scene[];
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

    const {
      headerStatusBarHeight = isParentHeaderShown ? 0 : insets.top,
    } = options;

    acc[curr.key] =
      typeof height === 'number'
        ? height
        : getDefaultHeaderHeight(layout, headerStatusBarHeight);

    return acc;
  }, {});
};

const getDistanceFromOptions = (
  layout: Layout,
  descriptor?: StackDescriptor
) => {
  const {
    presentation,
    gestureDirection = presentation === 'modal'
      ? ModalTransition.gestureDirection
      : DefaultTransition.gestureDirection,
  } = (descriptor?.options || {}) as StackNavigationOptions;

  return getDistanceForDirection(layout, gestureDirection);
};

const getProgressFromGesture = (
  gesture: Animated.Value,
  layout: Layout,
  descriptor?: StackDescriptor
) => {
  const distance = getDistanceFromOptions(
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
  static getDerivedStateFromProps(
    props: Props,
    state: State
  ): Partial<State> | null {
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
            ? getDistanceFromOptions(state.layout, descriptor)
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

        // When a screen is not the last, it should use next screen's transition config
        // Many transitions also animate the previous screen, so using 2 different transitions doesn't look right
        // For example combining a slide and a modal transition would look wrong otherwise
        // With this approach, combining different transition styles in the same navigator mostly looks right
        // This will still be broken when 2 transitions have different idle state (e.g. modal presentation),
        // but majority of the transitions look alright
        const optionsForTransitionConfig =
          index !== self.length - 1 &&
          nextDescriptor &&
          nextDescriptor.options.presentation !== 'transparentModal'
            ? nextDescriptor.options
            : descriptor.options;

        let defaultTransitionPreset =
          optionsForTransitionConfig.presentation === 'modal'
            ? ModalTransition
            : optionsForTransitionConfig.presentation === 'transparentModal'
            ? ModalFadeTransition
            : DefaultTransition;

        const {
          animationEnabled = Platform.OS !== 'web' &&
            Platform.OS !== 'windows' &&
            Platform.OS !== 'macos',
          gestureEnabled = Platform.OS === 'ios' && animationEnabled,
          gestureDirection = defaultTransitionPreset.gestureDirection,
          transitionSpec = defaultTransitionPreset.transitionSpec,
          cardStyleInterpolator = animationEnabled === false
            ? forNoAnimationCard
            : defaultTransitionPreset.cardStyleInterpolator,
          headerStyleInterpolator = defaultTransitionPreset.headerStyleInterpolator,
          cardOverlayEnabled = (Platform.OS !== 'ios' &&
            optionsForTransitionConfig.presentation !== 'transparentModal') ||
            cardStyleInterpolator === forModalPresentationIOS,
        } = optionsForTransitionConfig;

        const headerMode: StackHeaderMode =
          descriptor.options.headerMode ??
          (!(
            optionsForTransitionConfig.presentation === 'modal' ||
            optionsForTransitionConfig.presentation === 'transparentModal' ||
            nextDescriptor?.options.presentation === 'modal' ||
            nextDescriptor?.options.presentation === 'transparentModal' ||
            cardStyleInterpolator === forModalPresentationIOS
          ) &&
          Platform.OS === 'ios' &&
          descriptor.options.header === undefined
            ? 'float'
            : 'screen');

        const scene = {
          route,
          descriptor: {
            ...descriptor,
            options: {
              ...descriptor.options,
              animationEnabled,
              cardOverlayEnabled,
              cardStyleInterpolator,
              gestureDirection,
              gestureEnabled,
              headerStyleInterpolator,
              transitionSpec,
              headerMode,
            },
          },
          progress: {
            current: getProgressFromGesture(
              currentGesture,
              state.layout,
              descriptor
            ),
            next:
              nextGesture &&
              nextDescriptor.options.presentation !== 'transparentModal'
                ? getProgressFromGesture(
                    nextGesture,
                    state.layout,
                    nextDescriptor
                  )
                : undefined,
            previous: previousGesture
              ? getProgressFromGesture(
                  previousGesture,
                  state.layout,
                  previousDescriptor
                )
              : undefined,
          },
          __memo: [
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

    this.state = {
      routes: [],
      scenes: [],
      gestures: {},
      layout: SafeAreaProviderCompat.initialMetrics.frame,
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
        (scene) => scene.descriptor.route.key === previousRoute.key
      );

      return previousScene;
    }

    return undefined;
  };

  render() {
    const {
      insets,
      state,
      routes,
      closingRouteKeys,
      onOpenRoute,
      onCloseRoute,
      renderHeader,
      renderScene,
      isParentHeaderShown,
      onTransitionStart,
      onTransitionEnd,
      onGestureStart,
      onGestureEnd,
      onGestureCancel,
      detachInactiveScreens = Platform.OS === 'web' ||
        Platform.OS === 'android' ||
        Platform.OS === 'ios',
    } = this.props;

    const { scenes, layout, gestures, headerHeights } = this.state;

    const focusedRoute = state.routes[state.index];
    const focusedHeaderHeight = headerHeights[focusedRoute.key];

    const isFloatHeaderAbsolute = this.state.scenes.slice(-2).some((scene) => {
      const options = scene.descriptor.options ?? {};
      const { headerMode, headerTransparent, headerShown = true } = options;

      if (
        headerTransparent ||
        headerShown === false ||
        headerMode === 'screen'
      ) {
        return true;
      }

      return false;
    });

    let activeScreensLimit = 1;

    for (let i = scenes.length - 1; i >= 0; i--) {
      const { options } = scenes[i].descriptor;
      const {
        // By default, we don't want to detach the previous screen of the active one for modals
        detachPreviousScreen = options.presentation === 'transparentModal'
          ? false
          : options.cardStyleInterpolator === forModalPresentationIOS
          ? i !==
            scenes
              .map((scene) => scene.descriptor.options.cardStyleInterpolator)
              .lastIndexOf(forModalPresentationIOS)
          : true,
      } = options;

      if (detachPreviousScreen === false) {
        activeScreensLimit++;
      } else {
        break;
      }
    }

    const floatingHeader = (
      <React.Fragment key="header">
        {renderHeader({
          mode: 'float',
          layout,
          scenes,
          getPreviousScene: this.getPreviousScene,
          getFocusedRoute: this.getFocusedRoute,
          onContentHeightChange: this.handleHeaderLayout,
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
    );

    return (
      <Background>
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

            const {
              cardStyleInterpolator,
              headerShown = true,
              headerTransparent,
              headerStyle,
              headerTintColor,
              orientation,
              statusBarAnimation,
              statusBarColor,
              statusBarHidden,
              statusBarStyle,
              statusBarTranslucent,
            } = scene.descriptor.options;

            const safeAreaInsetTop = insets.top;
            const safeAreaInsetRight = insets.right;
            const safeAreaInsetBottom = insets.bottom;
            const safeAreaInsetLeft = insets.left;

            const headerHeight =
              headerShown !== false ? headerHeights[route.key] : 0;

            const { backgroundColor: headerBackgroundColor } =
              StyleSheet.flatten(headerStyle) || {};

            let headerDarkContent: boolean | undefined;

            if (headerShown) {
              if (headerTintColor) {
                headerDarkContent = Color(headerTintColor).isDark();
              } else if (typeof headerBackgroundColor === 'string') {
                headerDarkContent = !Color(headerBackgroundColor).isDark();
              }
            }

            // Start from current card and count backwards the number of cards with same interpolation
            let interpolationIndex = 0;

            for (let i = index - 1; i >= 0; i--) {
              const cardStyleInterpolatorCurrent =
                scenes[i]?.descriptor.options.cardStyleInterpolator;

              if (cardStyleInterpolatorCurrent !== cardStyleInterpolator) {
                break;
              }

              interpolationIndex++;
            }

            const isNextScreenTransparent =
              scenes[index + 1]?.descriptor.options.presentation ===
              'transparentModal';

            const detachCurrentScreen =
              scenes[index + 1]?.descriptor.options.detachPreviousScreen !==
              false;

            return (
              <MaybeScreen
                key={route.key}
                style={StyleSheet.absoluteFill}
                enabled={detachInactiveScreens}
                active={isScreenActive}
                pointerEvents="box-none"
                orientation={orientation}
                statusBarAnimation={statusBarAnimation}
                statusBarColor={statusBarColor}
                statusBarHidden={statusBarHidden}
                statusBarStyle={statusBarStyle}
                statusBarTranslucent={statusBarTranslucent}
              >
                <CardContainer
                  index={index}
                  interpolationIndex={interpolationIndex}
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
                  onGestureStart={onGestureStart}
                  onGestureCancel={onGestureCancel}
                  onGestureEnd={onGestureEnd}
                  headerHeight={headerHeight}
                  isParentHeaderShown={isParentHeaderShown}
                  onHeaderHeightChange={this.handleHeaderLayout}
                  getPreviousScene={this.getPreviousScene}
                  getFocusedRoute={this.getFocusedRoute}
                  headerDarkContent={headerDarkContent}
                  hasAbsoluteFloatHeader={
                    isFloatHeaderAbsolute && !headerTransparent
                  }
                  renderHeader={renderHeader}
                  renderScene={renderScene}
                  onOpenRoute={onOpenRoute}
                  onCloseRoute={onCloseRoute}
                  onTransitionStart={onTransitionStart}
                  onTransitionEnd={onTransitionEnd}
                  isNextScreenTransparent={isNextScreenTransparent}
                  detachCurrentScreen={detachCurrentScreen}
                />
              </MaybeScreen>
            );
          })}
        </MaybeScreenContainer>
        {isFloatHeaderAbsolute ? floatingHeader : null}
      </Background>
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
