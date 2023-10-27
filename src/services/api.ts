import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';
import { BaseSystemObject, ChartLink, ChartNode, DirTreeItem, LogEntry, Project, ProjectContainer, ProjectWithData } from '../models';
import { handleRequest, handleRequestReturnResponse, parseArray } from './http-helpers';

export class Api {
    static axios: AxiosInstance = axios.create({
        baseURL: config.api_base_url,
        withCredentials: false,
    });

    // keep track of AbortControllers for project uploads in progress
    // this will be used to cancel uploads in progress
    static uploadProjectAbortControllerMap: Map<string, any> = new Map();

    // Health Check
    static healthCheck(): Promise<void> {
        return handleRequest<void>(Api.axios.get('/health')
        );
    }

    // Logs
    static getSystemLogs(count = 500): Promise<LogEntry[]> {
        return handleRequest<LogEntry[]>(
            Api.axios.get(`/info/logs/${count}`),
            data => parseArray<LogEntry>(LogEntry, data)
        );
    }

    static getTextFile(uri: string): Promise<string> {
        return handleRequest<string>(
            Api.axios.get(uri)
        );
    }

    // Objects
    static getObjects<T extends BaseSystemObject>(Clazz: typeof BaseSystemObject): Promise<T[]> {
        const { type } = new Clazz();
        return handleRequest<T[]>(
            Api.axios.get(`/objects?type=${type}`),
            data => parseArray<T>(Clazz as any, data)
        );
    }

    static getObject<T extends BaseSystemObject>(id: string, Clazz: typeof BaseSystemObject): Promise<T> {
        return handleRequest<T>(
            Api.axios.get(`/objects/${id}`),
            data => new Clazz(data) as T
        );
    }

    /**
     * Executes a PUT request for the passed object, and resolves with the response.data, or in case of error,
     * rejects with an error message.
     * @param obj   The request
     * @return Returns the Promise that will resolve with the response.data, or will reject with an error
     *          message in case of errors
     */
    static updateObject(obj: BaseSystemObject): Promise<void> {
        return handleRequest<void>(
            Api.axios.put(`/objects/${obj.id}`, obj)
        );
    }

    /**
     * Executes a PUT request for the passed object, and resolves with the entire response object, or in case of error,
     * rejects with an error message.
     * @param obj   The request
     * @return Returns the Promise that will resolve with the response object, or will reject with an error
     *          message in case of errors
     */
    static updateObjectReturnResponse(obj: BaseSystemObject): Promise<AxiosResponse> {
        return handleRequestReturnResponse<AxiosResponse>(
            Api.axios.put(`/objects/${obj.id}`, obj)
        );
    }

    static setObjectNote(id: string, note: string): Promise<void> {
        return handleRequest<void>(
            Api.axios.put(`/objects/${id}/note`, { note })
        );
    }

    static deleteObjects(ids: string[]): Promise<void> {
        return handleRequest<void>(
            Api.axios.delete('/objects', { data: { ids } })
        );
    }


    // Projects
    static getProjects(): Promise<Project[]> {
        return Api.getObjects<Project>(Project);
    }

    static getProject(id: string): Promise<ProjectContainer> {
        return new Promise((resolve, _reject) => {
            Api.getObject<ProjectWithData>(id, ProjectWithData)
                .then((projectWithData) => {
                    resolve(new ProjectContainer(projectWithData));
                });
        });
    }

    static deleteProjects(ids: string[]): Promise<void> {
        return Api.deleteObjects(ids);
    }

    static getResults(id: string, type: string): Promise<DirTreeItem[]> {
        return handleRequest<DirTreeItem[]>(
            Api.axios.get(`/objects/${id}/results/${type}`),
            data => parseArray<DirTreeItem>(DirTreeItem, data)
        );
    }

    static calcOverview(id: string): Promise<string> {
        return handleRequest<string>(
            Api.axios.post(`/objects/${id}/calc_overview`, {}),
            data => data && data.runId ? data.runId : null
        );
    }

    static calcDeps(project_id: string, type: string, ids?: string[]): Promise<string> {
        return handleRequest<string>(
            Api.axios.post(`/objects/${project_id}/calc_gr`, { type, ids }),
            data => data && data.runId ? data.runId : null
        );
    }

    static calcApp(project_id: string, app_ids?: string[]): Promise<string> {
        return handleRequest<string>(
            Api.axios.post(`/objects/${project_id}/calc_app`, { app_ids }),
            data => data && data.runId ? data.runId : null
        );
    }

    static calcMg(project_id: string, mg_ids?: string[]): Promise<string> {
        return handleRequest<string>(
            Api.axios.post(`/objects/${project_id}/calc_mg`, { mg_ids }),
            data => data && data.runId ? data.runId : null
        );
    }

    static calcCustomProperty(project_id: string, custom_property_key: string, values?: string[]): Promise<string> {
        return handleRequest<string>(
            Api.axios.post(`/objects/${project_id}/calc_gr`, {
                type: custom_property_key,
                ids: values
            }),
            data => data && data.runId ? data.runId : null
        );
    }

    static stopCalc(project_id: string): Promise<void> {
        return handleRequest<void>(
            Api.axios.delete(`/objects/${project_id}/calc`)
        );
    }


    // Charts
    static getChartConversations(project_id: string): Promise<{ nodes: ChartNode[]; links: ChartLink[] }> {
        return handleRequest<{ nodes: ChartNode[]; links: ChartLink[] }>(
            Api.axios.post('/charts/conversations', { project_id })
        );
    }


    // Messages

    /**
     * Creates a logical message queue returning a uuid.
     * The uuid should be supplied to subsequent getMessages calls.
     */
    static createMessageQueue(): Promise<string> {
        return handleRequest<string>(
            Api.axios.post('/messages', {}),
            data => data && data.id ? data.id : null
        );
    }

    /**
     * Gets messages from the logical message queue specified by the uuid.
     * @param uuid  The uuid that is returned from the createMessageQueue call.
     */
    static getMessages(uuid: string): Promise<any> {
        return handleRequest<any>(
            Api.axios.get(`/messages/${uuid}`)
        );
    }
}
