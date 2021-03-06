import * as React from 'react';
import type { NavigationContainerRef } from './types';

/**
 * Context which holds the root navigation (NavigationContainer interface).
 */
const RootNavigationContext = React.createContext<NavigationContainerRef | undefined>(undefined);
export default RootNavigationContext;
