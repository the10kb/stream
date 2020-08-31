
export type StreamOnMessageCallbackReturnType<OUTPUT> = OUTPUT|Promise<OUTPUT>|Promise<void>|void;
export type StreamOnMessageCallback<INPUT, OUTPUT = INPUT> = (m: INPUT, self: IStream<INPUT, OUTPUT>)  => StreamOnMessageCallbackReturnType<OUTPUT>;

export interface IStream<INPUT, OUTPUT = INPUT | Error> {
    /**
     * Notify current stream
     * @param message
     */
    notify( message: INPUT | Error ): this;

    /**
     * Notify subscribed / piped streams, skipping current stream
     * @param message
     */
    propagate( message: OUTPUT ): this;

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
}
