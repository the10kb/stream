import * as m from '../src/index';

describe("export test", ()=>{
    it("should export", ()=>{
        expect(m.NAME).toBe('stream');
    })
});