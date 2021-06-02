import { HeaderTitle } from '@react-navigation/elements';
import { Route, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { I18nManager, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScreenStackHeaderBackButtonImage,
  ScreenStackHeaderCenterView,
  ScreenStackHeaderConfig,
  ScreenStackHeaderLeftView,
  ScreenStackHeaderRightView,
  ScreenStackHeaderSearchBarView,
  SearchBar,
} from 'react-native-screens';

import type { NativeStackNavigationOptions } from '../types';
import { processFonts } from './FontProcessor';

type Props = NativeStackNavigationOptions & {
  route: Route<string>;
};

export default function HeaderConfig({
  headerBackImageSource,
  headerBackTitle,
  headerBackTitleStyle,
  headerBackTitleVisible = true,
  headerBackVisible,
  headerShadowVisible,
  headerLargeStyle,
  headerLargeTitle,
  headerLargeTitleShadowVisible,
  headerLargeTitleStyle,
  headerLeft,
  headerRight,
  headerShown,
  headerStyle,
  headerBlurEffect,
  headerTintColor,
  headerTitle,
  headerTitleStyle,
  headerTranslucent,
  route,
  orientation,
  headerSearchBarOptions,
  statusBarAnimation,
  statusBarHidden,
  statusBarStyle,
  title,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const tintColor =
    headerTintColor != null
      ? headerTintColor
      : Platform.OS === 'ios'
      ? colors.primary
      : colors.text;

  const headerBackTitleStyleFlattened =
    StyleSheet.flatten(headerBackTitleStyle) || {};
  const headerLargeTitleStyleFlattened =
    StyleSheet.flatten(headerLargeTitleStyle) || {};
  const headerTitleStyleFlattened = StyleSheet.flatten(headerTitleStyle) || {};
  const headerStyleFlattened = StyleSheet.flatten(headerStyle) || {};
  const headerLargeStyleFlattened = StyleSheet.flatten(headerLargeStyle) || {};

  const [
    backTitleFontFamily,
    largeTitleFontFamily,
    titleFontFamily,
  ] = processFonts([
    headerBackTitleStyleFlattened.fontFamily,
    headerLargeTitleStyleFlattened.fontFamily,
    headerTitleStyleFlattened.fontFamily,
  ]);

  const titleText = title !== undefined ? title : route.name;

  const headerLeftElement = headerLeft?.({ tintColor });
  const headerRightElement = headerRight?.({ tintColor });
  const headerTitleElement =
    typeof headerTitle === 'function'
      ? headerTitle({ tintColor, children: titleText })
      : null;

  if (
    Platform.OS === 'ios' &&
    headerSearchBarOptions != null &&
    SearchBar == null
  ) {
    throw new Error(
      `The current version of 'react-native-screens' doesn't support SearchBar in the header. Please update to the latest version to use this option.`
    );
  }

  /**
   * We need to set this in if:
   * - Back button should stay visible when `headerLeft` is specified
   * - If `headerTitle` for Android is specified, so we only need to remove the title and keep the back button
   */
  const backButtonInCustomView = headerBackVisible
    ? headerLeftElement != null
    : Platform.OS === 'android' && headerTitleElement != null;

  return (
    <ScreenStackHeaderConfig
      backButtonInCustomView={backButtonInCustomView}
      backgroundColor={
        headerStyleFlattened.backgroundColor ??
        (headerTranslucent ? 'transparent' : colors.card)
      }
      backTitle={headerBackTitleVisible ? headerBackTitle : ' '}
      backTitleFontFamily={backTitleFontFamily}
      backTitleFontSize={headerBackTitleStyleFlattened.fontSize}
      blurEffect={headerBlurEffect}
      color={tintColor}
      direction={I18nManager.isRTL ? 'rtl' : 'ltr'}
      hidden={headerShown === false}
      hideBackButton={headerBackVisible === false}
      hideShadow={headerShadowVisible === false}
      largeTitle={headerLargeTitle}
      largeTitleBackgroundColor={headerLargeStyleFlattened.backgroundColor}
      largeTitleColor={headerLargeTitleStyleFlattened.color}
      largeTitleFontFamily={largeTitleFontFamily}
      largeTitleFontSize={headerLargeTitleStyleFlattened.fontSize}
      largeTitleFontWeight={headerLargeTitleStyleFlattened.fontWeight}
      largeTitleHideShadow={headerLargeTitleShadowVisible === false}
      // @ts-ignore Renamed from screenOrientation to orientation
      screenOrientation={orientation}
      statusBarAnimation={statusBarAnimation}
      statusBarHidden={statusBarHidden}
      statusBarStyle={statusBarStyle}
      title={typeof headerTitle === 'string' ? headerTitle : titleText}
      titleColor={
        headerTitleStyleFlattened.color ?? headerTintColor ?? colors.text
      }
      titleFontFamily={titleFontFamily}
      titleFontSize={headerTitleStyleFlattened.fontSize}
      titleFontWeight={headerTitleStyleFlattened.fontWeight}
      topInsetEnabled={insets.top !== 0}
      translucent={
        // This defaults to `true`, so we can't pass `undefined`
        headerTranslucent === true
      }
    >
      {Platform.OS === 'ios' ? (
        <>
          {headerLeftElement != null ? (
            <ScreenStackHeaderLeftView>
              {headerLeftElement}
            </ScreenStackHeaderLeftView>
          ) : null}
          {headerTitleElement != null ? (
            <ScreenStackHeaderCenterView>
              {headerTitleElement}
            </ScreenStackHeaderCenterView>
          ) : null}
        </>
      ) : (
        <>
          {headerLeftElement != null || typeof headerTitle === 'function' ? (
            <ScreenStackHeaderLeftView>
              <View style={styles.row}>
                {headerLeftElement}
                {typeof headerTitle === 'function' ? (
                  headerTitleElement
                ) : (
                  <HeaderTitle tintColor={tintColor}>{titleText}</HeaderTitle>
                )}
              </View>
            </ScreenStackHeaderLeftView>
          ) : null}
        </>
      )}
      {headerBackImageSource !== undefined ? (
        <ScreenStackHeaderBackButtonImage
          key="backImage"
          source={headerBackImageSource}
        />
      ) : null}
      {headerRightElement != null ? (
        <ScreenStackHeaderRightView>
          {headerRightElement}
        </ScreenStackHeaderRightView>
      ) : null}
      {Platform.OS === 'ios' && headerSearchBarOptions != null ? (
        <ScreenStackHeaderSearchBarView>
          <SearchBar {...headerSearchBarOptions} />
        </ScreenStackHeaderSearchBarView>
      ) : null}
    </ScreenStackHeaderConfig>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
