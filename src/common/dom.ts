module DOMTools {
    
    export function parse(str: string): Document {
        return new DOMParser().parseFromString(str, 'text/html');
    }
    
    /** Returns the names and values of all of the input elements on the page in a map. */
    export function parseInputs(doc: Document): Object {
        // retrieve all input elements
        var inputs = doc.findTag('input').toArray();
        
        // create a map with [name] as keys and [value] as values
        var keys = inputs.map(input => (<HTMLElement> input).getAttribute('name'));
        var values = inputs.map(input => (<HTMLElement> input).getAttribute('value'));
        
        var map = {};
        keys.peach(values, (k, v) => map[k] = v);
        
        return map;
    }
}