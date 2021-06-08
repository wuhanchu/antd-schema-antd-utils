import React, { Fragment } from 'react';
import '@ant-design/compatible/assets/index.css';
import { Button, message } from 'antd';

import Zip from 'jszip';

import { frSchema } from '@/outter';
import { antdUtils } from '@/outter/index';
import services from '@/schemas/tools/service';
import ReportModal from './components/ReportModal';

const { actions, schemaFieldType, dict, decorateList } = frSchema;

const { ListPage, InfoModal } = antdUtils.components;

/**
 * 报告列表
 */
class Report extends ListPage {
    localStorageKey = 'markgo_reoport_list';

    constructor(props) {
        super(props, {
            schema: {
                key: {
                    title: '文件',
                },

                finished: {
                    title: '处理是否完成',
                    type: schemaFieldType.Select,
                    dict: dict.yesOrNo,
                },
            },
            service: services,
            mini: true,
            // readOnly: true
        });
    }

    renderHeaderContent = () => {
        return (
            <span>
                提供独立工具，对原始文件以及标注后文件进行分析，生成报告提供下载。
                <br />
                数据会存储在浏览器上，切换环境会导致数据丢失。处理过程中出错，可点击 转换
                按钮继续处理。
            </span>
        );
    };

    listUpdate(key, value) {
        const list = this.state.data.list.map((record) => {
            if (record.key === key) {
                return {
                    ...record,
                    ...value,
                };
            }

            return record;
        });

        this.setState({
            data: {
                list: decorateList(list, this.schema),
            },
        });

        return list;
    }

    /**
     * 表格操作列
     * @returns {{width: string, fixed: (*|string), title: string, render: (function(*, *=): *)}}
     */
    renderOperateColumn() {
        const { scroll } = this.meta;
        return {
            title: '操作',
            fixed: scroll && 'right',
            render: (text, record) => (
                <Fragment>
                    {record.finished && (
                        <Fragment>
                            <a
                                onClick={() =>
                                    this.setState({
                                        showReportModal: true,
                                        record,
                                    })
                                }
                            >
                                报告
                            </a>
                            {/* <Divider type="vertical" /> */}
                        </Fragment>
                    )}

                    {/* <a
                        onClick={() =>
                            this.setState({ showReportModal: true, record })
                        }
                    >
                        已阅
                    </a> */}
                </Fragment>
            ),
        };
    }

    componentDidMount() {
        const list = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
        this.setState({
            data: {
                list: decorateList(list, this.schema),
                pagination: {},
            },
            listLoading: false,
        });
    }

    renderOperationButtons() {
        if (this.props.renderOperationButtons) {
            return this.props.renderOperationButtons();
        }

        return (
            <Fragment>
                <Button
                    type="primary"
                    onClick={() =>
                        this.setState({
                            showUpload: true,
                        })
                    }
                >
                    上传
                </Button>
                <Button
                    loading={this.state.loadingConvert}
                    type="primary"
                    onClick={() => this.handleConvert()}
                >
                    转换
                </Button>
            </Fragment>
        );
    }

    /**
     * 处理转换
     */
    async handleConvert() {
        const _this = this;
        this.setState({ loadingConvert: true });
        const waitRequests = [];
        this.state.data.list.filter((item) => {
            if (!item.finished) {
                waitRequests.push(
                    () =>
                        new Promise((reslove) => {
                            _this
                                .service({
                                    // key: item.key,
                                    check_text: item.checkText,
                                    base_text: item.baseText,
                                })
                                .then((res) => {
                                    const list = this.listUpdate(item.key, {
                                        ...res,
                                        finished: true,
                                    });
                                    localStorage.setItem(
                                        this.localStorageKey,
                                        JSON.stringify(list),
                                    );
                                    message.success('文件上传成功！');

                                    reslove();
                                })
                                .catch(() => {
                                    message.error('文件转换失败！');
                                });
                        }),
                );
                return true;
            }
            return item;
        });

        try {
            for (let i = 0; i < waitRequests.length; i++) {
                await waitRequests[i]();
            }
            // await waitRequests[0]()
            message.info('处理完成');
        } finally {
            this.setState({
                loadingConvert: false,
            });
        }
    }

    renderExtend() {
        const { showUpload, showReportModal, record } = this.state;
        const schema = {
            item_file: {
                title: '文件上传',
                type: schemaFieldType.Upload,
                required: true,
                extra: (
                    <span>
                        zip格式，标注文件需放在mark文件夹下。
                        <br />
                        检查文件存放在其他文件夹下，但是文件名需要和mark下的文件对应。
                    </span>
                ),
            },
        };

        return (
            <Fragment>
                {showUpload && (
                    <InfoModal
                        visible
                        schema={schema}
                        onCancel={() =>
                            this.setState({
                                showUpload: false,
                                loadingUpload: false,
                            })
                        }
                        loadingSubmit={this.state.loadingUpload}
                        action={actions.add}
                        handleAdd={async (data) => {
                            this.setState(
                                {
                                    loadingUpload: true,
                                },
                                async () => {
                                    const args = {
                                        ...(this.props.addArgs || {}),
                                        ...data,
                                    };

                                    const zip = new Zip();
                                    // more files !
                                    const zipObject = await zip.loadAsync(args.item_file.file);

                                    //  get the files
                                    const dirList = [];
                                    const fileKeys = Object.keys(zipObject.files);
                                    fileKeys.forEach((key) => {
                                        if (
                                            !zipObject.files[key].dir ||
                                            key.indexOf('MACOSX') >= 0
                                        ) {
                                            return;
                                        }

                                        if (key.indexOf('mark/') !== 0) {
                                            dirList.push(key);
                                        }
                                    });

                                    const reportList = [];
                                    for (let i = 0; i < fileKeys.length; i++) {
                                        const key = fileKeys[i];
                                        if (
                                            key.endsWith('/') ||
                                            !key.endsWith('txt') ||
                                            fileKeys[i].indexOf('mark') !== 0
                                        ) {
                                            continue;
                                        }

                                        //  获取标注信息
                                        const baseText = await zip
                                            .file(fileKeys[i])
                                            .async('string');

                                        for (let j = 0; j < dirList.length; j++) {
                                            const checkKey =
                                                dirList[j] + fileKeys[i].replace('mark/', '');
                                            const checkText = await zip
                                                .file(checkKey)
                                                .async('string');

                                            reportList.push({
                                                key: `${args.item_file.file.name}:${checkKey}`,
                                                baseText,
                                                checkText,
                                                finished: false,
                                            });
                                        }
                                    }
                                    localStorage.setItem(
                                        this.localStorageKey,
                                        JSON.stringify(reportList),
                                    );

                                    this.setState({
                                        data: {
                                            list: reportList,
                                        },
                                    });

                                    this.handleConvert();
                                    this.setState({
                                        showUpload: false,
                                        loadingUpload: false,
                                    });
                                },
                            );
                        }}
                    />
                )}
                {showReportModal && (
                    <ReportModal
                        visible
                        report={record}
                        onCancel={() => this.setState({ showReportModal: false })}
                    />
                )}
            </Fragment>
        );
    }
}

export default Report;
