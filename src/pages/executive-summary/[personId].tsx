import { Button, FormControl, Grid, InputLabel, MenuItem, Toolbar, Typography, } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { Field, Form, Formik } from 'formik';
import { Select, TextField } from 'formik-material-ui';
import Router, { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import useSWR from 'swr';
import { Page } from '../../components/layout';
import { AppContext } from '../../context';
import { ShowToast } from '../../utils';
import { getNavigationMenu } from '../../utils/navigation';

const NAV_MENU = getNavigationMenu('executiveSummary');

const fetcher = (url: RequestInfo) => fetch(url).then(r => r.json());

export default function PersonFormTest() {

    const appContext = useContext(AppContext);
    const { enqueueSnackbar } = useSnackbar();

    const [user] = useState(appContext.user);

    console.log('personId', user);

    // this example shows how to get the ID from the URL, then load data from a local API. The API is defined
    // in pages/api/[personId].js, where [personId] is the ID in the URL
    const {
        query: { personId },
    } = useRouter();
    const { data: person, mutate } = useSWR(`/api/starwars/${personId}`, fetcher);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (values: any) => {
        setErrorMessage('');
        // const { data, error } = await fetch('/api/savePerson', {
        const { data, error } = await fetch('/api/starwars/', {
            method: 'POST',
            body: JSON.stringify({ person: values }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(resp => resp.json());

        if (error) {
            setErrorMessage(error);
            ShowToast(error, appContext, enqueueSnackbar, 'error');
        } else {
            mutate(data, false);
            ShowToast('Successfully saved!', appContext, enqueueSnackbar, 'success');
        }
    };

    return (
        <Page tab="executiveSummary" navMenu={NAV_MENU}>
            {!person && <FormSkeleton/>}
            {person && (
                <>
                    {errorMessage && <Typography color="error">{errorMessage}</Typography>}
                    <Formik
                        initialValues={person}
                        onSubmit={handleSubmit}
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <Form style={{ backgroundColor: '#ffffff' }}>
                            <Grid container direction="column">
                                <Field
                                    component={TextField}
                                    name="name"
                                    label="Name"
                                />
                                <Field
                                    component={TextField}
                                    name="height"
                                    type="number"
                                    label="Height (cm)"
                                />
                                <Field
                                    component={TextField}
                                    name="mass"
                                    type="number"
                                    label="Mass (kg)"
                                />
                                <FormControl>
                                    <InputLabel htmlFor="gender">Gender</InputLabel>
                                    <Field
                                        component={Select}
                                        name="gender"
                                        inputProps={{
                                            id: 'gender',
                                        }}
                                    >
                                        <MenuItem value="male">Male</MenuItem>
                                        <MenuItem value="female">Female</MenuItem>
                                        <MenuItem value="n/a">N/A</MenuItem>
                                    </Field>
                                </FormControl>
                                <Field
                                    component={TextField}
                                    name="birth_year"
                                    label="Bitrh Year"
                                />
                            </Grid>
                            <Toolbar disableGutters>
                                <Button type="submit" variant="contained" color="secondary">Save</Button>
                                <Button onClick={() => Router.push('/executive-summary/dashboard')}>Cancel</Button>
                            </Toolbar>
                        </Form>
                    </Formik>
                </>
            )}
        </Page>
    );
}

const FormSkeleton = () => (
    <div style={{ width: 600 }}>
        <Skeleton height={60}/>
        <Skeleton height={60}/>
        <Skeleton height={60}/>
    </div>
);
