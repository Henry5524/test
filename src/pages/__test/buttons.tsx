import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import TestIcon from '@material-ui/icons/AddCircle';
import TestIcon2 from '@material-ui/icons/ChevronLeft';

const ButtonsTestPage = () => {
    const [large, setLarge] = useState(false);
    const [ghost, setGhost] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [withicon, setWithicon] = useState(false);
    const [icononly, setIcononly] = useState(false);

    const handleLargeOnChange = () => setLarge(!large);
    const handleGhostOnChange = () => setGhost(!ghost);
    const handleDisabledOnChange = () => setDisabled(!disabled);
    const handleWithiconOnChange = () => setWithicon(!withicon);
    const handleIcononlyOnChange = () => setIcononly(!icononly);

    return (
        <div style={{ padding: 20, background: 'white' }}>
            <Button
                size={large ? 'large' : 'small'}
                variant={ghost ? 'outlined' : undefined}
                disabled={disabled}
                startIcon={withicon && !icononly ? <TestIcon /> : undefined}
                className={icononly ? 'icon-button' : undefined}
            >
                {icononly ? <TestIcon2 /> : 'Text'}
            </Button>
            <br /><br />
            <input style={{ marginLeft: 20 }} type="checkbox" checked={large} onChange={handleLargeOnChange} />Large
            <input style={{ marginLeft: 20 }} type="checkbox" checked={ghost} onChange={handleGhostOnChange} />Ghost
            <input style={{ marginLeft: 20 }} type="checkbox" checked={disabled} onChange={handleDisabledOnChange} />Disabled
            <input style={{ marginLeft: 20 }} type="checkbox" checked={withicon} onChange={handleWithiconOnChange} />With Icon
            <input style={{ marginLeft: 20 }} type="checkbox" checked={icononly} onChange={handleIcononlyOnChange} />Icon Only
            <br />
            <hr />
            <br />
            <table cellSpacing="15">
                <thead>
                    <tr>
                        <th>Normal</th>
                        <th>Disabled</th>
                        <th>startIcon + label</th>
                        <th>IconButton</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <Button size="large">Text</Button>
                        </td>
                        <td>
                            <Button size="large" disabled>Text</Button>
                        </td>
                        <td>
                            <Button size="large" startIcon={<TestIcon />}>Text</Button>
                        </td>
                        <td>
                            <Button size="large" className="icon-button"><TestIcon2 /></Button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Button size="large" variant="outlined">Text</Button>
                        </td>
                        <td>
                            <Button size="large" variant="outlined" disabled>Text</Button>
                        </td>
                        <td>
                            <Button size="large" variant="outlined" startIcon={<TestIcon />}>Text</Button>
                        </td>
                        <td>
                            <Button size="large" variant="outlined" className="icon-button"><TestIcon2 /></Button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Button size="small">Text</Button>
                        </td>
                        <td>
                            <Button size="small" disabled>Text</Button>
                        </td>
                        <td>
                            <Button size="small" startIcon={<TestIcon />}>Text</Button>
                        </td>
                        <td>
                            <Button size="small" className="icon-button"><TestIcon2 /></Button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Button size="small" variant="outlined">Text</Button>
                        </td>
                        <td>
                            <Button size="small" variant="outlined" disabled>Text</Button>
                        </td>
                        <td>
                            <Button size="small" variant="outlined" startIcon={<TestIcon />}>Text</Button>
                        </td>
                        <td>
                            <Button size="small" variant="outlined" className="icon-button"><TestIcon2 /></Button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ButtonsTestPage;
