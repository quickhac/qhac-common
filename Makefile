all:
	tsc src/*.ts --out build/qhac.js

prepare:
	mkdirs build

clean:
	rm build/*