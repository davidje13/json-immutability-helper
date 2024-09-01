"use strict";const e=/^enum\[(.+)\]$/;function t(t){switch(t){case"*":case"value":return()=>!0;case"array":return Array.isArray;case"condition":case"spec":return e=>"object"==typeof e;case"single-locator":return r(["first","last"]);case"multi-locator":return r(["first","last","all"]);case"primitive":return e=>["number","string"].includes(typeof e);default:const c=e.exec(t);if(c){const e=c[1].split(",");return t=>"string"==typeof t&&e.includes(t)}return e=>typeof e===t}}const r=e=>t=>{if(Array.isArray(t)){if(2!==t.length||"object"!=typeof t[1])return!1;t=t[0]}return"number"==typeof t&&Math.round(t)===t||e.includes(t)};function c(e){let[r,c]=e.split(":");return c=c||r,r=r.replace(/(\.\.\.|\?)$/,""),c.endsWith("...")?{variadic:!0,optional:!0,check:t(c.slice(0,-3)),name:r,suffix:"..."}:c.endsWith("?")?{variadic:!1,optional:!0,check:t(c.slice(0,-1)),name:r,suffix:"?"}:{variadic:!1,optional:!1,check:t(c),name:r,suffix:""}}exports.config=(e,...t)=>{const r=c(e),n=t.map(c),a=["command",...n.map((e=>e.name+e.suffix))],i=`expected target to be ${r.name}`,o=`expected [${a.join(", ")}]`,s=n.filter((e=>!e.optional)).length,u=n.some((e=>e.variadic))?Number.POSITIVE_INFINITY:n.length;return e=>(t,c,a)=>{a.invariant(r.optional&&void 0===t||r.check(t),i),a.invariant(c.length>=s&&c.length<=u,o);for(let e=0;e<c.length;++e){const{variadic:t,check:r}=n[e];if(a.invariant(r(c[e]),o),t)for(++e;e<c.length;++e)a.invariant(r(c[e]),o)}return e(t,c,a)}};