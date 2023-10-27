import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, makeStyles, TextField, Typography, } from '@material-ui/core';
import { useFormik } from 'formik';
import _ from 'lodash';
import React, { useContext, useState } from 'react';
import { useCookies } from 'react-cookie';
import { AppContext } from '../../context';
import { IdName, Person } from '../../models';
import { Auth } from '../../services';
import { colors, GrayButton, theme } from '../../styles';
import { VcioIcon } from '../controls/VcioIcon';

const useStyles = makeStyles({
    dialog: {
        minWidth: '558px',
        borderRadius: 4,
        backgroundColor: colors.white_100,
        shadowColor: 'rgba(15, 45, 104, 0.39)',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowRadius: 13,
        shadowOpacity: 1,
        borderStyle: 'solid',
        borderWidth: 0,
        borderColor: colors.blue_gray_300,
    },
    closeBtn: {
        padding: theme.spacing(4, 3, 1.5, 0),
        marginLeft: 'auto',
        height: '16px',
        width: '20px'
    },
    dialogContent: {
        paddingLeft: theme.spacing(10)
    },
    titleDiv: {
        // titleDiv is used to override the styles for the root of the DialogTitle
        padding: theme.spacing(3, 0, 0, 10),
        fontFamily: 'Muli',
        fontSize: '22px',
        fontWeight: 300,
        fontStyle: 'normal',
        fontStretch: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        color: colors.black_90
    },
    label: {
        height: 20,
        fontFamily: 'Open Sans',
        fontSize: '14px',
        fontWeight: 'normal',
        fontStretch: 'normal',
        lineHeight: 1.43,
        fontStyle: 'normal',
        letterSpacing: 'normal',
        color: colors.black_90
    },
    text: {
        marginBottom: theme.spacing(2),
        borderRadius: 4,
        backgroundColor: colors.white_100,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_300
    },
    errorText: {
        fontFamily: 'Open Sans',
        fontSize: '13px',
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.38,
        letterSpacing: 'normal',
        color: colors.red_500
    },
    dialogActions: {
        justifyContent: 'flex-start',
        padding: theme.spacing(5, 0, 10, 10)
    }
});

interface AddEditOrganizationDialogProps {
    mode: 'add' | 'edit';
    handleDialogClose: (updated: boolean, newName?: string, id?: string) => void;
    // organization...if being used in edit mode
    organization?: {
        id?: string;
        name?: string;
    };
}

/**
 * Add or edit organization
 *
 * @param props
 * @constructor
 */
export const AddEditOrganizationDialog: React.FunctionComponent<AddEditOrganizationDialogProps> = (props: AddEditOrganizationDialogProps) => {
    const classes = useStyles();
    const appContext = useContext(AppContext);
    const [cookies, setCookie] = useCookies();

    type ValidationMessage = {
        error_message_1: string;
        error_message_2: string;
    };
    const initialValidationMessage: ValidationMessage = {
        error_message_1: '',
        error_message_2: ''
    };
    const [errorMsg, setErrorMsg] = useState(initialValidationMessage);

    /**
     * Validates the new (updated) organization name - makes sure it is not already used.
     * @param organizationName
     * @param organizationId
     */
    const validate = (organizationName: string, organizationId?: string): Promise<ValidationMessage> => {
        return new Promise((resolve, _reject) => {
            const msg: ValidationMessage = initialValidationMessage;
            Auth.getAllOrganizations().then((allOrganizations) => {
                let existing;
                if (organizationId) {
                    existing = _.find(allOrganizations, { name: organizationName });
                    // The org name actually didn't change...
                    if (existing && (existing.id === organizationId)) {
                        existing = undefined;
                    }
                } else {
                    existing = _.find(allOrganizations, { name: organizationName });
                }
                if (existing) {
                    msg.error_message_1 = 'An organization with this name already exists.';
                    msg.error_message_2 = 'Please select another name for the new organization.';
                }
                resolve(msg);
            });
        });
    };

    const handleNameChange = (_event: any) => {
        if (errorMsg.error_message_1 !== '') {
            // Error msg is showing, user changes text, need to get rid of error msg
            setErrorMsg(initialValidationMessage);
        }
    };

    /**
     * Close the dialog by invoking parent function - since dialog was launched by parent
     */
    const handleClose = () => {
        setErrorMsg(initialValidationMessage);
        formik.values.organization_name = '';
        props.handleDialogClose(false);
    };

    /**
     * Update the user info for the current browser session
     */
    const updateLocalUser = async () => {
        // Update list of orgs for the currently user
        return Auth.getUserInfo(appContext.user?.id || '')
            .then((person: Person) => {
                if (appContext.user) {
                    appContext.user.organizations = person.organizations;
                    appContext.user.updateMaps();
                }
                // Update the local session user cookie with new organization
                const userFromCookie = new Person(cookies['local-user-data']);
                userFromCookie.organizations = person.organizations;
                userFromCookie.updateMaps();

                // we are running into 4k cookie size limit and these unused _organizationsMap can safely be deleted from the cookie
                // if the data stored is over 4k the cookie is not persisted
                delete person._organizationsMap;

                setCookie('local-user-data', person, {
                    path: '/',
                    maxAge: 60 * 60 * 24
                });
            });
    };

    /**
     * Add new organization
     *
     * @param organizationName
     */
    const addOrganization = (organizationName: string): Promise<IdName> => new Promise((resolve, _reject) => {
        Auth.addOrganization(organizationName)
            .then((organizationInfo: IdName) => {
                updateLocalUser().then(() => resolve(organizationInfo));
            });
    });

    /**
     * Update organization name
     *
     * @param organizationId
     * @param organizationName
     */
    const updateOrganization = (organizationId: string, organizationName: string): Promise<IdName> => new Promise((resolve, _reject) => {
        Auth.updateOrganization(organizationId, organizationName)
            .then((organizationInfo: IdName) => {
                updateLocalUser().then(() => resolve(organizationInfo));
            });
    });

    /**
     * Validate and either show error messages or add/edit the organization.
     * @param values    The values from the form submit
     */
    const submitHandler = async (values: {
        organization_name: string;
    }) => {
        const organizationName: string = values.organization_name.trim();
        validate(organizationName, props.organization?.id).then((msg: ValidationMessage) => {
            setErrorMsg(msg);
            if (msg.error_message_1 === '') {
                if (props.mode === 'add') {
                    addOrganization(organizationName).then(org => props.handleDialogClose(true, organizationName, org.id));
                } else {
                    updateOrganization(props.organization?.id || '', organizationName)
                        .then(org => props.handleDialogClose(true, organizationName, org.id));
                }
                formik.values.organization_name = '';
            }
        });
    };

    /**
     * Setup formik
     */
    const formik = useFormik({
        initialValues: {
            organization_name: props.mode === 'add' ? '' : (props.organization?.name || '')
        },
        onSubmit: (values) => submitHandler(values),
    });

    return (
        <>
            <Dialog
                data-cy="AddEditOrganizationDialog"
                open={true}
                classes={{ paper: classes.dialog }}
                maxWidth={false}
                onClose={handleClose}
                style={{ maxHeight: '100%' }}
            >
                <IconButton
                    data-cy="closeAddEditOrganizationBtn"
                    className={classes.closeBtn}
                    onClick={handleClose}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} height={16}/>
                </IconButton>
                <DialogTitle
                    data-cy="AddEditOrganizationDialogTitle"
                    id="organization-title"
                    classes={{ root: classes.titleDiv }}
                >
                    {props.mode === 'add' ? 'Create a New Organization' : 'Rename Organization'}
                </DialogTitle>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent className={classes.dialogContent}>
                        <Grid container direction="column">
                            <Typography
                                data-cy="addEditOrganizationNameLabel"
                                className={classes.label}
                                gutterBottom
                            >
                                Enter Organization Name
                            </Typography>
                            <TextField
                                data-cy="addEditOrganizationNameInput"
                                className={classes.text}
                                required
                                autoFocus={true}
                                name="organization_name"
                                autoComplete="off"
                                value={formik.values.organization_name}
                                placeholder="Organization Name"
                                onChange={(event) => {
                                    formik.handleChange(event);
                                    handleNameChange(event);
                                }}
                            />
                            {
                                !!errorMsg.error_message_1 &&
                                <Box className={classes.errorText}>
                                    {errorMsg.error_message_1}
                                </Box>
                            }
                            {
                                !!errorMsg.error_message_2 &&
                                <Box className={classes.errorText}>
                                    {errorMsg.error_message_2}
                                </Box>
                            }
                        </Grid>
                    </DialogContent>
                    <DialogActions className={classes.dialogActions}>
                        <Button
                            data-cy="addEditOrganizationBtn"
                            type="submit"
                            autoFocus
                            disabled={_.isEmpty(formik.values.organization_name)}
                        >
                            {props.mode === 'add' ? 'Create Organization' : 'Save Organization Name'}
                        </Button>
                        <GrayButton
                            data-cy="cancelAddEditOrganizationBtn"
                            onClick={handleClose}
                            size="small"
                        >
                            Cancel
                        </GrayButton>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};

