import $ from 'jquery';
import { fileFields } from '../CCP4i2Api';
import { CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';
import { TSModelValues, simpleAuthFetch } from '../../../app/API';
import { useCallback } from 'react';

const _fetchRefmacXML = async (jobId) => {
    const responseText = await simpleAuthFetch(`/api/CCP4i2/JobFile/${jobId}/input_params.xml`, {
        headers: { Accept: 'application/xml, text/html, application/xhtml+xml' }
    }).then(response => response.text())
    const xmlDoc = $.parseXML(responseText)
    return Promise.resolve({ xmlDoc, jobId })
}

const _fetchRefmacFiles = (jobId, modelType) => {
    var valuesList = []
    if (modelType === 'Files') {
        valuesList = fileFields
    }
    if (modelType === 'Fileuses') {
        var baseFields = []
        for (var fieldName of fileFields.concat()) {
            baseFields.push('fileid__' + fieldName)
        }
        valuesList = baseFields.concat(['jobparamname'])
    }
    return new Promise((resolve, reject) => {
        TSModelValues({
            app: 'CCP4i2',
            model: modelType,
            values: valuesList,
            predicate: { jobid: jobId }
        }).then(response => {
            return response.json()
        }).then(result => {
            var withDeconvolutedFields = result.results
            if (modelType === 'Fileuses') {
                withDeconvolutedFields = []
                for (var result of result.results) {
                    var deconvolutedFields = {}
                    for (var key in result) {
                        var value = result[key]
                        if (['jobparamname', 'fileid__jobparamname'].includes(key)) {
                            deconvolutedFields[key] = value
                        }
                        else if (key === 'fileid__fileid') {
                            deconvolutedFields['fileid'] = value
                        }
                        else {
                            deconvolutedFields[key.substring(8)] = value
                        }
                    }
                    withDeconvolutedFields.push(deconvolutedFields)
                }
            }
            resolve(withDeconvolutedFields)
        })
    })
}

export const CCP4i2MuiAddingStatsToMmcifI2 = (props) => {
    const onChange = useCallback(async (change)=>{
        const taskInterface = props.lookup
        const jobId = props.job.jobid
        console.log('Change is', {change, jobId, taskInterface})
        const objectPath = change.objectPath
        if (objectPath.indexOf('XYZIN') !== -1) {
            const coordFileId = change.newValue.dbFileId._value
            console.log({ coordFileId })
            const refmacJobIdResult = await TSModelValues({
                app: 'CCP4i2',
                model: 'Files',
                values: fileFields,
                predicate: { fileid: coordFileId }
            }).then(response => response.json())
            console.log({ refmacJobIdResult })
            const refmacJobId = refmacJobIdResult.results[0].jobid__jobid
            const result = await _fetchRefmacXML(refmacJobId)
            var useAnomalousNode = $(result.xmlDoc).find('controlParameters').find('USEANOMALOUS')
            //message.info(`Use anomalous is ${useAnomalousNode.text()}`)
            console.log(`Use anomalous is ${useAnomalousNode.text()}`)
            var useTwinNode = $(result.xmlDoc).find('controlParameters').find('USE_TWIN')
            //message.info(`Use twin is ${useTwinNode.text()}`)
            console.log(`Use twin is ${useTwinNode.text()}`)
            console.log('taskInterfaceis ', taskInterface)
            await taskInterface.changeParameter(jobId,
                "adding_stats_to_mmcif_i2.controlParameters.USEANOMALOUS",
                useAnomalousNode.text() === 'True')
            await taskInterface.changeParameter(jobId,
                "adding_stats_to_mmcif_i2.controlParameters.USE_TWIN",
                useTwinNode.text() === 'True')
            const fileUsesResult = await _fetchRefmacFiles(refmacJobId, 'Fileuses')
            console.log('fileUsesResult', fileUsesResult)
    
            {
                const filesOfInterest = []
                let reflectionFileInfo = null
                for (var resultFile of fileUsesResult) {
                    if (['F_SIGF'].includes(resultFile.jobparamname)) {
                        resultFile.mappedName = 'adding_stats_to_mmcif_i2.inputData.F_SIGF'
                        filesOfInterest.push(resultFile)
                        reflectionFileInfo = resultFile
                    }
                    else if (['FREERFLAG'].includes(resultFile.jobparamname)) {
                        resultFile.mappedName = 'adding_stats_to_mmcif_i2.inputData.FREERFLAG'
                        filesOfInterest.push(resultFile)
                    }
                    else if (['TLSIN'].includes(resultFile.jobparamname)) {
                        resultFile.mappedName = 'adding_stats_to_mmcif_i2.inputData.TLSIN'
                        filesOfInterest.push(resultFile)
                    }
                }
                const filesResult = await TSModelValues({
                    app: 'CCP4i2',
                    model: "Files",
                    values: fileFields,
                    predicate: {
                        jobparamname: 'UNMERGEDOUT',
                        jobid__jobid: reflectionFileInfo.jobid__jobid
                    }
                }).then(response => response.json())
                if (filesResult.results.length === 1) {
                    filesResult.results[0].mappedName = 'adding_stats_to_mmcif_i2.inputData.SCALEDUNMERGED'
                    filesOfInterest.push(filesResult.results[0])
                }
                else {
                    //message.warning('The job that generated the reflections did not produce a scaled unmerged file')
                }
    
                var jobNumberElements = reflectionFileInfo.jobid__jobnumber.split('.')
                var aimlessXMLFile = {
                    mappedName: "adding_stats_to_mmcif_i2.inputData.AIMLESSXML",
                    jobid__jobnumber: reflectionFileInfo.jobid__jobnumber,
                    pathflag: 1,
                    filename: "program.xml",
                    annotation: `From job ${reflectionFileInfo.jobid__jobnumber}`,
                    jobid__projectid__projectid: reflectionFileInfo.jobid__projectid__projectid,
                    fileid: null
                }
                filesOfInterest.push(aimlessXMLFile)
                var setMethod = (fileOfInterest) => {
                    var arg = {
                        oldItem: taskInterface.itemForName(fileOfInterest.mappedName),
                        dbItem: fileOfInterest
                    }
                    console.log({fileOfInterest})
                    return taskInterface.selectFile(jobId, 
                        fileOfInterest.mappedName, 
                        fileOfInterest)
                }
                await filesOfInterest.reduce(async (previousPromise, nextID) => {
                    await previousPromise;
                    return setMethod(nextID);
                }, Promise.resolve())
            }
    
            const filesFromJob = await _fetchRefmacFiles(result.jobId, 'Files')
            {
                const filesOfInterest = []
                for (var resultFile of filesFromJob) {
                    if (['TLSOUT'].includes(resultFile.jobparamname)) {
                        resultFile.mappedName = 'adding_stats_to_mmcif_i2.inputData.TLSIN'
                        filesOfInterest.push(resultFile)
                    }
                    else if (['FPHIOUT'].includes(resultFile.jobparamname)) {
                        resultFile.mappedName = 'adding_stats_to_mmcif_i2.inputData.FPHIOUT'
                        filesOfInterest.push(resultFile)
                    }
                    else if (['DIFFPHIOUT'].includes(resultFile.jobparamname)) {
                        resultFile.mappedName = 'adding_stats_to_mmcif_i2.inputData.DIFFPHIOUT'
                        filesOfInterest.push(resultFile)
                    }
                }
                var setMethod = (fileOfInterest) => {
                    var arg = {
                        oldItem: taskInterface.itemForName(fileOfInterest.mappedName),
                        dbItem: fileOfInterest
                    }
                    return taskInterface.selectFile(jobId, fileOfInterest.mappedName, fileOfInterest)
                }
                await filesOfInterest.reduce(async (previousPromise, nextID) => {
                    await previousPromise;
                    return setMethod(nextID);
                }, Promise.resolve());
            }
        }
    
    },
    [props.job, props.lookup])


    return <CCP4i2ToplevelTask
        taskName="adding_stats_to_mmcif_i2"
        onChange={(change) => {
            if (change.objectPath === 'adding_stats_to_mmcif_i2.inputData.XYZIN') {
                onChange(change)
            }
        }} >
        <CCP4i2MuiTabs {...props}>
            <CCP4i2MuiTab tab="Main inputs" key="Main inputs">
                <CCP4i2MuiWidget {...props} key="XYZIN" itemName="XYZIN" guiLabel="Final refmac-refined coordinates" />
                <CCP4i2MuiWidget {...props} key="ASUCONTENT" itemName="ASUCONTENT" guiLabel="ASUContent file with sequences" />
                <CCP4i2MuiWidget {...props} key="SENDTOVALIDATIONSERVER" itemName="SENDTOVALIDATIONSERVER" guiLabel="Send to validation server" />
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}

