import React from "react"
import pick from "lodash/pick"
import {
    ADD_NODE_MODEL,
    ItemType,
    GraphMode
} from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/constants"
import { NodeModel, EdgeModel } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/interfaces"
import {
    EditorContextProps,
    withEditorContext
} from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/EditorContext"

export interface ItemProps extends EditorContextProps {
    style?: React.CSSProperties
    className?: string
    type?: ItemType
    model: NodeModel | EdgeModel
}

export interface ItemState {}

class Item extends React.Component<ItemProps, ItemState> {
    static defaultProps = {
        type: ItemType.Node
    }

    handleMouseDown = () => {
        const { graph, type, model } = this.props

        if (type === ItemType.Node) {
            graph.set(ADD_NODE_MODEL, model)
            graph.setMode(GraphMode.AddNode)
        }
    }

    render() {
        const { children } = this.props

        return (
            <div
                {...pick(this.props, ["style", "className"])}
                onMouseDown={this.handleMouseDown}
            >
                {children}
            </div>
        )
    }
}

export default withEditorContext<ItemProps>(Item)
