import { guid } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/utils"
import { ItemType } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/constants"
import { NodeModel, EdgeModel } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/interfaces"
import commandManager from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/commandManager"
import { baseCommand, BaseCommand } from "./base"
import schemas from "@/schemas"
import { infoType } from "@/pages/word/components/WordModel/Info"

interface AddCommandParams {
    shouldExecute: Function
    type: ItemType
    record: Object
    addPoint: Object
    model: NodeModel | EdgeModel
    x: number
    y: number
}

// @ts-ignore
// @ts-ignore
const addCommand: BaseCommand<AddCommandParams> = {
    ...baseCommand,

    params: {
        type: ItemType.Node,
        model: {
            shape: "bizFlowStartNode",
            id: "",
            label: "未配置"
        }
    },

    init() {
        const { model } = this.params
        if (model.id) {
            return
        }
        model.id = guid()
    },

    shouldExecute(graph) {
        const { shouldExecute } = this.params

        if (shouldExecute) {
            return shouldExecute()
        }

        return baseCommand.shouldExecute(graph)
    },

    execute(graph) {
        const { type, model, addPoint } = this.params

        let point = graph.getPointByCanvas(100, 250)
        if (addPoint) {
            point = graph.getPointByCanvas(addPoint.x, addPoint.y)
        }
        graph.addItem(type, {
            x: point.x,
            y: point.y,
            ...model
        })

        this.setSelectedNode(graph, model.id)
    },

    undo(graph) {
        const { model } = this.params

        graph.remove(model.id)
    }
}

commandManager.register("add", addCommand)
