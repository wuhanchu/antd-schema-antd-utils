import { Modal, Row, Input, message, Tooltip, Tag } from 'antd';
import service from '@/pages/authority/user/service';

import { QuestionCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { connect } from 'umi';
import Avatar from './AvatarDropdown';
import styles from '@/components/GlobalHeader/index.less';

const config = SETTING

const ENVTagColor = {
    dev: 'orange',
    test: 'green',
    pre: '#87d068',
};
class GlobalHeaderRight extends React.Component {
    state = {
        showeditPw: false,
        conValue: '',
    };

    onChangeOld = (e) => {
        this.setState({
            oldValue: e.target.value,
        });
    };

    onChangeNew = (e) => {
        this.setState({
            newValue: e.target.value,
        });
    };

    onChangeCon = (e) => {
        this.setState({
            conValue: e.target.value,
        });
    };

    handleChangeShoweditPw = (visible) => {
        this.setState({
            showeditPw: visible,
        });
    };

    render() {
        const { theme, layout } = this.props;
        let className = styles.right;

        if (theme === 'dark' && layout === 'topmenu') {
            className = `${styles.right}  ${styles.dark}`;
        }

        return (
            <div className={className} style={{height: '48px'}}>
                {config.useDocumentation &&<Tooltip title="使用文档">
                    <a
                        target="_blank"
                        href={config.useDocumentation}
                        rel="noopener noreferrer"
                        className={styles.action}
                    >
                        <QuestionCircleOutlined />
                    </a>
                </Tooltip>}
                <Avatar handleChangeShoweditPw={this.handleChangeShoweditPw.bind(this)} />
                <Modal
                    title="修改密码"
                    visible={this.state.showeditPw}
                    onCancel={() => {
                        this.setState({ showeditPw: false });
                    }}
                    onOk={async () => {
                        if (
                            this.state.oldValue &&
                            this.state.newValue &&
                            this.state.conValue &&
                            this.state.newValue === this.state.conValue
                        ) {
                            try {
                                await service.editMyPwd({
                                    old_password: this.state.oldValue,
                                    new_password: this.state.newValue,
                                });
                                message.success('修改成功');
                                this.setState({ showeditPw: false });
                            } catch (error) {
                                message.error(error.message);
                                this.setState({ showeditPw: false });
                            }
                        } else {
                            message.error('输入有误，请重新输入！');
                        }
                    }}
                >
                    {/* <EditPwd/> */}
                    <Row style={{ height: '60px', lineHeight: '32px', marginLeft: '50px' }}>
                        初始密码:
                        <Input.Password
                            onChange={this.onChangeOld}
                            style={{ width: '300px', height: '32px', marginLeft: '10px' }}
                        />
                    </Row>
                    <Row style={{ height: '60px', lineHeight: '32px', marginLeft: '50px' }}>
                        新的密码:
                        <Input.Password
                            onChange={this.onChangeNew}
                            style={{ width: '300px', height: '32px', marginLeft: '10px' }}
                        />
                    </Row>
                    <Row style={{ height: '60px', lineHeight: '32px', marginLeft: '50px' }}>
                        确认密码:
                        <Input.Password
                            onChange={this.onChangeCon}
                            style={{ width: '300px', height: '32px', marginLeft: '10px' }}
                        />
                    </Row>
                </Modal>
                {REACT_APP_ENV && (
                    <span>
                        <Tag color={ENVTagColor[REACT_APP_ENV]}>{REACT_APP_ENV}</Tag>
                    </span>
                )}
            </div>
        );
    }
}

// const GlobalHeaderRight = (props) => {

// };

export default connect(({ settings }) => ({
    theme: settings.navTheme,
    layout: settings.layout,
}))(GlobalHeaderRight);
