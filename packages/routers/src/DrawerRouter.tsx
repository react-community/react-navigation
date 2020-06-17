import { nanoid } from 'nanoid/non-secure';
import {
  PartialState,
  CommonNavigationAction,
  Router,
  ParamListBase,
} from './types';
import TabRouter, {
  TabActions,
  TabActionType,
  TabRouterOptions,
  TabNavigationState,
  TabActionHelpers,
} from './TabRouter';

export type DrawerActionType =
  | TabActionType
  | {
      type: 'OPEN_DRAWER' | 'CLOSE_DRAWER' | 'TOGGLE_DRAWER';
      source?: string;
      target?: string;
    };

export type DrawerRouterOptions = TabRouterOptions & {
  openByDefault?: boolean;
};

export type DrawerNavigationState = Omit<
  TabNavigationState,
  'type' | 'history'
> & {
  /**
   * Type of the router, in this case, it's drawer.
   */
  type: 'drawer';
  /**
   * List of previously visited route keys and drawer open status.
   */
  history: ({ type: 'route'; key: string } | { type: 'drawer' })[];
};

export type DrawerActionHelpers<
  ParamList extends ParamListBase
> = TabActionHelpers<ParamList> & {
  /**
   * Open the drawer sidebar.
   */
  openDrawer(): void;

  /**
   * Close the drawer sidebar.
   */
  closeDrawer(): void;

  /**
   * Open the drawer sidebar if closed, or close if opened.
   */
  toggleDrawer(): void;
};

export const DrawerActions = {
  ...TabActions,
  openDrawer(): DrawerActionType {
    return { type: 'OPEN_DRAWER' };
  },
  closeDrawer(): DrawerActionType {
    return { type: 'CLOSE_DRAWER' };
  },
  toggleDrawer(): DrawerActionType {
    return { type: 'TOGGLE_DRAWER' };
  },
};

const isDrawerOpen = (
  state: DrawerNavigationState | PartialState<DrawerNavigationState>
) => Boolean(state.history?.find((it) => it.type === 'drawer'));

const openDrawer = (state: DrawerNavigationState): DrawerNavigationState => {
  if (isDrawerOpen(state)) {
    return state;
  }

  return {
    ...state,
    history: [...state.history, { type: 'drawer' }],
  };
};

const closeDrawer = (state: DrawerNavigationState): DrawerNavigationState => {
  if (!isDrawerOpen(state)) {
    return state;
  }

  return {
    ...state,
    history: state.history.filter((it) => it.type !== 'drawer'),
  };
};

export default function DrawerRouter({
  openByDefault,
  ...rest
}: DrawerRouterOptions = {}): Router<
  DrawerNavigationState,
  DrawerActionType | CommonNavigationAction
> {
  const router = (TabRouter(rest) as unknown) as Router<
    DrawerNavigationState,
    TabActionType | CommonNavigationAction
  >;

  return {
    ...router,

    type: 'drawer',

    getInitialState(configOptions) {
      let state = router.getInitialState(configOptions);

      if (openByDefault) {
        state = openDrawer(state);
      }

      return {
        ...state,
        stale: false,
        type: 'drawer',
        key: `drawer-${nanoid()}`,
      };
    },

    getRehydratedState(partialState, configOptions) {
      if (partialState.stale === false) {
        return partialState;
      }

      let state = router.getRehydratedState(partialState, configOptions);

      if (isDrawerOpen(partialState)) {
        state = openDrawer(state);
      }

      return {
        ...state,
        type: 'drawer',
        key: `drawer-${nanoid()}`,
      };
    },

    getStateForRouteFocus(state, key) {
      const result = router.getStateForRouteFocus(state, key);

      if (openByDefault) {
        return openDrawer(result);
      }

      return closeDrawer(result);
    },

    getStateForAction(state, action, configOptions) {
      switch (action.type) {
        case 'OPEN_DRAWER':
          return openDrawer(state);

        case 'CLOSE_DRAWER':
          return closeDrawer(state);

        case 'TOGGLE_DRAWER':
          if (isDrawerOpen(state)) {
            return closeDrawer(state);
          }

          return openDrawer(state);

        case 'GO_BACK':
          if (openByDefault) {
            if (!isDrawerOpen(state)) {
              return openDrawer(state);
            }
          } else {
            if (isDrawerOpen(state)) {
              return closeDrawer(state);
            }
          }

          return router.getStateForAction(state, action, configOptions);

        default:
          return router.getStateForAction(state, action, configOptions);
      }
    },

    actionCreators: DrawerActions,
  };
}
