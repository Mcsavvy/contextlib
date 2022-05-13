export interface Success<T> {
    result: T;
    suppressed?: false;
}
export interface Failure {
    error: unknown;
    suppressed: true;
}
export declare type Result<T> = Success<T> | Failure;
