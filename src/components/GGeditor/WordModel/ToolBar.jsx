import React from "react"
import { Command } from "@/outter/fr-schema-antd-utils/src/components/GGeditor"
import styled from "styled-components"

import { Tooltip, Popconfirm } from "antd"
import upperFirst from "lodash/upperFirst"

// export const IconFont = Icon.createFromIconfontCN({
//     scriptUrl: "https:////at.alicdn.com/t/font_1469900_lfnr1mdsot.js"
// })

const Container = styled.div`
    display: flex;
    padding: 8px;
    border-bottom: 1px solid #e8e8e8;
    background: #ffffff;

    .command i {
        display: inline-block;
        width: 27px;
        height: 27px;
        margin: 0 6px;
        padding-top: 6px;
        text-align: center;
        border: 1px solid #fff;
        cursor: pointer;
        z-index: 10000;

        &:hover {
            border: 1px solid #e8e8e8;
        }
    }

    .command-disabled i {
        color: rgba(0, 0, 0, 0.25);
        cursor: auto;

        &:hover {
            border: 1px solid #fff;
        }
    }
`

function ToolBar(props) {
    return (
        <Container>
            {[
                {
                    key: "add",
                    // icon: "plus",
                    props: {
                        x: 250,
                        y: 250
                    },
                    params: {
                        addPoint: props.addPoint
                    },

                    name: "新增"
                },
                {
                    key: "remove",
                    // icon: "delete",
                    name: "删除",
                    props: {
                        confirm: true
                    }
                }
            ].map(item => {
                const { name, key, icon, params } = item
                console.log("Command")
                console.log(Command)
                return (
                    <Command
                        key={key}
                        name={key}
                        params={params}
                        className={"command"}
                        disabledClassName={"commandDisabled"}
                        {...item.props}
                    >
                        <Tooltip title={upperFirst(name)}>
                            {/* <Icon type={`${icon || key}`} /> */}
                            {item.name}
                        </Tooltip>
                    </Command>
                )
            })}
        </Container>
    )
}

export default React.memo(ToolBar)
