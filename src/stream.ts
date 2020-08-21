import {IStream, StreamOnMessageCallback, StreamOnMessageCallbackReturnType} from "./types";

export class Stream<I, O = I> implements IStream<I, O> {
    protected readonly _observers: IStream<O, any>[];

    constructor(
        private readonly _onMessageCallback ?: StreamOnMessageCallback<I, O>,
        private readonly _onErrorCallback ?: StreamOnMessageCallback<Error, O | Error>
    ) {
        this._onMessageCallback = this._onMessageCallback || ( ( (m : I) => m ) as unknown as StreamOnMessageCallback<I, O>);
        this._onErrorCallback = this._onErrorCallback || ( (e:Error)=>e );
        this._observers = [];
    }

    notify( message: I | Error ): this {
        if( message instanceof Error ) {
            let errorProcessing = this._onErrorCallback( message, this );
            if( errorProcessing instanceof Error ) {
                setImmediate(()=>{
                    this.propagate( errorProcessing as any );
                });
                return this;
            } else {
                message = errorProcessing as any as I;
            }
        }

        let callbackReturn : StreamOnMessageCallbackReturnType<O>;
        try {
            callbackReturn = this._onMessageCallback(message, this);
        } catch (e) {
            let errorProcessing = this._onErrorCallback( e, this );
            if( errorProcessing instanceof Error ) {
                setImmediate(()=>{
                    this.propagate( e as any );
                });
                return this;
            } else {
                callbackReturn = errorProcessing as any as O;
            }
        }

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
                })
                .catch((error)=>{
                    let errorProcessing = this._onErrorCallback( error, this );
                    this.propagate( errorProcessing as any as O );
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

    propagate( message: O | Error ): this {
        for (const observer of this._observers) {
            observer.notify( message );
        }
        return this;
    }

    pipe<S extends IStream<O | Error, any>>(stream: S): S {
        this.push( stream );
        return stream;
    }

    push<S extends IStream<O | Error, any>>(stream: S): this {
        let iof = this._observers.indexOf( stream ) ;
        if( iof == -1 ) {
            this._observers.push( stream );
        }
        return this;
    }

    unpipe<S extends IStream<O | Error, any>>(stream: S): S {
        let iof = this._observers.indexOf( stream );
        if( iof != -1 ){
            this._observers.splice(iof, 1);
        }

        return stream;
    }
}
