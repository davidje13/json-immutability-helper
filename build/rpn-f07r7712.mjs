import{c as r}from"./commandTypeCheck-b4O3V53M.mjs";const t=(r,t,e)=>{const o=new Map([...Object.entries(r)]);return(r,n)=>{const i=[],c={...t,...n};if(r.forEach((r=>{if("number"==typeof r)i.push(r);else{if("string"!=typeof r)throw new Error("unexpected token type");'"'===r.charAt(0)?i.push(JSON.parse(r)):Object.prototype.hasOwnProperty.call(c,r)?i.push(c[r]):function(r,t){const[n,i]=r.split(":");if(!o.has(n))throw new Error(`unknown function ${n}`);const[c,p,m]=o.get(n),f=i?Number.parseInt(i,10):c;if(f<c||f>p)throw new Error(`invalid arity for ${r}`);if(t.length<f)throw new Error(`argument mismatch for ${r}`);t.push(m.apply(e,t.splice(-f)))}(r,i)}})),1!==i.length)throw new Error("argument mismatch");return i[0]}},e=Symbol("compiled-rpn"),o=r("primitive","operations:primitive...")(((r,o,n)=>{let i=n[e];i||(i=t(n.rpnOperators,n.rpnConstants,n),n[e]=i);const c=i(o,{x:r});return n.invariant(typeof r==typeof c,"cannot change type of property"),c}));export{o as r};
