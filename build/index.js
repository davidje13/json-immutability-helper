"use strict";var t=require("./commandTypeCheck-Dbzi5OUO.js");const e={set:t.config("*","value")(((t,[e])=>e)),unset:t.config("*")(((t,e,n)=>n.UNSET_TOKEN)),init:t.config("*","value")(((t,[e])=>void 0===t?e:t)),updateIf:t.config("*","condition","spec","spec?")(((t,[e,n,o=null],i)=>i.makeConditionPredicate(e)(t)?i.update(t,n,{allowUnset:!0}):o?i.update(t,o,{allowUnset:!0}):t)),seq:t.config("*","spec...")(((t,e,n)=>e.reduce(((t,e)=>n.update(t,e,{allowUnset:!0})),t))),toggle:t.config("boolean")((t=>!t)),merge:t.config("object?","merge:object","initial:object?")(((t,[e,n],o)=>{const i=void 0===t?n:t;return o.applyMerge(i,Object.entries(e).filter((([,t])=>void 0!==t)))})),add:t.config("number","number")(((t,[e])=>t+e)),subtract:t.config("number","number")(((t,[e])=>t-e))};e.if=e.updateIf,e["="]=e.set,e["+"]=e.add,e["-"]=e.subtract,e["~"]=e.toggle;var n={commands:e};var o={conditions:{equals:t=>e=>e===t,not:t=>e=>e!==t,greaterThan:t=>e=>e>t,lessThan:t=>e=>e<t,greaterThanOrEqual:t=>e=>e>=t,lessThanOrEqual:t=>e=>e<=t,notNullish:()=>t=>null!=t}};function i(t,e){if(!t){const t="function"==typeof e?e():e||"bad input";throw new Error(t)}}const r=(t,e)=>Object.prototype.hasOwnProperty.call(t,e)?t[e]:void 0,s=(t,e,n)=>Object.defineProperty(t,e,{value:n,configurable:!0,enumerable:!0,writable:!0}),c=Array.isArray;function a(t){return c(t)&&"seq"===t[0]?t.slice(1):[t]}function u(t,e){if(c(t)||c(e))return["seq",...a(t),...a(e)];const n=Object.assign({},t);return Object.entries(e).forEach((([t,e])=>{Object.prototype.hasOwnProperty.call(n,t)?n[t]=u(n[t],e):void 0===n[t]?n[t]=e:s(n,t,e)})),n}function h(t,e){i("object"==typeof t,`expected spec of condition to be an object; got ${t}`);const n=Object.entries(t).filter((([t])=>"key"!==t)).map((([t,n])=>{const o=e.conditions.get(t);return i(o,`unknown condition type: ${t}`),o(n,e)}));return void 0===t.key?(i(n.length>0,"invalid condition"),t=>n.every((e=>e(t)))):(n.length||n.push(o.conditions.notNullish()),e=>{const o=r(e,t.key);return n.every((t=>t(o)))})}const l=Symbol("unset");class b{constructor(t){var e;Object.assign(this,t,{commands:new Map(t.commands),conditions:new Map(t.conditions),t:0,o:1,UNSET_TOKEN:l,invariant:i}),e=this,["with","update","applyMerge","combine","makeConditionPredicate"].forEach((t=>{e[t]=e[t].bind(e)})),Object.assign(this.update,{context:this,combine:this.combine,UNSET_TOKEN:this.UNSET_TOKEN,with:(...t)=>this.with(...t).update})}with(...t){const e={commands:[...this.commands.entries()],conditions:[...this.conditions.entries()],limits:Object.assign({},this.limits),rpnOperators:Object.assign({},this.rpnOperators),rpnConstants:Object.assign({},this.rpnConstants),isEquals:this.isEquals,copy:this.copy};return new b(t.reduce(((t,e)=>Object.assign(t,e,{commands:[...t.commands,...Object.entries(e.commands||{})],conditions:[...t.conditions,...Object.entries(e.conditions||{})],limits:Object.assign(t.limits,e.limits),rpnOperators:Object.assign(t.rpnOperators,e.rpnOperators),rpnConstants:Object.assign(t.rpnConstants,e.rpnConstants)})),e))}update(t,e,{path:n="",allowUnset:o=!1}={}){const s=t===l?void 0:t;if(c(e)){const[t,...r]=e,c=this.commands.get(t);try{i(c,"unknown command");const t=c(s,r,this);return t===l?o?l:void 0:this.isEquals(t,s)?s:t}catch(e){throw new Error(`/${n} ${t}: ${e.message}`)}}i("object"==typeof t&&null!==t,`/${n}: target must be an object or array`),i("object"==typeof e&&null!==e,`/${n}: spec must be an object or a command`);const a=n?`${n}/`:"",u=Object.entries(e).map((([t,e])=>[t,this.update(r(s,t),e,{path:`${a}${t}`,allowUnset:!0})]));return this.applyMerge(s,u,n)}applyMerge(t,e,n=""){let o=null;const i=[],r=Array.isArray(t);return e.forEach((([e,c])=>{if(r&&!((t,e)=>{const n=Number(t);return n>=0&&n<e&&n.toFixed(0)===t})(e,t.length))throw new Error(`/${n}: cannot modify array property ${e}`);const a=c!==l,u=Object.prototype.hasOwnProperty.call(t,e);(a!==u||a&&!this.isEquals(t[e],c))&&(o=o||this.copy(t),a?u||void 0===t[e]?o[e]=c:s(o,e,c):r?i.push(Number(e)):delete o[e])})),i.length>0&&function(t,e){e.sort(((t,e)=>t-e));let n=1;for(let o=e[0]+1;o<t.length;++o)o===e[n]?++n:t[o-n]=t[o];t.length-=n}(o,i),o||t}combine(t,e){return i(!e,"combine(): must provide a single (list) parameter."),t.reduce(u,{})}makeConditionPredicate(t){if(!Array.isArray(t))return h(t,this);if(i(t.length>0,"update(): empty condition."),"string"==typeof t[0]&&2===t.length)return h({key:t[0],equals:t[1]},this);const e=t.map((t=>h(t,this)));return t=>e.every((e=>e(t)))}incLoopNesting(t,e){if(t<=1)return e();const n=this.o;++this.t,this.o*=t;try{return i(this.t<this.limits.recursionDepth&&this.o<this.limits.recursionBreadth,`too much recursion: ${this.t} deep, ~${this.o} items`),e()}finally{--this.t,this.o=n}}}const d={commands:[],conditions:[],limits:{stringLength:10240,recursionDepth:10,recursionBreadth:1e5},rpnOperators:{},rpnConstants:{},isEquals:Object.is,copy:t=>Array.isArray(t)?[...t]:"object"==typeof t&&t?Object.assign({},t):t},p=new b(d).with(n,o);p.combine,p.update,p.context=p,p.default=p,module.exports=p;
