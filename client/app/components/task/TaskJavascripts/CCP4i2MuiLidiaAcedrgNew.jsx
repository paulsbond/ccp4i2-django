import React, { useEffect, useState } from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';
import { JSMEEditor } from '../CCP4i2ViewerElements'
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button, Grid } from '@mui/material';

export const CCP4i2MuiLidiaAcedrgNew = (props) => {
    const [initialSmiles, setInitialSmiles] = useState("c1ccccc1")
    const [currentSmiles, setCurrentSmiles] = useState("c1ccccc1")
    const [jobStatus, setJobStatus] = useState('Pending')

    useEffect(() => {
        setJobStatus(props.job.status__statustext)
    }, [props.job])

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
        try {
            const smilesInItem = props.lookup.itemForName('SMILESIN')
            if (smilesInItem._value !== initialSmiles) {
                setInitialSmiles(smilesInItem._value)
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        //console.log("plc", props.lookup.current);
        copyLeft()

        if (jobStatus === 'Pending') {
            const chooserItem = props.lookup.itemForName('MOLSMILESORSKETCH')
            if (chooserItem._value === 'SKETCH') {
                try {
                    props.lookup.changeParameter(
                        props.job.jobid,
                        chooserItem._objectPath,
                        'SMILES')
                } catch (err) {
                    console.log(err)
                }
            }
        }

    }, [props.lookup.current, jobStatus])

    return <CCP4i2ToplevelTask taskName='LidiaAcedrgNew'>
        <CCP4i2MuiTabs  {...props} type="line">
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiWidget {...props} itemName="MOLSMILESORSKETCH" guiLabel="Ligand geometry provided as" />
                <CCP4i2MuiContainer {...props} guiLabel="SMILES and preview/editor" visibility={() => {
                    return ['SMILES'].includes(props.lookup.itemForName('MOLSMILESORSKETCH')._value)
                }} >
                    <Grid container>
                        <Grid item xs={10}>
                            <JSMEEditor key="jsme" width="400px" height="400px"
                                initialSmiles={initialSmiles}
                                editable={jobStatus === 'Pending'}
                                onChange={(newSmiles) => {
                                    if (newSmiles !== currentSmiles) {
                                        setCurrentSmiles(newSmiles)
                                    }
                                }} />
                        </Grid>
                        <Grid item xs={1}>
                            <Grid container><Grid item xs={24}><Button variant="contained"
                                disabled={jobStatus !== "Pending"}
                                onClick={() => { copyRight() }}><ArrowRightOutlined /></Button> </Grid></Grid>
                            <Grid container><Grid item xs={24}><Button variant="contained"
                                disabled={jobStatus !== "Pending"}
                                onClick={() => { copyLeft() }}><ArrowLeftOutlined /></Button></Grid></Grid>
                        </Grid>
                        <Grid item xs={13}>
                            <CCP4i2MuiWidget {...props} itemName="SMILESIN" guiLabel="Smiles string" guiMode="multiLine" />
                        </Grid>
                    </Grid>
                </CCP4i2MuiContainer>
                <CCP4i2MuiWidget {...props} itemName="MOLIN" guiLabel="MDL Mol File" visibility={() => {
                    return props.lookup.itemForName('MOLSMILESORSKETCH')._value === 'MOL'
                }} />
                <CCP4i2MuiWidget {...props} itemName="DICTIN2" guiLabel="CIF Dictionary" visibility={() => {
                    return props.lookup.itemForName('MOLSMILESORSKETCH')._value === 'DICT'
                }} />
                <CCP4i2MuiWidget {...props} itemName="SMILESFILEIN" guiLabel="File containg SMILES string" visibility={() => {
                    return props.lookup.itemForName('MOLSMILESORSKETCH')._value === 'SMILESFILE'
                }} />
                <CCP4i2MuiContainer {...props} guiLabel={<b><em>Atom/residue naming</em></b>} initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="TLC" guiLabel="Three letter code for result" />
                    <CCP4i2MuiWidget {...props} itemName="ATOMMATCHOPTION" guiLabel="Atom name matching" />
                    <CCP4i2MuiWidget {...props} itemName="MATCHTLC" guiLabel="Three letter code to match names to" visibility={() => {
                        return props.lookup.itemForName('ATOMMATCHOPTION')._value === 'MONLIBCODE'
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="DICTIN" guiLabel="Local dictionary" visibility={() => {
                        return props.lookup.itemForName('ATOMMATCHOPTION')._value === 'LOCALDICT'
                    }} />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}
