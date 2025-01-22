import { useCallback } from 'react';
import { setToastMessage, setToastOpen } from '../../../app/appSlice';
import { useAppDispatch } from '../../../app/hooks';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';



export const CCP4i2MuiPhaserEPLLG = (props_in) => {

    const props = { ...props_in, usingExpertLevel: false }

    const reflectionsChanged = useCallback((change) => {
        const dispatch = useAppDispatch()
        const F_SIGFItem = props.lookup.itemForName('F_SIGF')
        props.lookup.digestFile(props.job.jobid, F_SIGFItem._objectPath, F_SIGFItem._class)
            .then(result => {
                var wavelength = result.contentsDict.wavelengths[result.contentsDict.wavelengths.length - 1]
                props.lookup.changeParameter(props.job.jobid, props.lookup.itemForName('WAVELENGTH')._objectPath, wavelength)
                    .then(result => {
                        dispatch(setToastMessage(result.text()))
                        dispatch(setToastOpen())
                    })
            })
    }, [props.job, props.lookup])

    handleChange = (change) => {
        if (change.change === 'MultipleChange' && change.objectPath.includes('F_SIGF')) {
            reflectionsChanged(change)
        }
    }

    return <CCP4i2ToplevelTask taskName='phaser_EP_LLG' onChange={handleChange}>
        <CCP4i2MuiTabs {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer {...props} guiLabel="Input data" key="Input data" >
                    <CCP4i2MuiWidget {...props} itemName="F_SIGF" key="F_SIGF" />
                    <CCP4i2MuiWidget {...props} itemName="PARTIALMODELORMAP" key="PARTIALMODELORMAP"
                        guiLabel="Partial model as"
                        toolTip="Partial model can be provided as coordinates or a set of map coefficients" />
                    <CCP4i2MuiWidget {...props} itemName="XYZIN_PARTIAL" key="XYZIN_PARTIAL" visibility={() => {
                        return props.lookup.itemForName('PARTIALMODELORMAP')._value === 'MODEL'
                    }} />
                    <CCP4i2MuiWidget {...props} itemName="MAPCOEFF_PARTIAL" key="MAPCOEFF_PARTIAL" visibility={() => {
                        return props.lookup.itemForName('PARTIALMODELORMAP')._value === 'MAP'
                    }} />
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
                <CCP4i2MuiContainer {...props} guiLabel="Basic controls" key="Basic controls" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="WAVELENGTH" key="WAVELENGTH" guiLabel="Wavelength" />
                    <CCP4i2MuiWidget {...props} itemName="RESOLUTION_LOW" key="RESOLUTION_LOW" guiLabel="Low resolution limit" />
                    <CCP4i2MuiWidget {...props} itemName="RESOLUTION_HIGH" key="RESOLUTION_HIGH" guiLabel="High resolution limit" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Similarity of search model"
                    key="Similarity of search model"
                    containerHint="FolderLevel"
                    initiallyOpen={true} visibility={() => {
                        return props.lookup.itemForName('PARTIALMODELORMAP')._value === 'MODEL'
                    }}>
                    <CCP4i2MuiWidget {...props} itemName="PART_VARI" key="PART_VARI" guiLabel="How to specify similarity (i.e. sequence or coords)" />
                    <CCP4i2MuiWidget {...props} itemName="PART_DEVI" key="PART_DEVI" guiLabel="Sequence identity (0.0-1.0) or RMSD (Angstroms)" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
            <CCP4i2MuiTab tab="Keywords" key="2">
                <CCP4i2MuiWidget {...props} itemName="keywords" />
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}


