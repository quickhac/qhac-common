all:
	tsc src/all.ts --out build/qhac.js
	typedoc --out doc/ src/

prepare:
	mkdirs build

clean:
	rm build/*