// Aliases for common DOM traversal functions

interface HTMLElement {
	find(x : string) : NodeList;
	attr() : string;
	findClass(x : string) : NodeList;
	findTag(x : string) : NodeList;
}

HTMLElement.prototype.find = HTMLElement.prototype.querySelectorAll;

HTMLElement.prototype.attr = HTMLElement.prototype.getAttribute;

HTMLElement.prototype.findClass = HTMLElement.prototype.getElementsByClassName;

HTMLElement.prototype.findTag = HTMLElement.prototype.getElementsByTagName;

NodeList.prototype.splice = (idx) => {
	var newList = [];

	for (i = idx; i < this.length; i++) {
		newList[newList.length] = this[i];
	}

	return newList;
}