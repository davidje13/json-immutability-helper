"use strict";var a=require("../rpn-B0fcA714.js");require("../commandTypeCheck-Dbzi5OUO.js");const t=Number.POSITIVE_INFINITY,n={Number:[1,1,a=>Number.parseFloat(a)],"+":[2,t,(...a)=>a.reduce(((a,t)=>a+Number(t)),0)],"-":[2,2,(a,t)=>a-t],"*":[2,t,(...a)=>a.reduce(((a,t)=>a*Number(t)),1)],"/":[2,2,(a,t)=>a/t],"//":[2,2,(a,t)=>Math.trunc(a/t)],"^":[2,2,(a,t)=>Math.pow(a,t)],"%":[2,2,(a,t)=>a%t],mod:[2,2,(a,t)=>(a%t+t)%t],neg:[1,1,a=>-a],log:[1,2,(a,t)=>t?Math.log(a)/Math.log(t):Math.log(a)],exp:[1,2,(a,t)=>t?Math.pow(t,a):Math.exp(a)],max:[2,t,Math.max],min:[2,t,Math.min],bitor:[2,2,(a,t)=>a|t],bitand:[2,2,(a,t)=>a&t],bitxor:[2,2,(a,t)=>a^t],bitneg:[1,1,a=>~a]};["abs","log2","log10","sin","cos","tan","asin","acos","atan","sinh","cosh","tanh","asinh","acosh","atanh","round","floor","ceil","trunc"].forEach((a=>{n[a]=[1,1,Math[a]]}));var r={commands:{rpn:a.rpnCommand},rpnOperators:n,rpnConstants:{e:Math.E,pi:Math.PI,Inf:t,NaN:Number.NaN}};module.exports=r;
