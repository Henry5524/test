import { Box, Button, Card, CardContent, CardHeader, CardProps, CircularProgress, Divider, Grid, IconButton, LinearProgress, Link, ListItemIcon, ListItemText, makeStyles, Menu, MenuItem, Typography, withStyles, } from '@material-ui/core';
import { Project, ProjectResult, ProjectResultLinkText, ProjectResultType, Target } from '@models';
import { bytesRenderer, doRoute, fromNow, setupNavMenu } from '@utils';
import _ from 'lodash';
import Router from 'next/router';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../../context';
import { Api } from '../../services';
import { colors } from '../../styles';
import { CalcStatus, downloadAllResults, ProjectViewType } from '../../utils/common-project';
import { ProjectDeleteDialog, ProjectRenameDialog } from '../dialogs';
import { VcioIcon } from './VcioIcon';

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
        borderRadius: 4,
        backgroundColor: colors.white_100,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_200,
        boxShadow: '0px 0px 0px 0px',
        '&:hover': {
            borderRadius: 4,
            backgroundColor: '#f0fdf8',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: colors.green_300,
            cursor: 'pointer'
        },
        padding: '12px 14px 8px 14px',
    },
    card: {
        '&:hover': {
            textDecoration: 'none'
        }
    },
    title: {
        fontSize: 12,
    },
    projectName: {
        fontSize: 19,
        fontWeight: 600,
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90
    },
    instanceName: {
        height: 24,
        fontSize: 16,
        fontWeight: 600,
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_80
    },
    sectionTitle: {
        height: 20,
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_40,
        marginLeft: 8,

    },
    sectionTitleCompleted: {
        height: 20,
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.green_600,
        marginLeft: 8,
    },
    itemType: {
        fontSize: 13,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90,
    },

    itemCount: {
        fontSize: 13,
        fontWeight: 600,
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90
    },

    dropList: {
        paper: {
            borderRadius: 4,
            backgroundColor: colors.white_100,
            shadowColor: 'rgba(15, 45, 104, 0.15)',
            shadowOffset: {
                width: 0,
                height: 2
            },
            shadowRadius: 15,
            shadowOpacity: 1,
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: colors.blue_gray_200
        }
    },

    pos: {
        marginBottom: 12,
    },
    cancelUpload: {
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted',
        marginLeft: 10,
        color: colors.red_600,
        fontSize: 13,
        fontWeight: 'normal',
        fontStyle: 'normal',
    },

    deleteButton: {
        border: '1px solid ' + colors.red_600,
        marginLeft: 15,
        '&:disabled': {
            color: colors.red_500,
            border: '1px solid ' + colors.red_50,
        },
        '&:hover': {
            backgroundColor: colors.red_50,
            color: colors.red_600,
            border: '1px solid ' + colors.red_600,
        }
    }
});

const StyledMenu = withStyles({
    paper: {
        borderRadius: 4,
        backgroundColor: colors.white_100,
        shadowColor: 'rgba(15, 45, 104, 0.15)',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowRadius: 15,
        shadowOpacity: 1,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_200,
    },
    list: {
        paddingTop: 0,
        paddingBottom: 0,
    }
})(Menu);

const StyledMenuItem = withStyles({
    root: {
        backgroundColor: colors.white_100,
        '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
            color: colors.black_90,
            fontSize: 14
        },
        '&:focus': {
            // backgroundColor: colors.white_100,
            '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                color: colors.black_90,
                fontSize: 14
            },
        },

    },
})(MenuItem);

const UploadLinearProgress = withStyles({
    root: {
        height: 18,
        flexGrow: 1,
        backgroundColor: colors.blue_gray_40,
    },
    bar1Determinate: {
        backgroundColor: colors.blue_100,
    },
})(LinearProgress);

interface ProjectCardProps extends CardProps {
    projectData: Project;
    cardRef: any;
    projectNames: string[];
}

/**
 * Project summary for migration, main dashboard page.
 *
 * @param props
 * @constructor
 */
export const ProjectCard: React.FunctionComponent<ProjectCardProps> = (props) => {
    const appContext = useContext(AppContext);
    const { children, className, projectData, cardRef, projectNames, ...other } = props;
    const classes = useStyles();

    const [anchorEl, setAnchorEl] = useState(null);
    const [progress, setProgress] = useState(0);
    const [renameProjectOpen, setRenameProjectOpen] = useState(false);
    const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((oldProgress) => {
                if (oldProgress === 100) {
                    return 0;
                }
                const diff = Math.random() * 5;
                return Math.min(oldProgress + diff, 100);
            });
        }, 2000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const projectErrorMessage = useMemo(() => {
        let errorMessage = null;

        if (_.isArray(projectData.errors) && projectData.errors.length > 0) {
            const error = projectData.errors[0];
            if (error.error_type === 'upload_project') {
                errorMessage = error.error + ' (#' + error.error_code + ')';
            }
        }

        return errorMessage;
    }, [projectData]);

    const handleMenuClick = useCallback((event: any) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback((event: any) => {
        event.stopPropagation();
        setAnchorEl(null);
    }, []);

    const handleRenameProjectOpen = useCallback(() => {
        setRenameProjectOpen(true);
    }, []);

    const handleRenameProjectClose = useCallback(() => {
        setRenameProjectOpen(false);
    }, []);

    const handleDeleteProjectOpen = useCallback(() => {
        setDeleteProjectOpen(true);
    }, []);

    const handleDeleteProjectClose = useCallback(() => {
        setDeleteProjectOpen(false);
    }, []);

    const renameProject = useCallback(async (_event?: any) => {
        if (_event) {
            _event.stopPropagation();
            setAnchorEl(null);
        }

        handleRenameProjectOpen();
    }, [handleRenameProjectOpen]);

    const deleteProject = useCallback(async (_event?: any) => {
        if (_event) {
            _event.stopPropagation();
            setAnchorEl(null);
        }

        handleDeleteProjectOpen();
    }, [handleDeleteProjectOpen]);

    const downloadResults = useCallback(async (projectId: string, _event?: any) => {
        if (_event) {
            setAnchorEl(null);
        }

        await downloadAllResults(projectId, _event);
    }, []);

    const viewType = useCallback(async (type: ProjectViewType, _event?: any) => {
        if (_event) {
            _event.stopPropagation();
            setAnchorEl(null);
        }

        const LinkPageName = {
            [ProjectViewType.Inventory]: 'inventory',
            [ProjectViewType.Overview]: 'overview',
            [ProjectViewType.App]: 'application/application-summary',
            [ProjectViewType.AppList]: 'application/application-list',
            [ProjectViewType.MoveGroup]: 'mg/move-group-summary',
            [ProjectViewType.MoveGroupList]: 'mg/move-group-list',
            [ProjectViewType.CustomGroup]: 'not-implemented',
        };

        const LinkNodeId = {
            [ProjectViewType.Inventory]: 'inventory',
            [ProjectViewType.Overview]: 'environment-overview',
            [ProjectViewType.App]: 'applications-analysis-summary',
            [ProjectViewType.AppList]: 'applications-list',
            [ProjectViewType.MoveGroup]: 'move-groups-analysis-summary',
            [ProjectViewType.MoveGroupList]: 'move-group-list',
            [ProjectViewType.CustomGroup]: 'not-implemented',
        };

        const LinkNodesToExpand = {
            [ProjectViewType.Inventory]: [],
            [ProjectViewType.Overview]: [],
            [ProjectViewType.App]: ['applications'],
            [ProjectViewType.AppList]: ['applications'],
            [ProjectViewType.MoveGroup]: ['moveGroups'],
            [ProjectViewType.MoveGroupList]: ['moveGroups'],
            [ProjectViewType.CustomGroup]: ['groups'], // todo: not sure what this should be, update after dale implements those results pages
        };

        const target: Target = {
            route: '/migration/project/[projectId]/' + LinkPageName[type],
            route_as: '/migration/project/' + projectData.id + '/' + LinkPageName[type]
        };

        setupNavMenu(appContext, 'migration', LinkNodeId[type], target, projectData.project_name, projectData.project_instance, LinkNodesToExpand[type]);
        doRoute(Router, target);
    }, [appContext, projectData]);

    const cardMenu = useMemo(() => {
        return (
            Boolean(anchorEl) &&
            <StyledMenu
                data-cy="projectCardMenu"
                data-project-id={projectData.id}
                data-project-name={projectData.project_name}
                data-project-version={projectData.project_instance}
                id="card-menu"
                anchorEl={anchorEl}
                elevation={0}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <StyledMenuItem
                    data-cy="projectCardMenuItemViewInventory"
                    onClick={(event) => viewType(ProjectViewType.Inventory, event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="view-list" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="View Inventory"/>
                </StyledMenuItem>
                <StyledMenuItem
                    data-cy="projectCardMenuItemRename"
                    onClick={(event) => renameProject(event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="general-edit" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Rename"/>
                </StyledMenuItem>
                <Divider/>
                <StyledMenuItem
                    data-cy="projectCardMenuItemViewResults"
                    onClick={(event) => viewType(ProjectViewType.Overview, event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="general-eye" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="View Results"/>
                </StyledMenuItem>
                <StyledMenuItem
                    data-cy="projectCardMenuItemDownloadResults"
                    onClick={(event) => downloadResults(projectData.id, event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="general-download" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Download Results"/>
                </StyledMenuItem>
                <Divider/>
                <StyledMenuItem
                    data-cy="projectCardMenuItemDelete"
                    onClick={(event) => deleteProject(event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="general-trash-outline" iconColor={colors.red_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Delete"/>
                </StyledMenuItem>
            </StyledMenu>
        );
    }, [anchorEl, deleteProject, downloadResults, handleMenuClose, projectData, renameProject, viewType]);

    const cardHeader = useMemo(() => {
        return (
            <CardHeader
                data-cy="projectCardHeader"
                action={
                    projectData.id && !projectErrorMessage &&
                    <IconButton
                        data-cy="projectCardMenuButton"
                        aria-controls="card-menu"
                        aria-haspopup="true"
                        onClick={handleMenuClick}
                    >
                        <VcioIcon vcio="general-dots" iconColor={colors.green_500}/>
                        {cardMenu}
                    </IconButton>
                }
                title={
                    <Typography
                        data-cy="projectCardName"
                        className={classes.projectName}
                        gutterBottom
                    >
                        {projectData.project_name}
                    </Typography>
                }
                subheader={
                    <Typography
                        data-cy="projectCardVersion"
                        className={classes.instanceName}
                        gutterBottom
                    >
                        {projectData.project_instance}
                    </Typography>
                }
            />
        );
    }, [classes.instanceName, classes.projectName, cardMenu, handleMenuClick, projectData, projectErrorMessage]);

    const getCardLink = useCallback((projectResultType: ProjectResultType) => {

        const calculationStatus = (results: any) => {
            let status = CalcStatus.Completed;

            if (results.type === null) {
                status = CalcStatus.NotCalculated;
            } else if (results.running) {
                status = CalcStatus.Running;
            } else if (results.error) {
                status = CalcStatus.Error;
            }
            return status as CalcStatus;
        };

        const CalcStatusText = {
            [CalcStatus.NotCalculated]: '(not calculated yet)',
            [CalcStatus.Completed]: '',
            [CalcStatus.Running]: 'calculating',
            [CalcStatus.Error]: '(calculation error occurred)',
        };

        const CalcStatusIcon = {
            [CalcStatus.NotCalculated]: 'status-not-ready',
            [CalcStatus.Completed]: 'status-ok',
            [CalcStatus.Running]: 'status-Info',
            [CalcStatus.Error]: 'status-alarm',
        };

        const CalcStatusIconColor = {
            [CalcStatus.NotCalculated]: colors.blue_gray_300,
            [CalcStatus.Completed]: colors.light_green_600,
            [CalcStatus.Running]: colors.blue_600,
            [CalcStatus.Error]: colors.red_500,
        };

        const CalcStatusTextParensColor = {
            [CalcStatus.NotCalculated]: colors.black_40,
            [CalcStatus.Completed]: colors.black_90,
            [CalcStatus.Running]: colors.blue_600,
            [CalcStatus.Error]: colors.black_90,
        };

        const CalcStatusClass = {
            [CalcStatus.NotCalculated]: classes.sectionTitle,
            [CalcStatus.Completed]: classes.sectionTitleCompleted,
            [CalcStatus.Running]: classes.sectionTitle,
            [CalcStatus.Error]: classes.sectionTitleCompleted,
        };

        const ViewType = {
            [ProjectResultType.Root]: ProjectViewType.Overview,
            [ProjectResultType.Overview]: ProjectViewType.Overview,
            [ProjectResultType.App]: ProjectViewType.App,
            [ProjectResultType.MoveGroup]: ProjectViewType.MoveGroup,
            [ProjectResultType.CustomGroup]: ProjectViewType.CustomGroup,
        };

        const getResultType = (results: ProjectResult[], type: ProjectResultType): ProjectResult => {
            const foundType = _.find(results, (result: ProjectResult) => {
                return result.type === type;
            }) || new ProjectResult();

            return foundType as ProjectResult;
        };

        const results = getResultType(projectData.results, projectResultType);
        const status = calculationStatus(results);
        const typeOfView = ViewType[projectResultType];
        const viewTypeCapitalized = _.capitalize(typeOfView);

        let typeCount = null;
        if (typeOfView === ProjectViewType.App) {
            typeCount = projectData.apps_count;
        }
        if (typeOfView === ProjectViewType.MoveGroup) {
            typeCount = projectData.move_groups_count;
        }
        const calculatedCount = results.params ? results.params.ids.length : 0;
        const calculationMessage = typeCount === null ? '' : '(' + calculatedCount + ' of ' + typeCount + ')';

        const linkContent = (
            <Grid
                data-cy={'projectCardGridContainer' + viewTypeCapitalized}
                container
                direction="row"
                alignItems="center"
            >
                <Grid
                    data-cy={'projectCardGridItemStatus' + viewTypeCapitalized}
                    item
                >
                    {status === CalcStatus.Running ?
                        <CircularProgress style={{ color: CalcStatusIconColor[status], marginLeft: 2 }} size="1rem"/>
                        : <VcioIcon vcio={CalcStatusIcon[status]} style={{ marginTop: -5 }} iconColor={CalcStatusIconColor[status]}/>}
                </Grid>
                <Grid
                    data-cy={'projectCardGridItemLink' + viewTypeCapitalized}
                    item
                >
                    <Typography
                        data-cy={'projectCardLinkText' + viewTypeCapitalized}
                        className={CalcStatusClass[status]}
                        gutterBottom
                        noWrap
                    >
                        {ProjectResultLinkText[projectResultType]}
                        <Box
                            data-cy={'projectCardLinkBox' + viewTypeCapitalized}
                            component="span"
                            style={{ fontSize: 13, color: CalcStatusTextParensColor[status] }}
                        >
                            &nbsp;{CalcStatusText[status]} {status === CalcStatus.NotCalculated || status === CalcStatus.Error ? '' : calculationMessage}
                        </Box>
                    </Typography>
                </Grid>
            </Grid>
        );

        return (
            (status !== CalcStatus.NotCalculated && !projectErrorMessage && typeOfView !== ProjectViewType.CustomGroup) ?
                <Link
                    data-cy={'projectCardLink' + viewTypeCapitalized}
                    onClick={(event: any) => viewType(ViewType[projectResultType], event)}
                >
                    {linkContent}
                </Link>
                : linkContent
        );
    }, [classes.sectionTitle, classes.sectionTitleCompleted, projectData, projectErrorMessage, viewType]);

    const getCardFooterLink = useCallback((projectViewType: ProjectViewType, linkText: string) => {
        return (
            (!projectErrorMessage) ?
                <Link
                    data-cy={'projectCardFooterLink' + _.trim(linkText)}
                    onClick={(event: any) => viewType(projectViewType, event)}
                >
                    {linkText}
                </Link>
                : linkText
        );
    }, [projectErrorMessage, viewType]);

    const normalView = useMemo(() => {
        return (
            <div>
                {getCardLink(ProjectResultType.Overview)}
                {getCardLink(ProjectResultType.App)}
                {getCardLink(ProjectResultType.MoveGroup)}
                {getCardLink(ProjectResultType.CustomGroup)}
                <Typography
                    data-cy="projectCardContentSummaryCounts"
                    className={classes.itemType}
                    gutterBottom
                    noWrap
                >
                    <br/>
                    <Typography component="span" className={classes.itemCount}>{projectData.nodes_count}</Typography>
                    &nbsp;
                    {getCardFooterLink(ProjectViewType.Inventory, 'Compute Instances')}
                    |&nbsp;
                    <Typography component="span" className={classes.itemCount}>{projectData.apps_count}</Typography>
                    &nbsp;
                    {getCardFooterLink(ProjectViewType.AppList, 'Applications')}
                    |&nbsp;
                    <Typography component="span" className={classes.itemCount}>{projectData.move_groups_count}</Typography>
                    &nbsp;
                    {getCardFooterLink(ProjectViewType.MoveGroupList, 'Move Groups')}
                </Typography>
                <Typography
                    data-cy="projectCardContentSummarySizeDate"
                    className={classes.itemType}
                    noWrap
                >
                    {bytesRenderer(projectData.size, true, 2)}, modified {fromNow(projectData.modify_time || projectData.create_time)}
                </Typography>
            </div>
        );
    }, [classes.itemCount, classes.itemType, getCardFooterLink, getCardLink, projectData]);

    const uploadView = useMemo(() => {
        return (
            <div>
                <Typography
                    data-cy="projectCardFileUploadPercentage"
                    style={{
                        fontSize: 27,
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        letterSpacing: 0,
                        color: colors.blue_600,
                        marginTop: -13,
                        textAlign: 'center',
                    }}
                    noWrap
                >
                    {_.round(progress, 1)}%
                </Typography>
                <Typography
                    data-cy="projectCardFileUploading"
                    style={{
                        fontSize: 15,
                        fontWeight: 600,
                        fontStyle: 'normal',
                        letterSpacing: 0,
                        color: colors.blue_600,
                        marginBottom: 75,
                        textAlign: 'center',
                    }}
                    noWrap
                >
                    Uploading Project Data
                </Typography>
                <Typography
                    data-cy="projectCardFileInformation"
                    className={classes.itemType}
                    noWrap
                >
                    {projectData.name}, {bytesRenderer(projectData.size, true, 2)}
                </Typography>
                <Grid container direction="row">
                    <UploadLinearProgress variant="determinate" value={progress}/>
                    <Link
                        data-cy="projectCardCancelUpload"
                        onClick={(event: any) => {
                            event.stopPropagation();

                            const abortUploadKey = projectData.description;

                            if (abortUploadKey) {
                                const abortController = Api.uploadProjectAbortControllerMap.get(abortUploadKey);
                                if (abortController) {
                                    abortController.abort();
                                }
                            }
                        }}
                        className={classes.cancelUpload}
                    >
                        Cancel
                    </Link>
                </Grid>
            </div>
        );
    }, [classes.cancelUpload, classes.itemType, progress, projectData.description, projectData.name, projectData.size]);

    const errorView = useMemo(() => {
        return (
            <div>
                <Typography
                    data-cy="projectErrorMessage"
                    style={{
                        fontSize: 14,
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        letterSpacing: 0,
                        color: colors.red_600,
                        marginTop: 84,
                        marginBottom: 20,
                        textAlign: 'center',
                    }}
                    noWrap
                >
                    {projectErrorMessage}
                </Typography>
                <div>
                    <Button
                        data-cy="projectErrorDownloadButton"
                        variant="outlined"
                        startIcon={<VcioIcon vcio="general-download" iconColor={colors.green_500}/>}
                        onClick={(event) => downloadResults(projectData.id, event)}
                    >
                        Download Error Logs
                    </Button>
                    <Button
                        data-cy="projectErrorDeleteButton"
                        variant="outlined"
                        onClick={(event) => deleteProject(event)}
                        classes={{
                            outlined: classes.deleteButton,
                        }}
                        startIcon={<VcioIcon vcio="general-trash-outline" iconColor={colors.red_500}/>}
                    >
                        Delete Project
                    </Button>
                </div>
            </div>
        );
    }, [classes.deleteButton, deleteProject, downloadResults, projectData, projectErrorMessage]);

    return projectData && (
        <>
            <Card
                ref={cardRef}
                data-cy='projectCard'
                data-project-id={projectData.id}
                data-project-name={projectData.project_name}
                data-project-version={projectData.project_instance}
                onClick={(event: any) => {
                    if (!projectErrorMessage) {
                        viewType(ProjectViewType.Inventory, event);
                    }
                }}
                key={projectData.id}
                className={classes.root}
                {...other}
            >
                {cardHeader}
                <CardContent
                    data-cy='projectCardContent'
                >
                    {projectErrorMessage && errorView}
                    {projectData.id && !projectErrorMessage && normalView}
                    {!projectData.id && uploadView}
                </CardContent>
            </Card>
            {
                renameProjectOpen &&
                <ProjectRenameDialog
                    project={projectData}
                    renameProjectOpen={renameProjectOpen}
                    handleRenameProjectClose={handleRenameProjectClose}
                    projectNames={projectNames}
                />
            }
            {
                deleteProjectOpen &&
                <ProjectDeleteDialog
                    project={projectData}
                    deleteProjectOpen={deleteProjectOpen}
                    handleDeleteProjectClose={handleDeleteProjectClose}
                />
            }
        </>
    );
};
