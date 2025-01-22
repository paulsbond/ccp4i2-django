import { CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiCsymmatch = (props) => {
    return <CCP4i2ToplevelTask taskName='csymmatch'>
        <CCP4i2MuiTabs  {...props} type="line">
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiWidget {...props} key="XYZIN_QUERY" itemName="XYZIN_QUERY" guiLabel="Coordinates to move" />
                <CCP4i2MuiWidget {...props} key="XYZIN_TARGET" itemName="XYZIN_TARGET" guiLabel="Reference coordinates" />
                <CCP4i2MuiWidget {...props} key="ORIGIN_HAND" itemName="ORIGIN_HAND" guiLabel="Try all possible origin shifts, and changes of hand" />
                <CCP4i2MuiWidget {...props} key="CONNECTIVITY_RADIUS" guiLabel="Radius to define linkage" />
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}
