import React, { useEffect } from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiGenericTask = (props) => {
    useEffect(() => {
        console.log(props)
    }, [])
    return <CCP4i2ToplevelTask taskName={props.taskName}>
        <CCP4i2MuiContainer {...props} itemName={props.taskName} />
    </CCP4i2ToplevelTask>
}
