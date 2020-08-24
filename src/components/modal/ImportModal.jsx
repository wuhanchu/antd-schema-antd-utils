import React, {PureComponent} from "react"
import {connect} from "dva"
import {globalStyle} from "@/styles/global"
import '@ant-design/compatible/assets/index.css';

import {Button, message, Modal, Upload, Form} from "antd";
import FileSaver from "file-saver"

import XLSX from "xlsx"
import {convertFormImport} from "@/outter/fr-schema/src/schema"

const FormItem = Form.Item

/**
 * nodeId the conf  node id
 * maxLength 检测数据长度，超过报错
 */

class ImportModal extends PureComponent {
    formRef = React.createRef();
    state = {
        data: {}
    }

    render() {
        const {
            maxLength,
            importTemplateUrl,
            sliceNum = 2,
            errorKey,
            ...others
        } = this.props
        const {data, file} = this.state

        const uploadProps = {
            onRemove: file => {
                this.setState(state => {
                    const index = state.fileList.indexOf(file)
                    const newFileList = state.fileList.slice()
                    newFileList.splice(index, 1)
                    return {
                        fileList: newFileList
                    }
                })
            },
            beforeUpload: file => {
                this.setState({beforeUploadLoading: true})
                const reader = new FileReader()
                reader.onload = (async evt => {
                    // parse excel
                    const schema = this.props.schema
                    const binary = evt.target.result
                    const wb = XLSX.read(binary, {type: "binary"})
                    const sheetName = wb.SheetNames[0]
                    const ws = wb.Sheets[sheetName]
                    let data = XLSX.utils.sheet_to_json(ws, {
                        raw: false,
                        header: "A",
                        defval: "",
                        dateNF: "YYYY/MM/DD"
                    })

                    try {
                        // 判断数据长度
                        if (maxLength && data && data.length > maxLength) {
                            throw new Error(
                                `每次导入最多只允许导入${maxLength}条数据！`
                            )
                        }

                        data = await convertFormImport(
                            data,
                            schema,
                            sliceNum,
                            errorKey || Object.keys(schema)[0]
                        )
                        this.props.onChange(data)

                        this.setState(state => ({
                            fileList: [file]
                        }))
                    } catch (e) {
                        message.error(e.message)
                    } finally {
                        this.setState({beforeUploadLoading: false})
                    }
                }).bind(this)

                reader.readAsBinaryString(file)

                return false
            },
            file
        }

        return (
            <Modal visible={true} {...others}>
                <Form ref={this.formRef}>
                    <FormItem
                        labelCol={globalStyle.form.labelCol}
                        wrapperCol={globalStyle.form.wrapperCol}
                        label={"模板文件"}
                    >
                        <Button
                            onClick={event => {
                                FileSaver(importTemplateUrl, "导入模板")
                            }}
                        >
                            下载
                        </Button>
                    </FormItem>

                    <FormItem
                        labelCol={globalStyle.form.labelCol}
                        wrapperCol={globalStyle.form.wrapperCol}
                        label={"上传文件"}
                        required={true}
                        name="file"
                    >
                        <Upload
                            fileList={this.state.fileList}
                            {...uploadProps}
                        >
                            <Button loading={this.state.chuan}>
                                点击上传文件
                            </Button>
                        </Upload>
                    </FormItem>
                </Form>
            </Modal>
        )
    }
}

export default ImportModal
