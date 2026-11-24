(() => {
  'use strict';
  const section=document.querySelector('.values-section');
  const cards=Array.from(document.querySelectorAll('.value-card'));
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled=false;
  const clamp=n=>Math.min(1,Math.max(0,n));
  function updateValues(){
    scheduled=false;
    if(!section.classList.contains('enhanced'))return;
    const rect=section.getBoundingClientRect();
    const length=Math.max(1,section.offsetHeight-window.innerHeight);
    const progress=clamp(-rect.top/length);
    const starts=[0,.20,.43,.66];
    cards.forEach((card,i)=>{
      const move=i===0?1:clamp((progress-starts[i])/.12);
      card.style.setProperty('--slide',`${(1-move)*108}%`);
    });
    section.classList.toggle('is-joined',progress>.9);
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(updateValues)}}
  function configure(){
    const active=!motion.matches && window.innerHeight>=570;
    section.classList.toggle('enhanced',active);
    if(!active){section.classList.remove('is-joined');cards.forEach(card=>card.style.removeProperty('--slide'));}
    updateValues();
  }
  configure();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',configure,{passive:true});
  motion.addEventListener('change',configure);

  const word=document.querySelector('.final-word');
  const letters=Array.from(word.querySelectorAll('span'));
  if(!motion.matches && 'IntersectionObserver' in window){
    letters.forEach((letter,i)=>{
      letter.style.setProperty('--x',`${(i-5)*9}px`);
      letter.style.setProperty('--y',`${(i%3-1)*28}px`);
      letter.style.setProperty('--r',`${(i%4-2)*3}deg`);
      letter.style.transitionDelay=`${i*.035}s`;
    });
    word.classList.add('is-ready');
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){word.classList.add('is-joined');observer.disconnect();}},{threshold:.5});
    observer.observe(word);
  }
})();
