import classNames from 'classnames';
import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import { Dropdown, MenuItem } from 'react-bootstrap';
import {
    // Grbl
    GRBL,
    GRBL_ACTIVE_STATE_ALARM,
    // Smoothie
    SMOOTHIE,
    SMOOTHIE_ACTIVE_STATE_ALARM,
    // TinyG
    TINYG,
    TINYG_MACHINE_STATE_ALARM,
    // Workflow
    WORKFLOW_STATE_RUNNING,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_IDLE
} from '../../constants';
import {
    MODAL_WATCH_DIRECTORY
} from './constants';
import i18n from '../../lib/i18n';
import log from '../../lib/log';
import styles from './index.styl';

class Toolbar extends Component {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };
    fileInputEl = null;

    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    }
    onClickToUpload() {
        this.fileInputEl.value = null;
        this.fileInputEl.click();
    }
    onChangeFile(event) {
        const { actions } = this.props;
        const files = event.target.files;
        const file = files[0];
        const reader = new FileReader();

        reader.onloadend = (event) => {
            const { result, error } = event.target;

            if (error) {
                log.error(error);
                return;
            }

            log.debug('FileReader:', _.pick(file, [
                'lastModified',
                'lastModifiedDate',
                'meta',
                'name',
                'size',
                'type'
            ]));

            const meta = {
                name: file.name,
                size: file.size
            };
            actions.uploadFile(result, meta);
        };

        try {
            reader.readAsText(file);
        } catch (err) {
            // Ignore error
        }
    }
    canRun() {
        const { state } = this.props;
        const { port, gcode, workflowState } = state;
        const controllerType = state.controller.type;
        const controllerState = state.controller.state;

        if (!port) {
            return false;
        }
        if (!gcode.ready) {
            return false;
        }
        if (!_.includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], workflowState)) {
            return false;
        }
        if (controllerType === GRBL) {
            const activeState = _.get(controllerState, 'status.activeState');
            const states = [
                GRBL_ACTIVE_STATE_ALARM
            ];
            if (_.includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === SMOOTHIE) {
            const activeState = _.get(controllerState, 'status.activeState');
            const states = [
                SMOOTHIE_ACTIVE_STATE_ALARM
            ];
            if (_.includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === TINYG) {
            const machineState = _.get(controllerState, 'sr.machineState');
            const states = [
                TINYG_MACHINE_STATE_ALARM
            ];
            if (_.includes(states, machineState)) {
                return false;
            }
        }

        return true;
    }
    render() {
        const { state, actions } = this.props;
        const { port, gcode, workflowState } = state;
        const canClick = !!port;
        const isReady = canClick && gcode.ready;
        const canRun = this.canRun();
        const canPause = isReady && _.includes([WORKFLOW_STATE_RUNNING], workflowState);
        const canStop = isReady && _.includes([WORKFLOW_STATE_PAUSED], workflowState);
        const canClose = isReady && _.includes([WORKFLOW_STATE_IDLE], workflowState);
        const canUpload = isReady ? canClose : (canClick && !gcode.loading);

        return (
            <div className={classNames('btn-toolbar', styles.toolbar)}>
                <div className="btn-group btn-group-sm">
                    <button
                        type="button"
                        className="btn btn-primary"
                        title={i18n._('Upload G-code')}
                        onClick={::this.onClickToUpload}
                        disabled={!canUpload}
                    >
                        {i18n._('Upload G-code')}
                    </button>
                    <input
                        // The ref attribute adds a reference to the component to
                        // this.refs when the component is mounted.
                        ref={(node) => {
                            this.fileInputEl = node;
                        }}
                        type="file"
                        style={{ display: 'none' }}
                        multiple={false}
                        onChange={::this.onChangeFile}
                    />
                    <Dropdown
                        id="upload-dropdown"
                        disabled={!canUpload}
                    >
                        <Dropdown.Toggle
                            bsStyle="primary"
                            noCaret
                        >
                            <i className="fa fa-caret-down" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <MenuItem header>
                                {i18n._('Watch Directory')}
                            </MenuItem>
                            <MenuItem
                                onSelect={() => {
                                    actions.openModal(MODAL_WATCH_DIRECTORY);
                                }}
                            >
                                <i className="fa fa-search" />
                                <span className="space" />
                                {i18n._('Browse...')}
                            </MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <div className="btn-group btn-group-sm">
                    <button
                        type="button"
                        className="btn btn-default"
                        title={i18n._('Run')}
                        onClick={actions.handleRun}
                        disabled={!canRun}
                    >
                        <i className="fa fa-play" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-default"
                        title={i18n._('Pause')}
                        onClick={actions.handlePause}
                        disabled={!canPause}
                    >
                        <i className="fa fa-pause" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-default"
                        title={i18n._('Stop')}
                        onClick={actions.handleStop}
                        disabled={!canStop}
                    >
                        <i className="fa fa-stop" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-default"
                        title={i18n._('Close')}
                        onClick={actions.handleClose}
                        disabled={!canClose}
                    >
                        <i className="fa fa-close" />
                    </button>
                </div>
            </div>
        );
    }
}

export default Toolbar;
