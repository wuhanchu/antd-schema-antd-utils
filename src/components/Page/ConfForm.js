import React, { PureComponent } from "react"
import '@ant-design/compatible/assets/index.css';
import { Button,Form } from "antd";
import InfoForm from "./InfoForm"
import { connect } from "dva"

const FormItem = Form.Item

@connect(({ weixinMember, user, loading }) => ({
    member: weixinMember.member,
    user: user.currentUser,
    loading: loading.models.weixinMember
}))
class ConfForm extends PureComponent {
    formRef = React.createRef();
    componentDidMount() {
        const { dispatch, user } = this.props
        dispatch({
            type: "weixinMember/getCurrent"
        })
    }

    handleSubmit = filedValues => {
        const { dispatch, member, addon } = this.props
        this.formRef.current
            .validateFields()
            .then(async values => {
                console.log("handleSubmit", values)
                // const value = JSON.stringify(values);
                member.addons[addon] = values
                dispatch({
                    type: "weixinMember/update",
                    payload: {
                        ...member,
                        addon_config: JSON.stringify(member.addons)
                    }
                })
            })
            .catch(err => {
                console.log("err", err)
            })
    }

    render() {
        const { member, addon, resource, loading } = this.props
        if (!member) {
            return null
        }
        const data = addon && member && member.addons[addon]

        const submitFormLayout = {
            wrapperCol: {
                xs: { span: 24, offset: 0 },
                sm: { span: 10, offset: 7 }
            }
        }

        return (
            <Form onFinish={this.handleSubmit} hideRequiredMark ref={this.formRef}>
                <InfoForm
                    values={data}
                    form={this.formRef}
                    resource={resource || "weixinMember"}
                />
                <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        保存
                    </Button>
                </FormItem>
            </Form>
        )
    }
}

export default ConfForm
