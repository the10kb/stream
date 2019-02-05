import {Stream} from "./stream";

export class IO<I, O>{
    protected _input : Stream<I>;
    protected _output : Stream<O>;

    constructor(){
        this._input = new Stream<I>();
        this._output = new Stream<O>();
    }

    get input(): Stream<I> {
        return this._input;
    }

    get output(): Stream<O> {
        return this._output;
    }
}