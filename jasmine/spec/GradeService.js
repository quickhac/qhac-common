describe('GradeService', function() {
	function failPromise(e) { expect('promise not fulfilled: ' + e.message).toFail(); }

	it('should become ready', function() {
		var gs = new GradeService();
		gs.ready().then(function() {
			passed = true;
			expect('it is ready').toPass();
		}, failPromise);
	});

	it('should log in for a Round Rock ISD account with one student', function() {
		var gs = new GradeService();
		gs.ready().then(function() {
			return gs.attemptLogin(Districts.roundrock, 'zengx', 'test');
		}, failPromise).then(function(retData) {
			passed = true;
			expect(retData[0].courses.length).toBe(8);
			expect(retData[1].name).toBe('Xuming');
		}, failPromise);
	});

	it('should log in for a Round Rock ISD account with multiple students', function() {
		var gs = new GradeService();
		gs.ready().then(function() {
			return gs.attemptLogin(Districts.roundrock, 'Seifert', 'test');
		}, failPromise).then(function (retData) {
			expect(retData[0].length).toBe(2);
			return gs.attemptSelectStudent('112840');
		}, failPromise).then(function (retData) {
			expect(retData[0].courses.length).toBe(8);
			expect(retData[1].name).toBe('Tristan');
		}, failPromise);
	});
});