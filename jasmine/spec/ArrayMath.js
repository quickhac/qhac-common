describe("NumericArrayAdditions", function() {
  it("should correctly determine non-numerics", function() {
    expect(actuallyIsNaN("12")).toBe(false);
    expect(actuallyIsNaN({})).toBe(true);
    expect(actuallyIsNaN(Infinity)).toBe(false);
    expect(actuallyIsNaN(null)).toBe(true);
    expect(actuallyIsNaN(undefined)).toBe(true);
    expect(actuallyIsNaN(NaN)).toBe(true);
    expect(actuallyIsNaN(12)).toBe(false);
    expect(actuallyIsNaN(new Number(-2))).toBe(false);
    expect(actuallyIsNaN(0.5)).toBe(false);
  });

  it("should sum array elements", function() {
    expect([1,2,3,-1].sum()).toBe(5);
    expect([].sum()).toBeNaN();
    expect(["1", 1, "2"].sum()).toBe(4);
  });

  it("should correctly average elements", function() {
    expect([1,2,3,-1].average()).toBe(1.25);
    expect([].average()).toBeNaN();
  });

  it("should correctly compute weighted averages", function() {
    expect([].weightedAverage([])).toBeNaN();
    expect([].weightedAverage([1,2])).toBeNaN();
    expect([100, 70].weightedAverage([10, 90])).toEqual(73);
    expect([100, 70].weightedAverage([0.1, 0.9])).toEqual(73);
  });

  it("should give correct results for upto", function() {
    expect(upto(3)).toEqual([0,1,2]);
    expect(upto(0)).toEqual([]);
  });

});