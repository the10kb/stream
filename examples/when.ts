import {Stream} from "../src";

let stream = new Stream();

let wow = (new Stream()).when((t)=>t=="wow").subscribe((t)=>console.log(`WOW!!`));
let yep = (new Stream()).when((t)=>t=="yep").subscribe((t)=>console.log(`Yep is yep`));

stream.pipe(wow).pipe(yep);

stream.notify("yep");
stream.notify("wow");

//console : Yep is yep
//console : WOW!!