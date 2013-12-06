TSC=tsc

all:
	${TSC} src/*.ts --outDir build

prepare:
	mkdirs build

clean:
	rm build/*