(() => {
  'use strict';
  const image=document.getElementById('hero-image');
  let canvas=document.getElementById('water');
  const art=document.querySelector('.hero-art');
  const hero=document.querySelector('.hero');
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let geometry=null,renderer=null,raf=0,visible=true,ready=false;
  const vertex=`attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.0,1.0);}`;
  const fragment=`
    precision mediump float;
    uniform sampler2D u_image;
    uniform vec2 u_resolution, u_imageSize, u_offset;
    uniform float u_scale, u_dpr, u_time, u_part;
    float poolEdge(float x){
      if(x<0.55) return 0.947-max(0.0,x-0.35)*0.30;
      if(x<0.76) return 0.887;
      return 0.883+(x-0.76)*0.11;
    }
    float leafCoverage(vec2 p){
      vec3 color=texture2D(u_image,vec2(p.x,1.0-p.y)).rgb;
      float warmth=smoothstep(0.045,0.105,color.g-color.b);
      return warmth*smoothstep(0.08,0.18,max(color.r,color.g));
    }
    void main(){
      vec2 pixel=vec2(gl_FragCoord.x,u_resolution.y-gl_FragCoord.y)/u_dpr;
      vec2 uv=(pixel-u_offset)/(u_imageSize*u_scale);
      if(uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) discard;
      float t=u_time;
      if(u_part<0.5){
        if(uv.x<0.34 || uv.y<0.865) discard;
        float edge=poolEdge(uv.x);
        float mask=smoothstep(edge,edge+0.009,uv.y)*smoothstep(0.34,0.375,uv.x);
        if(mask<0.001) discard;
        float depth=clamp((uv.y-edge)/0.11,0.0,1.0);
        float swell=sin(uv.y*340.0-t*1.15+sin(uv.x*12.0+t*0.35)*0.65);
        float fine=sin(uv.y*740.0+uv.x*32.0+t*0.8)*0.36;
        vec2 bend=vec2((swell+fine)*(0.0013+depth*0.0020),
                       sin(uv.y*210.0+uv.x*18.0-t*0.6)*0.0010*depth);
        vec2 sampleUV=clamp(uv+bend,vec2(0.001),vec2(0.999));
        vec4 reflection=texture2D(u_image,vec2(sampleUV.x,1.0-sampleUV.y));
        float sheen=max(0.0,swell)*0.014*depth;
        gl_FragColor=vec4(reflection.rgb+vec3(sheen*1.0,sheen*0.86,sheen*0.67),mask);
        return;
      }
      float region;
      if(u_part<1.5){
        region=(1.0-smoothstep(0.35,0.46,uv.x))*(1.0-smoothstep(0.26,0.36,uv.y));
      }else{
        if(uv.x>0.34 && uv.y>poolEdge(uv.x))discard;
        region=(1.0-smoothstep(0.34,0.45,uv.x))*smoothstep(0.68,0.75,uv.y)*(1.0-smoothstep(0.88,0.95,uv.y));
      }
      if(region<0.001)discard;
      vec2 d=vec2(4.0/u_imageSize.x,4.0/u_imageSize.y);
      float leaves=max(leafCoverage(uv),max(leafCoverage(uv+vec2(d.x,0.0)),leafCoverage(uv-vec2(d.x,0.0))));
      float mask=region*leaves*0.85;
      if(mask<0.01)discard;
      float sway=sin(t*0.62+uv.y*16.0+uv.x*9.0)*0.0015+sin(t*1.05+uv.x*21.0)*0.0005;
      vec2 windUV=clamp(uv+vec2(sway,cos(t*0.46+uv.x*8.0)*0.0005),vec2(0.001),vec2(0.999));
      gl_FragColor=vec4(texture2D(u_image,vec2(windUV.x,1.0-windUV.y)).rgb,mask);
    }`;

  function createWebGL(){
    const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false});
    if(!gl)return null;
    function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;}
    const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const u={};['u_resolution','u_imageSize','u_offset','u_scale','u_dpr','u_time','u_part'].forEach(name=>u[name]=gl.getUniformLocation(program,name));
    return {kind:'webgl',gl,program,u};
  }
  function createFallback(){
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;
    const ctx=canvas.getContext('2d');return ctx?{kind:'2d',ctx}:null;
  }
  function resize(){
    if(!renderer || !image.naturalWidth)return;
    const w=art.clientWidth,h=art.clientHeight,dpr=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    const iw=image.naturalWidth,ih=image.naturalHeight,scale=Math.max(w/iw,h/ih);
    geometry={w,h,dpr,iw,ih,scale,x:(w-iw*scale)*(window.innerWidth<=680?.59:.5),y:(h-ih*scale)*.5};
    if(renderer.kind==='webgl')renderer.gl.viewport(0,0,canvas.width,canvas.height);
    else renderer.ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function renderWebGL(now,g){
    const {gl,u}=renderer;
    gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);
    gl.uniform2f(u.u_resolution,canvas.width,canvas.height);gl.uniform2f(u.u_imageSize,g.iw,g.ih);gl.uniform2f(u.u_offset,g.x,g.y);
    gl.uniform1f(u.u_scale,g.scale);gl.uniform1f(u.u_dpr,g.dpr);gl.uniform1f(u.u_time,now*.001);
    function drawRegion(part,x0,y0,x1,y1){
      const left=Math.max(0,Math.floor((g.x+x0*g.iw*g.scale)*g.dpr));
      const right=Math.min(canvas.width,Math.ceil((g.x+x1*g.iw*g.scale)*g.dpr));
      const top=Math.max(0,Math.floor((g.y+y0*g.ih*g.scale)*g.dpr));
      const bottom=Math.min(canvas.height,Math.ceil((g.y+y1*g.ih*g.scale)*g.dpr));
      if(right<=left || bottom<=top)return;
      gl.scissor(left,canvas.height-bottom,right-left,bottom-top);gl.uniform1f(u.u_part,part);gl.drawArrays(gl.TRIANGLES,0,6);
    }
    drawRegion(0,0,.86,1,1);drawRegion(1,0,0,.47,.37);drawRegion(2,0,.68,.46,.95);
    gl.disable(gl.SCISSOR_TEST);
  }
  function renderFallback(now,g){
    const c=renderer.ctx;c.clearRect(0,0,g.w,g.h);c.save();c.beginPath();
    [[.34,1],[.35,.947],[.43,.922],[.55,.887],[.66,.879],[.76,.883],[.87,.895],[1,.91],[1,1]].forEach(([x,y],i)=>{const px=g.x+x*g.iw*g.scale,py=g.y+y*g.ih*g.scale;i?c.lineTo(px,py):c.moveTo(px,py)});c.closePath();c.clip();
    const step=3;
    for(let sy=Math.floor(g.ih*.87);sy<g.ih;sy+=step){
      const dy=g.y+sy*g.scale;if(dy<0||dy>g.h)continue;
      const shift=(Math.sin(sy*.09-now*.0011)*2.2+Math.sin(sy*.19+now*.0008)*1.0)*g.scale;
      c.drawImage(image,0,sy,g.iw,Math.min(step,g.ih-sy),g.x+shift,dy,g.iw*g.scale,step*g.scale+1);
    }
    c.restore();
    function windZone(points,phase){
      c.save();c.beginPath();points.forEach(([x,y],i)=>{const px=g.x+x*g.iw*g.scale,py=g.y+y*g.ih*g.scale;i?c.lineTo(px,py):c.moveTo(px,py)});c.closePath();c.clip();
      c.globalAlpha=.36;const sway=Math.sin(now*.0007+phase)*1.8*g.scale;
      c.drawImage(image,g.x+sway,g.y,g.iw*g.scale,g.ih*g.scale);c.restore();
    }
    windZone([[0,0],[.43,0],[.38,.1],[.29,.17],[.17,.25],[0,.25]],0);
    windZone([[0,.72],[.29,.7],[.39,.77],[.36,.87],[0,.87]],1.2);
  }
  function loop(now){
    raf=0;if(!ready || !geometry || !visible || document.hidden || motion.matches)return;
    if(renderer.kind==='webgl')renderWebGL(now,geometry);else renderFallback(now,geometry);
    raf=requestAnimationFrame(loop);
  }
  function start(){if(ready && visible && !document.hidden && !motion.matches && !raf)raf=requestAnimationFrame(loop);}
  function init(){
    if(ready || !image.naturalWidth)return;
    try{renderer=createWebGL();}catch(error){renderer=null;}
    if(!renderer)renderer=createFallback();if(!renderer)return;
    ready=true;resize();start();
  }
  image.addEventListener('load',init);if(image.complete)init();
  window.addEventListener('resize',()=>{resize();start();},{passive:true});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);start();});observer.observe(hero);}
  document.addEventListener('visibilitychange',start);
  motion.addEventListener('change',()=>{if(motion.matches){if(renderer?.kind==='webgl'){const gl=renderer.gl;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}else if(renderer)renderer.ctx.clearRect(0,0,geometry.w,geometry.h);}else start();});
})();
