import {Stream} from "../src";

let stream = new Stream()

stream.when((t)=>t=="Hello ").subscribe((text:string)=>{
    console.log(text + "world");
});

stream.notify("Hello ");
stream.notify("Hi ");