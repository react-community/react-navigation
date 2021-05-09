import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import type { SceneRendererProps, TabViewProps } from 'react-native-tab-view';
import type {
  ParamListBase,
  Descriptor,
  NavigationHelpers,
  Route,
  NavigationProp,
  TabNavigationState,
  TabActionHelpers,
  RouteProp,
} from '@react-navigation/native';

export type MaterialTopTabNavigationEventMap = {
  /**
   * Event which fires on tapping on the tab in the tab bar.
   */
  tabPress: { data: undefined; canPreventDefault: true };
  /**
   * Event which fires on long press on the tab in the tab bar.
   */
  tabLongPress: { data: undefined };
  /**
   * Event which fires when a swipe gesture starts, i.e. finger touches the screen.
   */
  swipeStart: { data: undefined };
  /**
   * Event which fires when a swipe gesture ends, i.e. finger leaves the screen.
   */
  swipeEnd: { data: undefined };
};

export type MaterialTopTabNavigationHelpers = NavigationHelpers<
  ParamListBase,
  MaterialTopTabNavigationEventMap
> &
  TabActionHelpers<ParamListBase>;

export type MaterialTopTabNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList
> = NavigationProp<
  ParamList,
  RouteName,
  TabNavigationState<ParamList>,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap
> &
  TabActionHelpers<ParamList>;

export type MaterialTopTabScreenProps<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList
> = {
  navigation: MaterialTopTabNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, RouteName>;
};

export type MaterialTopTabNavigationOptions = {
  /**
   * Title text for the screen.
   */
  title?: string;

  /**
   * Whether this screens should render the first time it's accessed. Defaults to `false`.
   */
  lazy?: boolean;

  /**
   * Function that returns a React element to render if this screen hasn't been rendered yet.
   * The `lazy` option also needs to be enabled for this to work.
   *
   * This view is usually only shown for a split second. Keep it lightweight.
   *
   * By default, this renders null.
   */
  lazyPlaceholder?: () => React.ReactNode;

  /**
   * Title string of a tab displayed in the tab bar
   * or a function that given { focused: boolean, color: string } returns a React.Node, to display in tab bar.
   *
   * When undefined, scene title is used. Use `tabBarShowLabel` to hide the label.
   */
  tabBarLabel?:
    | string
    | ((props: { focused: boolean; color: string }) => React.ReactNode);

  /**
   * A function that given { focused: boolean, color: string } returns a React.Node to display in the tab bar.
   */
  tabBarIcon?: (props: { focused: boolean; color: string }) => React.ReactNode;

  /**
   * Accessibility label for the tab button. This is read by the screen reader when the user taps the tab.
   * It's recommended to set this if you don't have a label for the tab.
   */
  tabBarAccessibilityLabel?: string;

  /**
   * ID to locate this tab button in tests.
   */
  tabBarTestID?: string;

  /**
   * Color for the icon and label in the active tab.
   */
  tabBarActiveTintColor?: string;

  /**
   * Color for the icon and label in the inactive tabs.
   */
  tabBarInactiveTintColor?: string;

  /**
   * Color for material ripple (Android >= 5.0 only).
   */
  tabBarPressColor?: string;

  /**
   * Opacity for pressed tab (iOS and Android < 5.0 only).
   */
  tabBarPressOpacity?: number;

  /**
   * Whether the tab label should be visible. Defaults to `true`.
   */
  tabBarShowLabel?: boolean;

  /**
   * Whether the tab icon should be visible. Defaults to `false`.
   */
  tabBarShowIcon?: boolean;

  /**
   * Whether label font should scale to respect Text Size accessibility settings.
   */
  tabBarAllowFontScaling?: boolean;

  /**
   * Boolean indicating whether the tab bar bounces when overscrolling.
   */
  tabBarBounces?: boolean;

  /**
   * Boolean indicating whether to make the tab bar scrollable.
   *
   * If you set this to `true`, you should also specify a width in `tabBarItemStyle` to improve the performance of initial render.
   */
  tabBarScrollEnabled?: boolean;

  /**
   * Style object for the tab icon container.
   */
  tabBarIconStyle?: StyleProp<ViewStyle>;

  /**
   * Style object for the tab label.
   */
  tabBarLabelStyle?: StyleProp<TextStyle>;

  /**
   * Style object for the individual tab items.
   */
  tabBarItemStyle?: StyleProp<ViewStyle>;

  /**
   * Style object for the tab bar indicator.
   */
  tabBarIndicatorStyle?: StyleProp<ViewStyle>;

  /**
   * Style object for the view containing the tab bar indicator.
   */
  tabBarIndicatorContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Style object for the view containing the tab items.
   */
  tabBarContentContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Style object for the the tab bar.
   */
  tabBarStyle?: StyleProp<ViewStyle>;
};

export type MaterialTopTabDescriptor = Descriptor<
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

export type MaterialTopTabDescriptorMap = Record<
  string,
  MaterialTopTabDescriptor
>;

export type MaterialTopTabNavigationConfig = Omit<
  TabViewProps<Route<string>>,
  | 'navigationState'
  | 'onIndexChange'
  | 'onSwipeStart'
  | 'onSwipeEnd'
  | 'renderScene'
  | 'renderTabBar'
  | 'renderLazyPlaceholder'
  | 'lazy'
> & {
  /**
   * Callback for tab index change
   */
  onIndexChange?: (index: number) => void;
  /**
   * Function that returns a React element to display as the tab bar.
   */
  tabBar?: (props: MaterialTopTabBarProps) => React.ReactNode;
};

export type MaterialTopTabBarProps = SceneRendererProps & {
  state: TabNavigationState<ParamListBase>;
  navigation: NavigationHelpers<
    ParamListBase,
    MaterialTopTabNavigationEventMap
  >;
  descriptors: MaterialTopTabDescriptorMap;
};
