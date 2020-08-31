import Authorized from './components/Authorized';

import ConfForm from './components/Page/ConfForm';
import ExtendModal from './components/Page/ExtendModal';
import InfoForm from './components/Page/InfoForm';
import InfoModal from './components/Page/InfoModal';
import ListPage from './components/Page/ListPage';
import DataList from './components/Page/DataList';

import * as authority from "./utils/authority"
import * as component from "./utils/component"
import * as componentDict from "./utils/componentDict"
import * as file from "./utils/file"
import * as model from "./utils/model"
import * as url from "./utils/url"
import * as utils from "./utils/utils"
import * as xlsx from "./utils/xlsx"

export let schemas = null
export let services = null

/**
 * 根据模型和服务 初始化 工具
 * @param {object} initSchema
 * @param {object} initServices
 */
function init(initSchema, initServices) {
    schemas = initSchema
    services = initServices
}

export default {
    init, components: {
        Authorized,
        ConfForm,
        ExtendModal,
        InfoForm,
        InfoModal,
        DataList,
        ListPage,
    }, utils: {
        authority,
        component,
        componentDict,
        file,
        model,
        url,
        utils,
        xlsx
    }, services, schemas
}
