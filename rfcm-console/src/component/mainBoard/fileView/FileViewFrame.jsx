import React, { useEffect, useState, useRef } from "react";

import { PAGE_ROUTE, HTTP, MediaType, SOCK_REQ_TYPE} from "../../../util/Const";
import axios from 'axios';

import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';
import Button from '@material-ui/core/Button';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import FileMoveIcon from '@material-ui/icons/TrendingUpOutlined';
import FileNameChangeIcon from '@material-ui/icons/CreateOutlined';
import UploadIcon from '@material-ui/icons/CloudUploadOutlined';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileAlt, faFolder } from "@fortawesome/free-regular-svg-icons"
import { connect } from "react-redux";

import { useCookies } from "react-cookie";
import { actionCreators } from "../../../store";
import ProgressModal from "../../modal/ProgressModal";

function createData(name, dateModified, type, size, hiden) {
    return { name, dateModified, type, size, hiden };
}
  
const rows = [
    createData('...', '', '', '', 'previous'),
];
  
function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
};
  
function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
};
  
function stableSort(array, comparator) {
    if(array === null || array === undefined) return [];
    if(array.length > 1){
        let tempPrevious = "";
        if(array[0].hiden === "previous"){
            tempPrevious = array[0];
            array.shift();
        }
        
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });

        let result = stabilizedThis.map((el) => el[0]);
        if(tempPrevious !== ""){
            result.unshift(tempPrevious);
            array.unshift(tempPrevious);
        }
        
        return result;
    }
    return array;
};

const headCells = [
    { id: 'name', numeric: false, disablePadding: true, label: 'Name' },
    { id: 'dateModified', numeric: true, disablePadding: false, label: 'Date modified' },
    { id: 'type', numeric: true, disablePadding: false, label: 'Type' },
    { id: 'size', numeric: true, disablePadding: false, label: 'Size' },
];
  
function EnhancedTableHead(props) {
    const { classes, order, orderBy, onRequestSort } = props;
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
        <TableRow>
            {headCells.map((headCell) => (
            <TableCell
                style={{ backgroundColor : '#CCCCCC' }}
                key={headCell.id}
                align={headCell.numeric ? 'right' : 'left'}
                padding={headCell.disablePadding ? 'none' : 'default'}
                sortDirection={orderBy === headCell.id ? order : false}
            >
                <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
                >
                {headCell.label}
                {orderBy === headCell.id ? (
                    <span className={classes.visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </span>
                ) : null}
                </TableSortLabel>
            </TableCell>
            ))}
        </TableRow>
        </TableHead>
    );
}
  
EnhancedTableHead.propTypes = {
    classes: PropTypes.object.isRequired,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = makeStyles((theme) => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
    },
    highlight:
        theme.palette.type === 'light'
        ? {
            color: theme.palette.secondary.main,
            backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
        : {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.secondary.dark,
            },
    title: {
        flex: '1 1 100%',
    },
}));
  
const EnhancedTableToolbar = (props) => {
    const classes = useToolbarStyles();
    const { numSelected, fileViewInfo, selectedRow, changeFileName, setCopyItem, copyItem, settingModalState, getFileData } = props;
    const [cookies, setCookie, removeCookie] = useCookies(["JWT_TOKEN"]);
    const [uploadFile, setUploadFile] = useState(null);

    useEffect(() => {
        setUploadFile(null);
    }, [fileViewInfo]);

    const onCLickChangeBtn = (fileName) => {
        if(fileName === null || fileName === undefined || fileName === "") return;
        
        const splitedFileName = selectedRow.name.split(".");
        const originalFileName = splitedFileName[0];
        const extension = splitedFileName[1];
        const changedName = prompt("Please write the name to change.", originalFileName);

        if(changedName === null || changedName === undefined || changedName === "" || changedName === fileName) return;

        settingModalState(true);

        const address = fileViewInfo.fileViewAddress;
        // s: Ajax ----------------------------------
        var fianlPath = fileViewInfo.fileViewPath;
        if(fianlPath !== "") { fianlPath += "|"; }
        fianlPath = fianlPath.replace(/\\/g, "|").replace(/\//g,"|");
        if(fianlPath.charAt(0) === '|') { fianlPath = fianlPath.substr(1); }

        const fileChangeInfo = {
            path: "",
            beforeName: originalFileName,
            afterName: changedName,
            extension: extension
        }

        fetch(HTTP.SERVER_URL + `/api/file/${address}/${fianlPath}`, {
            method: HTTP.PUT,
            headers: {
                'Content-type': MediaType.JSON,
                'Accept': MediaType.JSON,
                'Authorization': HTTP.BASIC_TOKEN_PREFIX + cookies.JWT_TOKEN,
                'Uid': cookies.UID
            },
            body: JSON.stringify(fileChangeInfo)
        }).then(res => { if(!res.ok){ throw res; } return res;
        }).then(res => { return res.json();
        }).then(json => {
            if(json === null || json === undefined || json.error === true || json.responseData === false){
                alert("Cannot change file name");
                return;
            }
            
            let aftername = "";
            if(extension === undefined || extension === null || extension === ""){
                aftername = changedName;
            }else {
                aftername = changedName + "." + extension;
            }
            changeFileName(selectedRow.name, aftername);

        }).catch(error => {
            alert("Cannot change file name");
        })
        // .finally(() => {
        //     settingModalState(false);
        // });;
        // e: Ajax ----------------------------------
    };

    const onClickFileUpLoad = () => {
        // s: Ajax ----------------------------------
        const address = fileViewInfo.fileViewAddress;
        var fianlPath = fileViewInfo.fileViewPath;
        if(fianlPath !== ""){
            fianlPath += "|";
        }
        fianlPath = fianlPath.replace(/\\/g, "|").replace(/\//g,"|");
        if(fianlPath.charAt(0) === '|'){
        fianlPath = fianlPath.substr(1);
        }

        const formData = new FormData();
        formData.append('file', uploadFile[0]);

        fetch(HTTP.SERVER_URL + `/api/file/upload/${address}/${fianlPath}`, {
            method: HTTP.POST,
            headers: {
                'Authorization': HTTP.BASIC_TOKEN_PREFIX + cookies.JWT_TOKEN,
                'Uid': cookies.UID,
            },
            body: formData
        }).then(res => {
            if(!res.ok){
                throw res;
            }
            return res;
        }).then(res => {
            return res.json();
        }).then(json => {
            if(json) {
                alert("Success upload");
                getFileData(fileViewInfo.fileViewAddress, fileViewInfo.fileViewPath);
            }
        }).catch(error => {
            console.error(error);
            alert(error.errorMsg);
        });
    }

    const onCLickFileCopy = () => {
        const address = fileViewInfo.fileViewAddress;
        // s: Ajax ----------------------------------
        var fianlPath = fileViewInfo.fileViewPath;
        if(fianlPath !== ""){
            fianlPath += "|";
        }
        fianlPath = fianlPath.replace(/\\/g, "|").replace(/\//g,"|");
        if(fianlPath.charAt(0) === '|'){
        fianlPath = fianlPath.substr(1);
        }
        setCopyItem(true, address ,fianlPath+selectedRow.name, selectedRow.name);
    }

    const onClickMove = () => {
        if(fileViewInfo.address == "" || fileViewInfo.path == ""){
          resetCopyItem();
        }

        if(fileViewInfo.fileViewAddress !== copyItem.address){
          alert("Cannot move to another address");
          resetCopyItem();
        }

        // s: Ajax ----------------------------------
        var fianlPath = fileViewInfo.fileViewPath;
        if(fianlPath !== ""){
            fianlPath += "|";
        }
        fianlPath = fianlPath.replace(/\\/g, "|").replace(/\//g,"|");
        if(fianlPath.charAt(0) === '|'){
        fianlPath = fianlPath.substr(1);
        }

        const FileMoveCopyInfo = {
            fileName: copyItem.fileName,
            fromFilePath: copyItem.path,
            toDirectoryPath: fianlPath,
        }

        fetch(HTTP.SERVER_URL + `/api/file/move/${copyItem.address}`, {
            method: HTTP.PUT,
            headers: {
                'Content-type': MediaType.JSON,
                'Accept': MediaType.JSON,
                'Authorization': HTTP.BASIC_TOKEN_PREFIX + cookies.JWT_TOKEN,
                'Uid': cookies.UID
            },
            body: JSON.stringify(FileMoveCopyInfo)
        }).then(res => {
            if(!res.ok){
                throw res;
            }
            return res;
        }).then(res => {
            return res.json();
        }).then(json => {
            if(json === null || json === undefined){
                alert("Cannot move file");
                return;
            }
            
            if(json.error === true){
                alert("Cannot move file");
                return;
            }

            if(json.responseData){
                alert("Move success");
                getFileData(fileViewInfo.fileViewAddress, fileViewInfo.fileViewPath);
                resetCopyItem();
            }

        }).catch(error => {
            console.error(error.errorMsg);
            alert("Cannot move file");
        });
        // e: Ajax ----------------------------------
    };

    const resetCopyItem = () => {
        setCopyItem(false, "", "", "");
    }

    const onClickCopy = () => {
        if(fileViewInfo.address == "" || fileViewInfo.path == ""){
          resetCopyItem();
        }

        if(fileViewInfo.fileViewAddress !== copyItem.address){
          alert("Cannot move to another address");
          resetCopyItem();
        }

        // s: Ajax ----------------------------------
        var fianlPath = fileViewInfo.fileViewPath;
        if(fianlPath !== ""){
            fianlPath += "|";
        }
        fianlPath = fianlPath.replace(/\\/g, "|").replace(/\//g,"|");
        if(fianlPath.charAt(0) === '|'){
        fianlPath = fianlPath.substr(1);
        }

        const FileMoveCopyInfo = {
            fileName: copyItem.fileName,
            fromFilePath: copyItem.path,
            toDirectoryPath: fianlPath,
        }

        fetch(HTTP.SERVER_URL + `/api/file/copy/${copyItem.address}`, {
            method: HTTP.PUT,
            headers: {
                'Content-type': MediaType.JSON,
                'Accept': MediaType.JSON,
                'Authorization': HTTP.BASIC_TOKEN_PREFIX + cookies.JWT_TOKEN,
                'Uid': cookies.UID
            },
            body: JSON.stringify(FileMoveCopyInfo)
        }).then(res => {
            if(!res.ok){
                throw res;
            }
            return res;
        }).then(res => {
            return res.json();
        }).then(json => {

            if(json === null || json === undefined){
                alert("Cannot copy file");
                return;
            }
            
            if(json.error === true){
                alert("Cannot copy file");
                return;
            }

            if(json.responseData){
                alert("Copy success");
                getFileData(fileViewInfo.fileViewAddress, fileViewInfo.fileViewPath);
                resetCopyItem();
            }

        }).catch(error => {
            console.error(error.errorMsg);
            alert("Cannot copy file");
        });
        // e: Ajax ----------------------------------
    };

    const fileChangedHandler = (e) =>{
        const files = e.target.files;
        setUploadFile(files);
    };
  
    return (
      <Toolbar
        className={clsx(classes.root, {
          [classes.highlight]: numSelected > 0,
        })}
      >
        {numSelected > 0 ? (
          <Typography className={classes.title} color="inherit" variant="subtitle1" component="div">
            {/* {numSelected} selected */}
          </Typography>
        ) : (
            <>
                <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                    {fileViewInfo.fileViewAddress !== "" && fileViewInfo.fileViewPath !== "" && "["}
                    {fileViewInfo.fileViewAddress}
                    {fileViewInfo.fileViewAddress !== "" && fileViewInfo.fileViewPath !== "" && "] "}
                    {
                        fileViewInfo.fileViewPath.replace(/\\/g, "|").replace(/\//g,"|").replace(/\|/g,"/").substr(1)
                    }
                </Typography>

                {copyItem.state && (
                  <>
                    <Button
                      onClick={onClickMove}
                      variant="contained"
                      color="secondary"
                      className={classes.button}
                      style={{"marginRight": "15px"}}
                    >
                        Move
                    </Button>

                    <Button
                        onClick={onClickCopy}
                        variant="contained"
                        color="inherit"
                        className={classes.button}
                        style={{"marginRight": "15px", "color": "black"}}
                    >
                        Copy
                    </Button>
                  </>
                )}

                {fileViewInfo.fileViewAddress !== "" && fileViewInfo.fileViewPath !== "" && (
                    <>
                    <Tooltip title="upload">
                        <IconButton aria-label="upload">
                            <UploadIcon onClick={onClickFileUpLoad}/>
                        </IconButton>
                    </Tooltip>
                    <input type="file" onChange={fileChangedHandler}></input>
                    </>
                )}
            </>
        )}
  
        {numSelected > 0 && (
          <Tooltip title="Delete">
              <>
                <Button
                    onClick={onCLickChangeBtn}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    startIcon={<FileNameChangeIcon />}
                    style={{"marginRight": "15px"}}
                >
                    Change
                </Button>

                {selectedRow.type === 'file' && 
                    <Button
                    onClick={onCLickFileCopy}
                    variant="contained"
                    color="default"
                    className={classes.button}
                    startIcon={<FileCopyIcon />}
                    >
                        Copy
                    </Button>
                }
              </>
          </Tooltip>
        ) }
      </Toolbar>
    );
};
  
EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
};
  
const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    paper: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    table: {
        minWidth: 750,
    },
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
}));
  
const FileViewFrame = ({ fileViewInfo, copyItem, conn, renewFileViewInfo, renewCopyItem, switchModalState }) => {
    const classes = useStyles();
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('name');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [dense, setDense] = React.useState(false);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [selectedRow, setSelectedRow] = React.useState({});
    const [modalState, setModalState] = useState(false);

    const [cookies, setCookie, removeCookie] = useCookies(["JWT_TOKEN"]);

    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        const address = fileViewInfo.fileViewAddress;
        const path = fileViewInfo.fileViewPath;
        if(address == null || address == undefined || address == "" || path == null || path == undefined || path == "") {
            setFileList([]);
            setSelected([]);
            return;
        }else {
            getFileData(fileViewInfo.fileViewAddress, fileViewInfo.fileViewPath);
        }
        setSelected([]);

    }, [fileViewInfo]);

    const getFileData = (address, path) => {

        if(address == null || address == undefined || address == "" || path == null || path == undefined || path == "") return;

        // s: Ajax ----------------------------------
        var fianlPath = path;
        fianlPath = fianlPath.replace(/\\/g, "|").replace(/\//g,"|");
        if(fianlPath.charAt(0) === '|'){ fianlPath = fianlPath.substr(1); }

        fetch(HTTP.SERVER_URL + `/api/file/${address}/${fianlPath}`, {
            method: HTTP.GET,
            headers: {
                'Content-type': MediaType.JSON,
                'Accept': MediaType.JSON,
                'Authorization': HTTP.BASIC_TOKEN_PREFIX + cookies.JWT_TOKEN,
                'Uid': cookies.UID
            },
        }).then(res => { if(!res.ok){ throw res; } return res;
        }).then(res => { return res.json();
        }).then(json => {
            if(json === null || json === undefined) {
                setFileList([]);
                alert(errorMsg);
                return;
            }
            
            if(json.error === true){
                setFileList([]);
                alert(error.errorMsg);
                return;
            }

            if(!json.responseData.root){
                json.responseData.fileList.unshift(createData('...', '', '', '', 'previous'));
            }

            setFileList(json.responseData.fileList);

        }).catch(error => {
            console.error(error);
            setFileList([]);
        });
        // e: Ajax ----------------------------------
    }
  
    const handleRequestSort = (event, property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };
  
    const handleClick = (event, row) => {
        if(row.hiden === "previous") return;
        var name = row.name;
        setSelectedRow(row);
        const selectedIndex = selected.indexOf(name);
        let newSelected = [];
        if (selectedIndex === -1) {
            newSelected = [name];
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        }
        setSelected(newSelected);
    };

    const handleDoubleClick = (event, row) => {

        if(row.type === 'file'){
            //파일 다운로드
            //axios.get();
            const address = fileViewInfo.fileViewAddress;
            const path = fileViewInfo.fileViewPath;

            var fianlPath = path;
            fianlPath = fianlPath.replace(/\\/g, "|").replace(/\//g,"|");
            if(fianlPath.charAt(0) === '|'){ fianlPath = fianlPath.substr(1); }

            fetch(HTTP.SERVER_URL + `/api/file/download/${address}/${fianlPath}/${row.name}`, {
                method: HTTP.GET,
                headers: {
                    'Content-type': MediaType.JSON,
                    //'Accept': MediaType.JSON,
                    'Authorization': HTTP.BASIC_TOKEN_PREFIX + cookies.JWT_TOKEN,
                    'Uid': cookies.UID
                },
            }).then(response => {
                response.blob().then(blob => {
                    let url = window.URL.createObjectURL(blob);
                    let a = document.createElement('a');
                    a.href = url;
                    a.download = row.name;
                    a.click();
                });
            });
            return;
        }
        const address = fileViewInfo.fileViewAddress;
        let path = "";
        let upPath = "";
        if(row.hiden === "previous") {
            path = fileViewInfo.fileUpPath;
            upPath = path.replace(/\\/g, "|").replace(/\//g,"|").split("|");
            if(upPath.length > 2){
                upPath.pop();
                upPath = upPath.join('/');
            }else {
                upPath = "";
            }
        }else {
            path = fileViewInfo.fileViewPath + '|' + row.name;
            path = path;
            upPath = fileViewInfo.fileViewPath;
        }

        const fileViewInfo2 = {
            fileViewAddress: address,
            fileUpPath: upPath,
            fileViewPath: path,
        }

        renewFileViewInfo(fileViewInfo2);
        
    };

    const changeFileName = (beforeName, afterName) => {
        const newfileList = fileList.slice();
        for(let i = 0; i < newfileList.length; i++){
            if(newfileList[i].name === beforeName){
                newfileList[i].name = afterName;
            } 
        }
        setFileList(newfileList);
        setSelected([]);
    };

    const setCopyItem = (state, address, path, fileName) => {
        const copyData = {
            state: state,
            address: address,
            path: path,
            fileName: fileName
        }
        renewCopyItem(copyData);
    };

    const settingModalState = (x) => {

        setModalState(x);
    };
  
    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };
  
    const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };
  
    const handleChangeDense = (event) => {
      setDense(event.target.checked);
    };
  
    const isSelected = (name) => selected.indexOf(name) !== -1;
  
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);
  
    return (
      <div className={classes.root}>
        <Paper className={classes.paper}>
          <EnhancedTableToolbar numSelected={selected.length} fileViewInfo={fileViewInfo} selectedRow={selectedRow} changeFileName={changeFileName} setCopyItem={setCopyItem} copyItem={copyItem} settingModalState={settingModalState} getFileData={getFileData}/>
          <TableContainer>
            <Table
              stickyHeader
              className={classes.table}F
              aria-labelledby="tableTitle"
              //size={dense ? 'small' : 'medium'}
              size={'small'}
              aria-label="enhanced table"
            >
              <EnhancedTableHead 
                selectedName={selectedRow.name}
                classes={classes}
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                rowCount={rows.length}
              />
              <TableBody>
                {stableSort(fileList, getComparator(order, orderBy))
                  .map((row, index) => {
                    const isItemSelected = isSelected(row.name);
                    return (
                      <TableRow                        
                        hover
                        onClick={(event) => handleClick(event, row)}
                        onDoubleClick={(event) => handleDoubleClick(event, row)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={row.name}
                        selected={isItemSelected}
                      >
                        <TableCell >
                            {row.type === "directory" && <FontAwesomeIcon icon={faFolder}  style={{"marginRight": "15px"}} />}
                            {row.type === "file"      && <FontAwesomeIcon icon={faFileAlt}  style={{"marginRight": "15px"}} />}
                            {row.name}
                        </TableCell>
                        <TableCell align="right">{row.dateModified}</TableCell>
                        <TableCell align="right">{row.type}</TableCell>
                        <TableCell align="right">{row.size}</TableCell>
                      </TableRow>
                    );
                  })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <ProgressModal modalState={modalState}/>
      </div>
    );
}
  
const mapStateToProps = (state, ownProps) => {
    return { 
        fileViewInfo: state.fileViewInfo,
        copyItem: state.copyItem,
        conn: state.conn,
    };
}
  
const mapDispathToProps = (dispatch) => {
    return {
        renewCopyItem: (copyItem) => dispatch(actionCreators.renewCopyItem(copyItem)),
        renewFileViewInfo: (fileViewInfo) => dispatch(actionCreators.renewFileViewInfo(fileViewInfo)),
        
    };
}

export default connect(mapStateToProps, mapDispathToProps) (FileViewFrame);
