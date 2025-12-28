import { GraphData } from './types';

export const INITIAL_GRAPH_DATA: GraphData = {
  nodes: [
    // Variables
    { id: "name", type: "literalVar", label: "name", value: '"John"' },
    { id: "myObject", type: "byRefVar", label: "myObject" },
    { id: "number", type: "byRefVar", label: "number" },
    { id: "myFunction", type: "byRefVar", label: "myFunction" },

    // Objects
    { id: "obj1", type: "obj", objectType: "object", value: "*" },
    { id: "obj2", type: "obj", objectType: "object", value: "*" },
    { id: "obj3", type: "obj", objectType: "array", value: "*" },
    { id: "obj4", type: "obj", objectType: "function", value: "*" },

    // Properties
    { id: "parent", type: "byRefProp", label: "parent" },
    { id: "children", type: "byRefProp", label: "children" },
    { id: "prop", type: "literalProp", label: "prop", value: 20 },
    { id: "method", type: "byRefProp", label: "method" },
  ],
  links: [
    // Variable references
    { source: "myObject", target: "obj1", type: "reference" },
    { source: "number", target: "obj3", type: "reference" },
    { source: "myFunction", target: "obj4", type: "reference" },

    // Object properties
    { source: "obj1", target: "parent", type: "property" },
    { source: "obj1", target: "children", type: "property" },
    { source: "obj1", target: "prop", type: "property" },
    { source: "obj1", target: "method", type: "property" },

    // Property references
    { source: "parent", target: "obj2", type: "reference" },
    { source: "children", target: "obj3", type: "reference" },
    { source: "method", target: "obj4", type: "reference" },
  ],
};
