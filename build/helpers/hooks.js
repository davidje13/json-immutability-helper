"use strict";var e=require("./scoped.js");const t=e=>e;exports.makeHooks=function(s,{useEvent:u,useLayoutEffect:i,useEffect:a,useRef:c,useState:r,useMemo:n,useReducer:o}){let d;return u||(u=e=>{const t=c(e);(i??a)((()=>{t.current=e}),[e]);const[s]=r((()=>(...e)=>t.current.apply(void 0,e)));return s}),n||(n=e=>e()),d=o?(e,t)=>{const[u,i]=o(s.update,e,t);return n((()=>({state:u,dispatch:i})),[u,i])}:(e,u=t)=>{const[i,a]=r((()=>u(e))),[c]=r((()=>e=>a((t=>s.update(t,e)))));return n((()=>({state:i,dispatch:c})),[i,c])},{useEvent:u,useJSONReducer:d,useWrappedJSONReducer([e,t]){const i=u(t),[a]=r((()=>e=>i((t=>s.update(t,e)))));return n((()=>({state:e,dispatch:a})),[e,a])},useScopedReducer({state:t,dispatch:i},a,{initialiseValue:c,initialisePath:r=void 0!==c}={}){const o=e.getScopedState(s,t,a,c),d=u((t=>i(e.makeScopedSpec(a,t,{initialisePath:r,initialiseValue:c}))));return n((()=>({state:o,dispatch:d})),[o,d])}}};
