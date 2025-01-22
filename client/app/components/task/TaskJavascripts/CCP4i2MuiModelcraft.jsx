import React from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiModelcraft = (props) => {
    return <CCP4i2ToplevelTask taskName='modelcraft'>
        <CCP4i2MuiTabs  {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer {...props} guiLabel="Input data" key="Input data" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} key="F_SIGF" itemName="F_SIGF" guiLabel="Reflections" />
                    <CCP4i2MuiWidget {...props} key="FREERFLAG" itemName="FREERFLAG" guiLabel="Free R set" />
                    <CCP4i2MuiWidget {...props} key="ASUIN" itemName="ASUIN" guiLabel="Asymmetric unit contents" />
                    <CCP4i2MuiContainer {...props} key="Starting phases" guiLabel="Starting phases">
                        <CCP4i2MuiWidget {...props} key="USE_MODEL_PHASES" itemName="USE_MODEL_PHASES" guiLabel="Use model phases" />
                        <CCP4i2MuiWidget {...props} key="PHASES" itemName="PHASES" guiLabel="Starting phases" visibility={(change) => {
                            return !props.lookup.itemForName('USE_MODEL_PHASES')._value
                        }} />
                        <CCP4i2MuiWidget {...props} key="XYZIN" itemName="XYZIN" guiLabel="Coordinates" visibility={(change) => {
                            return props.lookup.itemForName('USE_MODEL_PHASES')._value
                        }} />
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer {...props} guiLabel="Controls" key="Controls">
                    <CCP4i2MuiWidget {...props} key="SELENOMET" itemName="SELENOMET" guiLabel="Build methionine (MET) as selenomethionine (MSE)" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}
