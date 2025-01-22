import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiFreerflag = (props) => {
    return <CCP4i2ToplevelTask taskName='freerflag'>
        <CCP4i2MuiTabs {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiWidget {...props} itemName="F_SIGF" key="F_SIGF" guiLabel="Reflections" />
                <CCP4i2MuiWidget {...props} itemName="GEN_MODE" key="GEN_MODE" guiLabel="Mode" />
                <CCP4i2MuiWidget {...props} itemName="FREERFLAG" key="FREERFLAG" guiLabel="Existing Free-R set" visibility={(change) => {
                    return props.lookup.itemForName('GEN_MODE')._value === 'COMPLETE'
                }} />
                <CCP4i2MuiContainer {...props} guiLabel="Key parameters" key="Key parameters">

                    <CCP4i2MuiWidget {...props} itemName="FRAC" key="FRAC" guiLabel="Fraction for free-R set" />
                    <CCP4i2MuiWidget {...props} itemName="UNIQUEIFY" key="UNIQUEIFY" guiLabel="Uniqueify reflections" />
                    <CCP4i2MuiWidget {...props} itemName="COMPLETE" key="COMPLETE" guiLabel="Complete" />

                </CCP4i2MuiContainer>
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask >
}