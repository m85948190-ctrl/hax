(()=>{
function launch(e){if(e){e.preventDefault();e.stopImmediatePropagation();}if(window.HAxBROFutureMaker?.open){window.HAxBROFutureMaker.open();return false}const el=document.getElementById('kaiWorkCanvas');if(el){el.classList.add('active');return false}return false}
function bind(){['appMakerBtn','mobileAppMakerBtn'].forEach(id=>{const b=document.getElementById(id);if(!b||b.dataset.futureBound)return;b.dataset.futureBound='1';b.addEventListener('click',launch,true);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();document.addEventListener('click',e=>{const b=e.target.closest?.('#appMakerBtn,#mobileAppMakerBtn');if(b)launch(e)},true);
window.HAxBROKai2AppMaker={open:()=>window.HAxBROFutureMaker?.open(),close:()=>window.HAxBROFutureMaker?.close()};
})();