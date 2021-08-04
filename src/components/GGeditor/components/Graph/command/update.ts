import pick from "lodash/pick"
import commandManager from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/commandManager"
import {
    baseCommand,
    BaseCommand
} from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/Graph/command/base"

interface UpdateCommandParams {
    id: string
    originModel: object
    updateModel: object
    forceRefreshLayout: boolean
}

const updateCommand: BaseCommand<
    UpdateCommandParams,
    G6.Graph & G6.TreeGraph
> = {
    ...baseCommand,

    params: {
        id: "",
        originModel: {},
        updateModel: {},
        forceRefreshLayout: false
    },

    // canExecute(graph) {
    //     const selectedNodes = this.getSelectedNodes(graph)
    //     const selectedEdges = this.getSelectedEdges(graph)
    //     return (selectedNodes.length || selectedEdges.length) &&
    //         (selectedNodes.length === 1 || selectedEdges.length === 1)
    //         ? true
    //         : false
    // },

    init(graph) {
        const { id, updateModel } = this.params

        const updatePaths = Object.keys(updateModel)
        const node = graph.findById(id)
        if (!node) {
            return
        }
        const originModel = pick(node.getModel(), updatePaths)

        this.params.originModel = originModel
    },

    execute(graph) {
        const { id, updateModel, forceRefreshLayout } = this.params

        graph.updateItem(id, updateModel)

        if (forceRefreshLayout) {
            graph.refreshLayout && graph.refreshLayout(false)
        }
    },

    undo(graph) {
        const { id, originModel } = this.params

        graph.updateItem(id, originModel)
    }
}

commandManager.register("update", updateCommand)
