import {StreamOnMessageCallback, Stream} from "../src";

export class CustomStream extends Stream<string> {
    public append( what: string ): CustomStream {
        return this.pipe( new CustomStream((m) => m + " " + what) );
    }
}

const s1 = new CustomStream();

s1.append("World").subscribe((m) => {
    // console.log(m);
});

s1
    .notify("Hello");
// Hello World
