import { message } from "antd"

/**
 * create the base model
 * @param services
 * @returns {*}
 */
export function createBaseModel(services, refreshList = true) {
    return {
        state: {
            data: {
                list: [],
                pagination: {}
            },
            info: null
        },

        effects: {
            * fetch({ payload }, { call, put, select }) {
                // get  the user
                const { currentUser } = yield select(state => state.user)
                const { token } = (currentUser && currentUser.user) || {}

                const response = yield call(services.get, { token, ...payload })
                yield put({
                    type: "save",
                    payload: {
                        data: response
                    }
                })
            },

            * add({ payload, callback }, { call, put }) {
                const response = yield call(services.post, payload)
                yield put({
                    type: "save",
                    payload: {
                        info: response
                    }
                })
                if (callback) callback()
                refreshList &&
                (yield put({
                    type: "fetch"
                }))

                message.success("新增成功")
            },
            * remove({ payload, callback }, { call, put }) {
                yield call(services.delete, payload)
                yield put({
                    type: "save",
                    payload: {
                        info: null
                    }
                })
                if (callback) callback()
                refreshList &&
                (yield put({
                    type: "fetch"
                }))
                message.success("删除成功")
            },
            *update({ payload, callback }, { call, put }) {
                const response = yield call(services.patch, payload)
                yield put({
                    type: "save",
                    payload: {
                        info: response
                    }
                })

                if (callback) callback()
                refreshList &&
                (yield put({
                    type: "fetch"
                }))
                message.success("修改成功")
            }
        },

        reducers: {
            save(state, action) {
                return {
                    ...state,
                    ...action.payload
                }
            }
        }
    }
}
