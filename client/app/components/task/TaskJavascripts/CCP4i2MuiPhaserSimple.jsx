import React, { useCallback } from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';
import { Grid } from '@mui/material';

export const CCP4i2MuiPhaserSimple = (props_in) => {

    const props = { ...props_in, usingExpertLevel: true }

    const handleChange = useCallback((change) => {
        if (change.objectPath === props.lookup.itemForName('F_SIGF')) {
            const currentFlag = props.lookup.itemForName('F_SIGF').contentFlag._value
            if ([2, 4].includes(currentFlag)) {
                props.lookup.changeParameter(props.job.jobid,
                    props.lookup.itemForName('F_OR_I')._objectPath,
                    'F')
            }
        }
    }, [props.job, props.lookup])

    return <CCP4i2ToplevelTask taskName='phaser_simple' onChange={handleChange}>
        <CCP4i2MuiTabs {...props} type="line">
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer  {...props} guiLabel="Key files" containerHint="FolderLevel" initiallyOpen={true} onInitial={() => {
                    const currentFlag = props.lookup.itemForName('F_SIGF').contentFlag._value
                    if ([2, 4].includes(currentFlag)) {
                        props.lookup.changeParameter(props.job.jobid,
                            props.lookup.itemForName('F_OR_I')._objectPath, 'F')
                    }
                }}>
                    <CCP4i2MuiWidget {...props} itemName="F_OR_I" guiLabel="Use Fs or Is" visibility={() => {
                        return [1, 3].includes(props.lookup.itemForName('F_SIGF').contentFlag._value)
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="F_SIGF" guiLabel="Reflections" />
                    <CCP4i2MuiWidget {...props} itemName="XYZIN" guiLabel="Search coordinates" />
                    <CCP4i2MuiWidget {...props} itemName="INPUT_FIXED" guiLabel="Have known partial model" />
                    <CCP4i2MuiWidget {...props} itemName="XYZIN_FIXED" guiLabel="Known partial model" visibility={() => {
                        return props.lookup.itemForName('INPUT_FIXED')._value
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="FREERFLAG" guiLabel="Free R flags" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Basic parameters" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="NCOPIES" guiLabel="Copies to find" />
                    <CCP4i2MuiContainer  {...props} guiLabel="Resolution" containerHint="RowLevel" initiallyOpen={true}>
                        <Grid item xs={8}><CCP4i2MuiWidget {...props} itemName="RESOLUTION_LOW" guiLabel="Low" /></Grid>
                        <Grid item xs={8}><CCP4i2MuiWidget itemName="RESOLUTION_HIGH"  {...props} guiLabel="High" /></Grid>
                    </CCP4i2MuiContainer>
                    <CCP4i2MuiContainer {...props} guiLabel="Extra steps" containerHint="BlockLevel" initiallyOpen={true}>
                        <Grid container>
                            <Grid item xs={8}><CCP4i2MuiWidget {...props} itemName="RUNSHEETBEND" guiLabel="Sheet bend" /></Grid>
                            <Grid item xs={8}><CCP4i2MuiWidget {...props} itemName="RUNREFMAC" guiLabel="Refmac" /></Grid>
                            <Grid item xs={8}><CCP4i2MuiWidget {...props} itemName="RUNCOOT" guiLabel="Coot add-waters" /></Grid>
                        </Grid>
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Scattering in the crystal" key="Scattering" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="COMP_BY" guiLabel="How to specify scattering content" />
                    <CCP4i2MuiWidget {...props} itemName="ASUFILE" guiLabel="CCP4i2 ASU file" visibility={() => {
                        return props.lookup.itemForName('COMP_BY')._value === 'ASU'
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="ASU_NUCLEICACID_MW" guiLabel="nucleic acid (Da)" visibility={() => {
                        return props.lookup.itemForName('COMP_BY')._value === 'MW'
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="ASU_PROTEIN_MW" guiLabel="protein (Da)" visibility={() => {
                        return props.lookup.itemForName('COMP_BY')._value === 'MW'
                    }} />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Spacegroups" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="SGALT_SELECT" guiLabel="How spacegroups are chosen" />
                    <CCP4i2MuiWidget {...props} itemName="SGALT_TEST" guiLabel="List of spacegroups to try" visibility={() => {
                        var sgalt = props.lookup.itemForName('SGALT_SELECT')._value
                        return sgalt === 'LIST'
                    }} />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Similarity of search model" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="ID_RMS" guiLabel="How to specify similarity (i.e. sequence or coords)" />
                    <CCP4i2MuiWidget {...props} itemName="SEARCHSEQUENCEIDENTITY" guiLabel="Sequence identity (0.0-1.0)" visibility={() => {
                        var idrms = props.lookup.itemForName('ID_RMS')._value
                        return idrms == 'ID'
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="SEARCHRMS" guiLabel="Expected coordinate RMSD (angstroms)" visibility={() => {
                        var idrms = props.lookup.itemForName('ID_RMS')._value
                        return idrms == 'RMS'
                    }} />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
            <CCP4i2MuiTab tab="Keywords" key="2">
                <CCP4i2MuiWidget  {...props} itemName="keywords" guiLabel="" containerHint="BlockLevel" initiallyOpen={true} />
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}
