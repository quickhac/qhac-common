// Aliases for common DOM traversal functions

// declare methods defined below
interface HTMLElement {
	find(x : string) : NodeList;
	attr(x : string) : string;
	findClass(x : string) : NodeList;
	findTag(x : string) : NodeList;
}

// Node inherits HTMLElement properties and methods; suppress TS warnings
interface Node {
	find(x : string) : NodeList;
	attr(x : string) : string;
	findClass(x : string) : NodeList;
	findTag(x : string) : NodeList;
	// warning suppression
	innerText : string;
	innerHTML : string;
}

// same for Element
interface Element {
	find(x : string) : NodeList;
	attr(x : string) : string;
	findClass(x : string) : NodeList;
	findTag(x : string) : NodeList;
	// warning suppression
	innerText : string;
	innerHTML : string;
}

interface NodeList {
	map(f : (x : Node) => any) : any;
	splice(idx : number) : Node[];
	toArray() : Node[];
}

HTMLElement.prototype.find = HTMLElement.prototype.querySelectorAll;

HTMLElement.prototype.attr = HTMLElement.prototype.getAttribute;

HTMLElement.prototype.findClass = HTMLElement.prototype.getElementsByClassName;

HTMLElement.prototype.findTag = HTMLElement.prototype.getElementsByTagName;

NodeList.prototype.splice = function (idx : number) : Node[] {
	var newList = [];

	for (var i = idx; i < this.length; i++) {
		newList[newList.length] = this[i];
	}

	return newList;
}

NodeList.prototype.map = function (f : (x : Node) => any) {
	var newList = [];

	for (var i = 0; i < this.length; i++) {
		newList[i] = f(this[i]);
	}

	return newList;
}

NodeList.prototype.toArray = function () {
	var newList = [];

	for (var i = 0; i < this.length; i++) {
		newList[i] = this[i];
	}

	return newList;
}