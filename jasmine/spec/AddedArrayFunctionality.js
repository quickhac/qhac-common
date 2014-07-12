describe("AddedArrayFunctionality", function() {
  it("should properly flatten an array of arrays", function() {
    expect([[1, 2, 3], [4, 5], [6]].flatten().length).toBe(6);
    expect([[1, 2, 3], [4, 5], "wtf"].flatten().length).toBe(5);
  });
});