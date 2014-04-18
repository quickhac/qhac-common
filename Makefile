all:
	tsc src/all.ts --out build/qhac.js

prepare:
	mkdirs build

clean:
	rm build/*