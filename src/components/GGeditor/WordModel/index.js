import React, { Fragment } from "react"
import {
    Card,
    Col,
    Row,
    Tabs,
    Skeleton,
    Button,
    Modal,
    Table,
    message
} from "antd"
import styled from "styled-components"
import { Form } from "@ant-design/compatible"

import GGEditor, { Flow } from "@/outter/fr-schema-antd-utils/src/components/GGeditor"
import Info, { infoType } from "./Info"
import ToolBar from "./ToolBar.jsx"
import * as lodash from "lodash"
import { guid } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/utils"
import { operationDict } from "./Info"
import clone from "clone"


const CardNoInterval = styled(Card)`
    padding: 0;
    margin: 0;

    .ant-card-body {
        padding: 0;
        margin: 0;
    }
`

const { TabPane } = Tabs

const dataSource = [
    {
        key: "1",
        name: "姓名",
        example: "您好，是刘智潼本人嘛",
        scriptExample: "您好，是${姓名}本人嘛",
        script: "${姓名}"
    },
    {
        key: "2",
        name: "称呼（性别）",
        example: "您好，是刘智潼先生吗",
        scriptExample: "您好，是刘智潼${称呼}吗",
        script: "${称呼}"
    },
    {
        key: "3",
        name: "地址",
        example: "你的地址是厦门市东渡路156号吗",
        scriptExample: "你的地址是${地址}",
        script: "${地址}"
    },
    {
        key: "4",
        name: "手机号",
        example: "您的手机号是13388886666",
        scriptExample: "您的手机号是${手机号}",
        script: "${手机号}"
    },
    {
        key: "5",
        name: "自定义字段（职位）",
        example: "您是财务人员吗",
        scriptExample: "您是${职位}",
        script: "${自定义字段}"
    }
]

const columns = [
    {
        title: "字段",
        dataIndex: "name",
        key: "name"
    },
    {
        title: "例句",
        dataIndex: "example",
        key: "example"
    },
    {
        title: "脚本示例",
        dataIndex: "scriptExample",
        key: "scriptExample"
    },
    {
        title: "脚本",
        dataIndex: "script",
        key: "script"
    },
    {
        title: "操作",
        // dataIndex: 'operate',
        key: "operate",
        render: (text, record, index) => (
            <Fragment>
                {index != 4 && (
                    <span>
                        <a
                            onClick={() => {
                                var Url2 = document.getElementById(
                                    "script" + index
                                )
                                Url2.select() // 选择对象
                                document.execCommand("Copy") // 执行浏览器复制命令
                                message.success("已复制好，可贴粘。")
                            }}
                        >
                            复制脚本
                        </a>
                    </span>
                )}
                <textarea
                    style={{ opacity: 0, width: "1px", height: "1px" }}
                    value={"${姓名}"}
                    id={"script0"}
                ></textarea>
                <textarea
                    style={{ opacity: 0, width: "1px", height: "1px" }}
                    value={"${称呼}"}
                    id={"script1"}
                ></textarea>
                <textarea
                    style={{ opacity: 0, width: "1px", height: "1px" }}
                    value={"${地址}"}
                    id={"script2"}
                ></textarea>
                <textarea
                    style={{ opacity: 0, width: "1px", height: "1px" }}
                    value={"${手机号}"}
                    id={"script3"}
                ></textarea>
            </Fragment>
        )
    }
]

/**
 * @class WordModel word model
 * @param record config record
 */
class WordModel extends React.Component {
    CanvasContainer = React.createRef()
    nodeMap = {}
    intentionMap = {}
    hasChanged = false // nodeMap and intentionMap whether change
    splitStr = "|" // location split str

    styles = {
        contentHeight: 400
    }

    state = {
        record: null, // change
        currentValues: null,
        currentType: infoType.graph,
        graphData: null,
        ruleVisible: false
    }

    constructor(props) {
        super(props)
        console.log(props)
        this.schemas = props.schemas
        // nodemap
        this.nodeTypeMap = {}
        const dict = this.schemas.node.schema.type.dict
        this.nodeTypeMap[dict.normal.value] = "bizFlowStartNode"
        this.nodeTypeMap[dict.word.value] = "bizFlowNode"
        this.nodeTypeMap[dict.end.value] = "bizFlowEndNode"
    }

    /**
     * graph item add
     * @param {*} item
     * @param {*} model
     */
    async handleItemAdd(item, model) {
        const type = item.getType()
        const { record } = this.props

        if (type == infoType.node && this.refs.editor) {
            this.nodeMap[model.id] = {
                id: model.id,
                type: this.schemas.node.schema.type.dict.normal.value,
                robot_id: record.id,
                name: null
            }

            this.handleChooseChange(item, model)
        } else {
            return
        }

        this.handleItemUpdate(item, model)
    }

    /**
     * graphp item delete
     * @param {*} item
     * @param {*} model
     */
    async handleItemRemove(item, model) {
        const type = item.getType()
        const { id } = model

        if (type == infoType.node) {
            this.nodeMap[id] && delete this.nodeMap[id]
            Object.keys(this.intentionMap).forEach(key => {
                if (
                    this.intentionMap[key].node_id == id ||
                    this.intentionMap[key].to_node_id == id
                ) {
                    delete this.intentionMap[key]
                }
            })
        } else if (type == infoType.edge) {
            this.intentionMap[id] && delete this.intentionMap[id]
        }
        this.handleChooseChange(null)
    }

    /**
     * update the item data
     * @param {*} item
     * @param {*} model
     */
    handleItemUpdate = async (item, model = {}) => {
        const type = item.getType()
        const { source, target } = model

        if (!this.refs.editor) {
            return
        }

        if (type == "node") {
            this.nodeMap[model.id] = this.graphToNode(model)
        } else if (
            type == "edge" &&
            typeof source == "string" &&
            typeof target == "string"
        ) {
            this.intentionMap[model.id] = this.graphToIntention(model)
        }

        await this.handleChooseChange(item, model)
    }

    /**
     * sync data to server
     */
    startSync = async () => {
        if (this.syncing) {
            return
        }
        this.syncing = true
        if (
            (!lodash.isEqual(this.lastNodeMap, this.nodeMap) ||
                !lodash.isEqual(this.lastIntentionMap, this.intentionMap)) &&
            !this.props.visibleRelease
        ) {
            if (!this.props.visibleRelease) {
                console.log("asd")

                await this.schemas.service.sync({
                    id: this.props.record.id,
                    nodes: Object.values(this.nodeMap),
                    intentions: Object.values(this.intentionMap)
                })

                this.lastNodeMap = clone(this.nodeMap)
                this.lastIntentionMap = clone(this.intentionMap)
            }
        }
        this.syncing = false

        // change new id
        if (!this.unMonut) {
            this.interval = setTimeout(this.startSync, 2000)
        }
    }

    /**
     * change node to data
     * @returns {Promise<void>}
     */
    async handleValueUpdate(isBegin = true) {
        if (!this.refs.info) {
            return
        }
        const values = {}
        const { currentValues, currentType, currentModel } = this.state
        if (!currentValues || this.props.visibleRelease) {
            return
        }

        if (isBegin) {
            if (
                lodash.isEqual(currentValues, { ...currentValues, ...values })
            ) {
                return
            }
        }

        if (currentType == infoType.node) {
            await this.schemas.node.service.put({
                id: currentValues.id,
                ...values
            })
            this.nodeMap[currentValues.id] = { ...currentValues, ...values }
        } else if (currentType == infoType.edge) {
            const { source, target } = currentModel

            const updateValues = {
                id: currentValues.id,
                node_id: source,
                to_node_id: target,
                ...values
            }
            await this.schemas.intention.service.put(updateValues)
            this.intentionMap[currentValues.id] = updateValues
        } else {
            await this.schemas.service.put({
                id: currentValues.id,
                ...values
            })

            this.setState({
                record: { ...this.state.record, ...values }
            })
        }
    }

    /**
     * item update need to refresh graph
     * @param values update values
     */
    handleGraphUpdate = values => {
        if (!this.state.currentModel || !this.refs.editor) {
            return
        }

        let updateModel = this.createModel(
            this.state.currentType,
            this.state.currentModel,
            values
        )

        this.refs.editor.executeCommand("update", {
            id: this.state.currentModel.id,
            originModel: this.state.currentModel,
            updateModel
        })
    }

    /**1
     * click different type item , need to change the form
     * @param item
     */
    async handleChooseChange(item) {
        // await this.startSync()

        const type = item && item.getType()
        const model = item && item.getModel()
        if (
            this.state.currentModel &&
            model &&
            model.id == this.state.currentModel.id
        ) {
            return
        }

        await this.startSync()
        this.setState({ currentModel: null, currentValues: null }, () => {
            if (!type) {
                this.setState({
                    currentValues: this.state.record,
                    currentType: infoType.graph
                })
                return
            }

            let data = null
            if (type == infoType.node) {
                data = this.nodeMap[model.id]
            } else if (type == infoType.edge) {
                data = this.intentionMap[model.id]
            }

            if (!data) {
                return
            }

            this.setState(
                {
                    // currentModel: model,
                    currentValues: data,
                    currentType: item.getType()
                },
                () => {
                    this.handleGraphUpdate(data)
                }
            )
        })
    }

    async componentDidMount() {
        const record = await this.schemas.service.getDetail({
            id: this.props.record.id
        })

        // set default value
        const initValue = {
            silence_respon: "您好,还在吗?",
            unknown_times: 3,
            unknown_operation: operationDict.hangUp.value,
            repeat_times: 3,
            repeat_operation: operationDict.hangUp.value,
            silence_times: 3,
            silence_operation: operationDict.hangUp.value
        }

        const notNullValues = lodash.pickBy(
            record,
            value => !lodash.isNil(value)
        )
        const currentValues = {
            ...initValue,
            ...notNullValues
        }
        this.setState({
            record: currentValues,
            currentValues
        })

        // get the dict
        let response = await this.schemas.node.service.get({
            robot_id: record.id
        })

        if (lodash.isEmpty(response.list)) {
            await this.schemas.node.service.post({
                robot_id: record.id,
                name: "开始节点",
                id: guid(),
                type: this.schemas.node.schema.type.dict.normal.value
            })

            response = await this.schemas.node.service.get({
                robot_id: record.id,
                timeStr: Date.parse(new Date())
            })
        }

        const graphData = this.getGraphData(record, response.list)
        this.setState({ graphData }, () => {
            this.startSync()
        })
        const values = {}
        const { currentType, currentModel } = this.state
        // this.handleValueUpdate(false)
    }

    async componentWillUnmount() {
        this.unMonut = true
        await this.handleValueUpdate()
    }

    /**
     * use the graph model and info data to create new model
     * @param {*} type
     * @param {*} model current graph model
     * @param {*} value
     */
    createModel(type, model = null, values) {
        if (!values) {
            return null
        }

        let updateModel = {
            label: !lodash.isNil(values.name) ? values.name : "未配置"
        }

        if (type == infoType.node) {
            updateModel = this.nodeToGraph(values)
        } else if (type == infoType.edge) {
            updateModel = this.intentionToGraph(values)
        }

        return { ...model, ...updateModel }
    }

    nodeToGraph(item) {
        let node = {
            id: item.id,
            label: item.name || "未配置",
            shape: this.nodeTypeMap[item.type],
            labelFill: !item.name ? "red" : null,
            x: item.x,
            y: item.y
        }

        // if (item.location) {
        //     const arr = item.location.split(this.splitStr)
        //     if (lodash.size(arr) > 0) {
        //         node.x = parseFloat(arr[0])
        //         node.y = parseFloat(arr[1])
        //     }
        // }

        console.log(node)
        return node
    }

    intentionToGraph(item) {
        let model = {
            id: item.id,
            source: item.node_id,
            target: item.to_node_id,
            label: item.name || "未配置"
        }
        model.labelCfg = {
            style: {
                fill: "black",
                fontSize: 10
            }
        }

        if (
            item.answer_type ==
            this.schemas.intention.schema.answer_type.dict.any.value
        ) {
            model.label = "任意"
        } else if (
            item.answer_type ===
            this.schemas.intention.schema.answer_type.dict.sure.value
        ) {
            model.label = "肯定"
        } else if (
            item.answer_type ===
            this.schemas.intention.schema.answer_type.dict.unknow.value
        ) {
            model.label = "未知"
        } else if (
            item.answer_type ===
            this.schemas.intention.schema.answer_type.dict.deny.value
        ) {
            model.label = "否定"
        } else {
            model = {
                ...model,
                label: item.name || "未配置"
            }

            if (lodash.isNil(item.name)) {
                model.labelCfg.style.fill = "red"
            }
        }

        return model
    }

    graphToNode(model) {
        const info = this.nodeMap[model.id]
        let result = {
            ...info,
            robot_id: this.props.record.id,
            id: model.id,
            location: model.x + this.splitStr + model.y
        }

        return result
    }

    graphToIntention(model) {
        const info = this.intentionMap[model.id]

        return {
            ...info,
            id: model.id,
            node_id: model.source,
            to_node_id: model.target
        }
    }

    /**
     * form data restore graph data
     * @param record
     * @param data
     * @returns {{nodes: [{shape: string, id, label: string}], edges: []}|any}
     */
    getGraphData = (record, data = []) => {
        let result = {
            nodes: [],
            edges: [],
        }

        data.forEach(item => {
            this.nodeMap[item.id] = item
            console.log("data.forEach(item => {")
            console.log(item)

            // add item to graph
            result.nodes.push(this.nodeToGraph(item))

            // add intentions to graph
            item.intentions &&
                item.intentions.forEach(intention => {
                    this.intentionMap[intention.id] = intention
                    result.edges.push(this.intentionToGraph(intention))
                })
        })

        if (lodash.isEmpty(result.nodes)) {
            const startNode = {
                id: guid(),
                type: this.schemas.node.schema.type.dict.start.value,
                name: 开始节点
            }
            this.nodeMap[startNode.id] = startNode

            result = {
                nodes: [this.nodeToGraph(startNode)],
                edges: []
            }
        }

        this.lastIntentionMap = clone(this.intentionMap)
        this.lastNodeMap = clone(this.nodeMap)
        console.log("result")
        console.log(result)

        return result
    }

    /**
     *graph item click
     *
     * @memberof WordModel
     */
    handleItemClick = event => {
        event.preventDefault()
        // data
        if (
            this.state.currentModel &&
            event.item &&
            this.state.currentModel.id == event.item.getModel().id
        ) {
            return
        }

        // change data
        if (this.state.currentValues) {
            this.props.form.validateFields(async err => {
                if (err) return
                const values = {}

                await this.handleValueUpdate()
                await this.handleGraphUpdate(values)

                this.handleChooseChange(event.item)
            })
        } else {
            this.handleChooseChange(event.item)
        }
    }

    render() {
        const { graphData, record } = this.state

        console.log("graphData")
        console.log(graphData)

        return (
            <CardNoInterval>
                <GGEditor ref="editor">
                    <Row style={{ bordered: "1px" }}>
                        <Col span={20} ref={"col"}>
                            <div ref={this.CanvasContainer}>
                                <CardNoInterval
                                    style={{
                                        border: "0px",
                                        borderRight: "1px solid #e8e8e8",
                                        width: "100%"
                                    }}
                                >
                                    {graphData && (
                                        <ToolBar
                                            record={record}
                                            addPoint={{
                                                x:
                                                    this.CanvasContainer.current.getBoundingClientRect()
                                                        .width / 2,
                                                y: 250
                                            }}
                                        />
                                    )}

                                    {graphData && this.CanvasContainer ? (
                                        <Flow
                                            style={{
                                                backgroundColor: "#f4f6f8",
                                                flex: "1"
                                            }}
                                            data={graphData}
                                            graphConfig={{
                                                height:
                                                    window.innerHeight * 0.75,
                                                minZoom: 1,
                                                maxZoom: 2,

                                                defaultNode: {
                                                    shape: "bizFlowNode"
                                                },
                                                defaultEdge: {
                                                    shape: "bizFlowEdge"
                                                }
                                            }}
                                            onAfterAddItem={event => {
                                                const { item, model } = event
                                                this.handleItemAdd(item, model)
                                            }}
                                            onBeforeRemoveItem={event => {
                                                const { item } = event

                                                const model = item.getModel()
                                                this.handleItemRemove(
                                                    item,
                                                    model
                                                )
                                            }}
                                            onAfterUpdateItem={event => {
                                                const { cfg, item } = event
                                                if (
                                                    this.lastUpdateEvent &&
                                                    lodash.isEqual(
                                                        this.lastUpdateEvent,
                                                        cfg
                                                    )
                                                ) {
                                                    this.lastUpdateEvent = cfg
                                                    return
                                                }

                                                this.lastUpdateEvent = cfg
                                                const model = item.getModel()
                                                this.handleItemUpdate(
                                                    item,
                                                    model
                                                )
                                            }}
                                            onBeforeAddItem={data => {
                                                123
                                            }}
                                            onNodeClick={this.handleItemClick}
                                            onEdgeClick={this.handleItemClick}
                                            onCanvasClick={this.handleItemClick}
                                        />
                                    ) : (
                                        <Skeleton></Skeleton>
                                    )}
                                </CardNoInterval>
                            </div>
                        </Col>
                        <Col span={4}>
                            {graphData && this.state.currentValues && (
                                <Tabs
                                    defaultActiveKey="1"
                                    tabPosition="top"
                                    tabBarStyle={{ marginBottom: 0 }}
                                >
                                    <TabPane
                                        tab={
                                            <span style={{padding: '5px'}}>{this.state.currentType ==
                                            infoType.node
                                                ? " 节点属性配置"
                                                : this.state.currentType ==
                                                  infoType.edge
                                                ? " 客户回复意图配置"
                                                : " 流程信息"}</span>
                                        }
                                        key="1"
                                    >
                                        <div
                                            style={{
                                                marginLeft: 16,
                                                marginRight: 16,
                                                height:
                                                    window.innerHeight * 0.75,
                                                overflow: "auto"
                                            }}
                                        >
                                            <Info
                                                visibleRelease={
                                                    false
                                                    
                                                }
                                                schemas={this.schemas}
                                                form={this.props.form}
                                                ref={"info"}
                                                nodeMap={this.nodeMap}
                                                type={this.state.currentType}
                                                values={
                                                    this.state.currentValues
                                                }
                                                model={this.state.currentModel}
                                            />
                                            {this.state.currentType ==
                                                "node" && (
                                                <Fragment>
                                                    <a
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: "299px"
                                                        }}
                                                        onClick={() => {
                                                            this.setState({
                                                                ruleVisible: true
                                                            })
                                                        }}
                                                    >
                                                        {" "}
                                                        变量规则
                                                    </a>
                                                    {this.state.ruleVisible && (
                                                        <Modal
                                                            onCancel={() =>
                                                                this.setState({
                                                                    ruleVisible: false
                                                                })
                                                            }
                                                            footer={null}
                                                            width={900}
                                                            visible={
                                                                this.state
                                                                    .ruleVisible
                                                            }
                                                            title={"变量规则"}
                                                        >
                                                            <Table
                                                                pagination={
                                                                    false
                                                                }
                                                                columns={
                                                                    columns
                                                                }
                                                                dataSource={
                                                                    dataSource
                                                                }
                                                            />
                                                        </Modal>
                                                    )}
                                                </Fragment>
                                            )}
                                        </div>
                                    </TabPane>
                                </Tabs>
                            )}
                        </Col>
                    </Row>
                </GGEditor>
            </CardNoInterval>
        )
    }
}

export default Form.create()(WordModel)
