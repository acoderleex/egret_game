/**
 * 网络请求
 * 
 * Created by Tony on 17-6-13.
 */
module fighter {
    export class HttpClient {

        private loader: egret.URLLoader = new egret.URLLoader();
        private variables: egret.URLVariables;

        /**创建网络请求类*/
        static create(): HttpClient {
            return new HttpClient();
        }

        private configUrl(reletiveUrl: string): any {
            return "http://httpbin.org/get" + reletiveUrl;
        }

        /**添加参数 */
        public add(params): HttpClient {
            if (!this.variables) {
                this.variables = new egret.URLVariables();
            }
            this.variables.decode(params);
            return this;
        }
        /**设置接收数据类型 */
        public dataFormat(dataFormat: string): HttpClient {
            this.loader.dataFormat = dataFormat;
            return this;
        }

        /**get请求方式*/
        public get(url: string) {
            var req = new egret.URLRequest(this.configUrl(url));
            this.variables && (req.data = this.variables);
            this.loader.load(req);
        }
        /**post请求方式*/
        public post(url: string) {
            var req = new egret.URLRequest(this.configUrl(url));
            req.method = egret.URLRequestMethod.POST;
            this.variables && (req.data = this.variables);
            this.loader.load(req);
        }
        /**网络请求成功回调 */
        public onSuccess(handle: Function, thisObj: any = null): HttpClient {
            this.loader.addEventListener(egret.Event.COMPLETE, function (e: egret.Event): void {
                var loader = <egret.URLLoader>e.currentTarget;
                handle.call(thisObj, loader.data);
            }, thisObj);
            return this;
        }
        /**网络请求失败回调 */
        public onError(handle: Function, thisObj: any = null): HttpClient {
            this.loader.addEventListener(egret.IOErrorEvent.IO_ERROR, handle, thisObj);
            return this;
        }

    }
}