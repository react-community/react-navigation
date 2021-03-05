import * as React from 'react';
import { Text, View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import type { ParamListBase } from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
  StackHeaderProps,
} from '@react-navigation/stack';
import Article from '../Shared/Article';
import Albums from '../Shared/Albums';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native-gesture-handler';

type SimpleStackParams = {
  Article: { author: string };
  Albums: undefined;
};

const scrollEnabled = Platform.select({ web: true, default: false });

const ArticleScreen = ({
  navigation,
  route,
}: StackScreenProps<SimpleStackParams, 'Article'>) => {
  return (
    <ScrollView>
      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={() => navigation.push('Albums')}
          style={styles.button}
        >
          Push album
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go back
        </Button>
      </View>
      <Article
        author={{ name: route.params.author }}
        scrollEnabled={scrollEnabled}
      />
    </ScrollView>
  );
};

const AlbumsScreen = ({ navigation }: StackScreenProps<SimpleStackParams>) => {
  return (
    <ScrollView>
      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={() => navigation.push('Article', { author: 'Babel fish' })}
          style={styles.button}
        >
          Push article
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go back
        </Button>
      </View>
      <Albums scrollEnabled={scrollEnabled} />
    </ScrollView>
  );
};

interface HeaderButton {
  label: string;
  onPress(): void;
}
interface HeaderOptions {
  subtitle?: string;
  right?: HeaderButton;
}

const SimpleStack = createStackNavigator<SimpleStackParams, HeaderOptions>();

function CustomHeader(props: StackHeaderProps<HeaderOptions>) {
  const { navigation, scene } = props;
  const { title, subtitle, right } = scene.descriptor.options;

  return (
    <SafeAreaView edges={['top']} style={styles.header}>
      <View style={styles.headerContent}>
        {navigation.canGoBack() ? (
          <View style={[styles.headerButton, styles.headerButtonLeft]}>
            <TouchableOpacity onPress={navigation.goBack}>
              <Text style={styles.headerButtonLabel}>Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
        {right ? (
          <View style={[styles.headerButton, styles.headerButtonRight]}>
            <TouchableOpacity onPress={right.onPress}>
              <Text style={styles.headerButtonLabel}>{right.label}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

type Props = Partial<React.ComponentProps<typeof SimpleStack.Navigator>> &
  StackScreenProps<ParamListBase>;

export default function SimpleStackScreen({ navigation, ...rest }: Props) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <SimpleStack.Navigator
      {...rest}
      headerMode="screen"
      screenOptions={{ header: (props) => <CustomHeader {...props} /> }}
    >
      <SimpleStack.Screen
        name="Article"
        component={ArticleScreen}
        options={({ route, navigation }) => ({
          title: 'Article',
          subtitle: route.params.author,
          right: {
            label: 'Push album',
            onPress: () => navigation.push('Albums'),
          },
        })}
        initialParams={{ author: 'Gandalf' }}
      />
      <SimpleStack.Screen
        name="Albums"
        component={AlbumsScreen}
        options={{
          title: 'Albums',
          subtitle: 'Explore all albums',
        }}
      />
    </SimpleStack.Navigator>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    padding: 8,
  },
  button: {
    margin: 8,
  },
  header: {
    backgroundColor: '#ff005d',
  },
  headerContent: {
    padding: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#fff',
    textAlign: 'center',
  },
  headerButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 8,
  },
  headerButtonLeft: {
    left: 8,
  },
  headerButtonRight: {
    right: 8,
  },
  headerButtonLabel: {
    color: '#fff',
  },
});
