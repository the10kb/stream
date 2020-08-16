/*tslint:disable:max-classes-per-file*/

import {$debounceStream, $mapStream, $uniqueStream, $whenStream} from "./operators";

export interface IStream<M> {
    notify( m: M ): this;

    push(...s: Array<IStream<M>>): this;

    pipe<S extends IStream<M>>( s: S ): S;
    unpipe<S extends IStream<M>>(s: IStream<M>): S;

    stopPropagation(): this;

    // operators
    subscribe( callback: IStreamOnMessageCallback<M>): IStream<M>;
    when( predicate: IStreamPredicate<M, boolean> ): IStream<M>;
    map<T>( predicate: IStreamPredicate<M, T>): IStream<T>;
    unique<K extends string | number>( predicate: IStreamPredicate<M, K>): IStream<M>;
    debounce( timeout: number ): IStream<M>;
}

export type IStreamOnMessageCallback<M> = (m: M, self: Stream<M>)  => M|Promise<M>|Promise<void>|void|string;
export type IStreamPredicate<M, R> = (m: M, self: Stream<M>)  => R;

export class Stream<M> implements IStream<M> {
    protected readonly _observers: Array<IStream<M>>;
    protected _stopPropagation: boolean = false;

    constructor( private _onMessageCallback ?: IStreamOnMessageCallback<M> ) {
        this._onMessageCallback = this._onMessageCallback || ((m) => m);
        this._observers = [];
    }

    public notify(message: M): this {
        const callbackReturn = this._onMessageCallback(message, this);

        if (typeof callbackReturn === "undefined") {
            this.tryToPropagate(message);
        } else if (callbackReturn instanceof Promise) {
            (callbackReturn as Promise<any>)
                .then((promiseReturn: M | void) => {
                    if (typeof promiseReturn === "undefined") {
                        this.tryToPropagate(message);
                    } else {
                        this.tryToPropagate(promiseReturn);
                    }
                    return promiseReturn;
                });
            // do nothing
        } else {
            this.tryToPropagate(callbackReturn as any);
        }

        return this;
    }

    public propagate(message: M) {
        for (const observer of this._observers) {
            observer.notify( message );
        }
    }

    public push(...s: Array<IStream<M>>): this {
        s.forEach((s) => {
            this.pipe(s);
        });
        return this;
    }

    public pipe<S extends IStream<M>>(s: S): S {
        this._observers.push(s);
        return s;
    }

    public unpipe<S extends IStream<M>>(s: IStream<M>): S {
        const iof = this._observers.indexOf(s);
        if ( iof !== -1 ) {
            this._observers.splice(iof, 1);
        }
        return s as S;
    }

    public stopPropagation() {
        this._stopPropagation = true;

        return this;
    }

    //////////////////////////////////////////////////////
    // Operators /////////////////////////////////////////
    //////////////////////////////////////////////////////

    /**
     * Just an alias for pipe to new stream with callback
     * @param {IStreamPredicate<M>} mc
     * @returns {Stream<M>}
     */
    public subscribe( mc: IStreamOnMessageCallback<M> ): IStream<M> {
        return this.pipe( new Stream<M>(mc) );
    }

    public when(predicate: IStreamPredicate<M,  boolean> ): IStream<M> {
        return this.pipe( $whenStream<M>(predicate) );
    }

    public unique<K extends string | number>( predicate: IStreamPredicate<M, K> ): IStream<M> {
        return this.pipe( $uniqueStream<M, K>(predicate) );
    }

    public map<T>( predicate: IStreamPredicate<M, T> ): IStream<T> {
        return this.pipe($mapStream(predicate) as IStream<any>) as IStream<any>;
    }

    public debounce( timeout: number ): IStream<M> {
        return this.pipe( $debounceStream(timeout) );
    }

    protected tryToPropagate( m: M ): void {
        if ( this._stopPropagation ) {
            this._stopPropagation = false;
            return;
        }
        this.propagate(m);
    }
}
