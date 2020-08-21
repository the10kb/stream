/*tslint:disable:max-classes-per-file*/

// import {$debounceStream, $mapStream, $uniqueStream, $whenStream} from "./operators";
import {IStream, StreamOnMessageCallback, StreamOnMessageCallbackReturnType} from "./types";

export class Stream<I, O = I> implements IStream<I, O> {
    protected readonly _observers: IStream<O, any>[];

    // protected _stopPropagation: boolean = false;

    constructor( private _onMessageCallback ?: StreamOnMessageCallback<I, O> ) {
        this._onMessageCallback = this._onMessageCallback || ( ( (m : I) => m ) as unknown as StreamOnMessageCallback<I, O>);
        this._observers = [];
    }

    notify( message: I ): this {
        const callbackReturn = this._onMessageCallback(message, this);

        this.processStreamCallbackResult( callbackReturn, true );

        return this;
    }

    protected processStreamCallbackResult( callbackReturn : StreamOnMessageCallbackReturnType<O>, isAsync : boolean ) {
        if (typeof callbackReturn === "undefined") {
            // void / undefined is a signal of stop propagation
        } else if (callbackReturn instanceof Promise) {
            (callbackReturn as Promise<any>)
                .then((promiseReturn: O | void) => {
                    return this.processStreamCallbackResult( promiseReturn, false );
                });
            // do nothing
        } else {
            if( isAsync ) {
                setImmediate(()=>{
                    this.propagate(callbackReturn);
                });
            } else {
                this.propagate( callbackReturn );
            }
        }
    }

    propagate( message: O ): this {
        for (const observer of this._observers) {
            observer.notify( message );
        }
        return this;
    }

    pipe<S extends IStream<O, any>>(stream: S): S {
        this.push( stream );
        return stream;
    }

    push<S extends IStream<O, any>>(stream: S): this {
        let iof = this._observers.indexOf( stream ) ;
        if( iof == -1 ) {
            this._observers.push( stream );
        }
        return this;
    }

    unpipe<S extends IStream<O, any>>(stream: S): S {
        let iof = this._observers.indexOf( stream );
        if( iof != -1 ){
            this._observers.splice(iof, 1);
        }
        return stream;
    }



    /*public notify(message: M): this {
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

    /!**
     * Just an alias for pipe to new stream with callback
     * @param {IStreamPredicate<M>} mc
     * @returns {Stream<M>}
     *!/
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
    }*/
}
