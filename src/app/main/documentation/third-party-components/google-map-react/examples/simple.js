import React from 'react';
import {Icon, Tooltip, Typography} from '@material-ui/core';
import GoogleMap from 'google-map-react';

function Marker({text})
{
    return (
        <Tooltip title={text} placement="top">
            <Icon className="text-red">place</Icon>
        </Tooltip>
    );
}

function SimpleExample()
{
    return (
        <div className="w-full">
            <Typography className="h2 mb-16">Simple Map Example</Typography>
            <div className="w-full h-512">
                <GoogleMap
                    bootstrapURLKeys={{
                        key: process.env.REACT_APP_MAP_KEY
                    }}
                    defaultZoom={8}
                    defaultCenter={[27.9506, -82.4572]}
                >
                    <Marker
                        text="Marker Text"
                        lat="27.9506"
                        lng="-82.4572"
                    />
                </GoogleMap>
            </div>
        </div>
    );
}

export default SimpleExample;
