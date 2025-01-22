import React, { useCallback } from 'react';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiProvideSequence = (props) => {
    const handleChange = useCallback((change) => {
        console.log('In onChange', change)
        if (change.objectPath === "ProvideSequence.inputData.XYZIN") {
            const theItem = props.lookup.itemForName('XYZIN')
            props.lookup.digestFile(props.job.jobid, theItem._objectPath, theItem._class)
                .then(changedItem => {
                    let summedText = Object.keys(changedItem.contentsDict.sequences)
                        .map(key => `> Chain_${key}\n${changedItem.contentsDict.sequences[key]}`)
                        .join('\n\n')
                    props.lookup.changeParameter(props.job.jobid,
                        "ProvideSequence.controlParameters.SEQUENCETEXT",
                        summedText)
                })
        }
        else if (change.objectPath === "ProvideSequence.inputData.SEQIN") {
            const theItem = props.lookup.itemForName('SEQIN')
            props.lookup.digestFile(props.job.jobid, theItem._objectPath, theItem._class)
                .then(changedItem => {
                    var newText = `>P1; ${changedItem.contentsDict.name}\n\n${changedItem.contentsDict.sequence}`
                    props.lookup.changeParameter(props.job.jobid,
                        "ProvideSequence.controlParameters.SEQUENCETEXT",
                        newText)
                })
        }
    }, [props.job, props.lookup])

    return <CCP4i2ToplevelTask taskName='ProvideSequence' onChange={handleChange}>
        <CCP4i2MuiTabs  {...props} type="line">
            <CCP4i2MuiTab key={1} tab="Main inputs">
                <CCP4i2MuiContainer guiLabel="Optionally take sequence from input sequence or coordinates"
                    containerHint="FolderLevel"
                    initiallyOpen={true} {...props}>
                    <CCP4i2MuiWidget itemName="XYZIN" key="XYZIN" guiLabel="Populate from coordinate file" {...props} />
                    <CCP4i2MuiWidget itemName="SEQIN" key="SEQIN" guiLabel="Populate from .pir/.fasta file" {...props} />
                </CCP4i2MuiContainer>
                <CCP4i2MuiWidget itemName="SEQUENCETEXT" key="SEQUENCETEXT" guiLabel="Sequence" guiMode="multiLine" {...props} />
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}