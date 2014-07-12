describe("AddedArrayFunctionality", function() {
  it("should properly flatten an array of arrays", function() {
    expect([[1, 2, 3], [4, 5], [6]].flatten()).toEqual([1,2,3,4,5,6]);
    expect(function() { [[1, 2, 3], [4, 5], "wtf"].flatten(); }).toThrow();
  });
});