"use strict";var r=require("./commandTypeCheck-Dbzi5OUO.js");const t=(r,t,e)=>{const n=new Map([...Object.entries(r)]);return(r,o)=>{const i=[],c=Object.assign({},t,o);if(r.forEach((r=>{if("number"==typeof r)i.push(r);else{if("string"!=typeof r)throw new Error("unexpected token type");'"'===r.charAt(0)?i.push(JSON.parse(r)):Object.prototype.hasOwnProperty.call(c,r)?i.push(c[r]):function(r,t){const[o,i]=r.split(":");if(!n.has(o))throw new Error(`unknown function ${o}`);const[c,p,f]=n.get(o),s=i?Number.parseInt(i,10):c;if(s<c||s>p)throw new Error(`invalid arity for ${r}`);if(t.length<s)throw new Error(`argument mismatch for ${r}`);t.push(f.apply(e,t.splice(-s)))}(r,i)}})),1!==i.length)throw new Error("argument mismatch");return i[0]}},e=Symbol("compiled-rpn"),n=r.config("primitive","operations:primitive...")(((r,n,o)=>{let i=o[e];i||(i=t(o.rpnOperators,o.rpnConstants,o),o[e]=i);const c=i(n,{x:r});return o.invariant(typeof r==typeof c,"cannot change type of property"),c}));exports.rpnCommand=n;