import React, { Fragment } from "react"
import InfoForm from "@/outter/fr-schema-antd-utils/src/components/Page/InfoForm"
import schemas from "@/schemas"
import clone from "clone"
import { schemaFieldType } from "@/outter/fr-schema/src/schema"
import actions from "@/outter/fr-schema/src/actions"

/**
 *
 * @type {{node: string, edge: string, graph: string}}
 */
export const infoType = {
    edge: "edge",
    node: "node",
    graph: "graph",
    edgeAny: "edgeAny"
}

export const operationDict = {
    hangUp: {
        value: 0,
        remark: "挂机"
    }
    // jump: {
    //     value: 1,
    //     remark: "跳转"
    // }
}

let formSchemas = {}

// Object.values(formSchemas).forEach(schema => {
//     Object.values(schema).forEach(item => {

//     })
// })

/**
 * the editor item info form
 * @param form
 * @param nodeMap the node map
 * @param type the item type
 * @param value the current item obj
 */
class Info extends React.PureComponent {
    state = {
        init: false,
        audio: document.createElement("AUDIO")
    }

    answerMap = {}

    constructor(props) {
        super(props)
        this.schema = props.schemas
        formSchemas = {
            graph: {
                // bot_id: {
                //     title: "模板编码",
                //     type: schemaFieldType.TextArea,
                //     readOnly: true
                // },
                name: {
                    title: "模板名称",
                    readOnly: true,
                    style: {width: '100%'},
        
                },
                unknown_times: {
                    title: "未知回复次数",
                    required: true,
                    style: {width: '100%'},
                    tip: "设置未知回复的次数，达到配置次数会触发[未知回复操作]",
                    type: schemaFieldType.InputNumber,
                    props: {
                        min: 1,
                        default: 3,
                        max: 5
                    }
                },
                unknown_operation: {
                    title: "未知回复操作",
                    required: true,
                    style: {width: '100%'},
                    tip: "[未知回复次数]触发的操作,选择[跳转]需要配置相应节点",
                    type: schemaFieldType.Select,
                    dict: operationDict
                },
                unknown_jump: {
                    title: "未知回复跳转节点",
                    required: true,
                    style: {width: '100%'},
        
                    tip: "[未知回复操作]为[跳转]时跳转的节点。",
                    type: schemaFieldType.Select,
                    infoShowFunc: data => {
                        return data && data.unknown_operation
                    },
                    dict: {}
                },
                // repeat_times: {
                //     title: "节点重复次数",
                //     tip: "设置节点可回复执行的次数，达到配置次数会触发[节点重复操作]",
                //     type: schemaFieldType.InputNumber,
                //     required: true,
        
                //     props: {
                //         min: 1,
                //         max: 5
                //     }
                // },
                // repeat_operation: {
                //     title: "节点重复操作",
                //     type: schemaFieldType.Select,
                //     required: true,
                //     tip: "[节点重复次数]触发的操作,选择[跳转]需要配置相应节点",
                //     dict: operationDict
                // },
                repeat_jump: {
                    title: "节点重复跳转节点",
                    type: schemaFieldType.Select,
                    required: true,
                    style: {width: '100%'},
                    tip: "[节点重复操作]为[跳转]时跳转的节点。",
                    infoShowFunc: data => {
                        return data && data.repeat_operation
                    },
                    dict: {}
                },
                silence_respon: {
                    title: "静默回复",
                    required: true,
                    style: {width: '100%'},
        
                    tip: "静默的时候机器人返回的语音文字"
                },
                silence_times: {
                    title: "静默次数",
                    required: true,
                    style: {width: '100%'},
        
                    type: schemaFieldType.InputNumber,
                    tip: "设置允许客户静默的次数，达到配置次数会触发[重复静默操作]",
                    props: {
                        min: 1,
                        max: 5
                    }
                },
                silence_operation: {
                    title: "重复静默操作",
                    required: true,
                    value: 0,
                    style: {width: '100%'},
        
                    type: schemaFieldType.Select,
                    tip: "[静默次数]触发的操作,选择[跳转]需要配置相应节点",
                    dict: operationDict
                },
                silence_jump: {
                    title: "静默跳转节点",
                    required: true,
                    style: {width: '100%'},
        
                    type: schemaFieldType.Select,
                    dict: {},
                    infoShowFunc: data => {
                        return data && data.silence_operation
                    },
                    tip: "[重复静默操作]为[跳转]时跳转的节点。"
                }
            },
        
            node: this.schema.node.schema,
            edge: this.schema.intention.schema,
            edgeAny: {
                answer_type: this.schema.intention.schema.answer_type
            }
        }
        const { nodeMap } = props
        const nodeDict = Object.values(nodeMap).map(node => ({
            remark: node.name,
            value: node.id
        }))

        const filedList = ["unknown_jump", "repeat_jump", "silence_jump"]
        filedList.forEach(key => {
            formSchemas.graph[key].dict = nodeDict
        })
        if (this.props.visibleRelease) {
            Object.values(formSchemas).forEach(schema => {
                Object.values(schema).forEach(item => {
                    item.readOnly = true
                    item.style = { width: 180, ...item.style }
                })
            })
        } else {
            Object.values(formSchemas).forEach(schema => {
                Object.values(schema).forEach(item => {
                    item.readOnly = false
                })
            })
            formSchemas.graph.name.readOnly = true
        }
    }

    async componentDidMount() {
        const { type, model } = this.props
        if (model && model.edgeType == "edgeAny") {
            values = { name: "任意" }
            this.setState({
                init: true,
                values
            })
            return
        }

        console.log("let values = clone(this.props.values)")
        let values = clone(this.props.values)
        console.log(values)

        this.schemas = clone(formSchemas)

        if (type == infoType.edge) {
            let response = await this.schema.intention.service.get({
                limit: 9999
            })
            // this.schemas.edge.intention_pkgs.dict = response.list.map(item => {
            //     return {
            //         remark: item.name,
            //         value: item.id
            //     }
            // })

            // get the intention answers detail info
            // const answerObj = await this.schema.answer.service.getByIntention(
            //     {
            //         intention_id: values.id
            //     }
            // )

            // const intention_pkgs = answerObj.intention_pkgs.map(item => item.id)
            // this.answerMap = {}
            // const intention_answers = answerObj.answers.map(item => {
            //     this.answerMap[item.answer_info] = item
            //     return item.answer_info
            // })

            values = {
                ...values,
                // intention_pkgs,
                // intention_answers
                name: '任意1'
            }
        }

        this.setState({ init: true, values })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { values } = this.props
        if (this.props.type == infoType.edge && values !== prevProps.values) {
            this.answerMap = {}
            values.intention_answers &&
                values.intention_answers.forEach(item => {
                    this.answerMap[item.answer] = item
                })
        }
    }

    getValues = () => {
        let values = this.props.form.getFieldsValue()
        if (this.props.type === infoType.edge) {
            values.intention_answers = values.intention_answers
                ? values.intention_answers.map(answer_info => {
                      return this.answerMap[answer_info] || { answer_info }
                  })
                : []
        }

        Object.keys(values).forEach(key => {
            if (values[key] === undefined) {
                values[key] = null
            }
        })

        return values
    }

    render(props) {
        let { form, type, model } = this.props
        let { values, audio } = this.state

        let action = actions.edit
        if (
            type == infoType.edge &&
            values &&
            values.answer_type ==
                this.schema.intention.schema.answer_type.dict.any.value
        ) {
            type = infoType.edgeAny
            action = actions.show
        }

        return (
            this.state.init && (
                <Fragment>
                    <InfoForm
                        form={form}
                        action={action}
                        schema={this.schemas[type]}
                        labelCol={24}
                        wrapperCol={24}
                        values={values}
                    />

                    {/* {this.schemas[type].desc && (
                        <Button
                            icon="play-circle"
                            onClick={() => {
                                audio.src =
                                    "/api/v1/tts_test?content=" +
                                    this.getValues().desc
                                audio.play()
                            }}
                        >
                            试听
                        </Button>
                    )} */}
                </Fragment>
            )
        )
    }
}

export default Info
