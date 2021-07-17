import Color from 'color';
import * as React from 'react';
import {
  Animated,
  InteractionManager,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

import { forModalPresentationIOS } from '../../TransitionConfigs/CardStyleInterpolators';
import type {
  GestureDirection,
  Layout,
  StackCardInterpolationProps,
  StackCardStyleInterpolator,
  TransitionSpec,
} from '../../types';
import CardAnimationContext from '../../utils/CardAnimationContext';
import getDistanceForDirection from '../../utils/getDistanceForDirection';
import getInvertedMultiplier from '../../utils/getInvertedMultiplier';
import memoize from '../../utils/memoize';
import {
  GestureState,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from '../GestureHandler';
import ModalStatusBarManager from '../ModalStatusBarManager';
import CardSheet from './CardSheet';

type Props = ViewProps & {
  // index: number;
  interpolationIndex: number;
  closing: boolean;
  next?: Animated.AnimatedInterpolation;
  current: Animated.AnimatedInterpolation;
  gesture: Animated.Value;
  layout: Layout;
  insets: EdgeInsets;
  headerDarkContent: boolean | undefined;
  pageOverflowEnabled: boolean;
  gestureDirection: GestureDirection;
  onOpen: () => void;
  onClose: () => void;
  onTransition: (props: { closing: boolean; gesture: boolean }) => void;
  onGestureBegin: () => void;
  onGestureCanceled: () => void;
  onGestureEnd: () => void;
  children: React.ReactNode;
  overlay: (props: {
    style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  }) => React.ReactNode;
  overlayEnabled: boolean;
  shadowEnabled: boolean;
  gestureEnabled: boolean;
  gestureResponseDistance?: number;
  gestureVelocityImpact: number;
  transitionSpec: {
    open: TransitionSpec;
    close: TransitionSpec;
  };
  styleInterpolator: StackCardStyleInterpolator;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const GESTURE_VELOCITY_IMPACT = 0.3;

const TRUE = 1;
const FALSE = 0;

/**
 * The distance of touch start from the edge of the screen where the gesture will be recognized
 */
const GESTURE_RESPONSE_DISTANCE_HORIZONTAL = 50;
const GESTURE_RESPONSE_DISTANCE_VERTICAL = 135;

const useNativeDriver = Platform.OS !== 'web';

const hasOpacityStyle = (style: any) => {
  if (style) {
    const flattenedStyle = StyleSheet.flatten(style);
    return flattenedStyle.opacity != null;
  }

  return false;
};

export default class Card extends React.Component<Props> {
  static defaultProps = {
    shadowEnabled: false,
    gestureEnabled: true,
    gestureVelocityImpact: GESTURE_VELOCITY_IMPACT,
    overlay: ({
      style,
    }: {
      style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
    }) =>
      style ? (
        <Animated.View pointerEvents="none" style={[styles.overlay, style]} />
      ) : null,
  };

  componentDidMount() {
    this.animate({ closing: this.props.closing });
    this.isCurrentlyMounted = true;
  }

  componentDidUpdate(prevProps: Props) {
    const { layout, gestureDirection, closing } = this.props;
    const { width, height } = layout;

    if (width !== prevProps.layout.width) {
      this.layout.width.setValue(width);
    }

    if (height !== prevProps.layout.height) {
      this.layout.height.setValue(height);
    }

    if (gestureDirection !== prevProps.gestureDirection) {
      this.inverted.setValue(getInvertedMultiplier(gestureDirection));
    }

    const toValue = this.getAnimateToValue(this.props);

    if (
      this.getAnimateToValue(prevProps) !== toValue ||
      this.lastToValue !== toValue
    ) {
      // We need to trigger the animation when route was closed
      // Thr route might have been closed by a `POP` action or by a gesture
      // When route was closed due to a gesture, the animation would've happened already
      // It's still important to trigger the animation so that `onClose` is called
      // If `onClose` is not called, cleanup step won't be performed for gestures
      this.animate({ closing });
    }
  }

  componentWillUnmount() {
    this.isCurrentlyMounted = false;
    this.handleEndInteraction();
  }

  private isCurrentlyMounted = false;

  private isClosing = new Animated.Value(FALSE);

  private inverted = new Animated.Value(
    getInvertedMultiplier(this.props.gestureDirection)
  );

  private layout = {
    width: new Animated.Value(this.props.layout.width),
    height: new Animated.Value(this.props.layout.height),
  };

  private isSwiping = new Animated.Value(FALSE);

  private interactionHandle: number | undefined;

  private pendingGestureCallback: number | undefined;

  private lastToValue: number | undefined;

  private animate = ({
    closing,
    velocity,
  }: {
    closing: boolean;
    velocity?: number;
  }) => {
    const { gesture, transitionSpec, onOpen, onClose, onTransition } =
      this.props;

    const toValue = this.getAnimateToValue({
      ...this.props,
      closing,
    });

    this.lastToValue = toValue;

    this.isClosing.setValue(closing ? TRUE : FALSE);

    const spec = closing ? transitionSpec.close : transitionSpec.open;

    const animation =
      spec.animation === 'spring' ? Animated.spring : Animated.timing;

    this.setPointerEventsEnabled(!closing);
    this.handleStartInteraction();

    clearTimeout(this.pendingGestureCallback);

    onTransition?.({ closing, gesture: velocity !== undefined });
    animation(gesture, {
      ...spec.config,
      velocity,
      toValue,
      useNativeDriver,
      isInteraction: false,
    }).start(({ finished }) => {
      this.handleEndInteraction();

      clearTimeout(this.pendingGestureCallback);

      if (finished) {
        if (closing) {
          onClose();
        } else {
          onOpen();
        }

        if (this.isCurrentlyMounted) {
          // Make sure to re-open screen if it wasn't removed
          this.forceUpdate();
        }
      }
    });
  };

  private getAnimateToValue = ({
    closing,
    layout,
    gestureDirection,
  }: {
    closing?: boolean;
    layout: Layout;
    gestureDirection: GestureDirection;
  }) => {
    if (!closing) {
      return 0;
    }

    return getDistanceForDirection(layout, gestureDirection);
  };

  private setPointerEventsEnabled = (enabled: boolean) => {
    const pointerEvents = enabled ? 'box-none' : 'none';
    
    this.contentRef.current?.setNativeProps && 
      this.contentRef.current?.setNativeProps({ pointerEvents });
  };

  private handleStartInteraction = () => {
    if (this.interactionHandle === undefined) {
      this.interactionHandle = InteractionManager.createInteractionHandle();
    }
  };

  private handleEndInteraction = () => {
    if (this.interactionHandle !== undefined) {
      InteractionManager.clearInteractionHandle(this.interactionHandle);
      this.interactionHandle = undefined;
    }
  };

  private handleGestureStateChange = ({
    nativeEvent,
  }: PanGestureHandlerGestureEvent) => {
    const {
      layout,
      onClose,
      onGestureBegin,
      onGestureCanceled,
      onGestureEnd,
      gestureDirection,
      gestureVelocityImpact,
    } = this.props;

    switch (nativeEvent.state) {
      case GestureState.BEGAN:
        this.isSwiping.setValue(TRUE);
        this.handleStartInteraction();
        onGestureBegin?.();
        break;
      case GestureState.CANCELLED: {
        this.isSwiping.setValue(FALSE);
        this.handleEndInteraction();

        const velocity =
          gestureDirection === 'vertical' ||
          gestureDirection === 'vertical-inverted'
            ? nativeEvent.velocityY
            : nativeEvent.velocityX;

        this.animate({ closing: this.props.closing, velocity });

        onGestureCanceled?.();
        break;
      }
      case GestureState.END: {
        this.isSwiping.setValue(FALSE);

        let distance;
        let translation;
        let velocity;

        if (
          gestureDirection === 'vertical' ||
          gestureDirection === 'vertical-inverted'
        ) {
          distance = layout.height;
          translation = nativeEvent.translationY;
          velocity = nativeEvent.velocityY;
        } else {
          distance = layout.width;
          translation = nativeEvent.translationX;
          velocity = nativeEvent.velocityX;
        }

        const closing =
          (translation + velocity * gestureVelocityImpact) *
            getInvertedMultiplier(gestureDirection) >
          distance / 2
            ? velocity !== 0 || translation !== 0
            : this.props.closing;

        this.animate({ closing, velocity });

        if (closing) {
          // We call onClose with a delay to make sure that the animation has already started
          // This will make sure that the state update caused by this doesn't affect start of animation
          this.pendingGestureCallback = setTimeout(() => {
            onClose();

            // Trigger an update after we dispatch the action to remove the screen
            // This will make sure that we check if the screen didn't get removed so we can cancel the animation
            this.forceUpdate();
          }, 32) as any as number;
        }

        onGestureEnd?.();
        break;
      }
    }
  };

  // Memoize this to avoid extra work on re-render
  private getInterpolatedStyle = memoize(
    (
      styleInterpolator: StackCardStyleInterpolator,
      animation: StackCardInterpolationProps
    ) => styleInterpolator(animation)
  );

  // Keep track of the animation context when deps changes.
  private getCardAnimation = memoize(
    (
      interpolationIndex: number,
      current: Animated.AnimatedInterpolation,
      next: Animated.AnimatedInterpolation | undefined,
      layout: Layout,
      insetTop: number,
      insetRight: number,
      insetBottom: number,
      insetLeft: number
    ) => ({
      index: interpolationIndex,
      current: { progress: current },
      next: next && { progress: next },
      closing: this.isClosing,
      swiping: this.isSwiping,
      inverted: this.inverted,
      layouts: {
        screen: layout,
      },
      insets: {
        top: insetTop,
        right: insetRight,
        bottom: insetBottom,
        left: insetLeft,
      },
    })
  );

  private gestureActivationCriteria() {
    const { layout, gestureDirection, gestureResponseDistance } = this.props;
    const enableTrackpadTwoFingerGesture = true;

    const distance =
      gestureResponseDistance !== undefined
        ? gestureResponseDistance
        : gestureDirection === 'vertical' ||
          gestureDirection === 'vertical-inverted'
        ? GESTURE_RESPONSE_DISTANCE_VERTICAL
        : GESTURE_RESPONSE_DISTANCE_HORIZONTAL;

    if (gestureDirection === 'vertical') {
      return {
        maxDeltaX: 15,
        minOffsetY: 5,
        hitSlop: { bottom: -layout.height + distance },
        enableTrackpadTwoFingerGesture,
      };
    } else if (gestureDirection === 'vertical-inverted') {
      return {
        maxDeltaX: 15,
        minOffsetY: -5,
        hitSlop: { top: -layout.height + distance },
        enableTrackpadTwoFingerGesture,
      };
    } else {
      const hitSlop = -layout.width + distance;
      const invertedMultiplier = getInvertedMultiplier(gestureDirection);

      if (invertedMultiplier === 1) {
        return {
          minOffsetX: 5,
          maxDeltaY: 20,
          hitSlop: { right: hitSlop },
          enableTrackpadTwoFingerGesture,
        };
      } else {
        return {
          minOffsetX: -5,
          maxDeltaY: 20,
          hitSlop: { left: hitSlop },
          enableTrackpadTwoFingerGesture,
        };
      }
    }
  }

  private contentRef = React.createRef<View>();

  render() {
    const {
      styleInterpolator,
      // index,
      interpolationIndex,
      current,
      gesture,
      next,
      layout,
      insets,
      overlay,
      overlayEnabled,
      shadowEnabled,
      gestureEnabled,
      gestureDirection,
      pageOverflowEnabled,
      headerDarkContent,
      children,
      containerStyle: customContainerStyle,
      contentStyle,
      ...rest
    } = this.props;

    const interpolationProps = this.getCardAnimation(
      interpolationIndex,
      current,
      next,
      layout,
      insets.top,
      insets.right,
      insets.bottom,
      insets.left
    );

    const interpolatedStyle = this.getInterpolatedStyle(
      styleInterpolator,
      interpolationProps
    );

    const { containerStyle, cardStyle, overlayStyle, shadowStyle } =
      interpolatedStyle;

    const handleGestureEvent = gestureEnabled
      ? Animated.event(
          [
            {
              nativeEvent:
                gestureDirection === 'vertical' ||
                gestureDirection === 'vertical-inverted'
                  ? { translationY: gesture }
                  : { translationX: gesture },
            },
          ],
          { useNativeDriver }
        )
      : undefined;

    const { backgroundColor } = StyleSheet.flatten(contentStyle || {});
    const isTransparent =
      typeof backgroundColor === 'string'
        ? Color(backgroundColor).alpha() === 0
        : false;

    return (
      <CardAnimationContext.Provider value={interpolationProps}>
        {
          // StatusBar messes with translucent status bar on Android
          // So we should only enable it on iOS
          Platform.OS === 'ios' &&
          overlayEnabled &&
          interpolationIndex === 0 &&
          next &&
          styleInterpolator === forModalPresentationIOS ? (
            <ModalStatusBarManager
              dark={headerDarkContent}
              layout={layout}
              insets={insets}
              style={cardStyle}
            />
          ) : null
        }
        <Animated.View
          style={{
            // This is a dummy style that doesn't actually change anything visually.
            // Animated needs the animated value to be used somewhere, otherwise things don't update properly.
            // If we disable animations and hide header, it could end up making the value unused.
            // So we have this dummy style that will always be used regardless of what else changed.
            opacity: current,
          }}
          // Make sure that this view isn't removed. If this view is removed, our style with animated value won't apply
          collapsable={false}
        />
        <View pointerEvents="box-none" {...rest}>
          {overlayEnabled ? (
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              {overlay({ style: overlayStyle })}
            </View>
          ) : null}
          <Animated.View
            style={[styles.container, containerStyle, customContainerStyle]}
            pointerEvents="box-none"
          >
            <PanGestureHandler
              enabled={layout.width !== 0 && gestureEnabled}
              onGestureEvent={handleGestureEvent}
              onHandlerStateChange={this.handleGestureStateChange}
              {...this.gestureActivationCriteria()}
            >
              <Animated.View
                needsOffscreenAlphaCompositing={hasOpacityStyle(cardStyle)}
                style={[styles.container, cardStyle]}
              >
                {shadowEnabled && shadowStyle && !isTransparent ? (
                  <Animated.View
                    style={[
                      styles.shadow,
                      gestureDirection === 'horizontal'
                        ? [styles.shadowHorizontal, styles.shadowLeft]
                        : gestureDirection === 'horizontal-inverted'
                        ? [styles.shadowHorizontal, styles.shadowRight]
                        : gestureDirection === 'vertical'
                        ? [styles.shadowVertical, styles.shadowTop]
                        : [styles.shadowVertical, styles.shadowBottom],
                      { backgroundColor },
                      shadowStyle,
                    ]}
                    pointerEvents="none"
                  />
                ) : null}
                <CardSheet
                  ref={this.contentRef}
                  enabled={pageOverflowEnabled}
                  layout={layout}
                  style={contentStyle}
                >
                  {children}
                </CardSheet>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </View>
      </CardAnimationContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  shadow: {
    position: 'absolute',
    shadowRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  shadowHorizontal: {
    top: 0,
    bottom: 0,
    width: 3,
    shadowOffset: { width: -1, height: 1 },
  },
  shadowLeft: {
    left: 0,
  },
  shadowRight: {
    right: 0,
  },
  shadowVertical: {
    left: 0,
    right: 0,
    height: 3,
    shadowOffset: { width: 1, height: -1 },
  },
  shadowTop: {
    top: 0,
  },
  shadowBottom: {
    bottom: 0,
  },
});
