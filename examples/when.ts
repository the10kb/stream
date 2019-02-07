/*tslint:disable:no-console*/
import {Stream} from "../src";

const stream = new Stream();

const wow = (new Stream()).when((t) => t == "wow").subscribe((t) => console.log(`WOW!!`));
const yep = (new Stream()).when((t) => t == "yep").subscribe((t) => console.log(`Yep is yep`));

stream.pipe(wow).pipe(yep);

stream.notify("yep");
stream.notify("wow");

// console : Yep is yep
// console : WOW!!
