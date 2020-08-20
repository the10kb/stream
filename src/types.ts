// import {Stream} from "./stream";

export type StreamOnMessageCallbackReturnType<OUTPUT> = OUTPUT|Promise<OUTPUT>|Promise<void>|void
export type StreamOnMessageCallback<INPUT, OUTPUT = INPUT> = (m: INPUT, self: IStream<INPUT, OUTPUT>)  => StreamOnMessageCallbackReturnType<OUTPUT>;

// export type StreamMessagePredicate<I, O> = (m : I, self:IStream<I, any>) => O;

export interface IStream<INPUT, OUTPUT = INPUT>{
    /**
     * Notify current stream
     * @param message
     */
    notify( message: INPUT ): this;

    /**
     * Notify subscribed / piped streams, skipping current stream
     * @param message
     */
    propagate( message : OUTPUT ): this;

    /**
     * Pipe output from current stream to provided stream.
     * @alias for {IStream.pipe}, but with other return value
     * @param stream - stream for piping
     * @return current stream
     */
    push<S extends IStream<OUTPUT, any>>(stream: S): this;

    /**
     * Pipe output from current stream to provided
     * @return piped stream
     * @param stream
     */
    pipe<S extends IStream<OUTPUT, any>>( stream: S ): S;

    /**
     * Unpipe earlier piped stream
     * @return unpiped stream
     * @param stream
     */
    unpipe<S extends IStream<OUTPUT, any>>(stream: S): S;

    // stopPropagation(): this;

    // operators
    // subscribe( callback: IStreamOnMessageCallback<INPUT>): IStream<INPUT>;
    // when( predicate: IStreamPredicate<M, boolean> ): IStream<M>;
    // map<T>( predicate: IStreamPredicate<M, T>): IStream<T>;
    // unique<K extends string | number>( predicate: IStreamPredicate<M, K>): IStream<M>;
    // debounce( timeout: number ): IStream<M>;
}

