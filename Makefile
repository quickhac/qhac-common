all: ts doc

ts:
	tsc src/all.ts --out build/qhac.js

doc:
	typedoc --out doc/ src/

prepare:
	mkdir build

clean:
	rm build/*
