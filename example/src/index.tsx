import * as React from 'react';
import {
  ScrollView,
  Platform,
  StatusBar,
  I18nManager,
  Dimensions,
  ScaledSize,
  Linking,
  LogBox,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  Provider as PaperProvider,
  DefaultTheme as PaperLightTheme,
  DarkTheme as PaperDarkTheme,
  List,
  Divider,
  Text,
} from 'react-native-paper';
import {
  InitialState,
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  PathConfigMap,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  createStackNavigator,
  StackScreenProps,
  HeaderStyleInterpolators,
} from '@react-navigation/stack';
import { useReduxDevToolsExtension } from '@react-navigation/devtools';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { restartApp } from './Restart';
import LinkingPrefixes from './LinkingPrefixes';
import SettingsItem from './Shared/SettingsItem';
import SimpleStack from './Screens/SimpleStack';
import ModalPresentationStack from './Screens/ModalPresentationStack';
import StackTransparent from './Screens/StackTransparent';
import StackHeaderCustomization from './Screens/StackHeaderCustomization';
import StackHeaderCustomizationOptions from './Screens/StackHeaderCustomizationOptions';
import BottomTabs from './Screens/BottomTabs';
import MaterialTopTabsScreen from './Screens/MaterialTopTabs';
import MaterialBottomTabs from './Screens/MaterialBottomTabs';
import NotFound from './Screens/NotFound';
import DynamicTabs from './Screens/DynamicTabs';
import MasterDetail from './Screens/MasterDetail';
import AuthFlow from './Screens/AuthFlow';
import PreventRemove from './Screens/PreventRemove';
import CompatAPI from './Screens/CompatAPI';
import LinkComponent from './Screens/LinkComponent';

if (Platform.OS !== 'web') {
  LogBox.ignoreLogs(['Require cycle:']);
}

enableScreens();

type RootDrawerParamList = {
  Examples: undefined;
};

const SCREENS = {
  SimpleStack: { title: 'Simple Stack', component: SimpleStack },
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
  StackHeaderCustomizationOptions: {
    title: 'Header Customization with custom header options',
    component: StackHeaderCustomizationOptions,
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
  MasterDetail: {
    title: 'Master Detail',
    component: MasterDetail,
  },
  AuthFlow: {
    title: 'Auth Flow',
    component: AuthFlow,
  },
  PreventRemove: {
    title: 'Prevent removing screen',
    component: PreventRemove,
  },
  CompatAPI: {
    title: 'Compat Layer',
    component: CompatAPI,
  },
  LinkComponent: {
    title: '<Link />',
    component: LinkComponent,
  },
};

type RootStackParamList = {
  Home: undefined;
  NotFound: undefined;
} & {
  [P in keyof typeof SCREENS]: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';
const THEME_PERSISTENCE_KEY = 'THEME_TYPE';

export default function App() {
  const [theme, setTheme] = React.useState(DefaultTheme);

  const [isReady, setIsReady] = React.useState(Platform.OS === 'web');
  const [initialState, setInitialState] = React.useState<
    InitialState | undefined
  >();

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (Platform.OS !== 'web' || initialUrl === null) {
          const savedState = await AsyncStorage.getItem(
            NAVIGATION_PERSISTENCE_KEY
          );

          const state = savedState ? JSON.parse(savedState) : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
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
  }, []);

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

  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));

  React.useEffect(() => {
    const onDimensionsChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    };

    Dimensions.addEventListener('change', onDimensionsChange);

    return () => Dimensions.removeEventListener('change', onDimensionsChange);
  }, []);

  const navigationRef = React.useRef<NavigationContainerRef>(null);

  useReduxDevToolsExtension(navigationRef);

  if (!isReady) {
    return null;
  }

  const isLargeScreen = dimensions.width >= 1024;

  return (
    <PaperProvider theme={paperTheme}>
      {Platform.OS === 'ios' && (
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      )}
      <NavigationContainer
        ref={navigationRef}
        initialState={initialState}
        onStateChange={(state) =>
          AsyncStorage.setItem(
            NAVIGATION_PERSISTENCE_KEY,
            JSON.stringify(state)
          )
        }
        theme={theme}
        linking={{
          // To test deep linking on, run the following in the Terminal:
          // Android: adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:19000/--/simple-stack"
          // iOS: xcrun simctl openurl booted exp://127.0.0.1:19000/--/simple-stack
          // Android (bare): adb shell am start -a android.intent.action.VIEW -d "rne://127.0.0.1:19000/--/simple-stack"
          // iOS (bare): xcrun simctl openurl booted rne://127.0.0.1:19000/--/simple-stack
          // The first segment of the link is the the scheme + host (returned by `Linking.makeUrl`)
          prefixes: LinkingPrefixes,
          config: {
            initialRouteName: 'Home',
            screens: Object.keys(SCREENS).reduce<PathConfigMap>(
              (acc, name) => {
                // Convert screen names such as SimpleStack to kebab case (simple-stack)
                const path = name
                  .replace(/([A-Z]+)/g, '-$1')
                  .replace(/^-/, '')
                  .toLowerCase();

                acc[name] = {
                  path,
                  screens: {
                    Article: {
                      path: 'article/:author?',
                      parse: {
                        author: (author) =>
                          author.charAt(0).toUpperCase() +
                          author.slice(1).replace(/-/g, ' '),
                      },
                      stringify: {
                        author: (author: string) =>
                          author.toLowerCase().replace(/\s/g, '-'),
                      },
                    },
                    Albums: 'music',
                    Chat: 'chat',
                    Contacts: 'people',
                    NewsFeed: 'feed',
                    Dialog: 'dialog',
                  },
                };

                return acc;
              },
              {
                Home: {
                  screens: {
                    Examples: '',
                  },
                },
                NotFound: '*',
              }
            ),
          },
        }}
        fallback={<Text>Loading…</Text>}
        documentTitle={{
          formatter: (options, route) =>
            `${options?.title ?? route?.name} - React Navigation Example`,
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
          }}
        >
          <Stack.Screen
            name="Home"
            options={{
              headerShown: false,
            }}
          >
            {() => (
              <Drawer.Navigator
                drawerType={isLargeScreen ? 'permanent' : undefined}
                screenOptions={{ headerShown: true }}
              >
                <Drawer.Screen
                  name="Examples"
                  options={{
                    title: 'Examples',
                    drawerIcon: ({ size, color }) => (
                      <MaterialIcons size={size} color={color} name="folder" />
                    ),
                  }}
                >
                  {({ navigation }: StackScreenProps<RootStackParamList>) => (
                    <ScrollView
                      style={{ backgroundColor: theme.colors.background }}
                    >
                      <SafeAreaView edges={['right', 'bottom', 'left']}>
                        <SettingsItem
                          label="Right to left"
                          value={I18nManager.isRTL}
                          onValueChange={() => {
                            I18nManager.forceRTL(!I18nManager.isRTL);
                            restartApp();
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

                            setTheme((t) =>
                              t.dark ? DefaultTheme : DarkTheme
                            );
                          }}
                        />
                        <Divider />
                        {(Object.keys(SCREENS) as (keyof typeof SCREENS)[]).map(
                          (name) => (
                            <List.Item
                              key={name}
                              testID={name}
                              title={SCREENS[name].title}
                              onPress={() => navigation.navigate(name)}
                            />
                          )
                        )}
                      </SafeAreaView>
                    </ScrollView>
                  )}
                </Drawer.Screen>
              </Drawer.Navigator>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="NotFound"
            component={NotFound}
            options={{ title: 'Oops!' }}
          />
          {(Object.keys(SCREENS) as (keyof typeof SCREENS)[]).map((name) => (
            <Stack.Screen
              key={name}
              name={name}
              getComponent={() => SCREENS[name].component}
              options={{ title: SCREENS[name].title }}
            />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
