//@ts-check
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import { StyleSheet, css } from 'aphrodite';
import { BookieWebView } from '../../components';
import { KOEventForGrab, WebviewIPCMsg, KOGrabSelection, KOGrabSweet, WebviewContext } from '../../models';
import { Settings, iohttp } from '../../services';
import CircleIndicator from '../../components/common/CircleIndicator';

export interface Props {
    events: KOEventForGrab[];
    hidden: boolean;
    onDataGrab: (msg: { grab: KOGrabSweet, error?: string }) => void;
}

interface States {
    selectedTab: number;
    devToolOpen: boolean;
}

class GrabberContainer extends PureComponent<Props, States> {
    state: States = {
        selectedTab: 0,
        devToolOpen: false

    };
    onWebViewIPC = async (sender: object, msg: WebviewIPCMsg) => {

        const { onDataGrab } = this.props;
        const { data, context } = msg;
        const event: KOEventForGrab = context['event'];
        const { selections, msg_type, error } = data;

        if (msg_type === 'odds-extraction') {
            const grabSelections: { removes?: KOGrabSelection[], updates?: KOGrabSelection[] } = selections;

            const koGrabSweet: KOGrabSweet = {
                evt: {
                    ena: event.eventName,
                    etm: event.startTime,
                    eid: event.uuid, bm: event.bookmaker,
                    spt: event.sport, lve: event.isLive
                }
            };
            if (grabSelections) {
                if (grabSelections.removes) {
                    koGrabSweet['removes'] = grabSelections.removes.map(i => ({
                        mtp: i.marketType, mid: i.marketId,
                        sid: i.selectionId, sna: i.selectionName,
                        hd: i.handicap, ods: i.odds, url: i.url
                    }));
                }
                if (grabSelections.updates) {
                    koGrabSweet['updates'] = grabSelections.updates.map(i => ({
                        mtp: i.marketType, mid: i.marketId,
                        sid: i.selectionId, sna: i.selectionName,
                        hd: i.handicap, ods: i.odds, url: i.url
                    }));
                }
            }

            onDataGrab && onDataGrab({ grab: koGrabSweet, error });
        }
    }
    onBookieUnmount = (context: WebviewContext) => {
        try {
            const { onDataGrab } = this.props;
            const event: KOEventForGrab = context['event'];
            const koGrabSweet: KOGrabSweet = {
                evt: {
                    ena: event.eventName,
                    etm: event.startTime,
                    eid: event.uuid, bm: event.bookmaker,
                    spt: event.sport, lve: event.isLive
                }
            };
            onDataGrab && onDataGrab({ grab: koGrabSweet, error: 'Unmount' });
        } catch (error) {
            console.error(error);
        }

    }

    toggleDevTools = () => {
        const { events } = this.props;
        if (events.length === 0) return;

        this.setState({ devToolOpen: !this.state.devToolOpen });
    }

    onTabChanged = (event: React.ChangeEvent<{}>, value: number) => {
        this.setState({ selectedTab: value });
    }

    onGrabBrowserError = (context: WebviewContext, reason: string) => {
        const { onDataGrab } = this.props;
        if (reason === 'ProxyLoginTooMuchAttempts') {
            const { bookmaker, event } = context as unknown as { bookmaker: string, event: KOEventForGrab };
            const koGrabSweet: KOGrabSweet = {
                evt: {
                    ena: event.eventName,
                    etm: event.startTime,
                    eid: event.uuid, bm: event.bookmaker,
                    spt: event.sport, lve: event.isLive
                }
            };
            onDataGrab && onDataGrab({
                grab: koGrabSweet,
                error: `${bookmaker} proxy login attempts failure, please check your proxy account`
            });

            iohttp.post('/log/bet', true, { log: `${bookmaker} proxy login attempts failure, please check your proxy account` });

        }
    }


    render() {
        const { events, hidden } = this.props;

        const koEvents = events;
        const { selectedTab, devToolOpen } = this.state;

        return (
            <div className={css(styles.container)}>
                <Button size="small" color="primary" onClick={this.toggleDevTools}>
                    Toggle Debug Console
                    </Button>
                <Tabs classes={{ root: css(styles.tabsRoot) }}
                    value={selectedTab}
                    onChange={this.onTabChanged}>
                    {koEvents.map(evt => {
                        const proxyCountry = Settings.getProxyCountry(evt.bookmaker);
                        return (<Tab
                            key={evt.uuid}
                            classes={{
                                root: css(styles.tabRoot),
                                label: css(styles.tabLabel)
                            }}
                            label={
                                <div style={{ flexDirection: 'row', alignItems: 'center', display: 'flex' }}>
                                    <div>{!!proxyCountry ? `${evt.uuid} (${proxyCountry})` : `${evt.uuid}`}</div>
                                    {!!proxyCountry && <CircleIndicator color="green" size={10} />}
                                </div>
                            } />);
                    })
                    }
                </Tabs>
                <div style={{ position: 'relative', flex: 1 }}>
                    {
                        <React.Fragment>
                            {koEvents.map((evt, index) => {
                                const proxyCountry = Settings.getProxyCountry(evt.bookmaker);

                                return (
                                    <div
                                        key={evt.uuid}
                                        // web view issue conflic with aphrodite (no render at first load)
                                        //refer to https://github.com/electron/electron/issues/8505
                                        style={{
                                            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                                            zIndex: selectedTab === index ? (koEvents.length + 1) : index + 1
                                        }}>
                                        <BookieWebView
                                            session={'grabber_' + evt.uuid}
                                            hidden={hidden}
                                            proxyCountry={proxyCountry}
                                            context={{
                                                usage: 'grabber',
                                                event: evt,
                                                bookmaker: evt.bookmaker,
                                            }}
                                            willUnmount={this.onBookieUnmount}
                                            src={evt.url}
                                            script={evt.script}
                                            onIpcMsg={this.onWebViewIPC}
                                            onError={this.onGrabBrowserError}
                                            devToolOpen={selectedTab === index && devToolOpen} />

                                    </div>);
                            })
                            }
                        </React.Fragment>
                    }
                </div>
            </div>
        );
    }
}

export default connect()(GrabberContainer);


const styles = StyleSheet.create({
    container:
    {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#fff'
    },
    tabPos:
    {

    },
    tabsRoot:
    {
        minHeight: 30
    },
    tabRoot:
    {
        minHeight: 30,
        fontSize: '0.65rem'
    },
    tabLabel: {
        fontSize: '0.75rem'
    },
    hidden:
    {
        position: 'absolute',
        zIndex: 0
    }

});