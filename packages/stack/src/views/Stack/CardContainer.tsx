import * as React from 'react';
import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Route, useTheme } from '@react-navigation/native';
import type { Props as HeaderContainerProps } from '../Header/HeaderContainer';
import Card from './Card';
import HeaderHeightContext from '../../utils/HeaderHeightContext';
import HeaderShownContext from '../../utils/HeaderShownContext';
import PreviousSceneContext from '../../utils/PreviousSceneContext';
import useFocusTrap from '../../utils/useFocusTrap';
import type {
  Scene,
  Layout,
  StackHeaderMode,
  StackCardMode,
  TransitionPreset,
} from '../../types';

type Props = TransitionPreset & {
  index: number;
  active: boolean;
  focused: boolean;
  closing: boolean;
  layout: Layout;
  gesture: Animated.Value;
  scene: Scene<Route<string>>;
  safeAreaInsetTop: number;
  safeAreaInsetRight: number;
  safeAreaInsetBottom: number;
  safeAreaInsetLeft: number;
  cardOverlay?: (props: {
    style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  }) => React.ReactNode;
  cardOverlayEnabled?: boolean;
  cardShadowEnabled?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
  getPreviousScene: (props: {
    route: Route<string>;
  }) => Scene<Route<string>> | undefined;
  getFocusedRoute: () => Route<string>;
  renderHeader: (props: HeaderContainerProps) => React.ReactNode;
  renderScene: (props: { route: Route<string> }) => React.ReactNode;
  onOpenRoute: (props: { route: Route<string> }) => void;
  onCloseRoute: (props: { route: Route<string> }) => void;
  onTransitionStart?: (
    props: { route: Route<string> },
    closing: boolean
  ) => void;
  onTransitionEnd?: (props: { route: Route<string> }, closing: boolean) => void;
  onPageChangeStart?: () => void;
  onPageChangeConfirm?: (force: boolean) => void;
  onPageChangeCancel?: () => void;
  onGestureStart?: (props: { route: Route<string> }) => void;
  onGestureEnd?: (props: { route: Route<string> }) => void;
  onGestureCancel?: (props: { route: Route<string> }) => void;
  gestureEnabled?: boolean;
  gestureResponseDistance?: {
    vertical?: number;
    horizontal?: number;
  };
  gestureVelocityImpact?: number;
  mode: StackCardMode;
  headerMode: StackHeaderMode;
  headerShown: boolean;
  hasAbsoluteHeader: boolean;
  headerHeight: number;
  onHeaderHeightChange: (props: {
    route: Route<string>;
    height: number;
  }) => void;
  isParentHeaderShown: boolean;
};

const EPSILON = 0.1;

function CardContainer({
  active,
  cardOverlay,
  cardOverlayEnabled,
  cardShadowEnabled,
  cardStyle,
  cardStyleInterpolator,
  closing,
  gesture,
  focused,
  gestureDirection,
  gestureEnabled,
  gestureResponseDistance,
  gestureVelocityImpact,
  getPreviousScene,
  getFocusedRoute,
  mode,
  headerMode,
  headerShown,
  headerStyleInterpolator,
  hasAbsoluteHeader,
  headerHeight,
  onHeaderHeightChange,
  isParentHeaderShown,
  index,
  layout,
  onCloseRoute,
  onOpenRoute,
  onPageChangeCancel,
  onPageChangeConfirm,
  onPageChangeStart,
  onGestureCancel,
  onGestureEnd,
  onGestureStart,
  onTransitionEnd,
  onTransitionStart,
  renderHeader,
  renderScene,
  safeAreaInsetBottom,
  safeAreaInsetLeft,
  safeAreaInsetRight,
  safeAreaInsetTop,
  scene,
  transitionSpec,
}: Props) {
  const handleOpen = () => {
    const { route } = scene;

    onTransitionEnd?.({ route }, false);
    onOpenRoute({ route });
  };

  const handleClose = () => {
    const { route } = scene;

    onTransitionEnd?.({ route }, true);
    onCloseRoute({ route });
  };

  const handleGestureBegin = () => {
    const { route } = scene;

    onPageChangeStart?.();
    onGestureStart?.({ route });
  };

  const handleGestureCanceled = () => {
    const { route } = scene;

    onPageChangeCancel?.();
    onGestureCancel?.({ route });
  };

  const handleGestureEnd = () => {
    const { route } = scene;

    onGestureEnd?.({ route });
  };

  const handleTransition = ({
    closing,
    gesture,
  }: {
    closing: boolean;
    gesture: boolean;
  }) => {
    const { route } = scene;

    if (!gesture) {
      onPageChangeConfirm?.(true);
    } else if (active && closing) {
      onPageChangeConfirm?.(false);
    } else {
      onPageChangeCancel?.();
    }

    onTransitionStart?.({ route }, closing);
  };

  const insets = {
    top: safeAreaInsetTop,
    right: safeAreaInsetRight,
    bottom: safeAreaInsetBottom,
    left: safeAreaInsetLeft,
  };

  const { colors } = useTheme();

  const [pointerEvents, setPointerEvents] = React.useState<'box-none' | 'none'>(
    'box-none'
  );

  React.useEffect(() => {
    // @ts-expect-error: AnimatedInterpolation optionally has addListener, but the type defs don't think so
    const listener = scene.progress.next?.addListener?.(
      ({ value }: { value: number }) => {
        setPointerEvents(value <= EPSILON ? 'box-none' : 'none');
      }
    );

    return () => {
      if (listener) {
        // @ts-expect-error: AnimatedInterpolation optionally has removedListener, but the type defs don't think so
        scene.progress.next?.removeListener?.(listener);
      }
    };
  }, [pointerEvents, scene.progress.next]);

  const isCurrentHeaderShown = headerMode !== 'none' && headerShown !== false;
  const previousScene = getPreviousScene({ route: scene.route });

  const screenRef = React.useRef<View>(null);

  useFocusTrap(screenRef, focused);

  return (
    <Card
      index={index}
      gestureDirection={gestureDirection}
      layout={layout}
      insets={insets}
      gesture={gesture}
      current={scene.progress.current}
      next={scene.progress.next}
      closing={closing}
      onOpen={handleOpen}
      onClose={handleClose}
      overlay={cardOverlay}
      overlayEnabled={cardOverlayEnabled}
      shadowEnabled={cardShadowEnabled}
      onTransition={handleTransition}
      onGestureBegin={handleGestureBegin}
      onGestureCanceled={handleGestureCanceled}
      onGestureEnd={handleGestureEnd}
      gestureEnabled={gestureEnabled}
      gestureResponseDistance={gestureResponseDistance}
      gestureVelocityImpact={gestureVelocityImpact}
      transitionSpec={transitionSpec}
      styleInterpolator={cardStyleInterpolator}
      accessibilityElementsHidden={!focused}
      importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
      pointerEvents={active ? 'box-none' : pointerEvents}
      pageOverflowEnabled={headerMode === 'screen' && mode === 'card'}
      containerStyle={hasAbsoluteHeader ? { marginTop: headerHeight } : null}
      contentStyle={[{ backgroundColor: colors.background }, cardStyle]}
      style={[
        {
          // This is necessary to avoid unfocused larger pages increasing scroll area
          // The issue can be seen on the web when a smaller screen is pushed over a larger one
          overflow: active ? undefined : 'hidden',
        },
        StyleSheet.absoluteFill,
      ]}
    >
      <View style={styles.container}>
        <View style={styles.scene} ref={screenRef}>
          <PreviousSceneContext.Provider value={previousScene}>
            <HeaderShownContext.Provider
              value={isParentHeaderShown || isCurrentHeaderShown}
            >
              <HeaderHeightContext.Provider value={headerHeight}>
                {renderScene({ route: scene.route })}
              </HeaderHeightContext.Provider>
            </HeaderShownContext.Provider>
          </PreviousSceneContext.Provider>
        </View>
        {headerMode === 'screen'
          ? renderHeader({
              mode: 'screen',
              layout,
              insets,
              scenes: [previousScene, scene],
              getPreviousScene,
              getFocusedRoute,
              gestureDirection,
              styleInterpolator: headerStyleInterpolator,
              onContentHeightChange: onHeaderHeightChange,
            })
          : null}
      </View>
    </Card>
  );
}

export default React.memo(CardContainer);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column-reverse',
  },
  scene: {
    flex: 1,
  },
});
