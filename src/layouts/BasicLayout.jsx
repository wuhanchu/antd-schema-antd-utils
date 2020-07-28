/**
 * Ant Design Pro v4 use `@ant-design/pro-layout` to handle Layout.
 * You can view component api by:
 * https://github.com/ant-design/ant-design-pro-layout
 */
import ProLayout, { DefaultFooter } from '@ant-design/pro-layout';
import React, { useEffect } from 'react';
import { connect, Link, useIntl } from 'umi';
import { Button, Result } from 'antd';
import RightContent from '@/components/GlobalHeader/RightContent';
import { getAuthorityFromRouter } from '@/utils/utils';
import logo from '@/assets/logo.svg';
import config from "../../../../../config/settting/standard"
import Authorized from "../components/Authorized/Authorized";

const noMatch = (
    <Result
        status={403}
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
            <Button type="primary">
                <Link to="/user/login">Go Login</Link>
            </Button>
        }
    />
);

/**
 * use Authorized check all menu item
 */
const menuDataRender = menuList =>
    menuList.map(item => {
        const localItem = { ...item, children: item.children? menuDataRender(item.children) : [] };
        return Authorized.check(item.authority, localItem, null);
    });

const defaultFooterDom = (
    <DefaultFooter copyright={config.copyright || ""} links={[]}/>

);

const BasicLayout = props => {
    const {
        dispatch,
        children,
        settings,
        init,
        location = {
            pathname: '/',
        },
    } = props;
    /**
     * constructor
     */

    useEffect(() => {
        if (dispatch) {
            dispatch({
                type: 'global/init',
            });
        }
    }, []);
    /**
     * init variables
     */

    const handleMenuCollapse = payload => {
        if (dispatch) {
            dispatch({
                type: 'global/changeLayoutCollapsed',
                payload,
            });
        }
    }; // get children authority

    const { formatMessage } = useIntl();

    return (
        <ProLayout
            logo={logo}
            formatMessage={formatMessage}
            menuHeaderRender={(logoDom, titleDom) => (
                <Link to={"/"}>
                    {logoDom}
                    {titleDom}
                </Link>
            )}
            onCollapse={handleMenuCollapse}
            menuItemRender={(menuItemProps, defaultDom) => {
                if (menuItemProps.isUrl || menuItemProps.children || !menuItemProps.path) {
                    return defaultDom;
                }

                return <Link to={menuItemProps.path}>{defaultDom}</Link>;
            }}
            breadcrumbRender={(routers = []) => [
                {
                    path: '/',
                    breadcrumbName: formatMessage({
                        id: 'menu.home',
                    }),
                },
                ...routers,
            ]} te

            itemRender={(route, params, routes, paths) => {
                const first = routes.indexOf(route) === 0;
                return first? (
                    <Link to={paths.join('/')}>{route.breadcrumbName}</Link>
                ) : (
                    <span>{route.breadcrumbName}</span>
                );
            }}
            footerRender={() => defaultFooterDom}
            menuDataRender={menuDataRender}
            rightContentRender={() => <RightContent/>}
            {...props}
            {...settings}
            loading={!init}
        >
            {children}
        </ProLayout>
    );
};

export default connect(({ global, settings }) => ({
    collapsed: global.collapsed,
    init: global.init,
    settings,
}))(BasicLayout);
