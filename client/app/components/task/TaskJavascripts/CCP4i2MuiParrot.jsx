import React from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';
import { Grid } from '@mui/material';

export const CCP4i2MuiParrot = (props) => {
    return <CCP4i2ToplevelTask taskName='parrot'>
        <CCP4i2MuiTabs  {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer {...props} guiLabel="Input data" key="Input data" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} key="F_SIGF" itemName="F_SIGF" guiLabel="Reflections" />
                    <CCP4i2MuiWidget {...props} key="FREERFLAG" itemName="FREERFLAG" guiLabel="Free R set" />
                    <CCP4i2MuiWidget {...props} key="ASUIN" itemName="ASUIN" guiLabel="Asymmetric unit contents" />
                    <CCP4i2MuiWidget {...props} itemName="ABCD" key="ABCD" guiLabel="Starting phases" />
                    <CCP4i2MuiWidget {...props} key="F_PHI" itemName="F_PHI" guiLabel="Starting map" />
                    <CCP4i2MuiWidget {...props} key="XYZIN_MODE" itemName="XYZIN_MODE" guiLabel="Use of NCS" guiMode="radio" />
                    <CCP4i2MuiContainer {...props} guiLabel="Model from which to infer NCS" key="NCS" containerHint="BlockLevel"
                        visibility={(change) => {
                            return props.lookup.itemForName('XYZIN_MODE')._value !== "no"
                        }}>
                        <CCP4i2MuiWidget {...props} key="XYZIN_HA" itemName="XYZIN_HA" guiLabel="Heavy atom model"
                            visibility={(change) => {
                                return props.lookup.itemForName('XYZIN_MODE')._value === 'ha'
                            }} />
                        <CCP4i2MuiWidget {...props} key="XYZIN_MR" itemName="XYZIN_MR" guiLabel="Full atom model"
                            visibility={(change) => {
                                return props.lookup.itemForName('XYZIN_MODE')._value === 'mr'
                            }} />
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer {...props} guiLabel="Controls" key="Controls" containerHint="FolderLevel" initiallyOpen={true}>
                    <Grid container>
                        <Grid item xs={12}><CCP4i2MuiWidget {...props} key="CYCLES" itemName="CYCLES" guiLabel="Number of cycles" /></Grid>
                        <Grid item xs={12}><CCP4i2MuiWidget {...props} key="ANISOTROPY_CORRECTION" itemName="ANISOTROPY_CORRECTION" guiLabel="Apply anisotropy correction" /></Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={12}><CCP4i2MuiWidget {...props} key="RESOLUTION" itemName="RESOLUTION" guiLabel="Maximum resolution" /></Grid>
                        <Grid item xs={12}><CCP4i2MuiWidget {...props} key="SOLVENT_CONTENT" itemName="SOLVENT_CONTENT" guiLabel="Estimated solvent content" /></Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={12}><CCP4i2MuiWidget {...props} key="NCS_MASK_FILTER_RADIUS" itemName="NCS_MASK_FILTER_RADIUS" guiLabel="Filter radius to define NCS mask" /></Grid>
                        <Grid item xs={12}><CCP4i2MuiWidget {...props} key="VERBOSE" itemName="VERBOSE" guiLabel="Verbosity of log file" /></Grid>
                    </Grid>
                </CCP4i2MuiContainer>

            </CCP4i2MuiTab>
            <CCP4i2MuiTab tab="Reference structures" key="2">
                <CCP4i2MuiContainer {...props} guiLabel="Reference density and atmomic models" key="NCS" containerHint="FolderLevel" initiallyOpen={true}>
                    <span><b><em>You should normally let Parrot choose reference structures</em></b></span>
                    <CCP4i2MuiWidget {...props} key="F_SIGF_REF" itemName="F_SIGF_REF" guiLabel="Reference density reflections" />
                    <CCP4i2MuiWidget {...props} key="ABCD_REF" itemName="ABCD_REF" guiLabel="Reference density phases" />
                    <CCP4i2MuiWidget {...props} key="XYZIN_REF" itemName="XYZIN_REF" guiLabel="Model to define region of space to build" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}
