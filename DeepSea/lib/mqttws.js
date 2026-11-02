// Tiny MQTT 3.1.1 over WebSocket client (QoS 0 only). Public domain style, written for Deep Sea.
(function(){
function enc(s){return new TextEncoder().encode(s);}
function u16(n){return [n>>8&255,n&255];}
function str(s){const b=enc(s);return [...u16(b.length),...b];}
function remLen(n){const o=[];do{let d=n%128;n=Math.floor(n/128);if(n>0)d|=128;o.push(d);}while(n>0);return o;}
function pkt(type,body){return new Uint8Array([type,...remLen(body.length),...body]);}
function MQ(url,opt){this.url=url;this.opt=opt||{};this.ok=false;this.subs=[];this.onmsg=null;this.onstate=null;this.buf=new Uint8Array(0);this.mid=1;this._open();}
MQ.prototype._open=function(){const me=this;let ws;try{ws=new WebSocket(this.url,['mqtt']);}catch(e){me._fail(e);return;}this.ws=ws;ws.binaryType='arraybuffer';
  const cid='ds'+Math.random().toString(36).slice(2,12);
  ws.onopen=()=>{const flags=(me.opt.user?128:0)|(me.opt.pass?64:0)|2;let body=[...str('MQTT'),4,flags,...u16(30),...str(cid)];if(me.opt.user)body.push(...str(me.opt.user));if(me.opt.pass)body.push(...str(me.opt.pass));ws.send(pkt(0x10,body));};
  ws.onmessage=ev=>{const d=new Uint8Array(ev.data),b=new Uint8Array(me.buf.length+d.length);b.set(me.buf);b.set(d,me.buf.length);me.buf=b;me._parse();};
  ws.onclose=()=>me._fail('close');ws.onerror=()=>{};
  this.to=setTimeout(()=>{if(!me.ok){try{ws.close();}catch(e){}me._fail('timeout');}},8000);};
MQ.prototype._fail=function(e){if(this.dead)return;this.dead=true;this.ok=false;clearInterval(this.ping);clearTimeout(this.to);if(this.onstate)this.onstate('down');};
MQ.prototype._parse=function(){for(;;){const b=this.buf;if(b.length<2)return;let m=1,n=0,i=1,c;do{if(i>=b.length)return;c=b[i++];n+=(c&127)*m;m*=128;}while(c&128);if(b.length<i+n)return;const t=b[0]>>4,body=b.subarray(i,i+n);this.buf=b.slice(i+n);
  if(t===2){if(body[1]===0){this.ok=true;clearTimeout(this.to);const me=this;this.ping=setInterval(()=>{try{me.ws.send(new Uint8Array([0xc0,0]));}catch(e){}},20000);for(const s of this.subs)this._sub(s);if(this.onstate)this.onstate('up');}else{try{this.ws.close();}catch(e){}this._fail('refused');}}
  else if(t===3){const tl=(body[0]<<8)|body[1],topic=new TextDecoder().decode(body.subarray(2,2+tl));let p=2+tl;if((b[0]>>1&3)>0)p+=2;if(this.onmsg)this.onmsg(topic,new TextDecoder().decode(body.subarray(p)));}}};
MQ.prototype._sub=function(t){const id=this.mid++&65535||1;this.ws.send(pkt(0x82,[...u16(id),...str(t),0]));};
MQ.prototype.subscribe=function(t){this.subs.push(t);if(this.ok)this._sub(t);};
MQ.prototype.publish=function(t,msg){if(!this.ok)return false;try{if(this.ws.bufferedAmount>65536)return false;this.ws.send(pkt(0x30,[...str(t),...enc(msg)]));return true;}catch(e){return false;}};
MQ.prototype.close=function(){this.dead=true;clearInterval(this.ping);clearTimeout(this.to);try{this.ws.close();}catch(e){}};
window.MQWS=MQ;})();
