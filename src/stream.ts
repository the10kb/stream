export interface INotifiableStream<M>{
    notify( m : M ) : this;
}

export interface IPipeableStream<M>{
    pipe( s : INotifiableStream<M> ) : this;
    unpipe(s : INotifiableStream<M>) : this;
}

export interface IStreamOnMessageCallback<M>{
    (m : M) : M|Promise<M>|Promise<void>|void;
}

export class Stream<M> implements INotifiableStream<M>, IPipeableStream<M>{
    static PREVENT_PROPAGATION : string = "litestream-stop-all-notifying";
    private _observers : INotifiableStream<M>[];
    
    constructor( private _onMessageCallback ?: IStreamOnMessageCallback<M> ) {
        this._onMessageCallback = this._onMessageCallback || ((m)=>m);
        this._observers = [];
    }
    
    notify(message: M): this {
        let callbackReturn = this._onMessageCallback(message);

        if (typeof callbackReturn == "undefined") {
            this.notifyAll(message);
        } else if (callbackReturn instanceof Promise) {
            (<Promise<any>>callbackReturn)
                .then((promiseReturn: M | void) => {
                    if (typeof promiseReturn == "undefined") {
                        this.notifyAll(message);
                    } else {
                        this.notifyAll(promiseReturn);
                    }
                    return promiseReturn;
                })
                .catch((value) => {
                    if (typeof value == "string" && value == Stream.PREVENT_PROPAGATION) {
                        //just stop it
                    } else {
                        Promise.reject(value);
                    }
                });
        } else if( typeof callbackReturn == "string" && callbackReturn == Stream.PREVENT_PROPAGATION){
            //do nothing
        }else {
            this.notifyAll(callbackReturn);    
        }
        
        return this;
    }

    pipe(s: INotifiableStream<M>): this {
        this._observers.push(s);
        return this;
    }
    
    unpipe(s: INotifiableStream<M>): this {
        let iof = this._observers.indexOf(s);
        if( iof !== -1 ){
            this._observers.splice(iof, 1);
        }
        return this;
    }
    
    private notifyAll(message:M){
        for(let observer of this._observers){
            observer.notify( message );
        }
    }
    
    //////////////////////////////////////////////////////
    // Operators /////////////////////////////////////////
    //////////////////////////////////////////////////////

    /**
     * Just an alias for pipe to new stream with callback
     * @param {IStreamOnMessageCallback<M>} mc
     * @returns {Stream<M>}
     */
    subscribe( mc : IStreamOnMessageCallback<M> ) : Stream<M>{
        let newStream = new Stream<M>(mc);
        this.pipe( newStream );
        return newStream;
    }

    when(filter:(m:M)=>boolean) : WhenStream<M>{
        let stream = new WhenStream<M>(filter);
        this.pipe( stream );
        return stream;
    }

    unique<T>(predicate : (m:M)=>T) : UniqueStream<M, T>{
        let stream = new UniqueStream<M, T>(predicate);
        this.pipe( stream );
        return stream;
    }

    mapTo<T>(predicate : (m:M)=>T ) : MapToStream<M, T>{
        let stream = new MapToStream<M, T>(predicate);
        this.pipe( <any>stream );
        return stream;
    }
    
    debounce(timeout : number = 100) : Debounce<M>{
        let stream = new Debounce<M>(timeout);
        this.pipe(stream);
        return stream;
    }
}


export class WhenStream<M> extends Stream<M>{
    constructor(private _when : (message:M)=>boolean){
        super( (message:M)=>(this._when(message) ? message : <any>Stream.PREVENT_PROPAGATION) );
    }
}

export class UniqueStream<M, T> extends Stream<M>{
    private _keys : T[] = [];
    constructor(private _predicate : (m:M)=>T){
        super((m:M)=>{
            let key = this._predicate(m);
            if( this._keys.indexOf(key) == -1 ){
                this._keys.push(key);
                return m;
            }
            return <any>Stream.PREVENT_PROPAGATION;
        });
    }
}

export class MapToStream<FROM, TO> extends Stream<TO>{
    constructor(private _mapTo : (m:FROM)=>TO){
        super((m)=>this._mapTo(<any>m));
    }
}

export class Debounce<M> extends Stream<M>{
    private _timeoutHandler : number = -1;
    
    constructor(timeout : number){
        super((m : M)=>{
            return new Promise<M>((resolve)=>{
                if( this._timeoutHandler != -1 ){
                    clearTimeout(this._timeoutHandler);
                }
                this._timeoutHandler = <any>setTimeout((me)=>resolve(me), timeout, m);
            });
        });
    }
}