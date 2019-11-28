import {Stream} from "../src";

describe("stream", () => {

    it("should call self callback after notify", () => {
        return new Promise((resolve) => {

            const s = new Stream<string>((m) => {
                expect(m).toBe("test");
                resolve();
            });

            s.notify("test");
        });
    });

    it("should pipe message", () => {
        return new Promise((resolve) => {

            const s = new Stream<string>();

            s.pipe(new Stream<string>((m) => {
                expect(m).toBe("test");
                resolve();
            }));

            s.notify("test");
        });
    });

    it("should un-pipe", () => {
        return new Promise((resolve) => {

            const s = new Stream<string>();
            const s2 = new Stream<string>(() => {
                throw new Error();
            });

            const s3 = new Stream<string>((m) => {
                expect(m).toBe("test");
                resolve();
            });

            s.pipe(s2);
            s.pipe(s3);
            s.unpipe(s2);

            s.notify("test");
        });
    });

    it("should modify message after callback", () => {
        return new Promise((resolve) => {
            const s = new Stream<string>((m) => {
                return m + "modify";
            });

            s
                .pipe(new Stream<string>((m) => {
                    expect(m).toBe("testmodify");
                    resolve();
                }))
                .notify("test");
        });
    });

    it("should pipe when stream is async", () => {
        return new Promise((resolve) => {
            const s = new Stream<string>((m) => {
                expect(m).toBe("test");
                return new Promise<string>((resolve) => {
                    setTimeout(() => {
                        m = "async";
                        resolve(m);
                    }, 500);
                });
            });

            s
                .pipe(new Stream<string>((m) => {
                    expect(m).toBe("async");
                    resolve();
                }))
                .notify("test");
        });
    });

    it("should pipe when stream is async and not return anything in promise", () => {
        return new Promise((resolve) => {
            const s = new Stream<string>((m) => {
                expect(m).toBe("test");
                return new Promise<string>((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 500);
                });
            });

            s
                .pipe(new Stream<string>((m) => {
                    expect(m).toBe("test");
                    resolve();
                }))
                .notify("test");
        });
    });

});

describe("stream operator", () => {

    it("it should do subscribe", () => {
        return new Promise((resolve) => {
            const s = new Stream<string>();

            s.subscribe((m) => {
                expect(m).toBe("test");
                resolve();
            });

            s.notify("test");
        });
    });

    it("it should do when", () => {
        return new Promise((resolve) => {
            const s = new Stream<string>();

            s.when((m) => m == "test").subscribe((m) => {
                expect(m).toBe("test");
                resolve();
            });

            s.when((m) => m == "test2").subscribe((m) => {
                throw new Error();
            });

            s.notify("test");
        });
    });

    it("it should do mapTo", () => {
        return new Promise((resolve) => {
            const s = new Stream<string>();

            s.mapTo((m) => m + "-mapped").subscribe((m) => {
                expect(m).toBe("test-mapped");
                resolve();
            });

            s.notify("test");
        });
    });

    it("it should do unique", () => {
        return new Promise((resolve) => {
            const s = new Stream<string>();

            let ac = "";

            s.unique((m) => m).subscribe((m) => {
                ac += m;
            });

            s.notify("1");
            s.notify("1");
            s.notify("2");
            s.notify("3");
            s.notify("3");
            s.notify("4");
            s.notify("5");
            s.notify("5");

            expect(ac).toBe("12345");
            resolve();
        });
    });

    it("it should do debounce", () => {
        return new Promise((resolve) => {
            const s = new Stream<string>();

            const start = Date.now();

            s.debounce(500).subscribe((m) => {
                expect(m).toBe("test3");
                expect(Date.now() - start).toBeGreaterThan(1500);
                resolve();
            });

            s.notify("test0");

            setTimeout(() => {

                s.notify("test1");

                setTimeout(() => {
                    s.notify("test2");

                    setTimeout(() => {
                        s.notify("test3");

                    }, 400);
                }, 400);
            }, 400);
        });
    });

});