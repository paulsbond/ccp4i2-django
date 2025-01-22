import React, { useCallback } from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';
import { useAppDispatch } from '../../../app/hooks';
import { setToastMessage } from '../../../app/appSlice';



export const CCP4i2MuiShelx = (props) => {
    const dispatch = useAppDispatch()

    const handleChange = useCallback((change) => {
        if (change.change === 'FileChange' && change.objectPath.includes('F_SIGFanom')) {
            const F_SIGFItem = props.lookup.itemForName('F_SIGFanom')
            props.lookup.digestFile(props.job.jobid, F_SIGFItem._objectPath, F_SIGFItem._class)
                .then(result => {
                    var wavelength = result.contentsDict.wavelengths[result.contentsDict.wavelengths.length - 1]
                    props.lookup.changeParameter(props.job.jobid, props.lookup.itemForName('WAVELENGTH')._objectPath, wavelength)
                        .then(result => {
                            dispatch(setToastMessage(JSON.stringify(result)))
                            dispatch(setToastOpen(true))
                        })
                })
        }
    }, [props.job, props.lookup])

    const onInitial = useCallback((props) => {
        let updates = {}
        if (!props.lookup.itemForName('SHELXCDE')._value) {
            updates['SHELXCDE'] = true
        }
        if (props.lookup.itemForName('USE_COMB')._value) {
            updates['USE_COMB'] = false
        }
        if (!props.lookup.itemForName('SHELX_SEPAR')._value) {
            updates['SHELX_SEPAR'] = true
        }
        if (props.lookup.itemForName('MB_PROGRAM')._value !== 'buccaneer') {
            updates['MB_PROGRAM'] = 'buccaneer'
        }
        return props.lookup.serialSetParameters(props.job.jobid, updates)
    }, [props.job, props.lookup])

    return <CCP4i2ToplevelTask taskName='shelx' onChange={handleChange} onInitial={onInitial}>
        <CCP4i2MuiTabs  {...props} type="line">
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer  {...props} guiLabel="Key files" key="Key files" containerHint="FolderLevel"
                    initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="F_SIGFanom" key="F_SIGFanom" guiLabel="Reflections" />
                    <CCP4i2MuiWidget {...props} itemName="WAVELENGTH" key="WAVELENGTH" guiLabel="Wavelength" />
                    <CCP4i2MuiWidget {...props} itemName="SEQIN" key="SEQIN" guiLabel="Asymmetric unit content" />
                    <CCP4i2MuiWidget {...props} itemName="FREERFLAG" key="FREERFLAG" guiLabel="Free R flags" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Parameters" key="Parameters" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="ATOM_TYPE" key="ATOM_TYPE" guiLabel="Anomalous atom type" />
                    <CCP4i2MuiWidget {...props} itemName="START_PIPELINE" key="START_PIPELINE" guiLabel="First step for analysis atom type" />
                    <CCP4i2MuiWidget {...props} itemName="END_PIPELINE" key="END_PIPELINE" guiLabel="Last step for analysis" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}