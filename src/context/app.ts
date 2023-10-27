import { Person, TabNavigationContext, TabNavigationItem } from '@models';
import React from 'react';
import { FunctionalitySwitches } from './functionality-switches';

type AppContextType = {
    activeOrganizationId: string;
    setActiveOrganizationId: (orgId: string) => void;
    projectsDashboardSearch: string;
    setProjectsDashboardSearch: (search: string) => void;
    projectsDashboardSortField: string;
    setProjectsDashboardSortField: (sortBy: string) => void;
    projectsDashboardSortDirection: string;
    setProjectsDashboardSortDirection: (sortDirection: string) => void;
    shouldFetchProjectsData: boolean;
    setShouldFetchProjectsData: (shouldFetchProjectsData: boolean) => void;
    user: Person | undefined;
    setUser: (person: Person) => void;
    tabNavigationContext: TabNavigationContext;
    setTabNavigationContext: (navigationRecentNodes: TabNavigationContext) => void;
    prevTabName: string;
    setPrevTabName: (prevTabName: string) => void;
    messageQueueUuid: string;
    setMessageQueueUuid: (uuid: string) => void;
    functionalitySwitches: FunctionalitySwitches;
    setFunctionalitySwitches: (functionalitySwitches: FunctionalitySwitches) => void;
};

export const AppContext = React.createContext<AppContextType>({
    user: undefined,
    setUser: () => null,
    shouldFetchProjectsData: true,
    setShouldFetchProjectsData: () => null,
    activeOrganizationId: '',
    setActiveOrganizationId: () => null,
    projectsDashboardSearch: '',
    setProjectsDashboardSearch: () => null,
    projectsDashboardSortField: 'project_name',
    setProjectsDashboardSortField: () => null,
    projectsDashboardSortDirection: 'ASC',
    setProjectsDashboardSortDirection: () => null,
    tabNavigationContext: {
        tab_navigation_items: [] as TabNavigationItem []
    },
    setTabNavigationContext: () => null,
    prevTabName: '',
    setPrevTabName: () => null,
    messageQueueUuid: '',
    setMessageQueueUuid: () => null,
    functionalitySwitches: {
        showToasts: true
    },
    setFunctionalitySwitches: () => null
});

export const DebugContext = React.createContext({
    traceUpdateMap: {} as {[key: string]: any}
});
