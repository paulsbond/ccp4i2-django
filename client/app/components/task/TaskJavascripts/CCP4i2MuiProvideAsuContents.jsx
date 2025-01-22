import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { makeDataFileItem, makeCPdbDataFileItem } from '../CCP4i2WidgetUtils';
import { objectMethod } from '../CCP4i2Api';
import { simpleAuthFetch } from '../../../app/API';
import $ from 'jquery';
import { Collapse } from 'antd';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { CCP4i2MuiContainer, CCP4i2MuiTabs, CCP4i2MuiTab, CCP4i2MuiWidget, CCP4i2ToplevelTask } from '../CCP4i2TaskJavascriptElements';
import { Typography } from '@mui/material';
import { Grid } from '@mui/material';
import { GeneralTable } from '../../General/GeneralTable';
import { CCP4i2Reviver } from '../CCP4i2ReviverLookup';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addTaskLookupItem, buildLookup } from '../../../features/ccp4i2/ccp4i2Slice';
import { CCP4i2ReduxTaskWidget } from '../CCP4i2ReduxTaskWidgets';
import { thunkChangeParameters, thunkSerialSetObjects } from '../../../features/ccp4i2/ccp4i2Thunks';

const { Text } = Typography;

const seqFile = makeDataFileItem('ProvideAsuContents.controlParameters.SOURCESEQ', 'CSeqDataFile', 'application/CCP4-seq')
const coordFile = makeCPdbDataFileItem('ProvideAsuContents.controlParameters.SOURCEPDB', 'CPdbDataFile', 'chemical/x-pdb')

export const CCP4i2MuiProvideAsuContents = (props) => {
    const [matthewsData, setMatthewsData] = useState({ baseWeight: '-', cellVolume: '-', tableString: '' })
    const dispatch = useAppDispatch()
    const { taskLookup } = useAppSelector(state => state.ccp4i2)

    useEffect(() => {
        if (taskLookup) {
            if (!Object.keys(taskLookup).includes('ProvideAsuContents.controlParameters.SOURCESEQ')) {
                dispatch(addTaskLookupItem({ 'ProvideAsuContents.controlParameters.SOURCESEQ': seqFile }))
            }
            if (!Object.keys(taskLookup).includes('ProvideAsuContents.controlParameters.SOURCEPDB')) {
                dispatch(addTaskLookupItem({ 'ProvideAsuContents.controlParameters.SOURCEPDB': coordFile }))
            }
        }
    }, [taskLookup])

    const extrasAdded = useMemo(() => {
        if (taskLookup) {
            return Object.keys(taskLookup).includes('ProvideAsuContents.controlParameters.SOURCEPDB') &&
                Object.keys(taskLookup).includes('ProvideAsuContents.controlParameters.SOURCESEQ')
        }
    }, [taskLookup])

    const addSequences = useCallback((sequences) => {
        var ASU_CONTENT = props.lookup.itemForName(`ProvideAsuContents.inputData.ASU_CONTENT`)
        const newItems = Object.keys(sequences).map(chainId => {
            const newItem = JSON.parse(JSON.stringify(ASU_CONTENT._subItem), CCP4i2Reviver)
            const regexp = /(?<baseElement>.*)\[\?\]$/;
            const match = regexp.exec(newItem._objectPath)
            console.log(match)
            if (match?.groups) {
                const parentObjectName = match[1]
                const itemLookup = {}
                buildLookup(newItem, itemLookup)
                Object.keys(itemLookup).forEach(lookupKey => {
                    const lookupItem = itemLookup[lookupKey]
                    lookupItem._objectPath = lookupItem._objectPath.replace(`${parentObjectName}[?]`, `${parentObjectName}[${ASU_CONTENT._value ? ASU_CONTENT._value.length : 0}]`)
                })
            }
            newItem.sequence._value = sequences[chainId]
            newItem.name._value = chainId
            newItem.description._value = `Chain ${chainId}`
            return newItem
        })
        return newItems
    }, [props.job, props.lookup])

    const adoptFileChanged = useCallback(async (item, changedArg) => {
        let newSequences = {}
        console.log(item, changedArg)
        if (changedArg.dbFileId !== null) {
            return simpleAuthFetch(`/api/CCP4i2/DatabaseFileDigest?${$.param({ fileid: changedArg.dbFileId })}`)
                .then(response => response.json())
                .then(result => {
                    console.log({ result })
                    if (result._class === 'CPdbDataFile') {
                        Object.keys(result.contentsDict.sequences).forEach(chainId => {
                            newSequences[chainId] = result.contentsDict.sequences[chainId]
                        })
                    }
                    else if (result._class === 'CSeqDataFile') {
                        newSequences[result.contentsDict.name] = result.contentsDict.sequence
                    }
                    const addedSequences = addSequences(newSequences)
                    return Promise.resolve(addedSequences)
                })
        }
        /*
        else {
            if (changedArg.oldItem._class === 'CPdbDataFile') {
                Object.keys(changedArg.oldItem.contentsDict.sequences).forEach(chainId => {
                    newSequences[chainId] = changedArg.oldItem.contentsDict.sequences[chainId]
                })
            }
            else if (changedArg.oldItem._class === 'CSeqDataFile') {
                newSequences[changedArg.oldItem.contentsDict.name] = changedArg.oldItem.contentsDict.sequence
            }
            addSequences(props, newSequences)
        }
        */
    }, [props.job, props.lookup])

    const contentChanged = useCallback(async (change) => {
        const molWeightResult = await objectMethod({
            jobId: props.job.jobid,
            objectPath: 'ProvideAsuContents.inputData.ASU_CONTENT',
            methodName: 'molecularWeight'
        }).then(response => response.json())

        console.log('Matthews result', { molWeightResult })
        let newMatthewsData = {}
        newMatthewsData.baseWeight = molWeightResult.result.toFixed(2)

        if (molWeightResult.result > 0.1) {
            const matthewsResult = await objectMethod({
                jobId: props.job.jobid,
                objectPath: 'ProvideAsuContents.inputData.HKLIN.fileContent',
                methodName: 'matthewsCoeff',
                kwargs: { molWt: molWeightResult.result }
            }).then(response => response.json())

            const newTable = matthewsResult.result.results.map((item, iItem) => {
                return `${item.nmol_in_asu} ${item.prob_matth} ${item.nmol_in_asu} ${item.percent_solvent / 100.}`
            })
            newMatthewsData.tableString = newTable.join('\r')
            newMatthewsData.cellVolume = matthewsResult.result.cell_volume
            setMatthewsData(newMatthewsData)
        }
        else {
            newMatthewsData.tableString = [].join('\r')
            setMatthewsData(newMatthewsData)
        }
    }, [props.job, props.lookup])

    return extrasAdded && <CCP4i2ToplevelTask taskName='ProvideAsuContents' onChange={contentChanged} onInitial={contentChanged}>
        <CCP4i2MuiTabs  {...props} type="line">
            <CCP4i2MuiTab key={1} tab="Main inputs">
                <CCP4i2MuiContainer {...props} key="Content" guiLabel="Content">
                    <CCP4i2MuiWidget {...props} key="Content" itemName="ASU_CONTENT" guiLabel="ASU content" />
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer {...props} key="Content probability analysis" guiLabel="Content probability analysis">
                    <Grid key="1" container>
                        <Grid key="1" item xs={8}>
                            <CCP4i2ReduxTaskWidget {...props} key="Content" itemName="HKLIN" guiLabel="MTZ for cell" />
                        </Grid>
                        <Grid key="2" item xs={4}>
                            <MatthewsHistogram data={matthewsData} />
                        </Grid>
                    </Grid>
                    <Grid key="2" container>
                        <Grid item xs={12}>
                            <MatthewsTable data={matthewsData} />
                        </Grid>
                    </Grid>
                </CCP4i2MuiContainer>

                <CCP4i2MuiContainer {...props} key="Adopt sequence from" guiLabel="Adopt sequence from">
                    <CCP4i2MuiWidget {...props} key="seqFile" itemName={seqFile._objectPath} guiLabel="Sequence" willChange={(item, newValue) => {
                        console.log({ item })
                        if (item._objectPath === 'ProvideAsuContents.controlParameters.SOURCESEQ') {
                            adoptFileChanged(item, newValue)
                                .then(addedSequences => {
                                    addedSequences.forEach(addedSequence => {
                                        const changeObject = {};
                                        const tags = ['description', 'name', 'sequence'];
                                        tags.forEach(tag => {
                                            changeObject[tag] = addedSequence[tag]._value
                                        })
                                        const objectPath = addedSequence._objectPath
                                        console.log({ objectPath, changeObject })
                                        dispatch(thunkChangeParameters(props.job.jobid, objectPath, changeObject))
                                    })
                                })
                            return false
                        }
                        return true
                    }} />
                    <CCP4i2MuiWidget key="coordFile" itemName={coordFile._objectPath} guiLabel="Coords" lookup={props.lookup} job={props.job}
                        willChange={(item, newValue) => {
                            console.log({ item })
                            if (item._objectPath === 'ProvideAsuContents.controlParameters.SOURCEPDB') {
                                adoptFileChanged(item, newValue)
                                    .then(addedSequences => {
                                        addedSequences.forEach(addedSequence => {
                                            const changeObject = {};
                                            const tags = ['description', 'name', 'sequence'];
                                            tags.forEach(tag => {
                                                changeObject[tag] = addedSequence[tag]._value
                                            })
                                            const objectPath = addedSequence._objectPath
                                            console.log({ objectPath, changeObject })
                                            dispatch(thunkChangeParameters(props.job.jobid, objectPath, changeObject))
                                        })
                                    })
                                return false
                            }
                            return true
                        }}
                    />
                </CCP4i2MuiContainer>                
            </CCP4i2MuiTab>
        </CCP4i2MuiTabs>
    </CCP4i2ToplevelTask>
}

const MatthewsHistogram = (props) => {
    const [tableString, setTableString] = useState('')
    const tableData = useMemo(() => {
        return tableString.split('\r').map(item => {
            var splitItem = item.split(' ')
            return {
                dataIndex: splitItem[0],
                multiplier: splitItem[2],
                probability: parseFloat(splitItem[1]).toFixed(2),
                solvent: parseFloat(splitItem[3]).toFixed(2)
            }
        })
    }, [tableString])


    useEffect(() => {
        setTableString(props.data.tableString)
    }, [props.data])

    return <div>{tableData.length == 0 ? <Text type="danger">No plausible content for these parameters</Text> :
        <ComposedChart width={300} height={150} data={tableData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dataIndex" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="probability" fill="#8884d8" />
            <Line type="monotone" dataKey="solvent" />
        </ComposedChart>
    }
    </div >
}

const MatthewsTable = (props) => {
    const [tableString, setTableString] = useState('')

    useEffect(() => {
        setTableString(props.data.tableString)
    }, [props.data])

    return <Collapse>
        <Collapse.Panel header="Probabilities and solvent content as table">
            <Grid container>
                <Grid item xs={12}>Current ASU molecular weight: {props.data.baseWeight}</Grid>
                <Grid item xs={12}>Current cell volume: {props.data.cellVolume}</Grid>
            </Grid>
            <GeneralTable
                pagination={false}
                dataSource={tableString.split('\r').map(item => {
                    var splitItem = item.split(' ')
                    return { dataIndex: splitItem[0], multiplier: splitItem[2], probability: parseFloat(splitItem[1]).toFixed(2), solvent: parseFloat(splitItem[3]).toFixed(2) }
                })}
                dataIndex='multiplier'
                columns={[
                    { dataIndex: 'multiplier', title: 'Multiplier' },
                    { dataIndex: 'probability', title: 'Probability' },
                    { dataIndex: 'solvent', title: 'Solvent content' },]}
                rowKey=""
            />
        </Collapse.Panel>
    </Collapse>
}

