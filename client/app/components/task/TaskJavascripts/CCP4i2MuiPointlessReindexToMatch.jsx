import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiPointlessReindexToMatch = (props) => {
    return <CCP4i2ToplevelTask taskName='pointless_reindexToMatch'>
        <CCP4i2MuiTabs {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiContainer {...props} guiLabel="Object to reindex" key="Objects to reindex"
                    containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="F_SIGF" key="F_SIGF" guiLabel="Reflections" />
                    <CCP4i2MuiWidget {...props} itemName="FREERFLAG" key="FREERFLAG" guiLabel="Free-R flags" />
                </CCP4i2MuiContainer>
                <CCP4i2MuiContainer {...props} guiLabel="Specifying reindex" key="Specifying reindex"
                    containerHint="FolderLevel" initiallyOpen={true}>
                    <CCP4i2MuiWidget {...props} itemName="REFERENCE" key="REFERENCE" guiLabel="Mode" />
                    <CCP4i2MuiWidget {...props} itemName="HKLIN_FOBS_REF" key="HKLIN_FOBS_REF"
                        guiLabel="Reference reflections"
                        visibility={() => {
                            return props.lookup.itemForName("REFERENCE")._value === "HKLIN_FOBS_REF"
                        }} />
                    <CCP4i2MuiWidget {...props} itemName="HKLIN_FMAP_REF" key="HKLIN_FMAP_REF"
                        guiLabel="Reference map coefficients"
                        visibility={() => {
                            return props.lookup.itemForName("REFERENCE")._value === "HKLIN_FMAP_REF"
                        }} />
                    <CCP4i2MuiWidget {...props} itemName="HKLIN_FC_REF" key="HKLIN_FC_REF"
                        guiLabel="Reference FCs"
                        visibility={() => {
                            return props.lookup.itemForName("REFERENCE")._value === "HKLIN_FC_REF"
                        }} />

                    <CCP4i2MuiWidget {...props} itemName="XYZIN_REF" key="XYZIN_REF"
                        guiLabel="Reference coordinates"
                        visibility={() => {
                            return props.lookup.itemForName("REFERENCE")._value === "XYZIN_REF"
                        }} />

                    <CCP4i2MuiContainer {...props} guiLabel="Spacegroup and operator" key="Spacegroup and operator"
                        containerHint="BlockLevel"
                        visibility={() => {
                            return props.lookup.itemForName("REFERENCE")._value === "SPECIFY"
                        }} >
                        <CCP4i2MuiWidget {...props} itemName="CHOOSE_SPACEGROUP" key="CHOOSE_SPACEGROUP"
                            guiLabel="Specify spacegroup" />
                        <CCP4i2MuiWidget {...props} itemName="REINDEX_OPERATOR" key="REINDEX_OPERATOR"
                            guiLabel="Reindexing operator" />
                        <CCP4i2MuiWidget {...props} itemName="LATTICE_CENTERING" key="LATTICE_CENTERING"
                            guiLabel="Lattice centring" />
                    </CCP4i2MuiContainer>
                    <CCP4i2MuiWidget {...props} itemName="USE_REINDEX" key="USE_REINDEX"
                        guiLabel="Use reindex" />
                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}