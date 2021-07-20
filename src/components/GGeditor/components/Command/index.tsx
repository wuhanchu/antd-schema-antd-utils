import React from "react"
import { EditorEvent } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/constants"
import { GraphStateEvent } from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/interfaces"
import commandManager from "@/outter/fr-schema-antd-utils/src/components/GGeditor/common/commandManager"
import {
    EditorContextProps,
    withEditorContext
} from "@/outter/fr-schema-antd-utils/src/components/GGeditor/components/EditorContext"

interface CommandProps extends EditorContextProps {
    name: string
    className?: string
    disabledClassName?: string
}

interface CommandState {}

class Command extends React.Component<CommandProps, CommandState> {
    static defaultProps = {
        className: "command",
        disabledClassName: "command-disabled"
    }

    state = {
        disabled: false
    }

    constructor(props) {
        super(props)
        console.log("constructor")
    }

    componentDidMount() {
        console.log("componentDidMount")
        console.log(this.props)

        const { graph, name } = this.props

        console.log("componentDidMount")
        console.log(this.props)

        this.setState({
            disabled: !commandManager.canExecute(graph, name)
        })

        graph.on<GraphStateEvent>(EditorEvent.onGraphStateChange, () => {
            this.setState({
                disabled: !commandManager.canExecute(graph, name)
            })
        })
    }

    handleClick = async () => {
        const { name, executeCommand, params } = this.props
        await executeCommand(name, params)
    }

    render() {
        const { graph } = this.props

        if (!graph) {
            return null
        }

        const { className, disabledClassName, children } = this.props
        const { disabled } = this.state

        return (
            <div
                className={`${className}${
                    disabled ? ` ${disabledClassName}` : ""
                }`}
                onClick={this.handleClick}
            >
                {children}
            </div>
        )
    }
}

export default withEditorContext<CommandProps>(Command)
