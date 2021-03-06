import * as React from 'react';
import {
  Animated,
  View,
  StyleSheet,
  LayoutChangeEvent,
  Platform,
  ViewStyle,
} from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { Route } from '@react-navigation/native';
import HeaderBackButton from './HeaderBackButton';
import HeaderBackground from './HeaderBackground';
import HeaderShownContext from '../../utils/HeaderShownContext';
import memoize from '../../utils/memoize';
import type {
  Layout,
  StackHeaderStyleInterpolator,
  StackHeaderLeftButtonProps,
  StackHeaderTitleProps,
  StackHeaderOptions,
  Scene,
} from '../../types';

type Props = StackHeaderOptions & {
  headerTitle: (props: StackHeaderTitleProps) => React.ReactNode;
  layout: Layout;
  insets: EdgeInsets;
  onGoBack?: () => void;
  title?: string;
  leftLabel?: string;
  scene: Scene<Route<string>>;
  styleInterpolator: StackHeaderStyleInterpolator;
};

const warnIfHeaderStylesDefined = (styles: Record<string, any>) => {
  Object.keys(styles).forEach((styleProp) => {
    const value = styles[styleProp];

    if (styleProp === 'position' && value === 'absolute') {
      console.warn(
        "position: 'absolute' is not supported on headerStyle. If you would like to render content under the header, use the 'headerTransparent' navigationOption."
      );
    } else if (value !== undefined) {
      console.warn(
        `${styleProp} was given a value of ${value}, this has no effect on headerStyle.`
      );
    }
  });
};

export const getDefaultHeaderHeight = (
  layout: Layout,
  statusBarHeight: number
): number => {
  const isLandscape = layout.width > layout.height;

  let headerHeight;

  if (Platform.OS === 'ios') {
    if (isLandscape && !Platform.isPad) {
      headerHeight = 32;
    } else {
      headerHeight = 44;
    }
  } else if (Platform.OS === 'android') {
    headerHeight = 56;
  } else {
    headerHeight = 64;
  }

  return headerHeight + statusBarHeight;
};

export default function HeaderSegment(props: Props) {
  const [leftLabelLayout, setLeftLabelLayout] = React.useState<
    Layout | undefined
  >(undefined);

  const [titleLayout, setTitleLayout] = React.useState<Layout | undefined>(
    undefined
  );

  const isParentHeaderShown = React.useContext(HeaderShownContext);

  const handleTitleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    setTitleLayout((titleLayout) => {
      if (
        titleLayout &&
        height === titleLayout.height &&
        width === titleLayout.width
      ) {
        return titleLayout;
      }

      return { height, width };
    });
  };

  const handleLeftLabelLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    if (
      leftLabelLayout &&
      height === leftLabelLayout.height &&
      width === leftLabelLayout.width
    ) {
      return;
    }

    setLeftLabelLayout({ height, width });
  };

  const getInterpolatedStyle = memoize(
    (
      styleInterpolator: StackHeaderStyleInterpolator,
      layout: Layout,
      current: Animated.AnimatedInterpolation,
      next: Animated.AnimatedInterpolation | undefined,
      titleLayout: Layout | undefined,
      leftLabelLayout: Layout | undefined,
      headerHeight: number
    ) =>
      styleInterpolator({
        current: { progress: current },
        next: next && { progress: next },
        layouts: {
          header: {
            height: headerHeight,
            width: layout.width,
          },
          screen: layout,
          title: titleLayout,
          leftLabel: leftLabelLayout,
        },
      })
  );

  const {
    scene,
    layout,
    insets,
    title: currentTitle,
    leftLabel: previousTitle,
    onGoBack,
    headerTitle,
    headerTitleAlign = Platform.select({
      ios: 'center',
      default: 'left',
    }),
    headerLeft: left = onGoBack
      ? (props: StackHeaderLeftButtonProps) => <HeaderBackButton {...props} />
      : undefined,
    headerTransparent,
    headerTintColor,
    headerBackground,
    headerRight: right,
    headerBackImage: backImage,
    headerBackTitle: leftLabel,
    headerBackTitleVisible,
    headerTruncatedBackTitle: truncatedLabel,
    headerPressColorAndroid: pressColorAndroid,
    headerBackAccessibilityLabel: backAccessibilityLabel,
    headerBackAllowFontScaling: backAllowFontScaling,
    headerTitleAllowFontScaling: titleAllowFontScaling,
    headerTitleStyle: customTitleStyle,
    headerBackTitleStyle: customLeftLabelStyle,
    headerLeftContainerStyle: leftContainerStyle,
    headerRightContainerStyle: rightContainerStyle,
    headerTitleContainerStyle: titleContainerStyle,
    headerStyle: customHeaderStyle,
    headerDefaultBackIconStyle,
    headerStatusBarHeight = isParentHeaderShown ? 0 : insets.top,
    styleInterpolator,
  } = props;

  const defaultHeight = getDefaultHeaderHeight(layout, headerStatusBarHeight);

  const {
    height = defaultHeight,
    minHeight,
    maxHeight,
    backgroundColor,
    borderBottomColor,
    borderBottomEndRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderBottomStartRadius,
    borderBottomWidth,
    borderColor,
    borderEndColor,
    borderEndWidth,
    borderLeftColor,
    borderLeftWidth,
    borderRadius,
    borderRightColor,
    borderRightWidth,
    borderStartColor,
    borderStartWidth,
    borderStyle,
    borderTopColor,
    borderTopEndRadius,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderTopStartRadius,
    borderTopWidth,
    borderWidth,
    // @ts-expect-error: web support for shadow
    boxShadow,
    elevation,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    opacity,
    transform,
    ...unsafeStyles
  } = StyleSheet.flatten(customHeaderStyle || {}) as ViewStyle;

  if (process.env.NODE_ENV !== 'production') {
    warnIfHeaderStylesDefined(unsafeStyles);
  }

  const safeStyles: ViewStyle = {
    backgroundColor,
    borderBottomColor,
    borderBottomEndRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderBottomStartRadius,
    borderBottomWidth,
    borderColor,
    borderEndColor,
    borderEndWidth,
    borderLeftColor,
    borderLeftWidth,
    borderRadius,
    borderRightColor,
    borderRightWidth,
    borderStartColor,
    borderStartWidth,
    borderStyle,
    borderTopColor,
    borderTopEndRadius,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderTopStartRadius,
    borderTopWidth,
    borderWidth,
    // @ts-expect-error: boxShadow is only for Web
    boxShadow,
    elevation,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    opacity,
    transform,
  };

  // Setting a property to undefined triggers default style
  // So we need to filter them out
  // Users can use `null` instead
  for (const styleProp in safeStyles) {
    // @ts-expect-error: typescript wrongly complains that styleProp cannot be used to index safeStyles
    if (safeStyles[styleProp] === undefined) {
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete safeStyles[styleProp];
    }
  }

  const {
    titleStyle,
    leftButtonStyle,
    leftLabelStyle,
    rightButtonStyle,
    backgroundStyle,
  } = getInterpolatedStyle(
    styleInterpolator,
    layout,
    scene.progress.current,
    scene.progress.next,
    titleLayout,
    previousTitle ? leftLabelLayout : undefined,
    typeof height === 'number' ? height : defaultHeight
  );

  const leftButton = left
    ? left({
        backImage,
        pressColorAndroid,
        accessibilityLabel: backAccessibilityLabel,
        allowFontScaling: backAllowFontScaling,
        onPress: onGoBack,
        labelVisible: headerBackTitleVisible,
        label: leftLabel !== undefined ? leftLabel : previousTitle,
        truncatedLabel,
        labelStyle: [leftLabelStyle, customLeftLabelStyle],
        onLabelLayout: handleLeftLabelLayout,
        screenLayout: layout,
        titleLayout,
        headerDefaultBackIconStyle,
        tintColor: headerTintColor,
        canGoBack: Boolean(onGoBack),
      })
    : null;

  const rightButton = right ? right({ tintColor: headerTintColor }) : null;

  return (
    <React.Fragment>
      <Animated.View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFill, { zIndex: 0 }, backgroundStyle]}
      >
        {headerBackground ? (
          headerBackground({ style: safeStyles })
        ) : headerTransparent ? null : (
          <HeaderBackground style={safeStyles} />
        )}
      </Animated.View>
      <Animated.View
        pointerEvents="box-none"
        style={[{ height, minHeight, maxHeight, opacity, transform }]}
      >
        <View pointerEvents="none" style={{ height: headerStatusBarHeight }} />
        <View pointerEvents="box-none" style={styles.content}>
          {leftButton ? (
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.left,
                { left: insets.left },
                leftButtonStyle,
                leftContainerStyle,
              ]}
            >
              {leftButton}
            </Animated.View>
          ) : null}
          <Animated.View
            pointerEvents="box-none"
            style={[
              headerTitleAlign === 'left'
                ? {
                    position: 'absolute',
                    left: (leftButton ? 72 : 16) + insets.left,
                    right: (rightButton ? 72 : 16) + insets.right,
                  }
                : {
                    marginHorizontal:
                      (leftButton ? 32 : 16) +
                      (leftButton && headerBackTitleVisible !== false
                        ? 40
                        : 0) +
                      Math.max(insets.left, insets.right),
                  },
              titleStyle,
              titleContainerStyle,
            ]}
          >
            {headerTitle({
              children: currentTitle,
              onLayout: handleTitleLayout,
              allowFontScaling: titleAllowFontScaling,
              tintColor: headerTintColor,
              style: customTitleStyle,
            })}
          </Animated.View>
          {rightButton ? (
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.right,
                { right: insets.right },
                rightButtonStyle,
                rightContainerStyle,
              ]}
            >
              {rightButton}
            </Animated.View>
          ) : null}
        </View>
      </Animated.View>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  right: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
