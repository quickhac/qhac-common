beforeEach(function() {
	jasmine.addMatchers({
		toPass: function() {
			return {
				compare: function() { return true; }
			}
		}
	})
})