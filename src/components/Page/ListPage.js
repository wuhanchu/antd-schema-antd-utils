import React from "react"
import { PageHeaderWrapper } from "@ant-design/pro-layout"

import DataList from "./DataList"

console.log("DataList", DataList)

/**
 * meta 包含
 * resource
 * service
 * title
 * selectedRows
 * scroll table whether can scroll
 */
class ListPage extends DataList {
    constructor(props, meta) {
        super(props, meta)
        this.meta = { ...(this.meta || {}), ...this.props.meta }
    }

    renderDataList() {
        return super.render()
    }

    render() {
        const { title, content, tabList, onTabChange } = this.meta
        const { tabActiveKey } = this.state

        return (
            <PageHeaderWrapper
                title={title && title + "列表"}
                content={
                    content ||
                    (this.renderHeaderContent && this.renderHeaderContent())
                }
                tabList={tabList}
                onTabChange={onTabChange}
                tabActiveKey={tabActiveKey}
            >
                {this.renderDataList()}
            </PageHeaderWrapper>
        )
    }
}

export default ListPage
