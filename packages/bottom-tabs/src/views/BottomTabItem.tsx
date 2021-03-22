import React from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { Link, Route, useTheme } from '@react-navigation/native';
import Color from 'color';

import TabBarIcon from './TabBarIcon';
import type { BottomTabBarButtonProps, LabelPosition } from '../types';

type Props = {
  /**
   * Whether the tab is focused.
   */
  focused: boolean;
  /**
   * The route object which should be specified by the tab.
   */
  route: Route<string>;
  /**
   * The label text of the tab.
   */
  label:
    | string
    | ((props: {
        focused: boolean;
        color: string;
        position: LabelPosition;
      }) => React.ReactNode);
  /**
   * Icon to display for the tab.
   */
  icon: (props: {
    focused: boolean;
    size: number;
    color: string;
  }) => React.ReactNode;
  /**
   * Text to show in a badge on the tab icon.
   */
  badge?: number | string;
  /**
   * Custom style for the badge.
   */
  badgeStyle?: StyleProp<TextStyle>;
  /**
   * URL to use for the link to the tab.
   */
  to?: string;
  /**
   * The button for the tab. Uses a `TouchableWithoutFeedback` by default.
   */
  button?: (props: BottomTabBarButtonProps) => React.ReactNode;
  /**
   * The accessibility label for the tab.
   */
  accessibilityLabel?: string;
  /**
   * An unique ID for testing for the tab.
   */
  testID?: string;
  /**
   * Function to execute on press in React Native.
   * On the web, this will use onClick.
   */
  onPress: (
    e: React.MouseEvent<HTMLElement, MouseEvent> | GestureResponderEvent
  ) => void;
  /**
   * Function to execute on long press.
   */
  onLongPress: (e: GestureResponderEvent) => void;
  /**
   * Whether the label should be aligned with the icon horizontally.
   */
  horizontal: boolean;
  /**
   * Color for the icon and label when the item is active.
   */
  activeTintColor?: string;
  /**
   * Color for the icon and label when the item is inactive.
   */
  inactiveTintColor?: string;
  /**
   * Background color for item when its active.
   */
  activeBackgroundColor?: string;
  /**
   * Background color for item when its inactive.
   */
  inactiveBackgroundColor?: string;
  /**
   * Whether to show the label text for the tab.
   */
  showLabel?: boolean;
  /**
   * Whether to allow scaling the font for the label for accessibility purposes.
   */
  allowFontScaling?: boolean;
  /**
   * Style object for the label element.
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Style object for the icon element.
   */
  iconStyle?: StyleProp<ViewStyle>;
  /**
   * Style object for the wrapper element.
   */
  style?: StyleProp<ViewStyle>;
};

export default function BottomTabBarItem({
  focused,
  route,
  label,
  icon,
  badge,
  badgeStyle,
  to,
  button = ({
    children,
    style,
    onPress,
    to,
    accessibilityRole,
    ...rest
  }: BottomTabBarButtonProps) => {
    if (Platform.OS === 'web' && to) {
      // React Native Web doesn't forward `onClick` if we use `TouchableWithoutFeedback`.
      // We need to use `onClick` to be able to prevent default browser handling of links.
      return (
        <Link
          {...rest}
          to={to}
          style={[styles.button, style]}
          onPress={(e: any) => {
            if (
              !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) && // ignore clicks with modifier keys
              (e.button == null || e.button === 0) // ignore everything but left clicks
            ) {
              e.preventDefault();
              onPress?.(e);
            }
          }}
        >
          {children}
        </Link>
      );
    } else {
      return (
        <Pressable
          {...rest}
          accessibilityRole={accessibilityRole}
          onPress={onPress}
          style={style}
        >
          {children}
        </Pressable>
      );
    }
  },
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
  horizontal,
  activeTintColor: customActiveTintColor,
  inactiveTintColor: customInactiveTintColor,
  activeBackgroundColor = 'transparent',
  inactiveBackgroundColor = 'transparent',
  showLabel = true,
  allowFontScaling,
  labelStyle,
  iconStyle,
  style,
}: Props) {
  const { colors } = useTheme();

  const activeTintColor =
    customActiveTintColor === undefined
      ? colors.primary
      : customActiveTintColor;

  const inactiveTintColor =
    customInactiveTintColor === undefined
      ? Color(colors.text).mix(Color(colors.card), 0.5).hex()
      : customInactiveTintColor;

  const renderLabel = ({ focused }: { focused: boolean }) => {
    if (showLabel === false) {
      return null;
    }

    const color = focused ? activeTintColor : inactiveTintColor;

    if (typeof label === 'string') {
      return (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            { color },
            horizontal ? styles.labelBeside : styles.labelBeneath,
            labelStyle,
          ]}
          allowFontScaling={allowFontScaling}
        >
          {label}
        </Text>
      );
    }

    return label({
      focused,
      color,
      position: horizontal ? 'beside-icon' : 'below-icon',
    });
  };

  const renderIcon = ({ focused }: { focused: boolean }) => {
    if (icon === undefined) {
      return null;
    }

    const activeOpacity = focused ? 1 : 0;
    const inactiveOpacity = focused ? 0 : 1;

    return (
      <TabBarIcon
        route={route}
        horizontal={horizontal}
        badge={badge}
        badgeStyle={badgeStyle}
        activeOpacity={activeOpacity}
        inactiveOpacity={inactiveOpacity}
        activeTintColor={activeTintColor}
        inactiveTintColor={inactiveTintColor}
        renderIcon={icon}
        style={iconStyle}
      />
    );
  };

  const scene = { route, focused };

  const backgroundColor = focused
    ? activeBackgroundColor
    : inactiveBackgroundColor;

  return button({
    to,
    onPress,
    onLongPress,
    testID,
    accessibilityLabel,
    accessibilityRole: 'tab',
    accessibilityState: { selected: focused },
    // @ts-expect-error: keep for compatibility with older React Native versions
    accessibilityStates: focused ? ['selected'] : [],
    style: [
      styles.tab,
      { backgroundColor },
      horizontal ? styles.tabLandscape : styles.tabPortrait,
      style,
    ],
    children: (
      <React.Fragment>
        {renderIcon(scene)}
        {renderLabel(scene)}
      </React.Fragment>
    ),
  }) as React.ReactElement;
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabPortrait: {
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  tabLandscape: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  labelBeneath: {
    fontSize: 10,
  },
  labelBeside: {
    fontSize: 13,
    marginLeft: 20,
    marginTop: 3,
  },
  button: {
    display: 'flex',
  },
});
