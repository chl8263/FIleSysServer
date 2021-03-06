import React, { useEffect, useState } from "react";
import $ from "jquery";
import { connect } from "react-redux";

import PreLoader from "../component/PreLoader";
import { PAGE_ROUTE, HTTP, MediaType} from "../util/Const";
import { actionCreators } from "../store";

import TopBar from "../component/mainBoard/topBar/TopBar";
import LeftTree from "../component/mainBoard/treeView/LeftTree";
import FileViewFrame from "../component/mainBoard/fileView/FileViewFrame";
import { Scrollbars } from 'react-custom-scrollbars';
import ProgressModal from "../component/modal/ProgressModal";

import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MailIcon from '@material-ui/icons/Mail';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';

import PanelGroup from "react-panelgroup";
import Content from "react-panelgroup";

const drawerWidth = 240;

const MainBoard = ( { store, window } ) => {

    useEffect(() => {
        //history.pushState('','', '/main-board');
        $(".preloader").fadeOut(); // Remove preloader.
    }, []);

    const handleOpen = () => {
        setOpen(true);
      };
    
      const handleClose = () => {
        setOpen(false);
      };

    const container = window !== undefined ? () => window().document.body : undefined;
    
    return (
        <>
            <PreLoader />

            <TopBar />
            <PanelGroup borderColor="grey" panelWidths={[
                    {size: 300, minSize:200, maxSize:500, resize: "dynamic"},
                    {size: 300, minSize:50, resize: "dynamic"}
                ]}>

                <Scrollbars style={{ width: 500, height: "100vh" }}>
                    <LeftTree />
                </Scrollbars>

                <Scrollbars style={{ width: "100vw", height: "100vh", margin: "5px" }}>
                    <FileViewFrame />
                </Scrollbars>

            </PanelGroup>
        </> 
    );
};

MainBoard.propTypes = {
    window: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
    return { store: state };
}

const mapDispathToProps = (dispatch) => {
    return {
        switchLogin: () => dispatch(actionCreators.switchMainPageRoute(PAGE_ROUTE.LOGIN)),
        initJwtToken: () => dispatch(actionCreators.addJwtToken("")),
        initUserInfo: () => dispatch(actionCreators.addUserInfo("")),
    };
}

export default connect(mapStateToProps, mapDispathToProps) (MainBoard);