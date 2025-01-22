import React from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiMolrepMap = (props) => {
    return <CCP4i2ToplevelTask taskName='MolrepMap'>
        <CCP4i2MuiTabs  {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer {...props} guiLabel="Input data" key="Input data" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} key="XYZIN" itemName="XYZIN" />
                    <CCP4i2MuiWidget {...props} key="MAPIN" itemName="MAPIN" />
                    <CCP4i2MuiWidget {...props} key="PREPARE" itemName="PREPARE" guiLabel="Map and model preparation" initiallyOpen={true} />
                    <CCP4i2MuiWidget {...props} key="MOLREP" itemName="MOLREP" guiLabel="Molrep parameters" initiallyOpen={true} />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}
