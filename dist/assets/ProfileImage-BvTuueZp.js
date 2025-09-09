import{j as e}from"./index-CWCspKH8.js";import{r as w,R as b}from"./vendor-router-B0usbLSA.js";import{t as j,u as g,U as v}from"./vendor-utils-BzzJCpLm.js";const U=({imageUrl:i,fullName:o,email:n,size:d="md",editable:a=!1,onImageChange:l,loading:c=!1})=>{const[h,f]=w.useState(!1),r={sm:{container:"w-8 h-8",icon:"w-3 h-3",text:"text-xs"},md:{container:"w-12 h-12",icon:"w-5 h-5",text:"text-sm"},lg:{container:"w-20 h-20",icon:"w-8 h-8",text:"text-lg"},xl:{container:"w-32 h-32",icon:"w-12 h-12",text:"text-2xl"}}[d],x=()=>o?o.split(" ").map(t=>t.charAt(0).toUpperCase()).slice(0,2).join(""):n?n.charAt(0).toUpperCase():"U",m=t=>{const s=t.target.files?.[0];if(s&&l){if(!s.type.startsWith("image/")||s.size>5*1024*1024)return;l(s)}},p=()=>{f(!0)};b.useEffect(()=>{f(!1)},[i]);const u=()=>{if(c)return e.jsx("div",{className:"flex items-center justify-center w-full h-full",children:e.jsx("div",{className:"animate-spin rounded-full border-2 border-white/30 border-t-white w-1/2 h-1/2"})});if(i&&!h)return e.jsx("img",{src:i,alt:o||"Profile",onError:p,className:"w-full h-full object-cover"});const t=x();return t&&t!=="U"?e.jsx("span",{className:`font-semibold text-white ${r.text}`,children:t}):e.jsx(v,{className:`text-white ${r.icon}`})};return a?e.jsxs("div",{className:"relative",children:[e.jsxs("div",{className:`
          ${r.container} 
          rounded-full 
          bg-gradient-to-r from-blue-500 to-purple-600 
          flex items-center justify-center 
          overflow-hidden 
          border-2 border-white/20
          cursor-pointer
          group
          hover:scale-105
          transition-all duration-200
        `,children:[u(),e.jsx("div",{className:"absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center",children:e.jsx(j,{className:"w-1/3 h-1/3 text-white"})})]}),e.jsx("input",{type:"file",accept:"image/*",onChange:m,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer",disabled:c}),a&&e.jsx("div",{className:"absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white",children:e.jsx(g,{className:"w-3 h-3 text-white"})})]}):e.jsx("div",{className:`
      ${r.container} 
      rounded-full 
      bg-gradient-to-r from-blue-500 to-purple-600 
      flex items-center justify-center 
      overflow-hidden 
      border-2 border-white/20
    `,children:u()})};export{U as P};
