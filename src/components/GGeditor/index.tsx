import Editor from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/Editor"
import Flow from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/Flow"
import Mind from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/Mind"
import Command from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/Command"
import ItemPanel, { Item } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/ItemPanel"
import DetailPanel from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/DetailPanel"
import {
    RegisterNode,
    RegisterEdge,
    RegisterCommand,
    RegisterBehavior
} from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/Register"
import { withEditorContext } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/EditorContext"

export {
    Flow,
    Mind,
    Command,
    Item,
    ItemPanel,
    DetailPanel,
    RegisterNode,
    RegisterEdge,
    RegisterCommand,
    RegisterBehavior,
    withEditorContext
}

export default Editor
