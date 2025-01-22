import { CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';

export const CCP4i2MuiCoordinateSelector = (props) => {
    return <CCP4i2ToplevelTask taskName='coordinate_selector'>
        <CCP4i2MuiTabs {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="1">
                <CCP4i2MuiWidget {...props} itemName="XYZIN" key="XYZIN" guiLabel="Model" />
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask >
}