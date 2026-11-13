
const SAT_TYPES=['tape','tube','transformer','transistor','diode','hardclip'];
class SatCore{
  constructor(fs){
    this.fs=fs;
    this.p={type:'tube',drive:12,bias:0,hard:3,tone:20000,os:4,auto:1,autoGain:1,trim:0,mix:100,delta:0,bypass:0};
    this.ch=[SatCore.state(),SatCore.state()];
    this.R=1-2*Math.PI*10/fs;
    this.sa=1-Math.exp(-1/(0.012*fs));
    this.L=0;
    this.set({os:4});
  }
  static state(){return{xh:new Float64Array(256),xp:0,oh:new Float64Array(1024),op:0,lo:0,tp1:0,tp2:0,phi:0,dcx:0,dcy:0,x1:0,x2:0,y1:0,y2:0,dly:new Float64Array(128),dp:0,g:-1,o:1,m:1};}
  static i0(x){let s=1,t=1;for(let k=1;k<50;k++){t*=(x/(2*k))*(x/(2*k));s+=t;if(t<1e-12*s)break;}return s;}
  static design(L){
    const T=64*L+1,M=(T-1)/2,fc=0.455/L,beta=9,ib=SatCore.i0(beta),h=new Float64Array(T);let sum=0;
    for(let n=0;n<T;n++){const m=n-M;const s=m===0?2*fc:Math.sin(2*Math.PI*fc*m)/(Math.PI*m);const r=m/M;
      h[n]=s*SatCore.i0(beta*Math.sqrt(Math.max(0,1-r*r)))/ib;sum+=h[n];}
    for(let n=0;n<T;n++)h[n]/=sum;return h;
  }
  setOS(L){
    L=[1,2,4].indexOf(+L)>=0?+L:4;if(L===this.L)return;this.L=L;this.fos=this.fs*L;
    if(L>1){const h=SatCore.design(L);this.h=h;this.poly=[];
      for(let p=0;p<L;p++){const a=[];for(let k=0;k*L+p<h.length;k++)a.push(h[k*L+p]*L);this.poly.push(Float64Array.from(a));}
      this.lat=(h.length-1)/L;}else{this.h=null;this.poly=null;this.lat=0;}
    this.tapeA=1-Math.exp(-2*Math.PI*3000/this.fos);
    this.tfA=1-Math.exp(-2*Math.PI*150/this.fos);
    for(const s of this.ch){s.xh.fill(0);s.oh.fill(0);s.xp=0;s.op=0;s.dly.fill(0);s.dp=0;s.tp1=s.tp2=s.phi=0;}
  }
  static tube(x){return Math.tanh(x+0.7)*1.5770;}  /* operating point 0.7, 1/sech²(0.7) keeps small-signal gain at 1 */
  static knee(x,p){return x/Math.pow(1+Math.pow(Math.abs(x),p),1/p);}
  static diode(x,p){const t=x>=0?1:0.6;return t*SatCore.knee(x/t,p);}
  static clip(x){return x>1?1:x<-1?-1:x;}
  set(d){
    Object.assign(this.p,d);const P=this.p;
    if(d.os!==undefined)this.setOS(d.os);
    this.tid=Math.max(0,SAT_TYPES.indexOf(P.type));
    this.tG=Math.pow(10,P.drive/20);
    this.tO=(P.auto?P.autoGain:1)*Math.pow(10,P.trim/20);
    this.tM=P.delta?1:P.mix/100;
    const b=P.bias;
    this.fb=[Math.tanh(b+0.05),SatCore.tube(b),b-Math.tanh(b),SatCore.knee(b,P.hard),SatCore.diode(b,P.hard),SatCore.clip(b)][this.tid];
    this.toneOn=P.tone<19900;
    if(this.toneOn){const w=2*Math.PI*Math.min(P.tone,this.fs*0.45)/this.fs,c=Math.cos(w),al=Math.sin(w)/(2*0.7071),a0=1+al;
      this.b0=(1-c)/2/a0;this.b1=(1-c)/a0;this.b2=this.b0;this.a1=-2*c/a0;this.a2=(1-al)/a0;}
  }
  /* static (memoryless) curve for display; transformer shown at its low-frequency limit */
  curve(v){
    const P=this.p,b=P.bias;
    switch(this.tid){
      case 0:return Math.tanh(v+b+0.05)-this.fb;
      case 1:return SatCore.tube(v+b)-this.fb;
      case 2:{const ph=1.6*v+b;return (v-0.5*((ph-Math.tanh(ph))-this.fb))/this.tG;}
      case 3:return SatCore.knee(v+b,P.hard)-this.fb;
      case 4:return SatCore.diode(v+b,P.hard)-this.fb;
      default:return SatCore.clip(v+b)-this.fb;
    }
  }
  shape(st,v){
    const P=this.p,b=P.bias;let y;
    switch(this.tid){
      case 0:{st.tp1+=this.tapeA*(v-st.tp1);const e=2*v-st.tp1;const s=Math.tanh(e+b+0.05)-this.fb;st.tp2+=this.tapeA*(s-st.tp2);y=0.5*(s+st.tp2);break;}
      case 1:y=SatCore.tube(v+b)-this.fb;break;
      case 2:{st.phi+=this.tfA*(v-st.phi);const ph=1.6*st.phi+b;y=(v-0.5*((ph-Math.tanh(ph))-this.fb))/this.tG;if(P.delta)return y-v/this.tG;return y;}
      case 3:y=SatCore.knee(v+b,P.hard)-this.fb;break;
      case 4:y=SatCore.diode(v+b,P.hard)-this.fb;break;
      default:y=SatCore.clip(v+b)-this.fb;
    }
    return P.delta?y-v:y;
  }
  processChannel(c,inp,out,n){
    const st=this.ch[c],P=this.p,L=this.L,sa=this.sa;
    if(st.g<0){st.g=this.tG;st.o=this.tO;st.m=this.tM;}
    for(let i=0;i<n;i++){
      const x=inp[i];
      st.g+=(this.tG-st.g)*sa;st.o+=(this.tO-st.o)*sa;st.m+=(this.tM-st.m)*sa;
      let dry=x;
      if(this.lat){st.dly[st.dp]=x;dry=st.dly[(st.dp-this.lat)&127];st.dp=(st.dp+1)&127;}
      const u=x*st.g;let s;
      if(L===1){s=this.shape(st,u);}
      else{
        st.xh[st.xp]=u;st.xh[st.xp+128]=u;const base=st.xp+128;st.xp=(st.xp+1)&127;
        for(let p=0;p<L;p++){
          const hp=this.poly[p];let v=0;
          for(let k=0;k<hp.length;k++)v+=hp[k]*st.xh[base-k];
          const y=this.shape(st,v);
          st.oh[st.op]=y;st.oh[st.op+512]=y;st.lo=st.op+512;st.op=(st.op+1)&511;
        }
        const h=this.h,ob=st.lo;let acc=0;
        for(let j=0;j<h.length;j++)acc+=h[j]*st.oh[ob-j];
        s=acc;
      }
      const d=s-st.dcx+this.R*st.dcy;st.dcx=s;st.dcy=d;
      let t=d;
      if(this.toneOn){const y=this.b0*t+this.b1*st.x1+this.b2*st.x2-this.a1*st.y1-this.a2*st.y2;st.x2=st.x1;st.x1=t;st.y2=st.y1;st.y1=y;t=y;}
      const o=dry*(1-st.m)+t*st.o*st.m;
      out[i]=P.bypass?x:o;
    }
  }
}


class SatProc extends AudioWorkletProcessor{
  constructor(){super();this.core=new SatCore(sampleRate);this.port.onmessage=e=>this.core.set(e.data);}
  process(ins,outs){
    const i=ins[0],o=outs[0];
    if(!i||!i.length){for(const ch of o)ch.fill(0);return true;}
    const L=i[0],R=i[1]||i[0];
    this.core.processChannel(0,L,o[0],L.length);
    if(o[1])this.core.processChannel(1,R,o[1],R.length);
    return true;
  }
}
registerProcessor('sat-proc',SatProc);
