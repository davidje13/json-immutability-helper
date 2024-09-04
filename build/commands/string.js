"use strict";var r=require("../commandTypeCheck-Dbzi5OUO.js"),n=require("../rpn-B0fcA714.js");function t(r){return Math.round(r)===r}const e={String:[1,2,(r,n=null)=>{if(null===n)return String(r);if(!t(n)||n<-20||n>20)throw new Error("unsupported decimal places");if(n<0){const t=(Number(r)/Math.pow(10,-n)).toFixed();return"0"===t||"-0"===t?t:t+"0".repeat(-n)}return Number(r).toFixed(n)}],concat:[2,Number.POSITIVE_INFINITY,function(...r){const n=r.map(String);if(n.reduce(((r,n)=>r+n.length),0)>this.limits.stringLength)throw new Error("string concatenation too long");return n.join("")}],repeat:[2,2,function(r,n){const e=String(r);if(!t(n)||n<0||n*e.length>this.limits.stringLength)throw new Error(`unsupported repeat count ${n}`);return e.repeat(n)}],length:[1,1,r=>String(r).length],indexOf:[2,3,(r,n,t)=>String(r).indexOf(n,t)],lastIndexOf:[2,3,(r,n,t)=>String(r).lastIndexOf(n,t)],padStart:[2,3,function(r,n,e){if(!t(n)||n<0||n>this.limits.stringLength)throw new Error(`unsupported padding length ${n}`);return String(r).padStart(n,e)}],padEnd:[2,3,function(r,n,e){if(!t(n)||n<0||n>this.limits.stringLength)throw new Error(`unsupported padding length ${n}`);return String(r).padEnd(n,e)}],slice:[2,3,(r,n,t)=>String(r).slice(n,t)],substr:[3,3,(r,n,t)=>String(r).substr(n,t)]};var i={commands:{replaceAll:r.config("string","find:string","replace:string")(((r,[n,t],e)=>{if(!n||n===t)return r;const i=String.prototype.split.call(r,n);if(t.length>n.length){const o=i.length-1,u=o*(t.length-n.length);e.invariant(r.length+u<=e.limits.stringLength,"too much data"),e.incLoopNesting(o,(()=>null))}return i.join(t)})),rpn:n.rpnCommand},rpnOperators:e};module.exports=i;
