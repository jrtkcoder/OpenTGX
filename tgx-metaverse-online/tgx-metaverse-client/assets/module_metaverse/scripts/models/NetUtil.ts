import { WECHAT } from 'cc/env';
import { ApiReturn, HttpClientTransportOptions, HttpClient as HttpClient_Browser, TsrpcError, WsClient as WsClient_Browser } from 'tsrpc-browser';
import { HttpClient as HttpClient_Miniapp, WsClient as WsClient_Miniapp } from 'tsrpc-miniapp';
import { ServiceType, serviceProto as serviceProto_match } from '../shared/protocols/serviceProto_matchServer';
import { serviceProto as serviceProto_room, ServiceType as ServiceType_Room } from '../shared/protocols/serviceProto_roomServer';
import { FrontConfig } from './FrontConfig';

/** 网络请求相关 */
export class NetUtil {

    private static _globalErrorFilters = {};

    static addErrorFilter(error: string, cb: Function, target?: any) {
        this._globalErrorFilters[error] = { cb: cb, target: target };
    }

    /** Match Server */
    static matchClient = new (WECHAT ? HttpClient_Miniapp : HttpClient_Browser)(serviceProto_match, {
        server: FrontConfig.matchServer,
        // json: true,
        logger: console
    });

    public static async callApiFromLobby<T extends keyof ServiceType['api']>(apiName: T, req: ServiceType['api'][T]['req'], options?: HttpClientTransportOptions): Promise<ApiReturn<ServiceType['api'][T]['res']>> {
        let ret = await this.matchClient.callApi(apiName, req, options);
        if (!ret.isSucc) {
            let filter = this._globalErrorFilters[ret.err.message];
            if (filter && filter.cb) {
                filter.cb.call(filter.target);
            }
        }
        return ret;
    }
    public static async sendMsgToLobby<T extends keyof ServiceType['msg']>(msgName: T, msg: ServiceType['msg'][T], options?: HttpClientTransportOptions): Promise<{
        isSucc: true;
    } | {
        isSucc: false;
        err: TsrpcError;
    }> {
        return this.matchClient.sendMsg(msgName, msg, options);
    }

    /** Room Server */
    static createRoomClient(serverUrl: string): WsClient_Browser<ServiceType_Room> | WsClient_Miniapp<ServiceType_Room> {
        let client = new (WECHAT ? WsClient_Miniapp : WsClient_Browser)(serviceProto_room, {
            server: serverUrl,
            heartbeat: {
                interval: 5000,
                timeout: 5000
            },
            // json: true,
            logger: console,
            logMsg: false
        });

        // FLOWS
        // TODO

        return client;
    }

}

(window as any).NetUtil = NetUtil;