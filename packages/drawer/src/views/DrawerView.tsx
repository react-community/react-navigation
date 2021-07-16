import {
  getHeaderTitle,
  Header,
  SafeAreaProviderCompat,
  Screen,
} from '@react-navigation/elements';
import {
  DrawerActions,
  DrawerNavigationState,
  ParamListBase,
  useTheme,
} from '@react-navigation/native';
import * as React from 'react';
import {
  BackHandler,
  I18nManager,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import type {
  DrawerContentComponentProps,
  DrawerDescriptorMap,
  DrawerHeaderProps,
  DrawerNavigationConfig,
  DrawerNavigationHelpers,
  DrawerNavigationProp,
  DrawerProps,
} from '../types';
import DrawerPositionContext from '../utils/DrawerPositionContext';
import DrawerStatusContext from '../utils/DrawerStatusContext';
import getDrawerStatusFromState from '../utils/getDrawerStatusFromState';
import DrawerContent from './DrawerContent';
import DrawerToggleButton from './DrawerToggleButton';
import { GestureHandlerRootView } from './GestureHandler';
import { MaybeScreen, MaybeScreenContainer } from './ScreenFallback';

type Props = DrawerNavigationConfig & {
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

const getDefaultDrawerWidth = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  /*
   * Default drawer width is screen width - header height
   * with a max width of 280 on mobile and 320 on tablet
   * https://material.io/components/navigation-drawer
   */
  const smallerAxisSize = Math.min(height, width);
  const isLandscape = width > height;
  const isTablet = smallerAxisSize >= 600;
  const appBarHeight = Platform.OS === 'ios' ? (isLandscape ? 32 : 44) : 56;
  const maxWidth = isTablet ? 320 : 280;

  return Math.min(smallerAxisSize - appBarHeight, maxWidth);
};

const GestureHandlerWrapper = GestureHandlerRootView ?? View;

function DrawerViewBase({
  state,
  navigation,
  descriptors,
  drawerContent = (props: DrawerContentComponentProps) => (
    <DrawerContent {...props} />
  ),
  detachInactiveScreens = Platform.OS === 'web' ||
    Platform.OS === 'android' ||
    Platform.OS === 'ios',
  // Running in chrome debugger
  // @ts-expect-error
  useLegacyImplementation = !global.nativeCallSyncHook ||
    // Reanimated 2 is not configured
    // @ts-expect-error: the type definitions are incomplete
    !Animated.isConfigured?.(),
}: Props) {
  const Drawer: React.ComponentType<DrawerProps> = useLegacyImplementation
    ? require('./legacy/Drawer').default
    : require('./modern/Drawer').default;

  const focusedRouteKey = state.routes[state.index].key;
  const {
    drawerHideStatusBarOnOpen = false,
    drawerPosition = I18nManager.isRTL ? 'right' : 'left',
    drawerStatusBarAnimation = 'slide',
    drawerStyle,
    drawerType = Platform.select({ ios: 'slide', default: 'front' }),
    gestureHandlerProps,
    keyboardDismissMode = 'on-drag',
    overlayColor = 'rgba(0, 0, 0, 0.5)',
    swipeEdgeWidth = 32,
    swipeEnabled = Platform.OS !== 'web' &&
      Platform.OS !== 'windows' &&
      Platform.OS !== 'macos',
    swipeMinDistance = 60,
  } = descriptors[focusedRouteKey].options;

  const [loaded, setLoaded] = React.useState([focusedRouteKey]);

  if (!loaded.includes(focusedRouteKey)) {
    setLoaded([...loaded, focusedRouteKey]);
  }

  const dimensions = useSafeAreaFrame();

  const { colors } = useTheme();

  const drawerStatus = getDrawerStatusFromState(state);

  const handleDrawerOpen = React.useCallback(() => {
    navigation.dispatch({
      ...DrawerActions.openDrawer(),
      target: state.key,
    });
  }, [navigation, state.key]);

  const handleDrawerClose = React.useCallback(() => {
    navigation.dispatch({
      ...DrawerActions.closeDrawer(),
      target: state.key,
    });
  }, [navigation, state.key]);

  React.useEffect(() => {
    if (drawerStatus !== 'open' || drawerType === 'permanent') {
      return;
    }

    const handleClose = () => {
      // We shouldn't handle the back button if the parent screen isn't focused
      // This will avoid the drawer overriding event listeners from a focused screen
      if (!navigation.isFocused()) {
        return false;
      }

      handleDrawerClose();

      return true;
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // We only add the listeners when drawer opens
    // This way we can make sure that the listener is added as late as possible
    // This will make sure that our handler will run first when back button is pressed
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleClose
    );

    if (Platform.OS === 'web') {
      document?.body?.addEventListener?.('keyup', handleEscape);
    }

    return () => {
      subscription.remove();

      if (Platform.OS === 'web') {
        document?.body?.removeEventListener?.('keyup', handleEscape);
      }
    };
  }, [drawerStatus, drawerType, handleDrawerClose, navigation]);

  const renderDrawerContent = () => {
    return (
      <DrawerPositionContext.Provider value={drawerPosition}>
        {drawerContent({
          state: state,
          navigation: navigation,
          descriptors: descriptors,
        })}
      </DrawerPositionContext.Provider>
    );
  };

  const renderSceneContent = () => {
    return (
      <MaybeScreenContainer
        enabled={detachInactiveScreens}
        style={styles.content}
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const { lazy = true, unmountOnBlur } = descriptor.options;
          const isFocused = state.index === index;

          if (unmountOnBlur && !isFocused) {
            return null;
          }

          if (lazy && !loaded.includes(route.key) && !isFocused) {
            // Don't render a lazy screen if we've never navigated to it
            return null;
          }

          const {
            header = ({ layout, options }: DrawerHeaderProps) => (
              <Header
                {...options}
                layout={layout}
                title={getHeaderTitle(options, route.name)}
                headerLeft={
                  options.headerLeft ??
                  ((props) => <DrawerToggleButton {...props} />)
                }
              />
            ),
            sceneContainerStyle,
          } = descriptor.options;

          return (
            <MaybeScreen
              key={route.key}
              style={[StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]}
              visible={isFocused}
              enabled={detachInactiveScreens}
            >
              <Screen
                focused={isFocused}
                route={descriptor.route}
                navigation={descriptor.navigation}
                headerShown={descriptor.options.headerShown}
                headerStatusBarHeight={descriptor.options.headerStatusBarHeight}
                header={header({
                  layout: dimensions,
                  route: descriptor.route,
                  navigation:
                    descriptor.navigation as DrawerNavigationProp<ParamListBase>,
                  options: descriptor.options,
                })}
                style={sceneContainerStyle}
              >
                {descriptor.render()}
              </Screen>
            </MaybeScreen>
          );
        })}
      </MaybeScreenContainer>
    );
  };

  return (
    <DrawerStatusContext.Provider value={drawerStatus}>
      <Drawer
        open={drawerStatus !== 'closed'}
        onOpen={handleDrawerOpen}
        onClose={handleDrawerClose}
        gestureHandlerProps={gestureHandlerProps}
        swipeEnabled={swipeEnabled}
        swipeEdgeWidth={swipeEdgeWidth}
        swipeVelocityThreshold={500}
        swipeDistanceThreshold={swipeMinDistance}
        hideStatusBarOnOpen={drawerHideStatusBarOnOpen}
        statusBarAnimation={drawerStatusBarAnimation}
        keyboardDismissMode={keyboardDismissMode}
        drawerType={drawerType}
        drawerPosition={drawerPosition}
        drawerStyle={[
          {
            width: getDefaultDrawerWidth(dimensions),
            backgroundColor: colors.card,
          },
          drawerType === 'permanent' &&
            (drawerPosition === 'left'
              ? {
                  borderRightColor: colors.border,
                  borderRightWidth: StyleSheet.hairlineWidth,
                }
              : {
                  borderLeftColor: colors.border,
                  borderLeftWidth: StyleSheet.hairlineWidth,
                }),
          drawerStyle,
        ]}
        overlayStyle={{ backgroundColor: overlayColor }}
        renderDrawerContent={renderDrawerContent}
        renderSceneContent={renderSceneContent}
        dimensions={dimensions}
      />
    </DrawerStatusContext.Provider>
  );
}

export default function DrawerView({ navigation, ...rest }: Props) {
  return (
    <SafeAreaProviderCompat>
      <GestureHandlerWrapper style={styles.content}>
        <DrawerViewBase navigation={navigation} {...rest} />
      </GestureHandlerWrapper>
    </SafeAreaProviderCompat>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
