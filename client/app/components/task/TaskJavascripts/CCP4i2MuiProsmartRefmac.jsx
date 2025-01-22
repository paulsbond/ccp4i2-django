import React, { useCallback, useRef } from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';
import { Grid } from '@mui/material';


export const CCP4i2MuiProsmartRefmac = (props) => {
    const initialRun = useRef(false)

    const onInitial = useCallback((taskName) => {
        if (props.lookup.itemForName(taskName) && props.job && !initialRun.current) {
            console.log(props.lookup.itemForName(taskName), props.job)
            let updates = {}
            if (props.lookup.itemForName('VALIDATE_BAVERAGE')._value) {
                updates['VALIDATE_BAVERAGE'] = false
            }
            if (props.lookup.itemForName('VALIDATE_RAMACHANDRAN')._value) {
                updates['VALIDATE_RAMACHANDRAN'] = false
            }
            if (props.lookup.itemForName('VALIDATE_MOLPROBITY')._value) {
                updates['VALIDATE_MOLPROBITY'] = false
            }
            initialRun.current = true
            return props.lookup.serialSetParameters(props.job.jobid, updates)
        }
    }, [props.lookup, props.job])

    const handleChange = useCallback((change) => {
        if (change.objectPath.includes('F_SIGF')) {
            const F_SIGFItem = props.lookup.itemForName('F_SIGF')
            const waveLengthPath = props.lookup.itemForName('WAVELENGTH')._objectPath
            const useAnomalousPath = props.lookup.itemForName('USEANOMALOUS')._objectPath
            const useTwinPath = props.lookup.itemForName('USE_TWIN')._objectPath;
            props.lookup.digestFile(props.job.jobid, F_SIGFItem._objectPath, F_SIGFItem._class)
                .then(result => {
                    var wavelength = result.contentsDict.wavelengths[result.contentsDict.wavelengths.length - 1]
                    props.lookup.changeParameter(props.job.jobid, waveLengthPath, wavelength)
                        .then(result => {
                            if (![1, 2].includes(props.lookup.itemForName('F_SIGF').contentFlag._value)) {
                                props.lookup.changeParameter(props.job.jobid, useAnomalousPath, false)
                            }
                            else if (![3].includes(props.lookup.itemForName('F_SIGF').contentFlag._value)) {
                                props.lookup.changeParameter(props.job.jobid, useTwinPath, false)
                            }
                        })
                })
        }
    }, [props.job, props.lookup])

    return props.lookup && <CCP4i2ToplevelTask taskName='prosmart_refmac' onChange={handleChange} onInitial={onInitial} >
        <CCP4i2MuiTabs  {...props} type="line">
            <CCP4i2MuiTab tab="Input data" key="1">
                <CCP4i2MuiContainer  {...props} guiLabel="Main inputs" containerHint="BlockLevel" initiallyOpen={true} >
                    <CCP4i2MuiWidget {...props} itemName="XYZIN" guiLabel="Coordinates" />
                    <CCP4i2MuiWidget {...props} itemName="F_SIGF" guiLabel="Reflections" />
                    <CCP4i2MuiContainer   {...props} guiLabel="Anomalous signal" containerHint="BlockLevel" initiallyOpen={true}
                        visibility={() => {
                            return [1, 2].includes(props.lookup.itemForName('F_SIGF').contentFlag._value)
                        }}>
                        <Grid container>
                            <Grid item xs={6}>
                                <CCP4i2MuiWidget {...props} itemName="USEANOMALOUS" guiLabel="Use anomalous" />
                            </Grid>
                            <Grid item xs={6}>
                                <CCP4i2MuiWidget {...props} itemName="USEANOMALOUSFOR" guiLabel="Use for" visibility={() => {
                                    return [1, 2].includes(
                                        props.lookup.itemForName('F_SIGF').contentFlag._value) &&
                                        props.lookup.itemForName('USEANOMALOUS')._value
                                }} />
                            </Grid>
                            <Grid item xs={6}><CCP4i2MuiWidget {...props} itemName="WAVELENGTH" guiLabel="Wavelength" /></Grid>
                        </Grid>
                    </CCP4i2MuiContainer>
                    <Grid item xs={4}><CCP4i2MuiWidget {...props} itemName="USE_TWIN" guiLabel="Twin refinement" visibility={() => {
                        return [3].includes(props.lookup.itemForName('F_SIGF').contentFlag._value)
                    }} /></Grid>
                    <CCP4i2MuiWidget {...props} itemName="FREERFLAG" guiLabel="Free R flags" />
                    <CCP4i2MuiWidget {...props} itemName="DICT_LIST" guiLabel="Additional dictionaries" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer   {...props} guiLabel="Options" containerHint="BlockLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="NCYCLES" guiLabel="Cycles" key="NCYCLES" />
                    <Grid container key="Row1">
                        <Grid item xs={6} key="Col1">
                            <CCP4i2MuiWidget {...props} itemName="HYDR_USE" guiLabel="Use hydrogens during refinement" key="HYDR_USE" />
                        </Grid>
                        <Grid item xs={6} key="Col2" >
                            <CCP4i2MuiWidget {...props} itemName="HYDR_ALL" guiLabel=" " key="HYDR_ALL" visibility={() => {
                                return props.lookup.itemForName("HYDR_USE")._value
                            }} />
                        </Grid>
                    </Grid>
                    <CCP4i2MuiWidget {...props} itemName="ADD_WATERS" guiLabel="Add waters" key="ADD_WATERS" />
                    <CCP4i2MuiWidget {...props} itemName="USE_TWIN" guiLabel="Crystal is twinned" key="USE_TWIN" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>

            {/* 
        The parameterisation tab
        */}

            <CCP4i2MuiTab tab="Parameterisation" key="Parameterisation">

                <CCP4i2MuiContainer key="B-factors" {...props} guiLabel="B-factors" containerHint="BlockLevel">
                    <Grid container key="Row1">
                        <Grid item xs={12} key="solscale">
                            <CCP4i2MuiWidget {...props} itemName="B_REFINEMENT_MODE" guiLabel="B-factors" />
                        </Grid>
                    </Grid>
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer key="Scaling" {...props} guiLabel="Scaling" containerHint="BlockLevel">
                    <Grid container key="Row1">
                        <Grid item xs={6} key="solscale">
                            <CCP4i2MuiWidget {...props} itemName="SCALE_TYPE" guiLabel="Use " />
                        </Grid>
                        <Grid item xs={6} key="masktype">
                            <CCP4i2MuiWidget {...props} itemName="SOLVENT_MASK_TYPE" guiLabel={<span style={{ marginLeft: "1rem", marginRight: "1rem" }}>solvent scaling, with mask type</span>} />
                        </Grid>
                    </Grid>
                    <CCP4i2MuiWidget {...props} itemName="SOLVENT_ADVANCED" guiLabel="Use custom solvent mask parameters" key="SOLVENT_ADVANCED" visibility={() => {
                        return props.lookup.itemForName('SOLVENT_MASK_TYPE')._value === "EXPLICIT"
                    }} />
                    <CCP4i2MuiContainer {...props} guiLabel="Custom parameters" containerHint="BlockLevel" key="Custom parameters" visibility={() => {
                        return props.lookup.itemForName('SOLVENT_MASK_TYPE')._value === "EXPLICIT" && props.lookup.itemForName('SOLVENT_ADVANCED')._value
                    }}>
                        <CCP4i2MuiWidget {...props} itemName="SOLVENT_VDW_RADIUS" key="SOLVENT_VDW_RADIUS" guiLabel="Increase VDW Radius of non-ion atoms by " />
                        <CCP4i2MuiWidget {...props} itemName="SOLVENT_IONIC_RADIUS" key="SOLVENT_IONIC_RADIUS" guiLabel="Increase VDW Radius of potential ion atoms by " />
                        <CCP4i2MuiWidget {...props} itemName="SOLVENT_SHRINK" key="SOLVENT_SHRINK" guiLabel="Shrink the mask area by a factor of" />
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer key="Translation libration screw (TLS)" {...props} guiLabel="Translation libration screw (TLS)" containerHint="BlockLevel">
                    <Grid container key="row1">
                        <Grid item xs={12} key="col1">
                            <CCP4i2MuiWidget {...props} itemName="TLSMODE" guiLabel="TLS parameters" />
                        </Grid>
                        <Grid item xs={12} key="col12">
                            <CCP4i2MuiWidget {...props} itemName="NTLSCYCLES" guiLabel="Number of TLS cycles" visibility={() => {
                                return props.lookup.itemForName('TLSMODE')._value !== 'NONE'
                            }} />
                        </Grid>
                    </Grid>
                    <CCP4i2MuiContainer key="Custom parameters" {...props} guiLabel="Custom parameters" containerHint="DivLevel" visibility={() => {
                        return props.lookup.itemForName('TLSMODE')._value !== 'NONE'
                    }}>
                        <CCP4i2MuiWidget {...props} itemName="TLSIN" key="" guiLabel="TLS coefficients" visibility={() => {
                            return props.lookup.itemForName('TLSMODE')._value === 'FILE'
                        }} />
                        <Grid container key="row1">
                            <Grid item xs={12} key="col1">
                                <CCP4i2MuiWidget {...props} itemName="BFACSETUSE" guiLabel="Reset all B-factors at start " />
                            </Grid>
                            <Grid item xs={12} key="col2">
                                <CCP4i2MuiWidget {...props} itemName="BFACSET" guiLabel="...to a value of" visibility={() => {
                                    return props.lookup.itemForName('BFACSETUSE')._value
                                }} />
                            </Grid>
                        </Grid>
                        <CCP4i2MuiWidget {...props} itemName="TLSOUT_ADDU" guiLabel="Add TLS contribution to output B-factors (only for analysis and deposition)" />
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>

            </CCP4i2MuiTab>

            {/* 
        The Restraints tab
        */}

            <CCP4i2MuiTab tab="Restraints" key="2">
                <CCP4i2MuiContainer   {...props} key="weights" containerHint="BlockLevel" guiLabel="Weights" >
                    <Grid container>
                        <Grid item xs={16} key="col1">
                            <CCP4i2MuiWidget key="WEIGHTOPT" {...props} itemName="WEIGHT_OPT" guiLabel="Weight restraints versus experimental data using" />
                        </Grid>
                        <Grid item xs={4} key="col2">
                            <CCP4i2MuiWidget key="WEIGHT" {...props} itemName="controlParameters.WEIGHT" guiLabel="Weight" visibility={() => {
                                return props.lookup.itemForName("WEIGHT_OPT")._value == 'MANUAL'
                            }} />
                        </Grid>
                    </Grid>
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer   {...props} key="NCS" containerHint="BlockLevel" guiLabel="Non-crystallographic symmetry (NCS)" >
                    <CCP4i2MuiWidget {...props} itemName="USE_NCS" guiLabel="Use NCS" />
                    <CCP4i2MuiContainer  {...props} guiLabel="NCS" containerHint="DivLevel"
                        visibility={() => { return props.lookup.itemForName("USE_NCS")._value }}>
                        <Grid container>
                            <Grid item xs={12}><CCP4i2MuiWidget {...props} itemName="NCS_TYPE" guiLabel="Type" /></Grid>
                            <Grid item xs={12}><CCP4i2MuiWidget {...props} itemName="NCS_AUTO" guiLabel="Auto" /></Grid>
                        </Grid>
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer   {...props} key="Jelly-body" containerHint="BlockLevel" guiLabel="Jelly-body" >
                    <CCP4i2MuiWidget key="USE_JELLY" {...props} itemName="USE_JELLY" guiLabel="Use jelly body" />
                    <CCP4i2MuiContainer key="Jelly body" {...props} guiLabel="Jelly body" containerHint="DivLevel"
                        visibility={() => { return props.lookup.itemForName("USE_JELLY")._value }}>
                        <Grid container>
                            <Grid item xs={12}><CCP4i2MuiWidget {...props} itemName="JELLY_SIGMA" guiLabel="Sigma" /></Grid>
                            <Grid item xs={12}> <CCP4i2MuiWidget {...props} itemName="JELLY_DIST" guiLabel="Dist" /></Grid>
                        </Grid>
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>

                <CCP4i2MuiWidget {...props} itemName="prosmartProtein" containerHint="FolderLevel" guiLabel="Prosmart - protein" />
            </CCP4i2MuiTab>

            <CCP4i2MuiTab tab="Output" key="Output">
                <CCP4i2MuiContainer key="Output options" {...props} guiLabel="Output options" containerHint="BlockLevel">
                    <CCP4i2MuiWidget {...props} itemName="OUTPUT_HYDROGENS" guiLabel="Output calculated riding hydrogens to file" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer key="Map calculation" {...props} guiLabel="Map calculation" containerHint="BlockLevel">
                    <CCP4i2MuiWidget {...props} itemName="MAP_SHARP" guiLabel="Perform map sharpening when calculating maps" key="MAP_SHARP" />
                    <Grid container key="Sharpen row">
                        <Grid item xs={18} key="Col1">
                            <CCP4i2MuiWidget {...props} itemName="MAP_SHARP_CUSTOM" guiLabel="Use custom sharpening parameter (B-factor)" visibility={() => {
                                { return props.lookup.itemForName("MAP_SHARP")._value }
                            }} key="MAP_SHARP_CUSTOM" />
                        </Grid>
                        <Grid item xs={6} key="Col2">
                            <CCP4i2MuiWidget {...props} itemName="BSHARP" guiLabel=" " visibility={() => {
                                { return props.lookup.itemForName("MAP_SHARP")._value && props.lookup.itemForName("MAP_SHARP_CUSTOM")._value }
                            }} key="BSHARP" />
                        </Grid>
                    </Grid>
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer   {...props} guiLabel="Validation and analysis" containerHint="BlockLevel" initiallyOpen={true} key="Validation">
                    <CCP4i2MuiWidget key={1} {...props} itemName="VALIDATE_BAVERAGE" guiLabel="Analyse B-factor distributions" />
                    <CCP4i2MuiWidget key={2} {...props} itemName="VALIDATE_RAMACHANDRAN" guiLabel="Calculate Ramachandran plots" />
                    <CCP4i2MuiWidget key={3} {...props} itemName="VALIDATE_MOLPROBITY" guiLabel="Run MolProbity to analyse geometry" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>

            <CCP4i2MuiTab tab="Advanced" key="Advanced">
                <CCP4i2MuiContainer key="Experiments" {...props} guiLabel="Experiment" containerHint="BlockLevel">
                    <Grid container key="Sharpen row">
                        <Grid item xs={12} key={1}>
                            <CCP4i2MuiWidget {...props} itemName="SCATTERING_FACTORS" guiLabel="Diffraction experiment type" />
                        </Grid>
                        <Grid item xs={12} key={2}>
                            <CCP4i2MuiWidget {...props} itemName="SCATTERING_ELECTRON" guiLabel="Form factor calculation" visibility={() => {
                                return props.lookup.itemForName("SCATTERING_FACTORS")._value === 'ELECTRON'
                            }} />
                        </Grid>
                    </Grid>
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer key="Resolution" {...props} guiLabel="Resolution" containerHint="BlockLevel">
                    <Grid container key="Row1">
                        <Grid item xs={12} key={1}>
                            <CCP4i2MuiWidget {...props} itemName="RES_CUSTOM" guiLabel="Use custom resol." />
                        </Grid>
                        <Grid item xs={6} key={2}>
                            <CCP4i2MuiWidget {...props} itemName="RES_MIN" guiLabel="min" visibility={() => {
                                return props.lookup.itemForName("RES_CUSTOM")._value
                            }} />
                        </Grid>
                        <Grid item xs={6} key={3}>
                            <CCP4i2MuiWidget {...props} itemName="RES_MAX" guiLabel="max" visibility={() => {
                                return props.lookup.itemForName("RES_CUSTOM")._value
                            }} />
                        </Grid>
                    </Grid>
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer key="B-factor reset" {...props} guiLabel="Reset B-factors" containerHint="BlockLevel">
                    <Grid container key="row1">
                        <Grid item xs={12} key="col1">
                            <CCP4i2MuiWidget {...props} itemName="BFACSETUSE" guiLabel="Reset all B-factors at start " />
                        </Grid>
                        <Grid item xs={12} key="col2">
                            <CCP4i2MuiWidget {...props} itemName="BFACSET" guiLabel="...to a value of" visibility={() => {
                                return props.lookup.itemForName('BFACSETUSE')._value
                            }} />
                        </Grid>
                    </Grid>
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer key="Extra keywords" {...props} guiLabel="Extra keywords" containerHint="BlockLevel">
                    <CCP4i2MuiWidget {...props} itemName="EXTRAREFMACKEYWORDS" guiLabel=" " guiMode="multiLine" key="EXTRAREFMACKEYWORDS" />
                    <CCP4i2MuiWidget {...props} itemName="REFMAC_KEYWORD_FILE" guiLabel="" key="REFMAC_KEYWORD_FILE" />
                </CCP4i2MuiContainer>

            </CCP4i2MuiTab>

        </CCP4i2MuiTabs >
    </CCP4i2ToplevelTask>
}

