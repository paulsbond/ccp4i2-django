
import React from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiMolrepSelfrot = (props) => {
    return <CCP4i2ToplevelTask taskName='molrep_selfrot'>
        <CCP4i2MuiTabs  {...props}>
            <CCP4i2MuiTab tab="M◊ain inputs" key="1">
                <CCP4i2MuiContainer {...props} guiLabel="Input data" key="Input data" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} key="F_SIGF" itemName="F_SIGF" guiLabel="Reflections" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
            <CCP4i2MuiTab tab="Basic options" key="2">
                <CCP4i2MuiContainer {...props} guiLabel="Perform alignment and use it to rename residues and trim side chains" key="Sculptor">
                    <CCP4i2MuiWidget {...props} key="SEQ" itemName="SEQ" guiLabel=" " menuText={{
                        y: 'always',
                        d: 'only for sequence identity > 20%',
                        n: 'never'
                    }} guiMode="radio" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}