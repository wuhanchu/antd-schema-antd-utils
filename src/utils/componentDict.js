import {
    Avatar,
    Button,
    DatePicker,
    Input,
    InputNumber,
    Mentions,
    Radio,
    Select,
    Slider,
    Switch,
    TreeSelect,
    Upload
} from "antd"
import JsonViewer from 'react-json-view'
import BraftEditor from 'braft-editor'
import 'braft-editor/dist/index.css'
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools"

const { TextArea, Password } = Input
const { Option } = Select
const RadioGroup = Radio.Group
const RangePicker = DatePicker.RangePicker

export default {
    Button,
    Upload,
    TreeSelect,
    Input,
    DatePicker,
    RangePicker,
    Slider,
    InputNumber,
    TextArea,
    Select,
    Radio,
    Option,
    Switch,
    Avatar,
    RadioGroup,
    Password,
    Mentions,
    JsonViewer,
    BraftEditor,
    AceEditor
}
