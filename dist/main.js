(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const art = document.querySelector('.hero-art');
  window.addEventListener('scroll',()=>{if(reduceMotion.matches)return; const y=Math.min(window.scrollY/window.innerHeight,1);art.style.setProperty('--scene-scale',String(1.035+y*.07));},{passive:true});

  const sound=document.querySelector('.sound-toggle'), label=sound.querySelector('.sound-label');
  const nature=document.getElementById('nature');
  nature.volume=.25;
  function updateSound(){
    const playing=!nature.paused;
    sound.setAttribute('aria-pressed',String(playing));
    sound.setAttribute('aria-label',playing?'Выключить пение птиц':'Включить пение птиц');
    label.textContent=playing?'ВЫКЛЮЧИТЬ ЗВУК':'ВКЛЮЧИТЬ ЗВУК';
  }
  nature.addEventListener('play',updateSound);
  nature.addEventListener('pause',updateSound);
  sound.addEventListener('click',()=>{
    if(nature.paused){
      nature.play().catch(updateSound);
    }else{
      nature.pause();
    }
  });

  const dialog=document.getElementById('details'),body=document.getElementById('dialog-body');
  const menu=document.getElementById('mobile-menu'),toggle=document.querySelector('.menu-toggle');
  function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню')}
  const curtain=document.getElementById('nav-transition'),curtainTitle=curtain.querySelector('.nav-transition-title');
  const navigationPhrases=['Пусть день будет добрым','Пусть задуманное получится','Светлых мыслей и решений','Тепла и спокойствия','Пусть мечты сбываются','Пусть всё получится'];
  let navigation=0, nextPhrase=0;
  function arriveAt(target,href){
    window.history.pushState(null,'',href);
    target.scrollIntoView({behavior:'instant',block:'start'});
    target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
  }
  document.querySelectorAll('.nav a[href^="#"], .mobile-menu a[href^="#"], [data-section-transition]').forEach(link=>{
    link.addEventListener('click',event=>{
      if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
      const href=link.getAttribute('href'),target=document.getElementById(href.slice(1));
      if(!target)return;
      event.preventDefault();closeMenu();
      const current=++navigation;
      if(reduceMotion.matches){curtain.classList.remove('is-active');arriveAt(target,href);return;}
      curtainTitle.textContent=navigationPhrases[nextPhrase];
      nextPhrase=(nextPhrase+1)%navigationPhrases.length;
      curtain.classList.add('is-active');
      window.setTimeout(()=>{
        if(current!==navigation)return;
        arriveAt(target,href);
        window.setTimeout(()=>{if(current===navigation)curtain.classList.remove('is-active')},600);
      },320);
    });
  });
  document.querySelector('.back-to-top').addEventListener('click',event=>{
    if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
    event.preventDefault();navigation++;curtain.classList.remove('is-active');window.history.pushState(null,'','#top');window.scrollTo({top:0,behavior:'instant'});
    document.querySelector('.site-header .brand').focus({preventScroll:true});
  });
  toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню')});
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) {
      closeMenu();
      toggle.focus({preventScroll: true});
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 1051px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.querySelectorAll('[data-dialog]').forEach(btn=>btn.addEventListener('click',()=>{closeMenu();body.replaceChildren(document.getElementById(btn.dataset.dialog).content.cloneNode(true));dialog.showModal()}));
  document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
})();
