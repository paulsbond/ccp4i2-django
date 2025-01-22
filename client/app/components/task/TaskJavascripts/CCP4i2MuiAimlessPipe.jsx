import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';


const changedReact = (jobId, taskInterface, change) => {
    const regexp = /aimless_pipe.inputData.UNMERGEDFILES\[(?<index>\d+)\].file$/;
    const match = regexp.exec(change.objectPath)
    if (match !== null) {
        console.log('Demo for matching change name using regex')
    }
}

export const CCP4i2MuiAimlessPipe = (props) => {
    return <CCP4i2ToplevelTask taskName="aimless_pipe">
        <CCP4i2MuiTabs {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer  {...props} guiLabel="Files" key="Files" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="UNMERGEDFILES" guiLabel="Unmerged files" />
                    <CCP4i2MuiWidget {...props} itemName="FREERFLAG" guiLabel="Free R set to use/extend" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Parameters" key="Parameters" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="AUTOCUTOFF" guiLabel="Apply auto. data cutoff" />
                    <CCP4i2MuiWidget {...props} itemName="RESOLUTION_RANGE" guiLabel="Resolution" />
                    <CCP4i2MuiWidget {...props}guiLabel="Override cell difference" key="OVERRIDE_CELL_DIFFERENCE" itemName="OVERRIDE_CELL_DIFFERENCE" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer  {...props} guiLabel="Choosing spacegroup" containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="MODE" guiLabel="Pipeline mode" />
                    <CCP4i2MuiContainer  {...props} guiLabel="Choice options" containerHint="BlockLevel" visibility={() => {
                        const modeItem = props.lookup.itemForName('MODE')
                        return modeItem._value === "CHOOSE"
                    }}>
                        <CCP4i2MuiWidget {...props} itemName="CHOOSE_MODE" guiLabel="Symmetry choice mode" visibility={() => {
                            return props.lookup.itemForName("MODE")._value === "CHOOSE"
                        }} />
                        <CCP4i2MuiWidget {...props} itemName="CHOOSE_SOLUTION_NO" guiLabel="Solution no. to choose" visibility={() => {
                            let chooseModeItem = props.lookup.itemForName('CHOOSE_MODE')
                            return chooseModeItem._value === 'SOLUTION_NO'
                        }} />
                        <CCP4i2MuiWidget {...props} itemName="CHOOSE_SPACEGROUP" guiLabel="Spacegroup to choose" visibility={() => {
                            let chooseModeItem = props.lookup.itemForName('CHOOSE_MODE')
                            return chooseModeItem._value === 'SPACEGROUP' || chooseModeItem._value === 'REINDEX_SPACE'
                        }} />
                        <CCP4i2MuiWidget {...props} itemName="REINDEX_OPERATOR" guiLabel="Reindexing operator" visibility={() => {
                            let chooseModeItem = props.lookup.itemForName('CHOOSE_MODE')
                            return chooseModeItem._value === 'REINDEX_SPACE'
                        }} />
                        <CCP4i2MuiWidget {...props} itemName="CHOOSE_LAUEGROUP" guiLabel="Lauegroup to choose" visibility={() => {
                            let chooseModeItem = props.lookup.itemForName('CHOOSE_MODE')
                            return chooseModeItem._value === 'LAUEGROUP'
                        }} />
                    </CCP4i2MuiContainer>
                    <CCP4i2MuiContainer  {...props} guiLabel="Specify reference" containerHint="BlockLevel" visibility={() => {
                        const modeItem = props.lookup.itemForName('MODE')
                        return modeItem._value === "MATCH"
                    }}>
                        <CCP4i2MuiWidget {...props} itemName="REFERENCE_FOR_AIMLESS" guiLabel="Reference" />
                        <CCP4i2MuiWidget {...props} itemName="REFERENCE_DATASET" guiLabel="Reference type" visibility={() => {
                            const modeItem = props.lookup.itemForName('MODE')
                            const aimlessRefItem = props.lookup.itemForName('REFERENCE_FOR_AIMLESS')
                            return modeItem._value === "MATCH" && aimlessRefItem._value
                        }} />
                        <CCP4i2MuiWidget {...props} itemName="HKLIN_REF" guiLabel="Reference reflections" visibility={() => {
                            const modeItem = props.lookup.itemForName('MODE')
                            const aimlessRefItem = props.lookup.itemForName('REFERENCE_FOR_AIMLESS')
                            return modeItem._value === "MATCH" && aimlessRefItem._value &&
                                props.lookup.itemForName("REFERENCE_DATASET")._value === 'HKL'
                        }} />
                        <CCP4i2MuiWidget {...props} itemName="XYZIN_REF" guiLabel="Reference coordinates" visibility={() => {
                            const modeItem = props.lookup.itemForName('MODE')
                            const aimlessRefItem = props.lookup.itemForName('REFERENCE_FOR_AIMLESS')
                            return modeItem._value === "MATCH" && aimlessRefItem._value &&
                                props.lookup.itemForName("REFERENCE_DATASET")._value === 'XYZ'
                        }} />
                    </CCP4i2MuiContainer>
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}
