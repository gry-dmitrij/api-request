import { TNoBodyRequestMethod, TRequestMethod } from './constants';
export declare const isNoBodyRequestMethod: (method: TRequestMethod) => method is TNoBodyRequestMethod;
export declare const isRequestMethod: (method: string) => method is TRequestMethod;
