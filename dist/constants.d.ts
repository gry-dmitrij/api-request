export declare const NoBodyRequestMethod: {
    readonly get: "get";
    readonly head: "head";
};
export declare const BodyRequestMethod: {
    readonly post: "post";
    readonly put: "put";
    readonly delete: "delete";
};
export declare const RequestMethod: {
    readonly get: "get";
    readonly head: "head";
    readonly post: "post";
    readonly put: "put";
    readonly delete: "delete";
};
type TLowRequestMethod = typeof RequestMethod[keyof typeof RequestMethod];
export type TRequestMethod = TLowRequestMethod | Uppercase<TLowRequestMethod>;
export type TNoBodyRequestMethod = typeof NoBodyRequestMethod[keyof typeof NoBodyRequestMethod];
export type TBodyRequestMethod = typeof BodyRequestMethod[keyof typeof BodyRequestMethod];
export declare const NoBodyMethods: Set<TRequestMethod>;
export declare const RequestMethods: Set<TRequestMethod>;
export {};
