import React, { Fragment } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import '@ant-design/compatible/assets/index.css';
import { Avatar, Button, Col, Divider, Form, Mentions, Row, Select, Tabs, Tooltip, Transfer, Upload } from 'antd';
import JsonViewer from 'react-json-view'
import dictComponents from './componentDict';
import frSchema from '@/outter/fr-schema/src';
import styles from '../styles/basic.less';
import clone from 'clone';
import { globalStyle } from '../styles/global';
import moment from 'moment';
import lodash from 'lodash';
import BraftEditor from 'braft-editor'
import { ContentUtils } from 'braft-utils'
import 'braft-editor/dist/index.css'



const _ = lodash;
const SelectOption = Select.Option;
const MentionsOption = Mentions.Option;

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;

const { actions, dict, schemaFieldType } = frSchema;

/**
 * get the table column
 * @param schema
 * @returns {Array}
 */
export function getListColumn(schema, fieldConfList) {
    let oneRow = [];
    Object.keys(schema)
        .sort((a, b) => {
            return (
                (schema[a].orderIndex === undefined ||
                schema[a].orderIndex === null
                    ? 9999
                    : schema[a].orderIndex) -
                (schema[b].orderIndex === undefined ||
                schema[b].orderIndex === null
                    ? 9999
                    : schema[b].orderIndex)
            );
        })
        .forEach((key, index) => {
            const item = schema[key];
            if (
                item.listHide ||
                (fieldConfList && !fieldConfList.includes(key))
            ) {
                return;
            }

            oneRow.push(fieldToColumn(key, item));
        });

    return oneRow;
}

/**
 * 查找导出字段
 * @param schema
 * @param fieldConfList
 * @returns {Array}
 */
export function getExportColumn(schema, fieldConfList) {
    let oneRow = [];
    Object.keys(schema).forEach(key => {
        const item = schema[key];
        if (item.addHide || (fieldConfList && !fieldConfList.includes(key))) {
            return;
        }

        oneRow.push(fieldToColumn(key, item));
    });

    return oneRow.sort((a, b) => {
        return (a.orderIndex || 9999) - (b.orderIndex || 9999);
    });
}

/**
 * 字段转换成列表项
 *
 * @param key 配置的key
 * @param item 字段项目
 */
function fieldToColumn(key, item) {
    const addItem = {
        ...item,
        key,
        dataIndex:
            item.dict ||
            item.type === 'DatePicker' ||
            item.type === 'Select' ||
            item.unit
                ? key + '_remark'
                : key,
        render:
            item.render ||
            (value => {
                switch (item.type) {
                    case 'Avatar':
                        return <Avatar src={value}/>;
                    default:
                        return (
                            <div
                                style={{
                                    width: item.width,
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-all',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                }}
                            >
                                {value}
                            </div>
                        );
                }
            }),
    };
    return addItem;
}

/**
 * create the input0
 * @param item schema的field 属性
 * @param data 当前record的数据
 * @param form form对象
 * @param action 当前操作
 * @param itemProps
 * @param colNum
 * colNum 一行有几个字段
 * @returns {*}
 */
export function createInput(
    item,
    data,
    form,
    action = actions.add,
    itemProps = {},
    colNum = 1,
) {
    let type = item.type;
    if (!type) {
        type = "Input"
    }

    // component props
    let props = {
        form,
        readOnly:
            action === actions.show ||
            (action === actions.edit && item.readOnly),
        disabled:
            action === actions.show ||
            (action === actions.edit && item.readOnly),
        onChange: function (event) {
            const value =
                event && event.currentTarget? event.currentTarget.value : event;
            if (this && this.state && this.setState && this.state.data) {
                let data = { ...this.state.data };
                data[item.dataIndex] = value;
                this.setState({ data });
            }
            item.onChange &&
            item.onChange.bind(this)(value, this && this.state, form);
        }.bind(this),
        ...item.props,
    };

    //  create component
    let component = null;
    let decoratorProps = {};

    let defaultWidth =
        (globalStyle.form.input.width*(colNum > 3? 3 : colNum))/colNum;

    props = {
        style: item.style || { width: defaultWidth },
        placeholder: !props.readOnly? `请输入${item.title}` : null,
        ...props,
    };

    // 初始值
    if (data) {
        let initialValue = data[item.dataIndex];
        switch (type) {
            case 'MultiSelect':
            case 'Select':
                initialValue =
                    selectValueConvert(item, data[item.dataIndex]) ||
                    getItemDefaultValue(item);
                if(item.props && item.props.mode==="tags" && !initialValue){
                    initialValue = []
                }
                break;
            case 'DatePicker':
                initialValue = initialValue
                    ? moment(initialValue, moment.ISO_8601)
                    : null;
                break;
        }
        if (!form) {
            props.value = initialValue;
        } else {
            itemProps.initialValue = initialValue
        }
    }

    // 构建组件
    let tempData = data;
    if (item.type === schemaFieldType.Transfer) {
        tempData = data[item.dataIndex];
    }

    if (item.renderInput) {
        component = item.renderInput.bind(this)(
            item,
            form? tempData : null,
            props,
            action,
        );
    } else {
        component = createComponent.bind(this)(
            item,
            form? tempData : null,
            props,
            action,
            defaultWidth,
        );
    }

    //创建
    decoratorProps = convertDecoratorProps(item);
    return !this ||
    !this.state ||
    !item.infoShowFunc ||
    item.infoShowFunc(this.state.data)? (
        <Tooltip placement="top" title={item.tip}>
            <FormItem
                key={item.dataIndex}
                name={item.dataIndex}
                label={
                    item.title + (item.unit? '(' + item.unit + ')' : '')
                }
                rules={decoratorProps.rules}
                extra={item.extra}
                {...itemProps}
                {...item.itemProps}
            >
                {component}
            </FormItem>
        </Tooltip>
    ) : null;
}

/**
 * 创建输入控件
 * @param {*} item field 信息
 * @param {*} value 数据
 * @param {*} props 扩展的props
 * @param {*} action action操作
 * @param {*} defaultWidth 默认宽度
 */
export function createComponent(
    item,
    data,
    extraProps = {},
    action = actions.add,
    defaultWidth = 200,
) {
    let type = item.type;
    if (!type) {
        type = "Input"
    }
    let component,
        defaultValue = null;
    let options = [];
    let props = { ...item.props, ...extraProps };
    let key = item.dataIndex
    let jsonViewerDefultValue
    if(item.isArray){
        jsonViewerDefultValue = []
    }else jsonViewerDefultValue={}
    switch (type) {
        case 'Avatar':
            component = <Avatar {...props} />;
            break;

        case 'JsonViewer' :
            component = <div><JsonViewer
                sortKeys
                style={{ backgroundColor: "white" }}
                src={props.form && props.form.current ? props.form.current.getFieldsValue()[key]? props.form.current.getFieldsValue()[key]: jsonViewerDefultValue: data[key]?data[key]: jsonViewerDefultValue}
                collapseStringsAfterLength={12}
                displayObjectSize={true}
                name={null}
                enableClipboard={copy => {
                    console.log("you copied to clipboard!", copy)
                }}
                onEdit={async e => {
                    if (e.new_value === "error") {
                        return false
                    }

                    let obj = {}
                    obj[key] = e.updated_src
                    console.log(props)
                    props.form.current.setFieldsValue(obj);
                    console.log(props.form.current.getFieldsValue())

                }}
                onDelete={async e => {
                    let obj = {}
                    let objInit = {}
                    objInit[key] = undefined
                    obj[key] = e.updated_src
                    console.log(objInit)
                    console.log(props.form.current.getFieldsValue())

                    props.form.current.setFieldsValue(objInit);
                    props.form.current.setFieldsValue(obj);
                    console.log(props.form.current.getFieldsValue())

                }}
                onAdd={async e => {
                    if (e.new_value === "error") {
                        return false
                    }
                    let obj = {}
                    obj[key] = e.updated_src
                    props.form.current.setFieldsValue(obj);
                    console.log(props.form.current.getFieldsValue())
                }}
                shouldCollapse={({ src, namespace, type }) => {
                    if (type === "array" && src.indexOf("test") > -1) {
                        return true
                    } else if (namespace.indexOf("moment") > -1) {
                        return true
                    }
                    return false
                }}
                defaultValue=""/></div>
            break
        case 'BraftEditor' :
            console.log("item.lineWidth")
            console.log(props, data, item)
            let value = ''
            value = BraftEditor.createEditorState(data[key])
            component = <div style={{width: item.lineWidth}}>
                <BraftEditor  {...props} 
                    value={value}
                    onChange={(data)=>{
                        let obj = {}
                        obj[key] = data.toHTML()
                        try {
                            props.form.current.setFieldsValue(obj);
                        } catch (error) {
                            
                        }
                    }}
                />
                </div>
            break
        case schemaFieldType.Transfer:
            component = (
                <Transfer
                    targetKeys={data}
                    render={item => item.name}
                    showSearch
                    {...props}
                    onChange={(targetKeys, direction, moveKeys) => {
                        props.onChange(targetKeys);
                    }}
                />
            );
            break;
        case 'MultiSelect':
            const mode = 'multiple';

            //default value
            if (action === actions.add) {
                Object.values(item.dict).forEach(dictItem => {
                    defaultValue = getItemDefaultValue(item);
                });
            }
        case 'Select':
            //default value
            if (!defaultValue && action === actions.add && item.dict) {
                Object.values(item.dict).some(dictItem => {
                    defaultValue = getItemDefaultValue(item);
                });
            }

            // options
            item.dict &&
            Object.values(item.dict).forEach(
                function (dictItem) {
                    //check the dict Whether it matches
                    if (
                        dictItem.condition &&
                        (action === actions.add || action === actions.edit)
                    ) {
                        if (dictItem.condition instanceof Function) {
                            if (!dictItem.condition(this.state.data)) {
                                return;
                            }
                        } else if (
                            Object.keys(dictItem.condition).some(
                                function (key) {
                                    return (
                                        !this ||
                                        !this.state ||
                                        !this.state.data ||
                                        this.state.data[key] !==
                                        dictItem.condition[key]
                                    );
                                }.bind(this),
                            )
                        ) {
                            return;
                        }
                    }

                    // add to options
                    return options.push(
                        <SelectOption
                            key={dictItem.value}
                            title={dictItem.title}
                            value={dictItem.value}
                        >
                            {dictItem.remark}
                        </SelectOption>,
                    );
                }.bind(this),
            );

            // judge whether show search
            const searchOptions =
                options.length > 10
                    ? {
                        showSearch: true,
                        optionFilterProp: 'children',
                        filterOption: (input, option) =>
                            option.props.children.toLowerCase &&
                            option.props.children
                                .toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0,
                    }
                    : {};

            // create the select
            component = (
                <Select
                    showSearch
                    allowClear
                    defaultValue={defaultValue}
                    style={{ width: defaultWidth, ...(item.style || {}) }}
                    mode={mode}
                    optionFilterProp="children"
                    placeholder={!props.readOnly && '请选择'}
                    disabled={props.readOnly}
                    {...searchOptions}
                    {...props}
                >
                    {options}
                </Select>
            );
            break;

        case dictComponents.Mentions:
            // options
            item.options &&
            Object.values(item.options).forEach(
                function (dictItem) {
                    // add to options
                    return options.push(
                        <MentionsOption
                            key={dictItem.value}
                            value={dictItem.value}
                        >
                            {dictItem.remark}
                        </MentionsOption>,
                    );
                }.bind(this),
            );

            // create the components
            component = (
                <Mentions rows="3" {...props}>
                    {options}
                </Mentions>
            );
            break;

        // create the upload input
        case 'Upload':
            component = (
                <Upload
                    multiple={false}
                    beforeUpload={file => {
                        return false;
                    }}
                    {...props}
                >
                    <Button>
                        <UploadOutlined/> 选择文件
                    </Button>
                </Upload>
            );
            break;

        case 'RangePicker':
            let { placeholder, ...others } = props;
            component = React.createElement(dictComponents[type], {
                style: { width: defaultWidth },
                ...others,
            });
            break;

        default:
            component = React.createElement(dictComponents[type], {
                style: { width: defaultWidth },
                placeholder: !props.readOnly && `请输入${item.title}`,
                ...props,
            });
    }

    //return
    return component;
}

/**
 * 转换字段定义成 fieldDecorator
 * @param item
 * @returns {{rules: {message: (boolean|string), required: *}[]}}
 */
export function convertDecoratorProps(item) {
    const { rules, ...otherDecoratorProps } = item.decoratorProps || {};
    const decoratorProps = {
        rules: [
            {
                required: item.required,
                message: `请输入${item.title}！`,
            },
        ].concat(rules || []),
        ...(otherDecoratorProps || {}),
    };
    return decoratorProps;
}

/**
 * 获取下拉框默认值
 */
function getItemDefaultValue(item) {
    // 多选下拉框
    if (item.type == schemaFieldType.MultiSelect) {
        let defaultValue = [];
        item.dict &&
        Object.values(item.dict).forEach(dictItem => {
            if (dictItem.default) {
                defaultValue = defaultValue || [];
                defaultValue.push(dictItem.value);
            }
        });

        return defaultValue || [];
    }
    // 下拉框
    else if (item.type == schemaFieldType.Select) {
        let defaultValue = null;
        item.dict &&
        Object.values(item.dict).some(dictItem => {
            // 在from下的默认值由 form 来传入
            if (dictItem.default) {
                defaultValue = dictItem.value;
                return true;
            }
        });

        return defaultValue;
    }
}

/**
 * 根据字段类型转换初始值
 * @param item
 * @param initialValue
 * @returns {*}
 */
function selectValueConvert(item, initialValue) {
    let result = initialValue;
    if (result === null || result == undefined) {
        return result;
    }

    if (
        item.type === schemaFieldType.MultiSelect &&
        typeof initialValue === 'string'
    ) {
        result = initialValue? initialValue.split(',') : [];
        if (
            !_.isEmpty(result) &&
            !_.isEmpty(item.dict) &&
            typeof Object.values(item.dict)[0].value === 'number'
        ) {
            result = result.map(value => parseInt(value));
        }
    }

    if (item.type === schemaFieldType.Select) {
        if (!item.dict || !Object.values(item.dict)[0] || initialValue instanceof Array) {
            return result;
        }

        if (
            typeof Object.values(item.dict)[0].value === 'number' &&
            typeof initialValue === 'string'
        ) {
            result = parseInt(initialValue);
        } else if (initialValue instanceof Array) {
            result = initialValue;
        } else if (typeof Object.values(item.dict)[0].value === 'string') {
            result = initialValue.toString();
        }
    }

    return result;
}

/**
 * 增加搜索栏s输入框
 * @param form
 * @param inSchema
 * @param span
 * @returns {*[]}
 */
export function createFilter(form, inSchema, span, data) {
    let schema = clone(inSchema);
    Object.keys(schema).forEach(key => {
        if (!schema[key]) {
            delete schema[key];
            return;
        }

        schema[key].dict &&
        Object.keys(schema[key].dict).forEach(dictItem => {
            delete schema[key].dict[dictItem].default;
        });
    });

    let filter = Object.keys(schema).map(key => {
        if(schema[key].props && schema[key].props.mode == 'tags'){
            data=[]
        }
        return (
            <Col span={schema[key].span || span} key={'filter_' + key}>
                {createInput.bind(this)(
                    {
                        ...schema[key],
                        dataIndex: key,
                        required: false,
                        props: {
                            ...schema[key].props,
                            style: {
                                ...((schema[key].props &&
                                    schema[key].props.style) ||
                                    {}),
                            },
                        },
                    },
                    data,
                    form,
                    actions.add,
                )}
            </Col>
        );
    });

    return filter;
}

/**
 * 创建表单
 * colNum 表单列数
 * @param schema
 */
export function createForm(
    column,
    data,
    form,
    action = actions.add,
    style = {},
    otherTabs = {},
    extend = {},
    colNum = 1,
    formProps,
) {
    let result = null;

    // create the from
    column.forEach(item => {
        if (!result) {
            result = item.tabKey? {} : [];
        }

        // 修改隐藏 只读
        if (action === actions.edit && item.editHide && !data[item.dataIndex]) {
            return;
        }

        let component = createInput.bind(this)(
            item,
            data,
            form,
            action,
            { style },
            colNum,
        );

        if (result instanceof Array) {
            result.push({ column: item, component });
        } else {
            result[item.tabKey] = result[item.tabKey] || [];
            result[item.tabKey].push({ column: item, component });
        }
    });

    if (result instanceof Array) {

        // 清理 null 的数据
        let initialValues = {};
        Object.keys(data).forEach(key => {
            if (!_.isNil(data[key])) {
                initialValues[key] = data[key];
            }
        });

        return (
            <Form
                ref={form}
                initialValues={initialValues}
                labelCol={globalStyle.form.labelCol}
                wrapperCol={globalStyle.form.wrapperCol}
                {...formProps}
            >
                {renderInputList.bind(this)(result, colNum)}
            </Form>
        );
    } else {
        return (
            <Tabs tabPosition="left">
                {Object.keys(result).map(listKey => (
                    <TabPane tab={listKey} key={listKey}>
                        {result[listKey].length < 10
                            ? renderInputList.bind(this)(
                                result[listKey],
                                colNum,
                            )
                            : renderInputList.bind(this)(
                                result[listKey],
                                colNum,
                            )}
                        {extend[listKey] || null}
                    </TabPane>
                ))}

                {Object.keys(otherTabs).map(key => (
                    <TabPane tab={key} key={key}>
                        {otherTabs[key]}
                    </TabPane>
                ))}
            </Tabs>
        );
    }
}

/**
 * render form list
 * @param list
 * @param colNum
 * @returns {Array}
 */
function renderInputList(list, colNum) {
    let itemList = [];

    let tempMum = 0;
    let tempList = [];
    list.forEach((item, index) => {
        tempMum += item.column.colNum || 1;
        tempList.push(item);
        let push = false;

        //  分组情况下 强制换行
        if (index === 0 && item.column.groupName) {
            itemList.push(
                <Fragment>
                    <div className={styles.title}>
                        {list[index + 1].column.groupName}
                    </div>
                </Fragment>,
            );
        }

        if (
            list[index + 1] &&
            list[index + 1].column.groupName &&
            item.column.groupName !== list[index + 1].column.groupName
        ) {
            push = true;
        }

        if (push || tempMum >= colNum || index === list.length - 1) {
            itemList.push(
                <Row key={`tempList_${index}`}>
                    {tempList.map((tempItem, tempIndex) => (
                        <Col
                            key={`tempList_${index}_${tempIndex}}`}
                            span={(24/colNum)*(tempItem.column.colNum || 1)}
                        >
                            {tempItem.component}
                        </Col>
                    ))}
                </Row>,
            );

            tempMum = 0;
            tempList = [];
        }

        if (push) {
            itemList.push(
                <Fragment>
                    <Divider style={{ margin: '5px 2px 5px 2px' }}/>
                    <div className={styles.title}>
                        {list[index + 1].column.groupName}
                    </div>
                </Fragment>,
            );
        }
    });

    return itemList;
}
