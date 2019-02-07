/*tslint:disable:no-console*/
import {Stream} from "../src";

const stream = new Stream();

stream.when((t) => t == "Hello ").subscribe((text: string) => {
    console.log(text + "world");
});

stream.notify("Hello ");
stream.notify("Hi ");
