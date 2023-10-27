import { useMemo } from 'react';
import { NavigationMenu, Project, ProjectWithData } from '../models';
import { getEmptyNavigationMenu, getMigrationProjectNavigationMenu } from '../utils';

/**
 * This custom hook gets the memoized NavigationMenu object for the Cloud Migration tab and the specified project.
 * We memoize it because the left navigation should not need to be recreated on each render, just on renders where the
 * project information has changed.
 *
 * Hooks like useMemo can only be used at the top level of one of our components, OR, inside a custom hook that is
 * used at the top level of one of our components.  This hook was created to make it easier to include the useMemo
 * logic in our components.  By convention, hooks start with 'use'.
 *
 * @param project   Project or ProjectWithData
 */
export const useMigrationMenu = (project: Project | ProjectWithData | undefined): NavigationMenu => {

    return useMemo(() => {

        if (!project) {
            return getEmptyNavigationMenu('migration');
        }

        // log('useMigrationMenu calling getMigrationProjectNavigationMenu');
        return getMigrationProjectNavigationMenu(project.id,
            project.project_name,
            project.project_instance);

    }, [project?.id, project?.project_name, project?.project_instance]);

};

