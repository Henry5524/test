import _ from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import { AppContext } from '../../context';
import { Project, ProjectContainer } from '../../models';
import { Api, useProject, useProjects } from '../../services';
import { log, ShowToast, useInterval } from '../../utils';
import { isCalculating, MaskTarget } from '../../utils/common-project';

const LOGGING: boolean = true;      // Set to false when commit/push/merge
const logx = (msg: string, ...more: any[]): void => {
    if (LOGGING) {
        log(msg, more);
    }
};

// Turn off by setting false
const POLL: boolean = true;

const ONE_DAY: number = 86400000;               // Milliseconds in a day

enum CalculationStatus {
    NotCalculating = 0,
    StartedCalculation = 1,
    FinishedCalculation = 2
}

/**
 * Is the message one that we care about?
 * @param messageKey
 */
const isInterestingMessage = (messageKey: string): boolean => {
    return (messageKey === 'object.projectrun.started') ||
        (messageKey === 'object.projectrun.finished') ||
        (messageKey.startsWith('object.project.changed'));
};

/**
 * Is the message for the current project we are showing the user?
 * @param msg
 * @param project
 */
const isMsgForProject = (msg: any, project: ProjectContainer): boolean => {
    return msg.data.parent_id === project.roProjectWithData.id || msg.data.id === project.roProjectWithData.id;
};

/**
 * Based on the message and the project, determines what text to show the user in toast messages.
 * @param msg
 * @param currentProject
 * @param projects
 */
const getProjectDisplayName = (msg: any, currentProject: ProjectContainer, projects: Project[]): string => {

    let projectDisplay: string;

    if (isMsgForProject(msg, currentProject)) {
        // The message is about our current project
        projectDisplay = `${currentProject.roProjectWithData.project_name}/${currentProject.roProjectWithData.project_instance}`;
    } else if (msg.routing_key.startsWith('object.project.changed')) {
        projectDisplay = getProjectNameAndInstance(msg.data.id, projects);
    } else {
        projectDisplay = getProjectNameAndInstance(msg.data.parent_id, projects);
    }
    return projectDisplay;
};

/** f
 * Lookup the project in the array of projects, returning the project name/project instance if found, returning the
 * id if not found.
 * @param id
 * @param projects
 */
const getProjectNameAndInstance = (id: string, projects: any[]): string => {
    const project: any = _.find(projects, { id });
    if (project) {
        return `${project.project_name}/${project.project_instance}`;
    }
    return '(recently created)';
};

/**
 * Process messages:
 *  Handles the message(s) returned from an api request for messages.  There may be one or more messages in a single
 *  response.
 *
 *  If the message is a calculation message for a different project, not the project the user is currently viewing,
 *  we just show a toast.
 *
 *  For calculation messages about the current project:
 *      For a calculation started message
 *          Show the toast
 *          Set a state variable to indicate started calculation
 *          Mutate the project in the swr cache.  The updated project will indicate that it is calculating.
 *          Components will see the change and re-render, giving them a chance to mask the page, show calculation
 *          spinners, ..etc.
 *
 *      For a calculation finished message on the current project
 *          Set a state variable to indicate finished calculation
 *
 *      When we have received both a calculation finished and project changed message for the current project, this means
 *      that the project has been updated on the server after calculation finished.
 *          Show the toast
 *          Mutate the project in the swr cache.  The updated project will indicate that it is not calculating.
 *          Components will see the change and re-render, giving them a chance to unmask the page, remove calculation
 *          spinners, ..etc.
 *
 *  We can also receive project changed messages when the backend completes the project save process.  The flow goes
 *  like this:  Parent page (example Inventory.tsx) sends save api request, backend responds with requestId/projectId,
 *  and begins backend save processing.  When backend save processing is done, our polling for messages will receive
 *  a project changed message.  We look for a changed message with the requestId/projectId to know that our particular
 *  save request finished.  When this happens, call the parents handleFinishedSaving - where the parent can mutate and
 *  unmask.
 *
 * @param arrayOfMsgs       An array of messages received from the server
 * @param currentProject    The current project
 * @param mutateProject     SWR mutate function for currentProject
 * @param calculating       The calculating state variable
 * @param setCalculating    The calculating state variable setter
 * @param enqueueSnackbar   Snack bar function
 * @param appContext
 * @param projects          Array of projects returned from useProjects.  Used to get project name/instance for
 *                          calculation toast messages
 * @param saveInProcessFor?  Received as a property.  Contains a requestId/projectId.  Will only be populated by our parent
 *                          when the project save is initiated by the parent.
 * @param handleFinishedSaving?
 *                          Received as a property.  We call this function on the parent to let the parent know that
 *                          the project is completely saved.
 * @param handleFinishedCalculating?
 *                          Received as a property.  We call this function on the parent to let the parent know that
 *                          the project is finished calculating.
 */
const processMessages = (
    arrayOfMsgs: any[],
    currentProject: ProjectContainer,
    mutateProject: Function,
    calculating: CalculationStatus,
    setCalculating: Function,
    enqueueSnackbar: any,
    appContext: any,
    projects: Project[] | undefined,
    saveInProcessFor?: { requestId: string; projectId: string },
    handleFinishedSaving?: Function,
    handleFinishedCalculating?: Function) => {

    // For calculation the finished and changed messages always seem to be in the same response.  If they ever
    // arrive in different api/v1/message responses, the page would never unmask.  If that happens, we need to convert
    // these two variables to state variables.
    let finished: boolean = false;
    let changed: boolean = false;


    let projectDisplay: string = '';
    let msgIsForCurrentProject: boolean;

    // Loop thru all the messages that were returned in the api call
    // Note that after calculation starts, we need to react to getting BOTH a finished calculating and project changed
    // message. They may be received in any order.

    if (!currentProject) {
        return;
    }
    _.forEach(arrayOfMsgs, msg => {

        if (isInterestingMessage(msg.routing_key)) {

            projectDisplay = getProjectDisplayName(msg, currentProject, projects || []);
            msgIsForCurrentProject = isMsgForProject(msg, currentProject);

            if (msg.routing_key === 'object.projectrun.started') {
                // Started Calculation Message
                logx(`Received Started Calculation message for project ${projectDisplay}`);
                ShowToast(`Calculation started for project ${projectDisplay}`, appContext, enqueueSnackbar);
                if (msgIsForCurrentProject) {
                    setCalculating(CalculationStatus.StartedCalculation);
                    mutateProject();
                }

            } else if (msg.routing_key === 'object.projectrun.finished') {
                // Finished Calculation Message
                logx(`Received Finished Calculation message for project ${projectDisplay}`);
                if (msgIsForCurrentProject) {
                    finished = true;
                    if (changed) {
                        ShowToast(`Calculation finished for project ${projectDisplay}`, appContext, enqueueSnackbar);
                        mutateProject();
                        calculating = CalculationStatus.NotCalculating;
                        if (handleFinishedCalculating) {
                            handleFinishedCalculating();
                        }
                    } else {
                        setCalculating(CalculationStatus.FinishedCalculation);
                    }
                } else {
                    ShowToast(`Calculation finished for project ${projectDisplay}`, appContext, enqueueSnackbar);
                }

            } else if (msg.routing_key.startsWith('object.project.changed')) {
                // Project Changed Message
                logx(`Received Project Changed message for project ${projectDisplay}`);
                if (msgIsForCurrentProject) {
                    if (saveInProcessFor &&
                        (saveInProcessFor.requestId === msg.data.request_id) &&
                        (saveInProcessFor.projectId === msg.data.id)) {
                        // Parent saved this project, and we were waiting for the backend to be finished with the
                        // asynchronous project save logic.  This message tells us the backend is finished.
                        ShowToast('Project successfully saved!', appContext, enqueueSnackbar);
                        if (handleFinishedSaving) {
                            handleFinishedSaving();
                        }
                    } else {
                        changed = true;
                        if (finished || calculating === CalculationStatus.FinishedCalculation) {
                            ShowToast(`Calculation finished for project ${projectDisplay}`, appContext, enqueueSnackbar);
                            mutateProject();
                            calculating = CalculationStatus.NotCalculating;
                            if (handleFinishedCalculating) {
                                handleFinishedCalculating();
                            }
                        }
                    }
                }
            }

        } // if (isInterestingMessage...

    }); // Loop thru all the messages...

}; // processMessages


interface MyProps {
    children: any;

    // maskWhenCalculating true is intended for pages that update the project or kick off calculation of the current
    // project.  Do not provide this property if your page does not kick off calculation.
    // maskWhenSaving true is intended for pages that update/save the project.  Do not provide this property if your
    // page does not save the project.
    // If either of these are true, there is more frequent message polling, as these pages may potentially be waiting
    // to be unmasked after calculation or save.
    maskWhenCalculating?: boolean;
    maskWhenSaving?: boolean;

    // Allows the ability to override the default polling interval - in milliseconds. By default, if either
    // of the above maskWhen properties are true, we will poll more frequently, less frequently when both are false
    // or not supplied.  However; if pollFrequency is supplied by the parent, we use that frequency instead.
    pollFrequency?: number;

    // Pass the requestId/projectId when you have initiated a project save request - the requestId is from the project
    // save response.  When this exists, we will look for a save finished message.
    saveInProcessFor?: { requestId: string; projectId: string };

    // Once a save finished message has been received, this function will be called on our parent
    handleFinishedSaving?: Function;

    // Once a calculation finished message has been received, this function will be called on our parent
    handleFinishedCalculating?: Function;
}

/**
 * Wrap this component around the Page component for Cloud Migration pages that need to react to project save
 * and project calculation messages.
 */
export const ProjectMessagesWrapper: React.FunctionComponent<MyProps> = (props: MyProps) => {

    // Use props.pollFrequency as polling interval when provided.  If not provide, poll every 2 seconds if should
    // maskWhenCalculating or maskWhenSaving, otherwise poll every 5 seconds.
    const POLLING_FREQUENCY: number = props.pollFrequency ? props.pollFrequency : (props.maskWhenCalculating || props.maskWhenSaving ? 2000 : 5000);

    // When POLL is false, effectively turn off polling by setting it to poll once a day
    const pollingInterval: number = (POLL) ? POLLING_FREQUENCY : ONE_DAY;

    const { enqueueSnackbar } = useSnackbar();

    const appContext = useContext(AppContext);
    const { messageQueueUuid } = appContext;

    const { query: { projectId } } = useRouter();
    const { data: project, mutate: mutateProject } = useProject(projectId as string);

    // Array of projects so we can lookup other projects name/instance for calculation toast messages
    // Note that this should already be in the swr cache from the dashboard page that shows all the project cards.
    const { data: projects } = useProjects();

    const [calculating, setCalculating] = useState(isCalculating(project) ? CalculationStatus.StartedCalculation : CalculationStatus.NotCalculating);

    const getMessages = (messageUuid: string) => {
        if (!project?.roProjectWithData) {
            return;
        }
        Api.getMessages(messageUuid)
            .then((arrayOfMsgs: any) => {
                if (arrayOfMsgs.length !== 0) {
                    logx('ProjectMessagesWrapper got message=', JSON.stringify(arrayOfMsgs));
                    processMessages(arrayOfMsgs,
                        project,
                        mutateProject,
                        calculating,
                        setCalculating,
                        enqueueSnackbar,
                        appContext,
                        projects,
                        props.saveInProcessFor,
                        props.handleFinishedSaving,
                        props.handleFinishedCalculating);
                }
            })
            .catch(error => {
                if (error.status === 404) {
                    // The backend will delete the msg queue after five minutes of inactivity. After that, the next
                    // get request for the msg queue will return a 404.  When this happens, create a new msg queue
                    Api.createMessageQueue()
                        .then((uuid) => {
                            appContext.setMessageQueueUuid(uuid);
                            getMessages(uuid);
                        });
                } else {
                    // eslint-disable-next-line no-console
                    console.log(`Error response from message queue pull: ${JSON.stringify(error)}`);
                }
            });
    };

    useInterval(() => {
        if (messageQueueUuid === '') {
            // if user refreshed the page then we need to initiate a new message queue
            Api.createMessageQueue()
                .then((uuid) => {
                    appContext.setMessageQueueUuid(uuid);
                    getMessages(uuid);
                });
        } else {
            getMessages(messageQueueUuid);
        }
    }, pollingInterval);

    if (props.maskWhenCalculating && isCalculating(project)) {
        logx('ProjectMessagesWrapper: is calculating');
        return React.cloneElement(props.children, { mask: MaskTarget.ContentOnly });
    }

    if (props.maskWhenSaving && props.saveInProcessFor && props.saveInProcessFor.requestId !== '') {
        logx('ProjectMessagesWrapper: is saving');
        return React.cloneElement(props.children, { mask: MaskTarget.Everything });
    }

    return props.children;

};

