(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const art = document.querySelector('.hero-art');
  window.addEventListener('scroll',()=>{if(reduceMotion.matches)return; const y=Math.min(window.scrollY/window.innerHeight,1);art.style.setProperty('--scene-scale',String(1.035+y*.07));},{passive:true});

  const sound=document.querySelector('.sound-toggle'), label=sound.querySelector('.sound-label');
  const nature=document.getElementById('nature');
  nature.volume=.25;
  nature.autoplay=true;
  let soundWanted=true, soundPlaying=false, soundAttempt=0;
  function updateSound(playing){
    soundPlaying=playing;
    sound.setAttribute('aria-pressed',String(playing));
    sound.setAttribute('aria-label',playing?'Выключить пение птиц':'Включить пение птиц');
    label.textContent=playing?'ВЫКЛЮЧИТЬ ЗВУК':'ВКЛЮЧИТЬ ЗВУК';
  }
  async function startSound(){
    if(!soundWanted) return false;
    const attempt=++soundAttempt;
    try{
      await nature.play();
      if(attempt!==soundAttempt || !soundWanted){if(!soundWanted)nature.pause();return false;}
      updateSound(true);
      return true;
    }catch(error){
      if(attempt===soundAttempt && soundWanted)updateSound(false);
      return false;
    }
  }
  function stopSound(){
    soundWanted=false; soundAttempt++; nature.autoplay=false; nature.pause(); updateSound(false);
  }
  nature.addEventListener('playing',()=>{if(soundWanted)updateSound(true);else nature.pause();});
  sound.addEventListener('click',()=>{
    if(soundPlaying){stopSound();return;}
    soundWanted=true; nature.autoplay=true;
    void startSound();
  });
  let lastWheelAttempt=0;
  function tryOnInteraction(event){
    if(!soundWanted || soundPlaying || event.target.closest?.('.sound-toggle'))return;
    if(event.type==='wheel'){const now=Date.now();if(now-lastWheelAttempt<1000)return;lastWheelAttempt=now;}
    void startSound();
  }
  document.addEventListener('pointerdown',tryOnInteraction,{passive:true});
  document.addEventListener('keydown',tryOnInteraction,{passive:true});
  document.addEventListener('wheel',tryOnInteraction,{passive:true});
  window.addEventListener('pageshow',()=>{if(soundWanted && !soundPlaying)void startSound();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden && soundWanted && !soundPlaying)void startSound();});
  // Browsers may require a user gesture before they allow audible playback.
  void startSound();

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
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  let detailsTrigger=null, detailsScroll=null;
  document.querySelector('.service-stack').addEventListener('focusin',event=>{
    const button=event.target;
    if(detailsScroll || !button.matches('.service-button:focus-visible'))return;
    // Wait for the focused card's normal-flow geometry before aligning it.
    requestAnimationFrame(()=>{
      if(document.activeElement===button){
        // Cancel any pending smooth scroll from the previously focused table.
        window.scrollTo({left:window.scrollX,top:window.scrollY,behavior:'instant'});
        button.scrollIntoView({behavior:'instant',block:'center'});
      }
    });
  });
  document.querySelectorAll('[data-dialog]').forEach(btn=>btn.addEventListener('click',()=>{
    if(dialog.open)return;
    closeMenu();
    body.replaceChildren(document.getElementById(btn.dataset.dialog).content.cloneNode(true));
    detailsTrigger=btn;
    const root=document.documentElement;
    detailsScroll={x:window.scrollX,y:window.scrollY,overflow:root.style.overflow,padding:document.body.style.paddingRight};
    const scrollbar=window.innerWidth-root.clientWidth;
    const padding=parseFloat(getComputedStyle(document.body).paddingRight);
    root.style.overflow='hidden';
    document.body.style.paddingRight=padding+scrollbar+'px';
    window.scrollTo({left:detailsScroll.x,top:detailsScroll.y,behavior:'instant'});
    dialog.showModal();
    dialog.scrollTop=0;
  }));
  function restoreDetails(){
    if(!detailsScroll)return;
    const saved=detailsScroll;
    detailsScroll=null;
    document.documentElement.style.overflow=saved.overflow;
    document.body.style.paddingRight=saved.padding;
    if(document.activeElement===document.body || dialog.contains(document.activeElement)){
      detailsTrigger?.focus({preventScroll:true});
    }
    window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
  }
  function closeDetails(){
    dialog.close();
    // Restore now, before a subsequent Tab; native close is dispatched later.
    restoreDetails();
  }
  dialog.addEventListener('close',()=>{if(!dialog.open)restoreDetails()});
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDetails()});
  document.querySelector('.dialog-close').addEventListener('click',closeDetails);
  dialog.addEventListener('click',e=>{if(e.target===dialog)closeDetails()});
})();
