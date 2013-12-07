all:
	tsc src/*.ts --outDir build

prepare:
	mkdirs build

clean:
	rm build/*