import * as React from 'react';
import {
  ScrollView,
  AsyncStorage,
  YellowBox,
  Platform,
  StatusBar,
  I18nManager,
} from 'react-native';
import RNRestart from 'react-native-restart';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Provider as PaperProvider,
  DefaultTheme as PaperLightTheme,
  DarkTheme as PaperDarkTheme,
  Divider,
  Appbar,
} from 'react-native-paper';
import { Asset } from 'expo-asset';
import {
  InitialState,
  useLinking,
  NavigationContainerRef,
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  createStackNavigator,
  Assets as StackAssets,
  HeaderStyleInterpolators,
} from '@react-navigation/stack';

import LinkingPrefixes from './LinkingPrefixes';
import SimpleStack from './Screens/SimpleStack';
import NativeStack from './Screens/NativeStack';
import ModalPresentationStack from './Screens/ModalPresentationStack';
import StackTransparent from './Screens/StackTransparent';
import StackHeaderCustomization from './Screens/StackHeaderCustomization';
import BottomTabs from './Screens/BottomTabs';
import MaterialTopTabsScreen from './Screens/MaterialTopTabs';
import MaterialBottomTabs from './Screens/MaterialBottomTabs';
import DynamicTabs from './Screens/DynamicTabs';
import AuthFlow from './Screens/AuthFlow';
import CompatAPI from './Screens/CompatAPI';
import SettingsItem from './Shared/SettingsItem';
import { Updates } from 'expo';
import { DrawerActions } from '@react-navigation/routers';

YellowBox.ignoreWarnings(['Require cycle:', 'Warning: Async Storage']);

type RootDrawerParamList = {
  Home: undefined;
} & {
  [P in keyof typeof SCREENS]: undefined;
};

type RootStackParamList = {
  Root: undefined;
};

const SCREENS = {
  SimpleStack: { title: 'Simple Stack', component: SimpleStack },
  NativeStack: { title: 'Native Stack', component: NativeStack },
  ModalPresentationStack: {
    title: 'Modal Presentation Stack',
    component: ModalPresentationStack,
  },
  StackTransparent: {
    title: 'Transparent Stack',
    component: StackTransparent,
  },
  StackHeaderCustomization: {
    title: 'Header Customization in Stack',
    component: StackHeaderCustomization,
  },
  BottomTabs: { title: 'Bottom Tabs', component: BottomTabs },
  MaterialTopTabs: {
    title: 'Material Top Tabs',
    component: MaterialTopTabsScreen,
  },
  MaterialBottomTabs: {
    title: 'Material Bottom Tabs',
    component: MaterialBottomTabs,
  },
  DynamicTabs: {
    title: 'Dynamic Tabs',
    component: DynamicTabs,
  },
  AuthFlow: {
    title: 'Auth Flow',
    component: AuthFlow,
  },
  CompatAPI: {
    title: 'Compat Layer',
    component: CompatAPI,
  },
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';
const THEME_PERSISTENCE_KEY = 'THEME_TYPE';

Asset.loadAsync(StackAssets);

export default function App() {
  const containerRef = React.useRef<NavigationContainerRef>();

  // To test deep linking on, run the following in the Terminal:
  // Android: adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:19000/--/simple-stack"
  // iOS: xcrun simctl openurl booted exp://127.0.0.1:19000/--/simple-stack
  // Android (bare): adb shell am start -a android.intent.action.VIEW -d "rne://127.0.0.1:19000/--/simple-stack"
  // iOS (bare): xcrun simctl openurl booted rne://127.0.0.1:19000/--/simple-stack
  // The first segment of the link is the the scheme + host (returned by `Linking.makeUrl`)
  const { getInitialState } = useLinking(containerRef, {
    prefixes: LinkingPrefixes,
    config: {
      Root: {
        path: '',
        initialRouteName: 'Home',
        screens: Object.keys(SCREENS).reduce<{ [key: string]: string }>(
          (acc, name) => {
            // Convert screen names such as SimpleStack to kebab case (simple-stack)
            acc[name] = name
              .replace(/([A-Z]+)/g, '-$1')
              .replace(/^-/, '')
              .toLowerCase();

            return acc;
          },
          { Home: '' }
        ),
      },
    },
  });

  const [theme, setTheme] = React.useState(DefaultTheme);

  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState<
    InitialState | undefined
  >();

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        let state = await getInitialState();

        if (Platform.OS !== 'web' && state === undefined) {
          const savedState = await AsyncStorage.getItem(
            NAVIGATION_PERSISTENCE_KEY
          );
          state = savedState ? JSON.parse(savedState) : undefined;
        }

        if (state !== undefined) {
          setInitialState(state);
        }
      } finally {
        try {
          const themeName = await AsyncStorage.getItem(THEME_PERSISTENCE_KEY);

          setTheme(themeName === 'dark' ? DarkTheme : DefaultTheme);
        } catch (e) {
          // Ignore
        }

        setIsReady(true);
      }
    };

    restoreState();
  }, [getInitialState]);

  const paperTheme = React.useMemo(() => {
    const t = theme.dark ? PaperDarkTheme : PaperLightTheme;

    return {
      ...t,
      colors: {
        ...t.colors,
        ...theme.colors,
        surface: theme.colors.card,
        accent: theme.dark ? 'rgb(255, 55, 95)' : 'rgb(255, 45, 85)',
      },
    };
  }, [theme.colors, theme.dark]);

  if (!isReady) {
    return null;
  }

  return (
    <PaperProvider theme={paperTheme}>
      {Platform.OS === 'ios' && (
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      )}
      <NavigationContainer
        ref={containerRef}
        initialState={initialState}
        onStateChange={state =>
          AsyncStorage.setItem(
            NAVIGATION_PERSISTENCE_KEY,
            JSON.stringify(state)
          )
        }
        theme={theme}
      >
        <Stack.Navigator
          screenOptions={{
            headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
          }}
        >
          <Stack.Screen
            name="Root"
            options={{
              title: 'Examples',
              ...(Platform.OS !== 'web' && {
                headerLeft: () => (
                  <Appbar.Action
                    color={theme.colors.text}
                    icon="menu"
                    onPress={() =>
                      containerRef.current?.dispatch(
                        DrawerActions.toggleDrawer()
                      )
                    }
                  />
                ),
              }),
            }}
          >
            {() => (
              <Drawer.Navigator
                drawerType={Platform.OS === 'web' ? 'sidebar' : 'front'}
              >
                <Drawer.Screen
                  name="Home"
                  options={{
                    title: 'Examples',
                    drawerIcon: ({ size, color }) => (
                      <MaterialIcons size={size} color={color} name="folder" />
                    ),
                  }}
                >
                  {() => (
                    <ScrollView
                      style={{ backgroundColor: theme.colors.background }}
                    >
                      <SettingsItem
                        label="Right to left"
                        value={I18nManager.isRTL}
                        onValueChange={() => {
                          I18nManager.forceRTL(!I18nManager.isRTL);
                          // @ts-ignore
                          if (global.Expo) {
                            Updates.reloadFromCache();
                          } else {
                            RNRestart.Restart();
                          }
                        }}
                      />
                      <Divider />
                      <SettingsItem
                        label="Dark theme"
                        value={theme.dark}
                        onValueChange={() => {
                          AsyncStorage.setItem(
                            THEME_PERSISTENCE_KEY,
                            theme.dark ? 'light' : 'dark'
                          );

                          setTheme(t => (t.dark ? DefaultTheme : DarkTheme));
                        }}
                      />
                      <Divider />
                    </ScrollView>
                  )}
                </Drawer.Screen>
                {(Object.keys(SCREENS) as (keyof typeof SCREENS)[]).map(
                  name => (
                    <Drawer.Screen
                      key={name}
                      name={name}
                      component={SCREENS[name].component}
                      options={{ title: SCREENS[name].title }}
                    />
                  )
                )}
              </Drawer.Navigator>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
