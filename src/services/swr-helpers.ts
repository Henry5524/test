import { DirTreeItem, Project, ProjectContainer } from '@models';
import { log } from '@utils';
import useSWR from 'swr';
import { Api } from './api';

/*
 * swr-helpers.ts
 *
 * Defines SWR hooks for usage instead of directly calling useSWR.  Examples: useProject, useProjects, useResults, ...etc.
 * These functions delegate to useSWR.
 *
 * Intent is to centralize all or most SWR calls.  The benefit is to make the calling code cleaner, encapsulate the
 * api call, and encapsulate the construction of the SWR cache key in order for it to be unique and reusable from the
 * cache.
 *
 * Note that these functions will place data into the components state just like useSWR does.
 *
 * The signature for useSWR is
 *      useSWR(key, fetcher, options)
 *
 * The signature of these functions will be:
 *      useSomething(p1, p2, ... pn, fetcher options)
 *
 *          where p1 thru pn are required data values for the api call.
 *          Note that a cache key is not passed.  It will be defined by the function, typically by using some unique string
 *          in combination with the passed data values.
 *          Also note that you typically will not need to provide a fetcher or options, those both default.
 *          However, both a fetcher and options are allowed on any call in case you have a special case.
 *
 *          Example:
 *              const { data: resultsData, error: resultsError } = useResults(projectId as string, 'app');
 *
 * Note that each function returns a promise that contains:
 *      {
 *          data
 *          isLoading,
 *          error,
 *          mutate,
 *          key
 *      }
 * where data will be of the type returned from the API call.  mutate will be a mutate function bound to the key of
 * the SWR call.  See https://github.com/vercel/swr#bound-mutate.  key will be the useSWR cache key.
 */

const LOGGING: boolean = false;
const logx = (msg: string, ...more: any[]): void => {
    if (LOGGING) {
        log(msg, more);
    }
};

/**
 * Gets the project by projectId - gets the full version of the project.
 * Example:
 *      const { data, error } = useProject(projectId as string);
 *
 * @param projectId The project Id
 * @param fetcher   Optional function
 * @param options   SWR options - defaults to empty object - no options
 * @returns { data: ProjectContainer, isLoading: boolean, error: any }
 */
export function useProject(
    projectId: string,
    fetcher = (): any => {
        logx('useProject calling API.getProject');
        // during a project upload projectId is coming in as undefined from some call, protecting against it here
        return (projectId !== null && projectId !== undefined) ? Api.getProject(projectId) : undefined;
    },
    options = {},
):
    {
        isLoading: boolean;
        mutate: (data?: (Promise<any> | any), shouldRevalidate?: boolean) => Promise<any | undefined>;
        data: ProjectContainer | undefined;
        id: string;
        error: any;
        key: string;
    } {
    const key = `projectFull_${projectId}`;
    const { data, error, mutate } = useSWR<ProjectContainer, any>(key, fetcher, options);

    return {
        id: projectId,
        data,
        isLoading: !error && !data,
        error,
        mutate,
        key
    };
}

/**
 * Gets the light (summary) version of the project by projectId.
 * Example:
 *      const { data, error } = useProject(projectId as string);
 *
 * @param projectId The project Id
 * @param fetcher   Optional function
 * @param options   SWR options - defaults to empty object - no options
 * @returns { data: Project, isLoading: boolean, error: any }
 */
export function useProjectLight(
    projectId: string,
    fetcher = (): any => {
        if (LOGGING) {
            logx('useProjectLight calling Api.getObject');
        }
        return Api.getObject<Project>(projectId + '', Project);
    },
    options = {},
):
    {
        data: Project | undefined;
        isLoading: boolean;
        mutate: (data?: (Promise<any> | any), shouldRevalidate?: boolean) => Promise<any | undefined>;
        error: any;
        key: string;
    } {
    const key = `projectLight${projectId}`;
    const { data, error, mutate } = useSWR<Project, any>(key, fetcher, options);

    return {
        data,
        isLoading: !error && !data,
        mutate,
        error,
        key
    };
}

/**
 * Gets all projects - with each project being the light version of the projects
 * Example:
 *          const { data, error } = useProjects(null, {
 *              refreshInterval: 5000
 *          });
 *
 * @param fetcher   Optional function
 * @param options   SWR options
 * @returns { data: Project[], isLoading: boolean, error: any }
 */
export const useProjects = (
    fetcher = (): any => {
        if (LOGGING) {
            logx('useProjects calling Api.getProjects');
        }
        return Api.getProjects();
    },
    options = {}
) => {
    const key = 'getProjects';
    const { data, error, mutate } = useSWR<Project[], any>(key, fetcher, options);
    return {
        data,
        isLoading: !error && !data,
        error,
        mutate,
        key
    };
};

export const useResults = (
    id: string,
    type: string,
    fetcher = (): any => {
        if (LOGGING) {
            logx('useResults calling Api.getResults');
        }
        return Api.getResults(id, type);
    },
    options = {},
) => {
    const key = `useResults-${id}-${type}`;
    const { data, error, mutate } = useSWR<DirTreeItem[], any>(key, fetcher, options);

    return {
        data,
        isLoading: !error && !data,
        error,
        mutate,
        key
    };
};
