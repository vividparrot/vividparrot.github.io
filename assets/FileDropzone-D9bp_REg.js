import{y as l,j as e,U as p,S as h,a8 as x,T as u}from"./index-kAxbRY-h.js";/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i={name:"upload",size:24,node:[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]]};i.node;const j=l(i);function f({inputRef:s,label:n,accept:r,multiple:t=!1,onChange:d,onDrop:o,children:c}){return e.jsxs("div",{className:"file-upload",children:[e.jsx(p,{className:"pdf-dropzone",w:"100%",onClick:()=>{var a;return(a=s.current)==null?void 0:a.click()},onDragOver:a=>a.preventDefault(),onDrop:o,children:e.jsxs(h,{align:"center",gap:"sm",children:[e.jsx(x,{variant:"light",size:48,radius:"md",children:e.jsx(j,{size:24})}),e.jsx(u,{fw:600,children:n}),c]})}),e.jsx("input",{ref:s,type:"file",accept:r,multiple:t,hidden:!0,onChange:d,"aria-label":n})]})}export{f as F,j as U};
