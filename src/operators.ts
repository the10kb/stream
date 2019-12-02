import {IStream, IStreamPredicate, Stream} from "./stream";

export function $whenStream<M>(predicate: IStreamPredicate<M, boolean>): IStream<M> {
    return new Stream(((m: M, self) => {
        if ( predicate(m, self) ) {
            return m;
        } else {
            self.stopPropagation();
        }
    }));
}

export function $uniqueStream<M, K extends string | number>(predicate: IStreamPredicate<M, K>): IStream<M> {
    const keys: K[] = [];
    return new Stream(((m: M, self) => {
        const key = predicate(m, self);
        if ( keys.indexOf(key) === -1 ) {
            keys.push(key);
            return m;
        }
        self.stopPropagation();
    }));
}

export function $mapStream<M, N>( predicate: IStreamPredicate<M, N> ) {
    return new Stream<N>( (m, self ) => {
        return predicate( m as any, self as any ) as N;
    });
}

export function $debounceStream<M>(timeout: number) {
    let timeoutHandler: number = -1;
    return new Stream<M>((m, self) => {
        return new Promise<M>((resolve) => {
            if ( timeoutHandler !== -1 ) {
                clearTimeout(timeoutHandler);
            }
            timeoutHandler = setTimeout((me) => resolve(me), timeout, m) as any;
        });
    });
}
