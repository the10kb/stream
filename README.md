[![Build status](https://ci.appveyor.com/api/projects/status/6466cxm19rind0cx?svg=true)](https://ci.appveyor.com/project/pavel_shirobok/stream)

Install
-------
`npm install 10kb/stream`

Purposes
--------
Simple stream for simple purposes

Motivation
----------
TODO

Examples
--------
```
import {Stream} from "../src";

let stream = new Stream()

stream.when((t)=>t=="Hello ").subscribe((text:string)=>{
    console.log(text + "world");
});

stream.notify("Hello ");
stream.notify("Hi ");
//console: Hello world
```

```
import {Stream} from "../src";

let stream = new Stream();

let wow = (new Stream()).when((t)=>t=="wow").subscribe((t)=>console.log(`WOW!!`));
let yep = (new Stream()).when((t)=>t=="yep").subscribe((t)=>console.log(`Yep is yep`));

stream.pipe(wow).pipe(yep);

stream.notify("yep");
stream.notify("wow");

//console : Yep is yep
//console : WOW!!

```

Operators
---------
when(predicate)
unique(pridicate)
mapTo(predicate)