import { CCP4i2MuiAimlessPipe } from './CCP4i2MuiAimlessPipe';
import { CCP4i2MuiPhaserSimple } from './CCP4i2MuiPhaserSimple';
import { CCP4i2MuiPhaserPipeline } from './CCP4i2MuiPhaserPipeline';
import { CCP4i2MuiProsmartRefmac } from './CCP4i2MuiProsmartRefmac';
import { CCP4i2MuiProvideAsuContents } from './CCP4i2MuiProvideAsuContents';
import { CCP4i2MuiSubstituteLigand } from './CCP4i2MuiSubstituteLigand';
import { CCP4i2MuiAddingStatsToMmcifI2 } from './CCP4i2MuiAddingStatsToMmcifI2';
import { CCP4i2MuiPhaserEPLLG } from './CCP4i2MuiPhaserEPLLG';
import { CCP4i2MuiLidiaAcedrgNew } from './CCP4i2MuiLidiaAcedrgNew';
import { CCP4i2MuiPhaserEP } from './CCP4i2MuiPhaserEP';
import { CCP4i2MuiShelx } from './CCP4i2MuiShelx';
import { CCP4i2MuiCsymmatch } from './CCP4i2MuiCsymmatch';
import { CCP4i2MuiProvideSequence } from './CCP4i2MuiProvideSequence';
import { CCP4i2MuiModelcraft } from './CCP4i2MuiModelcraft';
import { CCP4i2MuiGenericTask } from './CCP4i2MuiGenericTask';
import { CCP4i2MuiFreerflag } from './CCP4i2MuiFreerflag'
import { CCP4i2MuiPointlessReindexToMatch } from './CCP4i2MuiPointlessReindexToMatch'
import { CCP4i2MuiParrot } from './CCP4i2MuiParrot'
import { CCP4i2MuiMolrepSelfrot } from './CCP4i2MuiMolrepSelfrot';
import { CCP4i2MuiI2Dimple } from './CCP4i2MuiI2Dimple';
import { CCP4i2MuiCoordinateSelector } from './CCP4i2MuiCoordinateSelector';
import { CCP4i2MuiMolrepMap } from './CCP4i2MuiMolrepMap';

export const TaskJavascripts = {
    getTask: (props) => {
        switch (props.taskName) {
            case "adding_stats_to_mmcif_i2":
                return <CCP4i2MuiAddingStatsToMmcifI2 {...props} />
            case "aimless_pipe":
                return <CCP4i2MuiAimlessPipe {...props} />
            case "csymmatch":
                return <CCP4i2MuiCsymmatch {...props} />
            case "LidiaAcedrgNew":
                return <CCP4i2MuiLidiaAcedrgNew {...props} />
            case "modelcraft":
                return <CCP4i2MuiModelcraft {...props} />
            case "phaser_EP_LLG":
                return <CCP4i2MuiPhaserEPLLG {...props} />
            case "phaser_EP":
                return <CCP4i2MuiPhaserEP {...props} />
            case "phaser_simple":
                return <CCP4i2MuiPhaserSimple {...props} />
            case "phaser_pipeline":
                return <CCP4i2MuiPhaserPipeline {...props} />
            case "prosmart_refmac":
                return <CCP4i2MuiProsmartRefmac {...props} />
            case "ProvideAsuContents":
                return <CCP4i2MuiProvideAsuContents {...props} />
            case "ProvideSequence":
                return <CCP4i2MuiProvideSequence {...props} />
            case "shelx":
                return <CCP4i2MuiShelx {...props} />
            case "pointless_reindexToMatch":
                return <CCP4i2MuiPointlessReindexToMatch {...props} />
            case "SubstituteLigand":
                return <CCP4i2MuiSubstituteLigand {...props} />
            case "freerflag":
                return <CCP4i2MuiFreerflag {...props} />
            case "parrot":
                return <CCP4i2MuiParrot {...props} />
            case "molrep_selfrot":
                return <CCP4i2MuiMolrepSelfrot {...props} />
            case "i2Dimple":
                return <CCP4i2MuiI2Dimple {...props} />
            case "coordinate_selector":
                return <CCP4i2MuiCoordinateSelector {...props} />
            case "molrep_map":
                return <CCP4i2MuiMolrepMap {...props} />
            default:
                return <CCP4i2MuiGenericTask {...props} />
        }
    }
}
export default TaskJavascripts;
