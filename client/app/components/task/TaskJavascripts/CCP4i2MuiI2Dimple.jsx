import React from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiI2Dimple = (props) => {

    return <CCP4i2ToplevelTask taskName='i2Dimple'>
        <CCP4i2MuiTabs  {...props} type="line">
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer {...props} guiLabel={<b><em>Inputs</em></b>} initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="XYZIN" guiLabel="Atomic model" />
                    <CCP4i2MuiWidget {...props} itemName="F_SIGF" guiLabel="Reflections" />
                    <CCP4i2MuiWidget {...props} itemName="FREERFLAG" guiLabel="Free R set" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer {...props} guiLabel={<b><em>Controls</em></b>} initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="MR_WHEN_R" guiLabel="Use MR if R exceeds" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}
