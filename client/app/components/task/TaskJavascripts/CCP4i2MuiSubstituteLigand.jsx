import React, { useCallback, useState } from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';
import { JSMEEditor } from '../CCP4i2ViewerElements';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button, Grid } from '@mui/material';

export const CCP4i2MuiSubstituteLigand = (props) => {
    const [initialSmiles, setInitialSmiles] = useState("c1ccccc1")
    const [currentSmiles, setCurrentSmiles] = useState("c1ccccc1")

    const copyRight = () => {
        const smilesInItem = props.lookup.itemForName('SMILESIN')
        if (smilesInItem._value !== currentSmiles) {
            props.lookup.changeParameter(
                props.job.jobid,
                smilesInItem._objectPath,
                currentSmiles)
        }
    }

    const copyLeft = () => {
        const smilesInItem = props.lookup.itemForName('SMILESIN')
        setInitialSmiles(smilesInItem._value)
    }

    const onInitial = useCallback(() => {
        const item = props.lookup.itemForName('F_SIGF_IN')
        if (item) {
            const currentFlag = item.contentFlag._value
            if ([3, 4].includes(currentFlag)) {
                props.lookup.changeParameter(props.job.jobid,
                    props.lookup.itemForName('MAKEANOM')._objectPath, false)
            }
        }
    }, [props.job, props.lookup])

    return <CCP4i2ToplevelTask taskName='SubstituteLigand' onInitial={onInitial}>
        <CCP4i2MuiTabs {...props} type="line">
            <CCP4i2MuiTab tab="Main inputs" key="1">

                <CCP4i2MuiContainer  {...props} guiLabel="Pipeline" key="Pipeline" containerHint="FolderLevel" initiallyOpen={true}
                >
                    <CCP4i2MuiWidget {...props} key="PIPELINE" itemName="PIPELINE" guiLabel="Pipeline to apply to start coords" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Key files" key="Key files" containerHint="FolderLevel" initiallyOpen={true} >
                    <CCP4i2MuiWidget {...props} key="FREERFLAG_IN" itemName="FREERFLAG_IN" />
                    <CCP4i2MuiWidget {...props} key="XYZIN" itemName="XYZIN" />
                    <CCP4i2MuiContainer  {...props} guiLabel="Reflections" key="Reflections" containerHint="FolderLevel" initiallyOpen={true} >
                        <CCP4i2MuiWidget {...props} key="OBSAS" itemName="OBSAS" />
                        <CCP4i2MuiWidget {...props} key="UNMERGEDFILES" itemName="UNMERGEDFILES" visibility={() => {
                            return props.lookup.itemForName('OBSAS')._value === 'UNMERGED'
                        }} />
                        <CCP4i2MuiWidget {...props} key="F_SIGF_IN" itemName="F_SIGF_IN" visibility={() => {
                            return props.lookup.itemForName('OBSAS')._value === 'MERGED'
                        }} />
                        <CCP4i2MuiWidget {...props} key="MAKEANOM" itemName="MAKEANOM" visibility={() => {
                            return props.lookup.itemForName('OBSAS')._value === 'UNMERGED' ||
                                [1, 2].includes(props.lookup.itemForName('F_SIGF_IN').contentFlag._value)
                        }} />
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>

            </CCP4i2MuiTab>
            <CCP4i2MuiTab tab="Ligand">

                <CCP4i2MuiContainer  {...props} guiLabel="Ligand" key="Ligand" containerHint="FolderLevel" initiallyOpen={true} >
                <CCP4i2MuiWidget {...props} itemName="LIGANDAS" guiLabel="Ligand geometry provided as" />
                    <CCP4i2MuiWidget {...props} itemName="TLC" guiLabel="Three-to-five letter code for the ligand" visibility={() => {
                        return ['SMILES', 'SKETCH'].includes(props.lookup.itemForName('LIGANDAS')._value)
                    }}  />
                    <CCP4i2MuiContainer {...props} guiLabel="SMILES and preview/editor" visibility={() => {
                        return props.lookup.itemForName('LIGANDAS')._value != 'NONE'
                    }} >
                        <Grid container>
                            <Grid item xs={10}>
                                <JSMEEditor key="jsme" width="400px" height="400px" initialSmiles={initialSmiles}
                                    onChange={(newSmiles) => {
                                        setCurrentSmiles(newSmiles)
                                    }} />
                            </Grid>
                            <Grid item xs={1}>
                                <Grid container><Grid item xs={24}><Button variant="contained" onClick={() => { copyRight() }}><ArrowRightOutlined /></Button> </Grid></Grid>
                                <Grid container><Grid item xs={24}><Button variant="contained" onClick={() => { copyLeft() }}><ArrowLeftOutlined /></Button></Grid></Grid>
                            </Grid>
                            <Grid item xs={13}>
                                <CCP4i2MuiWidget {...props} itemName="SMILESIN" guiLabel="Smiles string" guiMode="multiLine" />
                            </Grid>
                        </Grid>

                    </CCP4i2MuiContainer>
                    <CCP4i2MuiWidget {...props} itemName="MOLIN" guiLabel="MDL Mol File" visibility={() => {
                        return props.lookup.itemForName('LIGANDAS')._value === 'MOL'
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="DICTIN" guiLabel="CIF Dictionary" visibility={() => {
                        return props.lookup.itemForName('LIGANDAS')._value === 'DICT'
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="SMILESFILEIN" guiLabel="File containg SMILES string" visibility={() => {
                        return props.lookup.itemForName('LIGANDAS')._value === 'SMILESFILE'
                    }} />
                </CCP4i2MuiContainer>

            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}