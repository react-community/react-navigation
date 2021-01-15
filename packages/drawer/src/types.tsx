import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import type Animated from 'react-native-reanimated';
import type { PanGestureHandlerProperties } from 'react-native-gesture-handler';
import type {
  Route,
  ParamListBase,
  NavigationProp,
  Descriptor,
  NavigationHelpers,
  DrawerNavigationState,
  DrawerActionHelpers,
  RouteProp,
} from '@react-navigation/native';

export type Scene = {
  route: Route<string>;
  focused: boolean;
  color?: string;
};

export type Layout = { width: number; height: number };

export type DrawerNavigationConfig<T = DrawerContentOptions> = {
  /**
   * Position of the drawer on the screen. Defaults to `left`.
   */
  drawerPosition?: 'left' | 'right';
  /**
   * Type of the drawer. It determines how the drawer looks and animates.
   * - `front`: Traditional drawer which covers the screen with a overlay behind it.
   * - `back`: The drawer is revealed behind the screen on swipe.
   * - `slide`: Both the screen and the drawer slide on swipe to reveal the drawer.
   * - `permanent`: A permanent drawer is shown as a sidebar.
   */
  drawerType?: 'front' | 'back' | 'slide' | 'permanent';
  /**
   * How far from the edge of the screen the swipe gesture should activate.
   * Not supported on Web.
   */
  edgeWidth?: number;
  /**
   * Whether the statusbar should be hidden when the drawer is pulled or opens,
   */
  hideStatusBar?: boolean;
  /**
   * Whether the keyboard should be dismissed when the swipe gesture begins.
   * Defaults to `'on-drag'`. Set to `'none'` to disable keyboard handling.
   */
  keyboardDismissMode?: 'on-drag' | 'none';
  /**
   * Minimum swipe distance threshold that should activate opening the drawer.
   */
  minSwipeDistance?: number;
  /**
   * Color of the overlay to be displayed on top of the content view when drawer gets open.
   * The opacity is animated from `0` to `1` when the drawer opens.
   */
  overlayColor?: string;
  /**
   * Animation of the statusbar when hiding it. use in combination with `hideStatusBar`.
   */
  statusBarAnimation?: 'slide' | 'none' | 'fade';
  /**
   * Props to pass to the underlying pan gesture handler.
   * Not supported on Web.
   */
  gestureHandlerProps?: PanGestureHandlerProperties;
  /**
   * Whether the screens should render the first time they are accessed. Defaults to `true`.
   * Set it to `false` if you want to render all screens on initial render.
   */
  lazy?: boolean;
  /**
   * Function that returns React element to render as the content of the drawer, for example, navigation items.
   * Defaults to `DrawerContent`.
   */
  drawerContent?: (props: DrawerContentComponentProps<T>) => React.ReactNode;
  /**
   * Options for the content component which will be passed as props.
   */
  drawerContentOptions?: T;
  /**
   * Style object for the component wrapping the screen content.
   */
  sceneContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Style object for the drawer component.
   * You can pass a custom background color for a drawer or a custom width here.
   */
  drawerStyle?: StyleProp<ViewStyle>;
  /**
   * Whether inactive screens should be detached from the view hierarchy to save memory.
   * Make sure to call `enableScreens` from `react-native-screens` to make it work.
   * Defaults to `true`.
   */
  detachInactiveScreens?: boolean;
};

export type DrawerHeaderOptions = {
  /**
   * String or a function that returns a React Element to be used by the header.
   * Defaults to scene `title`.
   * It receives `allowFontScaling`, `tintColor`, `style` and `children` in the options object as an argument.
   * The title string is passed in `children`.
   */
  headerTitle?:
    | string
    | ((props: {
        /**
         * Whether title font should scale to respect Text Size accessibility settings.
         */
        allowFontScaling?: boolean;
        /**
         * Tint color for the header.
         */
        tintColor?: string;
        /**
         * Content of the title element. Usually the title string.
         */
        children?: string;
        /**
         * Style object for the title element.
         */
        style?: StyleProp<TextStyle>;
      }) => React.ReactNode);
  /**
   * How to align the the header title.
   * Defaults to `center` on iOS and `left` on Android.
   */
  headerTitleAlign?: 'left' | 'center';
  /**
   * Style object for the title component.
   */
  headerTitleStyle?: StyleProp<TextStyle>;
  /**
   * Whether header title font should scale to respect Text Size accessibility settings. Defaults to `false`.
   */
  headerTitleAllowFontScaling?: boolean;
  /**
   * Function which returns a React Element to display on the left side of the header.
   */
  headerLeft?: (props: { tintColor?: string }) => React.ReactNode;
  /**
   * Accessibility label for the header left button.
   */
  headerLeftAccessibilityLabel?: string;
  /**
   * Function which returns a React Element to display on the right side of the header.
   */
  headerRight?: (props: { tintColor?: string }) => React.ReactNode;
  /**
   * Color for material ripple (Android >= 5.0 only).
   */
  headerPressColorAndroid?: string;
  /**
   * Tint color for the header.
   */
  headerTintColor?: string;
  /**
   * Style object for the header. You can specify a custom background color here, for example.
   */
  headerStyle?: StyleProp<ViewStyle>;
  /**
   * Extra padding to add at the top of header to account for translucent status bar.
   * By default, it uses the top value from the safe area insets of the device.
   * Pass 0 or a custom value to disable the default behaviour, and customize the height.
   */
  headerStatusBarHeight?: number;
};

export type DrawerNavigationOptions = DrawerHeaderOptions & {
  /**
   * Title text for the screen.
   */
  title?: string;

  /**
   * Function that given `HeaderProps` returns a React Element to display as a header.
   */
  header?: (props: DrawerHeaderProps) => React.ReactNode;

  /**
   * Whether to show the header. The header is not shown by default.
   * Setting this to `true` shows the header.
   */
  headerShown?: boolean;

  /**
   * Title string of a screen displayed in the drawer
   * or a function that given { focused: boolean, color: string } returns a React.Node
   * When undefined, scene title is used.
   */
  drawerLabel?:
    | string
    | ((props: { color: string; focused: boolean }) => React.ReactNode);

  /**
   * A function that given { focused: boolean, color: string } returns a React.Node to display an icon the drawer.
   */
  drawerIcon?: (props: {
    color: string;
    size: number;
    focused: boolean;
  }) => React.ReactNode;

  /**
   * Whether you can use gestures to open or close the drawer.
   * Setting this to `false` disables swipe gestures as well as tap on overlay to close.
   * See `swipeEnabled` to disable only the swipe gesture.
   * Defaults to `true`.
   * Not supported on Web.
   */
  gestureEnabled?: boolean;

  /**
   * Whether you can use swipe gestures to open or close the drawer.
   * Defaults to `true`.
   * Not supported on Web.
   */
  swipeEnabled?: boolean;

  /**
   * Whether this screen should be unmounted when navigating away from it.
   * Defaults to `false`.
   */
  unmountOnBlur?: boolean;
};

export type DrawerContentComponentProps<T = DrawerContentOptions> = T & {
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
  /**
   * Animated node which represents the current progress of the drawer's open state.
   * `0` is closed, `1` is open.
   */
  progress: Animated.Node<number>;
};

export type DrawerContentOptions = {
  /**
   * Color for the icon and label in the active item in the drawer.
   */
  activeTintColor?: string;
  /**
   * Background color for the active item in the drawer.
   */
  activeBackgroundColor?: string;
  /**
   * Color for the icon and label in the inactive items in the drawer.
   */
  inactiveTintColor?: string;
  /**
   * Background color for the inactive items in the drawer.
   */
  inactiveBackgroundColor?: string;
  /**
   * Style object for the single item, which can contain an icon and/or a label.
   */
  itemStyle?: StyleProp<ViewStyle>;
  /**
   * Style object to apply to the `View` that wrap Text label.
   */
  labelContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Style object to apply to the `Text` inside content section which renders a label.
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Style object for the content section.
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Style object for the wrapper view.
   */
  style?: StyleProp<ViewStyle>;
};

export type DrawerHeaderProps = {
  /**
   * Layout of the screen.
   */
  layout: Layout;
  /**
   * Object representing the current scene, such as the route object and descriptor.
   */
  scene: {
    route: Route<string>;
    descriptor: DrawerDescriptor;
  };
};

export type DrawerNavigationEventMap = {
  /**
   * Event which fires when the drawer opens.
   */
  drawerOpen: { data: undefined };
  /**
   * Event which fires when the drawer closes.
   */
  drawerClose: { data: undefined };
};

export type DrawerNavigationHelpers = NavigationHelpers<
  ParamListBase,
  DrawerNavigationEventMap
> &
  DrawerActionHelpers<ParamListBase>;

export type DrawerNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string
> = NavigationProp<
  ParamList,
  RouteName,
  DrawerNavigationState<ParamList>,
  DrawerNavigationOptions,
  DrawerNavigationEventMap
> &
  DrawerActionHelpers<ParamList>;

export type DrawerScreenProps<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string
> = {
  navigation: DrawerNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, RouteName>;
};

export type DrawerDescriptor = Descriptor<
  ParamListBase,
  string,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationOptions
>;

export type DrawerDescriptorMap = {
  [key: string]: DrawerDescriptor;
};
