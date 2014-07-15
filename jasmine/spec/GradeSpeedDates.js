describe("GradeSpeedDates", function() {
  var clock;

  it("should correctly parse small endian dates", function() {
    expect(DateTools.parseSmallEndianDate("1 January 1970")).toEqual(Date.UTC(1970, 1, 1));
    expect(DateTools.parseSmallEndianDate("5 February 1999")).toEqual(Date.UTC(1999, 2, 5));
    expect(DateTools.parseSmallEndianDate("29 February 2004")).toEqual(Date.UTC(2004, 2, 29));
    expect(DateTools.parseSmallEndianDate("28 March 2004")).toEqual(Date.UTC(2004, 3, 28));
    expect(DateTools.parseSmallEndianDate("28 April 2004")).toEqual(Date.UTC(2004, 4, 28));
    expect(DateTools.parseSmallEndianDate("28 May 2004")).toEqual(Date.UTC(2004, 5, 28));
    expect(DateTools.parseSmallEndianDate("28 June 2004")).toEqual(Date.UTC(2004, 6, 28));
  });

  it("should correctly parse MDY dates", function() {
    expect(DateTools.parseMDYDate("1/1/1970")).toEqual(Date.UTC(1970, 1, 1));
    expect(DateTools.parseMDYDate("2/5/1999")).toEqual(Date.UTC(1999, 2, 5));
    expect(DateTools.parseMDYDate("02/5/1999")).toEqual(Date.UTC(1999, 2, 5));
    expect(DateTools.parseMDYDate("2/29/2004")).toEqual(Date.UTC(2004, 2, 29));
    expect(DateTools.parseMDYDate("02/29/2004")).toEqual(Date.UTC(2004, 2, 29));
    expect(DateTools.parseMDYDate("02/05/1999")).toEqual(Date.UTC(1999, 2, 5));
    expect(DateTools.parseMDYDate("2/05/1999")).toEqual(Date.UTC(1999, 2, 5));
  });

  it("should correctly parse assignment dates", function() {
    // todo
  });
});