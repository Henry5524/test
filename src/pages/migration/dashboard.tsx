import { Message, Page, ProjectCard, ProjectUploadDialog, VcioIcon } from '@components';
import { TooltipToggleButton } from '@components/controls/TooltipToggleButton';
import { AppBar, Box, Divider, Grid, InputAdornment, TextField, Toolbar, Tooltip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Autocomplete, ToggleButtonGroup } from '@material-ui/lab';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { AppContext } from '../../context';
import { Project } from '../../models';
import { useProjects } from '../../services';
import { colors } from '../../styles';
import { getEmptyNavigationMenu } from '../../utils';

const NAV_MENU = getEmptyNavigationMenu('migration');

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(4),
    },
    title: {
        flexGrow: 1,
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
        fontSize: 27,
        fontWeight: 300,
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90
    },
    toolbarPadding: {
        paddingTop: theme.spacing(3),
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        paddingBottom: theme.spacing(2),
    },
    resultsText: {
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.blue_gray_700
    },
    autocompletePaper: {
        backgroundColor: colors.white_100
    },
    toggleButtonRoot: {
        '&.Mui-selected': {
            backgroundColor: colors.green_50,
            borderLeftColor: colors.green_200
        },
    },
    toggleButtonSelected: {
        borderRadius: 4,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.green_200,
    },
    stickyAppBar: {
        backgroundColor: colors.white_100,
        paddingTop: theme.spacing(0),
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        paddingBottom: theme.spacing(0),
        boxShadow: 'none',
    },
    emptyProjectsImage: {
        width: 120,
        height: 120,
        opacity: 0.8
    },
    emptyProjectsText: {
        fontSize: 27,
        fontWeight: 300,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        color: colors.blue_gray_500,
        textAlign: 'center'
    },
    emptyProjectsSubText: {
        fontSize: 14,
        fontWeight: 300,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        color: colors.blue_gray_500,
        textAlign: 'center',
    },
    emptyProjectsLink: {
        fontSize: 15,
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        letterSpacing: 'normal',
        color: colors.green_600,
        textAlign: 'center',
        cursor: 'pointer',
    },
    emptyProjectsContainer: {
        height: '100%',
        margin: '0 20px 0 20px',
        backgroundColor: '#f8f9fc',
        textAlign: 'center',
        alignItems: 'center',
        verticalAlign: 'middle',
        justifyContent: 'center',
        display: 'flex'
    },
    projectsListWrapper: {
        display: 'flex',
        flex: 'auto',
        position: 'relative',
    },
    projectsList: {
        padding: 20,
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflowY: 'auto',
        alignContent: 'start',
    },
}));

/**
 * Main page for migration functionality.
 * @constructor
 */
export default function MigrationDashboard() {
    const appContext = useContext(AppContext);
    const classes = useStyles();
    const hasOrganizations = (appContext?.user?.organizations || []).length > 0;

    // used to keep reference of the project cards (by project id)
    const refsCollection: any = useRef({});

    // only pull the projects if the user belongs to an organization
    const { data, error, mutate } = useProjects(hasOrganizations ? undefined : () => []);

    useEffect(() => {
        const timer: NodeJS.Timeout = setInterval(() => {
            if (appContext.shouldFetchProjectsData) {
                mutate();
            }
        }, 5000);
        // Clear timeout if the component is unmounted
        return () => clearTimeout(timer);
    }, [appContext.shouldFetchProjectsData, mutate]);

    useEffect(() => {
        if (refsCollection.current.scrollto) {
            refsCollection.current.scrollto.scrollIntoView()
        }
    });

    const filteredProjectsData = useMemo(() => {
        return data ? (appContext.projectsDashboardSearch ? data.filter((project: {
            project_instance: string;
            project_name: string;
        }) => project.project_name.match(new RegExp(appContext.projectsDashboardSearch, 'gi'))
            || project.project_instance.match(new RegExp(appContext.projectsDashboardSearch, 'gi'))) : data) : [];
    }, [appContext.projectsDashboardSearch, data]);

    const projectsData = useMemo(() => {
        const sortField = appContext.projectsDashboardSortField;
        const sortDirection = appContext.projectsDashboardSortDirection;

        if (sortField === 'project_instance') {
            return _.orderBy(
                [...filteredProjectsData],
                [project => _.toLower(project.project_instance), project => _.toLower(project.project_name)],
                [sortDirection === 'ASC' ? 'asc' : 'desc', sortDirection === 'ASC' ? 'asc' : 'desc']);
        }

        if (sortField === 'modify_time') {
            return _.orderBy(
                [...filteredProjectsData],
                ['modify_time'],
                [sortDirection === 'ASC' ? 'desc' : 'asc']);
        }

        return _.orderBy([...filteredProjectsData],
            [project => _.toLower(project.project_name), project => _.toLower(project.project_instance)],
            [sortDirection === 'ASC' ? 'asc' : 'desc', sortDirection === 'ASC' ? 'asc' : 'desc']);
    }, [appContext.projectsDashboardSortDirection, appContext.projectsDashboardSortField, filteredProjectsData]);

    const handleSearchChange = useCallback((event: { target: { value: any } }) => {
        appContext.setProjectsDashboardSearch(event.target.value);
    }, [appContext]);

    const handleSortFieldChange = useCallback((_event: object, value: any) => {
        appContext.setProjectsDashboardSortField(value.sortField);
    }, [appContext]);

    const handleSortDirectionChange = useCallback((_event: object, direction: string) => {
        if (direction !== null) {
            appContext.setProjectsDashboardSortDirection(direction);
        }
    }, [appContext]);

    const sortOptions = useMemo(() => {
        return [
            { sortFieldName: 'Project Name', sortField: 'project_name' },
            { sortFieldName: 'Version Name', sortField: 'project_instance' },
            { sortFieldName: 'Modification Timestamp', sortField: 'modify_time' },
        ];
    }, []);

    const getSelectedSort = useCallback((options: any) => {
        const selected = options.find((option: { sortField: any }) => option.sortField === appContext.projectsDashboardSortField) || options[0];
        return { sortFieldName: selected.sortFieldName, sortField: appContext.projectsDashboardSortField };
    }, [appContext.projectsDashboardSortField]);

    // @ts-ignore
    const distinctProjectNames: string[] = useMemo(() => data ? _.sortBy([...new Set(data.map(x => x.project_name))]) : [], [data]);

    const gridContent = useMemo(() => {
        return projectsData.map((project: Project) => (
            <Grid key={project.id} item xs={12} sm={6} md={4} lg={3} xl={3}>
                <ProjectCard
                    cardRef={(ref: any) => {
                        refsCollection.current[project.id || 'scrollto'] = ref;
                    }}
                    projectData={project}
                    projectNames={distinctProjectNames}
                />
            </Grid>
        ));
    }, [distinctProjectNames, projectsData]);

    if (error) {
        return <div style={{ margin: 20, fontSize: 24 }}><Message warning={true}>{error?.message ?? 'Unknown Error'}</Message></div>;
    }

    return (
        <Page
            dataCy="pageMigrationDashboard"
            tab="migration"
            navMenu={NAV_MENU}
        >
            <AppBar
                className={classes.stickyAppBar}
                style={{ position: 'relative' }}
            >
                <Box
                    className={classes.toolbarPadding}
                >
                    <Toolbar>
                        <Typography
                            data-cy="projectDashboardTitle"
                            className={classes.title}
                            variant="h6"
                            noWrap
                        >
                            Cloud Migration Projects
                        </Typography>
                        {hasOrganizations && <ProjectUploadDialog
                            text="New Project"
                            projectNames={distinctProjectNames}
                        />}
                    </Toolbar>
                    <Toolbar
                        style={{ visibility: (!data || data.length === 0) ? 'hidden' : 'visible' }}
                    >
                        <TextField
                            data-cy="projectDashboardSearchField"
                            placeholder="Search projects"
                            value={appContext.projectsDashboardSearch}
                            onChange={handleSearchChange}
                            autoFocus={true}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <VcioIcon vcio="general-search" iconColor={colors.blue_gray_500}/>
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    appContext.projectsDashboardSearch &&
                                    <Tooltip title="Clear this search field" arrow placement="top">
                                        <InputAdornment
                                            position="start"
                                            onClick={() => appContext.setProjectsDashboardSearch('')}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <VcioIcon data-cy="projectDashboardSearchFieldClear" vcio="general-cross" iconColor={colors.blue_gray_500}/>
                                        </InputAdornment>
                                    </Tooltip>
                                ),
                            }}
                            style={{
                                width: 379,
                            }}
                        />
                        <Box className={classes.root}/>
                        <Typography
                            data-cy="projectDashboardResultsCount"
                            className={classes.resultsText}
                            noWrap
                        >
                            Results contain {projectsData ? projectsData.length : 0} projects
                        </Typography>
                        <Divider orientation="vertical" flexItem style={{ marginRight: 16, marginLeft: 16, marginTop: 15, marginBottom: 15 }}/>
                        <Autocomplete
                            data-cy="projectDashboardSortBy"
                            classes={{
                                paper: classes.autocompletePaper,
                            }}
                            options={sortOptions}
                            getOptionLabel={(option) => option.sortFieldName}
                            style={{ width: 220, marginRight: 15 }}
                            renderInput={(params) => <TextField {...params} label="Sort Projects by" variant="outlined"/>}
                            getOptionSelected={(option: { sortField: any }, value: { sortField: any }) => option.sortField === value.sortField}
                            disableClearable
                            openOnFocus
                            autoHighlight
                            autoSelect
                            size="small"
                            selectOnFocus
                            value={getSelectedSort(sortOptions)}
                            onChange={handleSortFieldChange}
                        />
                        <ToggleButtonGroup
                            data-cy="projectDashboardSortByGroup"
                            value={appContext.projectsDashboardSortDirection}
                            exclusive
                            onChange={handleSortDirectionChange}
                            aria-label="sort direction"
                        >
                            <TooltipToggleButton
                                data-cy="projectDashboardSortAscendingButton"
                                title="Sort Ascending"
                                placement="bottom-start"
                                arrow
                                value="ASC"
                                aria-label="sort ascending"
                            >
                                <VcioIcon vcio="data-sort-amount-down-alt" iconColor={colors.green_500}/>
                            </TooltipToggleButton>
                            <TooltipToggleButton
                                data-cy="projectDashboardSortDescendingButton"
                                title="Sort Descending"
                                placement="bottom-start"
                                arrow
                                value="DESC"
                                aria-label="sort descending"
                            >
                                <VcioIcon vcio="data-sort-amount-down" iconColor={colors.green_500}/>
                            </TooltipToggleButton>
                        </ToggleButtonGroup>
                    </Toolbar>
                </Box>
            </AppBar>

            { !hasOrganizations && <HasNoOrganizations/> }
            { hasOrganizations && (!projectsData || projectsData.length === 0) && <EmptyProjects/> }
            <div className={classes.projectsListWrapper}>
                {
                    (hasOrganizations && projectsData && projectsData.length > 0) &&
                    <Grid container className={classes.projectsList} spacing={6} justify="flex-start" alignItems="stretch">
                        {gridContent}
                    </Grid>
                }
            </div>
        </Page>
    );
};

const EmptyProjects = () => {
    const classes = useStyles();
    const { basePath } = useRouter();
    return (
        <>
            <Box className={classes.emptyProjectsContainer}>
                <Grid container style={{ marginTop: '10%' }}>
                    <Grid item xs={12}>
                        <img
                            data-cy="emptyProjects"
                            src={`${basePath}/images/nav-migration.svg`}
                            alt="no projects"
                            className={classes.emptyProjectsImage}
                        />
                    </Grid>
                    <Grid item xs={12} data-cy="letsGetStarted">
                        <span className={classes.emptyProjectsText}>
                            Let's get started!
                        </span>
                    </Grid>
                    <Grid item xs={12} style={{ marginTop: 10, marginBottom: 32 }} data-cy="shownHere">
                        <span className={classes.emptyProjectsSubText}>
                            Your cloud migration projects will be shown here
                        </span>
                    </Grid>
                    <Grid item xs={12}>
                        <ProjectUploadDialog
                            text="Create a New Project"
                            projectNames={[]}
                        />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

const HasNoOrganizations = () => {
    const classes = useStyles();
    const { basePath } = useRouter();
    return (
        <>
            <Box className={classes.emptyProjectsContainer}>
                <Grid container style={{ marginTop: '10%' }}>
                    <Grid item xs={12}>
                        <img
                            data-cy="emptyProjects"
                            src={`${basePath}/images/nav-migration.svg`}
                            alt="no projects"
                            className={classes.emptyProjectsImage}
                        />
                    </Grid>
                    <Grid item xs={12} data-cy="letsGetStarted">
                        <span className={classes.emptyProjectsText}>
                            You are not a member of an organization
                        </span>
                    </Grid>
                    <Grid item xs={12} style={{ marginTop: 10, marginBottom: 32 }} data-cy="shownHere">
                        <span className={classes.emptyProjectsSubText}>
                            Contact Support for assistance
                        </span>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

