import React from 'react';
import { Button, Card, Descriptions, Divider, Modal, Skeleton, Spin, Empty } from 'antd';
import ReactToPrint from 'react-to-print';

/**
 * 报告弹框
 */
class ReportModal extends React.PureComponent {
    state = {
        report: null,
    };

    constructor(props) {
        super(props);
        this.beingIndex = 0;
    }

    decorate(checkStr, str) {
        const result = [];

        for (let i = 0; i < str.length; i++) {
            const showText = str[i].replace('&', '**');
            let text = <span>{showText}</span>;
            switch (checkStr[this.beingIndex]) {
                case 'S':
                    text = <span style={{ backgroundColor: '#f4ff61' }}>{showText}</span>;
                    break;
                case 'D':
                    text = <span style={{ backgroundColor: '#a8ff3e' }}>{showText}</span>;
                    break;

                case 'I':
                    text = <span style={{ backgroundColor: '#fe5f55' }}>{showText}</span>;
                    break;
                default:
                    break;
            }
            result.push(text);

            this.beingIndex++;
        }
        return result;
    }

    renderContent(report, machineList, manList) {
        const checkStr = report.mark_different
            .replace(/ {3}/g, '  ')
            .replace(/ {2}S/g, ' S')
            .replace(/ {2}I/g, ' I')
            .replace(/ {2}D/g, ' D');

        const result = [];
        // // return <Empty/>
        //
        // if (!machineList || !manList) {
        // }
        if (machineList) {
            machineList.forEach((item, index) => {
                const temp = this.beingIndex;
                if (manList[index]) {
                    result.push(
                        <Descriptions.Item label="标注结果">
                            {this.decorate(checkStr, manList[index])}
                        </Descriptions.Item>,
                    );
                }
                this.beingIndex = temp;
                result.push(
                    <Descriptions.Item label="质检结果">
                        {this.decorate(checkStr, machineList[index])}
                    </Descriptions.Item>,
                );
            });
        }

        return result;
    }

    render() {
        const { onOk, onCancel } = this.props;
        const { report, file_path: filePath } = this.props;

        const manList = report && report.compare_str_valid.replace(/\*\*/g, '&').match(/.{1,66}/g);
        // const manList = [];

        const machineList =
            report && report.origin_str_valid.replace(/\*\*/g, '&').match(/.{1,66}/g);
        // [];

        return (
            <Modal
                title="标注结果对比报告"
                visible
                okText="   报告"
                cancelText="关闭"
                onOk={() => {
                    if (onOk) {
                        onOk();
                    }
                }}
                width={840}
                onCancel={() => {
                    if (onCancel) {
                        onCancel();
                    }
                }}
                footer={
                    <ReactToPrint
                        trigger={() => <Button>导出报告</Button>}
                        content={() => this.componentRef}
                    />
                }
            >
                {!report ? (
                    <Spin spinning tip="暂无质检报告">
                        <Skeleton />
                    </Spin>
                ) : (
                    <div ref={(el) => (this.componentRef = el)}>
                        <Card bordered={false}>
                            <Descriptions title="基础信息" column={2}>
                                <Descriptions.Item label="文件">{filePath}</Descriptions.Item>
                            </Descriptions>
                            <Divider style={{ marginTop: 5, marginBottom: 5 }} />
                            <Descriptions title="识别结果" column={4}>
                                <Descriptions.Item label="字准">
                                    {`${(report.accuracy * 100).toFixed(2)}%`}
                                </Descriptions.Item>
                                <Descriptions.Item label="删除率">
                                    {`${(report.ratio_delete * 100).toFixed(2)}%`}
                                </Descriptions.Item>
                                <Descriptions.Item label="插入率">
                                    {`${(report.ratio_insert * 100).toFixed(2)}%`}
                                </Descriptions.Item>
                                <Descriptions.Item label="替换率">
                                    {`${(report.ratio_update * 100).toFixed(2)}%`}
                                </Descriptions.Item>
                            </Descriptions>
                            <Divider style={{ marginTop: 5, marginBottom: 5 }} />
                            {!machineList || !manList ? (
                                <Empty />
                            ) : (
                                <Descriptions title="评估详情" bordered column={1}>
                                    {this.renderContent(report, machineList, manList)}
                                </Descriptions>
                            )}
                        </Card>
                    </div>
                )}
            </Modal>
        );
    }
}

export default ReportModal;
