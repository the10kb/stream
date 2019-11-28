/*tslint:disable:max-classes-per-file*/

export interface INotifiableStream<M> {
    notify( m: M ): this;
}

export interface IPipeableStream<M> {
    pipe( s: INotifiableStream<M> ): this;
    unpipe(s: INotifiableStream<M>): this;
}

export type IStreamOnMessageCallback<M> = (m: M, self: Stream<M>)  => M|Promise<M>|Promise<void>|void|string;

export class Stream<M> implements INotifiableStream<M>, IPipeableStream<M> {
    private readonly _observers: Array<INotifiableStream<M>>;
    private _stopPropagation: boolean = false;

    constructor( private _onMessageCallback ?: IStreamOnMessageCallback<M> ) {
        this._onMessageCallback = this._onMessageCallback || ((m) => m);
        this._observers = [];
    }

    public notify(message: M): this {
        const callbackReturn = this._onMessageCallback(message, this);

        if (typeof callbackReturn === "undefined") {
            this.notifyAll(message);
        } else if (callbackReturn instanceof Promise) {
            (callbackReturn as Promise<any>)
                .then((promiseReturn: M | void) => {
                    if (typeof promiseReturn === "undefined") {
                        this.notifyAll(message);
                    } else {
                        this.notifyAll(promiseReturn);
                    }
                    return promiseReturn;
                });
            // do nothing
        } else {
            this.notifyAll(callbackReturn as any);
        }

        return this;
    }

    public next(s: INotifiableStream<M>): INotifiableStream<M> {
        this.pipe(s);
        return s;
    }

    public pipe(s: INotifiableStream<M>): this {
        this._observers.push(s);
        return this;
    }

    public unpipe(s: INotifiableStream<M>): this {
        const iof = this._observers.indexOf(s);
        if ( iof !== -1 ) {
            this._observers.splice(iof, 1);
        }
        return this;
    }

    public stopPropagation() {
        this._stopPropagation = true;
    }

    //////////////////////////////////////////////////////
    // Operators /////////////////////////////////////////
    //////////////////////////////////////////////////////

    /**
     * Just an alias for pipe to new stream with callback
     * @param {IStreamOnMessageCallback<M>} mc
     * @returns {Stream<M>}
     */
    public subscribe( mc: IStreamOnMessageCallback<M> ): Stream<M> {
        const newStream = new Stream<M>(mc);
        this.pipe( newStream );
        return newStream;
    }

    public when(filter: (m: M) => boolean): WhenStream<M> {
        const stream = new WhenStream<M>(filter);
        this.pipe( stream );
        return stream;
    }

    public unique<T>(predicate: (m: M) => T): UniqueStream<M, T> {
        const stream = new UniqueStream<M, T>(predicate);
        this.pipe( stream );
        return stream;
    }

    public mapTo<T>(predicate: (m: M) => T ): MapToStream<M, T> {
        const stream = new MapToStream<M, T>(predicate);
        this.pipe( stream as any );
        return stream;
    }

    public debounce(timeout: number = 100): Debounce<M> {
        const stream = new Debounce<M>(timeout);
        this.pipe(stream);
        return stream;
    }

    private notifyAll(message: M) {
        if ( this._stopPropagation ) {
            this._stopPropagation = false;
            return;
        }
        for (const observer of this._observers) {
            observer.notify( message );
        }
    }
}

export class WhenStream<M> extends Stream<M> {
    constructor(private _when: (message: M, self: WhenStream<M>) => boolean) {
        super( (message: M, self) => (this._when(message, self as WhenStream<M>) ? message : self.stopPropagation()) );
    }
}

export class UniqueStream<M, T> extends Stream<M> {
    private _keys: T[] = [];
    constructor(private _predicate: (m: M, self: UniqueStream<M, T>) => T) {
        super((m: M, self: UniqueStream<M, T>) => {
            const key = this._predicate(m, self);
            if ( this._keys.indexOf(key) === -1 ) {
                this._keys.push(key);
                return m;
            }
            self.stopPropagation();
        });
    }
}

export class MapToStream<FROM, TO> extends Stream<TO> {
    constructor(private _mapTo: (m: FROM, self: MapToStream<FROM, TO>) => TO) {
        super((m, self) => this._mapTo(m as any, self as any));
    }
}

export class Debounce<M> extends Stream<M> {
    private _timeoutHandler: number = -1;

    constructor(timeout: number) {
        super((m: M, self: Debounce<M>) => {
            return new Promise<M>((resolve) => {
                if ( this._timeoutHandler !== -1 ) {
                    clearTimeout(this._timeoutHandler);
                }
                this._timeoutHandler = setTimeout((me) => resolve(me), timeout, m) as any;
            });
        });
    }
}
