import React, { useState } from 'react';
import { TextField, InputAdornment } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

const TextInputsTestPage = () => {
    const [large, setLarge] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [withicon, setWithicon] = useState(false);
    const [value, setValue] = React.useState('Text');

    const handleLargeOnChange = () => setLarge(!large);
    const handleDisabledOnChange = () => setDisabled(!disabled);
    const handleWithiconOnChange = () => setWithicon(!withicon);

    const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value);

    return (
        <div style={{ padding: 20, background: 'white' }}>
            <TextField
                disabled={disabled}
                size={large ? 'medium' : 'small'}
            />
            <br /><br />
            <input style={{ marginLeft: 20 }} type="checkbox" checked={large} onChange={handleLargeOnChange} />Large
            <input style={{ marginLeft: 20 }} type="checkbox" checked={disabled} onChange={handleDisabledOnChange} />Disabled
            <input style={{ marginLeft: 20 }} type="checkbox" checked={withicon} onChange={handleWithiconOnChange} />With Icon
            <br />
            <hr />
            <br />
            <table cellSpacing="15">
                <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th>Normal</th>
                        <th>Disabled</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Large Text Field</th>
                        <td>
                            <TextField value={value} onChange={handleOnChange}/>
                        </td>
                        <td>
                            <TextField disabled value={value} onChange={handleOnChange}/>
                        </td>
                    </tr>
                    <tr>
                        <th>Small Text Field</th>
                        <td>
                            <TextField size="small" value={value} onChange={handleOnChange}/>
                        </td>
                        <td>
                            <TextField size="small" disabled value={value} onChange={handleOnChange}/>
                        </td>
                    </tr>
                    <tr>
                        <th>Large Text Area</th>
                        <td>
                            <TextField multiline rows={3} value={value} onChange={handleOnChange}/>
                        </td>
                        <td>
                            <TextField multiline rows={3} disabled value={value} onChange={handleOnChange}/>
                        </td>
                    </tr>
                    <tr>
                        <th>Small Text Area</th>
                        <td>
                            <TextField size="small" multiline rows={3} value={value} onChange={handleOnChange}/>
                        </td>
                        <td>
                            <TextField size="small" multiline rows={3} disabled value={value} onChange={handleOnChange}/>
                        </td>
                    </tr>
                    <tr>
                        <th>Large Search Field</th>
                        <td>
                            <TextField
                                value={value}
                                onChange={handleOnChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                disabled
                                value={value}
                                onChange={handleOnChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>Small Search Field</th>
                        <td>
                            <TextField
                                size="small"
                                value={value}
                                onChange={handleOnChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                size="small"
                                disabled
                                value={value}
                                onChange={handleOnChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default TextInputsTestPage;
