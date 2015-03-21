var assert = require("assert")
describe('Arrayt', function(){
    describe('#indexOf(a)', function(){
        it('should return -1 when the value is not present', function(){
            assert.equal(2, [1,2,3].indexOf(3));
            assert.equal(-1, [1,2,3].indexOf(0));
        })
    })
})