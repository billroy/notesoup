/*
Note Soup License

Copyright (c) 2007, Bill Roy

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

	-	Redistributions of source code must retain the above copyright notice, 
		this list of conditions and the following disclaimer.
	-	Redistributions in binary form must reproduce the above copyright notice, 
		this list of conditions and the following disclaimer in the documentation 
		and/or other materials provided with the distribution.
	-	Neither the name of the authors nor the names of its contributors may be
		used to endorse or promote products derived from this software without 
		specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
var hexcase=0;
var b64pad="";
var chrsz=8;
function hex_sha1(s){
return binb2hex(core_sha1(str2binb(s),s.length*chrsz));
}
function b64_sha1(s){
return binb2b64(core_sha1(str2binb(s),s.length*chrsz));
}
function str_sha1(s){
return binb2str(core_sha1(str2binb(s),s.length*chrsz));
}
function hex_hmac_sha1(_4,_5){
return binb2hex(core_hmac_sha1(_4,_5));
}
function b64_hmac_sha1(_6,_7){
return binb2b64(core_hmac_sha1(_6,_7));
}
function str_hmac_sha1(_8,_9){
return binb2str(core_hmac_sha1(_8,_9));
}
function sha1_vm_test(){
return hex_sha1("abc")=="a9993e364706816aba3e25717850c26c9cd0d89d";
}
function core_sha1(x,_b){
x[_b>>5]|=128<<(24-_b%32);
x[((_b+64>>9)<<4)+15]=_b;
var w=Array(80);
var a=1732584193;
var b=-271733879;
var c=-1732584194;
var d=271733878;
var e=-1009589776;
for(var i=0;i<x.length;i+=16){
var _13=a;
var _14=b;
var _15=c;
var _16=d;
var _17=e;
for(var j=0;j<80;j++){
if(j<16){
w[j]=x[i+j];
}else{
w[j]=rol(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);
}
var t=safe_add(safe_add(rol(a,5),sha1_ft(j,b,c,d)),safe_add(safe_add(e,w[j]),sha1_kt(j)));
e=d;
d=c;
c=rol(b,30);
b=a;
a=t;
}
a=safe_add(a,_13);
b=safe_add(b,_14);
c=safe_add(c,_15);
d=safe_add(d,_16);
e=safe_add(e,_17);
}
return Array(a,b,c,d,e);
}
function sha1_ft(t,b,c,d){
if(t<20){
return (b&c)|((~b)&d);
}
if(t<40){
return b^c^d;
}
if(t<60){
return (b&c)|(b&d)|(c&d);
}
return b^c^d;
}
function sha1_kt(t){
return (t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;
}
function core_hmac_sha1(key,_20){
var _21=str2binb(key);
if(_21.length>16){
_21=core_sha1(_21,key.length*chrsz);
}
var _22=Array(16),_23=Array(16);
for(var i=0;i<16;i++){
_22[i]=_21[i]^909522486;
_23[i]=_21[i]^1549556828;
}
var _25=core_sha1(_22.concat(str2binb(_20)),512+_20.length*chrsz);
return core_sha1(_23.concat(_25),512+160);
}
function safe_add(x,y){
var lsw=(x&65535)+(y&65535);
var msw=(x>>16)+(y>>16)+(lsw>>16);
return (msw<<16)|(lsw&65535);
}
function rol(num,cnt){
return (num<<cnt)|(num>>>(32-cnt));
}
function str2binb(str){
var bin=Array();
var _2e=(1<<chrsz)-1;
for(var i=0;i<str.length*chrsz;i+=chrsz){
bin[i>>5]|=(str.charCodeAt(i/chrsz)&_2e)<<(32-chrsz-i%32);
}
return bin;
}
function binb2str(bin){
var str="";
var _32=(1<<chrsz)-1;
for(var i=0;i<bin.length*32;i+=chrsz){
str+=String.fromCharCode((bin[i>>5]>>>(32-chrsz-i%32))&_32);
}
return str;
}
function binb2hex(_34){
var _35=hexcase?"0123456789ABCDEF":"0123456789abcdef";
var str="";
for(var i=0;i<_34.length*4;i++){
str+=_35.charAt((_34[i>>2]>>((3-i%4)*8+4))&15)+_35.charAt((_34[i>>2]>>((3-i%4)*8))&15);
}
return str;
}
function binb2b64(_38){
var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var str="";
for(var i=0;i<_38.length*4;i+=3){
var _3c=(((_38[i>>2]>>8*(3-i%4))&255)<<16)|(((_38[i+1>>2]>>8*(3-(i+1)%4))&255)<<8)|((_38[i+2>>2]>>8*(3-(i+2)%4))&255);
for(var j=0;j<4;j++){
if(i*8+j*6>_38.length*32){
str+=b64pad;
}else{
str+=tab.charAt((_3c>>6*(3-j))&63);
}
}
}
return str;
}
var notesoup={clientVersion:"notesoup-miso-ext 0.597d",debugmode:0,sayDebug:false,newNotePositionMode:"cascade",apiuri:"notesoup.php",runScripts:true,syncInterval:60,syncUIOnUpdates:true,defaultNoteWidth:250,defaultNoteHeight:100,defaultAccessoryZIndex:10000,useFastFolderSwitching:false,cache:{},imageHost:"",initialize:function(_3e){
this["startuptime"]=new Date().getTime();
_3e=_3e||{};
for(var o in _3e){
notesoup[o]=_3e[o];
}
if(!this.baseuri){
this.baseuri=document.location;
}
if(!this.foldername.length){
var _40=(""+document.location).split("/");
var _41=_40.length;
if(_41>1){
this.foldername=_40[_41-2]+"/"+_40[_41-1];
}
}
var _40=(""+document.location).split("?");
if(_40.length==2){
var _42=_40[1].split("&");
for(var i=0;i<_42.length;i++){
var _44=_42[i].split("=");
if(_44.length==2){
if(_44[0]=="folder"){
this.foldername="user"+"/"+_44[1];
}
}
}
}
document.title="Note Soup";
this.ui.initialize();
if(navigator.userAgent.search("iPhone")>=0){
this.say("Welcome iPhone user!");
}
this.say("Opening folder "+notesoup.foldername+"...");
this.oneHertzCallback();
this.initialized=true;
return true;
},destroy:function(){
this.initialized=false;
delete this.processServerResponse;
delete this.postRequest;
delete this.oneHertzCallback;
for(var n in this.notes){
this.destroyNote(this.notes[n].id);
}
instantsoup.cleanup();
delete this;
},notes:{},username:"",foldername:"",editors:"",readers:"",senders:"",readonly:0,lastupdate:0,commandid:0,commandsPending:0,notificationCount:0,synctimeremaining:0,syncCount:0,in1HzCallback:false,rttlast:0,rtttotal:0,rttaverage:0,rttstack:[],bytesSent:[],bytesSentTotal:0,bytesReceived:[],bytesReceivedTotal:0,uiUpdateTimerLast:0,uiUpdateTimerTotal:0,uiUpdateTimerStack:[],prompt:function(_46,_47){
return prompt(_46,_47);
},alert:function(_48){
return alert(_48);
},debug:function(_49){
if(this.debugmode){
if(this.sayDebug){
this.say(_49);
}
if(this.stderr){
this.stderr.document.write(_49);
this.stderr.document.write("<br/>\n");
}
}
},setDebug:function(d){
if(d){
this.debugmode=d;
}else{
this.debugmode=3;
}
if((this.debugmode>0)&&(this.debugmode<=9)){
if(!this.stderr){
this.stderr=window.open("","notesoup debug output","resizable=1,scrollable=1,width=600,height=400");
}
if(!this.stderr){
alert("oops print");
}
this.debug("<link rel=\"stylesheet\" type=\"text/css\" href=\"css/debug.css\"/>");
this.debug("note soup debug log "+new Date());
}else{
this.debugmode=0;
if(this.stderr){
this.stderr.document.close();
delete this.stderr;
}
}
this.say("Debug level: "+this.debugmode);
},timeStamp:function(t,_4c){
if((typeof (t)==null)||(t=="")){
t=new Date();
}else{
if(typeof (t)=="number"){
t=new Date(t);
}else{
if(typeof (t)=="string"){
t=new Date(parseFloat(t));
}
}
}
if((typeof (_4c)==null)||(_4c=="")||(_4c=="ms-elapsed")){
return ""+Math.floor(t-notesoup.startuptime);
}
if(_4c=="time"){
var _4d="";
if(t.getHours()<10){
_4d=+"0";
}
_4d+=""+t.getHours()+":";
if(t.getMinutes()<10){
_4d+="0";
}
_4d+=""+t.getMinutes()+":";
if(t.getSeconds()<10){
_4d+="0";
}
_4d+=""+t.getSeconds();
return _4d;
}else{
var _4e=t.toString();
return _4e;
}
},sessionTime:function(){
return this.timeStamp("","");
},dump:function(obj){
return Ext.util.JSON.encode(obj);
},nextx:200,nexty:50,getNewNotePosition:function(_50){
if((_50=="random")||((_50=="switch")&&(this.countNotes()>10))){
return {x:this.nextx+Math.floor(Math.random()*300),y:this.nexty+Math.floor(Math.random()*300)};
}
var _51={x:this.nextx,y:this.nexty};
this.nextx+=25;
this.nexty+=25;
return _51;
},countNotes:function(){
var _52=0;
for(var n in this.notes){
_52++;
}
return _52;
},updateNote:function(_54){
if(this.debugmode>4){
this.debug("updatenote in: thenote="+_54.toString());
}
var _55=_54.id;
if(!_55){
this.say("Error: update without note id: "+_54.toString(),"error");
return;
}
if("deleted" in _54){
return;
}
var _56="onupdate";
var _57=true;
var _58=0;
if(_55 in this.notes){
if(this.notes[_55].editing){
delete this.notes[_55].syncme;
return;
}
for(var o in _54){
if(_54[o]!=notesoup.notes[_55][o]){
_58++;
if(this.debugmode>3){
notesoup.say("Server update: "+_58+" "+_55+"."+o+"="+_54[o]+" was="+notesoup.notes[_55][o]);
}
}
}
if(_58==0){
_57=false;
}
this.notes[_55].set(_54);
}else{
this.notes[_55]=new soupnote(_54);
_56="onload";
}
var _54=this.notes[_55];
if(!((_54.xPos>0)&&(_54.yPos>0))){
var _5a=this.getNewNotePosition(this.newNotePositionMode);
_54.set({"xPos":_5a.x,"yPos":_5a.y});
}
if(!(_54.height>0)){
_54.height=this.defaultNoteHeight;
}
if(!(_54.width>0)){
_54.width=this.defaultNoteWidth;
}
if(!("bgcolor" in _54)){
_54.bgcolor="#fff8b6";
}
delete _54.syncme;
delete _54.editing;
_54.calleventhandler(_56);
if(this.debugmode>4){
this.debug("updatenote out: thenote="+_54.toString());
}
if(_57){
if(this.syncUIOnUpdates){
_54.show();
}else{
_54.set({showme:true});
}
}
},syncUI:function(){
for(var n in this.notes){
if("showme" in this.notes[n]){
if("show" in this.notes[n]){
if(typeof (this.notes[n].show)=="function"){
this.notes[n].show();
}
}
}
}
if(this.uiUpdateTimerStart){
this.uiUpdateTimerLast=new Date().getTime()-this.uiUpdateTimerStart;
this.uiUpdateTimerTotal+=this.uiUpdateTimerLast;
this.uiUpdateTimerStack.push(this.uiUpdateTimerLast);
this.debug("UI update time="+this.uiUpdateTimerLast+" ms - run to completion");
delete this.uiUpdateTimerStart;
}
},syncToServer:function(){
var _5c=[];
for(var n in this.notes){
if(("syncme" in this.notes[n])&&this.notes[n].syncme){
delete this.notes[n].syncme;
_5c.push(this.notes[n]);
this.notes[n].syncme=true;
}
}
if(_5c.length>0){
this.postRequest({method:"savenote",params:{note:_5c,tofolder:this.foldername,notifyfolder:this.foldername}},{requestMessage:"Saving "+_5c.length+" updated notes...",successMessage:"Saved.",failureMessage:"Could not save notes."});
}else{
this.sendSync();
}
this.setSyncTimer();
},login:function(_5e,_5f){
if(_5e==null||_5e.length==0){
_5e=this.prompt("Enter username:",_5e);
if(_5e==null){
return;
}
}
if(_5f==null||_5f.length==0){
_5f=this.prompt("Enter password:",_5f);
if(_5f==null){
return;
}
}
this.newloginusername=_5e;
this.newloginpasswordhash=hex_sha1(_5f);
_5f="";
this.postRequest({method:"knockknock",params:{clientversion:this.clientVersion}},{requestMessage:"Connecting...",successMessage:"Connected.",failureMessage:"Could not connect to server."});
},completeLogin:function(_60){
if(this.newloginpasswordhash){
this.postRequest({method:"login",params:{username:this.newloginusername,passwordhash:hex_sha1(this.newloginpasswordhash+_60)}},{requestMessage:"Logging in as "+this.newloginusername+"...",successMessage:"Login succeeded...",failureMessage:"Login failure.  No soup for you."});
delete this.newloginusername;
delete this.newloginpasswordhash;
}else{
this.alert("Login phase error.","warning");
}
},logout:function(){
this.postRequest({method:"logout",params:{}},{requestMessage:"Logging out...",successMessage:"Logged out...",failureMessage:"I'm sorry, Dave, I can't let you do that."});
},saveNote:function(_61,_62){
if(this.readonly){
return;
}
this.debug("saveNote: thenote="+_61.toString());
_62=_62||this.foldername;
var _63=("notename" in _61)?_61.notename:_61.id;
delete _61.syncme;
this.postRequest({method:"savenote",params:{note:_61,tofolder:_62,notifyfolder:this.foldername}},{requestMessage:"Saving "+_63+"...",successMessage:"Saved.",failureMessage:"Could not save note "+_63});
_61.syncme=true;
},appendToNote:function(_64,_65,_66){
if(this.readonly){
return;
}
this.debug("appendToNote: thenoteid="+_65+" "+_64);
_66=_66||this.foldername;
this.postRequest({method:"appendtonote",params:{text:_64,noteid:_65,tofolder:_66,notifyfolder:this.foldername}},{requestMessage:"Updating "+_65,successMessage:"Updated.",failureMessage:"Could not update note "+_65});
},sendNote:function(_67,_68,_69,_6a){
if(_6a===undefined){
_6a=true;
}
this.postRequest({method:"sendnote",params:{noteid:_67,fromfolder:_68,tofolder:_69,notifyfolder:this.foldername,deleteoriginal:_6a}},{requestMessage:"Sending "+_67+" to "+_69,successMessage:"Sent.",failureMessage:"Could not send note."});
},sendNoteToUser:function(_6b,_6c,_6d){
if(!_6c){
_6c=prompt("Send to:","");
}
if(!_6c){
return;
}
if(_6c.search("/")<0){
_6c=_6c+"/inbox";
}
this.sendNote(_6b,notesoup.foldername,_6c,true);
},renameNote:function(_6e,_6f){
if(this.readonly){
return;
}
var _70=_6e.id;
if((_6f==null)||(_6f=="")){
_6f=this.prompt("Enter a new filename:",_70);
}
if(_6f!=null&&(_6f!="")&&(_6f!=_70)){
this.postRequest({method:"renamenote",params:{fromfolder:this.foldername,fromname:_70,toname:_6f}},{requestMessage:"Renaming "+_6e.notename+" from "+_70+" to "+_6f,successMessage:"Renamed.",failureMessage:"Could not rename note."});
}
},destroyNote:function(_71){
if(_71 in this.notes){
this.ui.deleteDOMNote(this.notes[_71]);
delete this.notes[_71];
}
},deleteNote:function(_72){
if(typeof (_72)=="object"){
_72=_72.id;
}
if(this.readonly){
return;
}
this.sendNote(_72,this.foldername,this.username+"/trash");
},erase:function(){
for(var n in this.notes){
this.deleteNote(this.notes[n].id);
}
},getUserFromFolderPath:function(_74){
return _74.split("/")[0];
},openFolder:function(_75){
if(this.useFastFolderSwitching&&(this.getUserFromFolderPath(_75)==this.username)){
this.say("Switching to folder "+_75);
this.cache[this.foldername]={data:{},lastupdate:this.lastupdate};
for(var n in this.notes){
this.cache[this.foldername]["data"][n]=this.notes[n];
}
for(var n in this.notes){
this.destroyNote(this.notes[n].id);
}
this.lastupdate=0;
this.foldername=_75;
document.title="Note Soup : "+this.foldername+"...";
if(this.foldername in this.cache){
this.say("Cache hit! Restoring...","warning");
for(var n in this.cache[this.foldername]["data"]){
this.notes[n]=this.cache[this.foldername]["data"][n];
this.notes[n]["showme"]=true;
}
this.lastupdate=this.cache[this.foldername]["lastupdate"];
this.say("Restored "+this.countNotes()+" notes "+this.lastupdate);
}
this.sendSync(this.foldername);
return;
}
if((_75==null)||(_75=="")){
_75=prompt("Enter the name of the folder to open:",_75);
}
if((_75!=null)&&(_75!="")){
this.postRequest({method:"openfolder",params:{tofolder:_75}},{requestMessage:"Connecting to folder "+_75+"...",successMessage:"Connected...",failureMessage:"Could not open folder."});
}
},createFolder:function(_77){
if((_77==null)||(_77=="")){
_77=prompt("Enter the name of the folder to create:",_77);
}
if(_77.indexOf("/")<0){
_77=this.username+"/"+_77;
}
if((_77!=null)&&(_77!="")){
this.postRequest({method:"createfolder",params:{tofolder:_77}},{requestMessage:"Creating folder "+_77+"...",successMessage:"Created.",failureMessage:"Could not create folder."});
}
},setFolderPassword:function(_78,_79){
if(_78==null||!_78.length){
_78=this.prompt("Enter folder name:",notesoup.foldername);
if(_78==null){
return;
}
}
if(_79==null||!_79.length){
_79=this.prompt("Enter new password:","");
}
this.postRequest({method:"setfolderpassword",params:{tofolder:_78,password:_79}},{requestMessage:"Setting password for "+_78+"...",successMessage:"Password set.",failureMessage:"Could not set password."});
},copyFolder:function(_7a,_7b){
if(_7a==null){
_7b=this.prompt("Copy everything from which folder:","");
}
if(_7a.split("/").length<2){
_7a=notesoup.username+"/"+_7b;
}
if(_7b==null){
_7b=this.prompt("Copy everything from"+_7a+" to folder named:","");
}
if(_7b.split("/").length<2){
_7b=notesoup.username+"/"+_7b;
}
if((_7b!=null)&&(_7b!="")){
this.postRequest({method:"copyfolder",params:{fromfolder:this.foldername,tofolder:_7b}},{requestMessage:"Copying to "+_7b+"...",successMessage:"Copied.",failureMessage:"Copy failed."});
}
},renameFolder:function(_7c,_7d){
if((_7c==null)||(_7c=="")){
_7c=this.foldername;
}
if((_7d==null)||(_7d=="")){
_7d=this.prompt("Rename folder \""+_7c+" \"to:","");
}
if((_7d!=null)&&(_7d!="")){
this.postRequest({method:"renamefolder",params:{fromfolder:_7c,tofolder:_7d}},{requestMessage:"Renaming "+_7c+" to "+_7d+"...",successMessage:"Renamed.",failureMessage:"Rename failed."});
}
},emptyTrash:function(){
this.postRequest({method:"emptytrash",params:{}},{requestMessage:"Emptying the trash...",successMessage:"The trash is empty.",failureMessage:"Failed."});
},setAccessList:function(_7e,_7f,_80){
this.postRequest({method:"setaccesslist",params:{tofolder:_7e,accessmode:_7f,accesslist:_80}},{requestMessage:"Setting "+_7f+" access list on "+_7e+" to "+_80,successMessage:"Access list updated.",failureMessage:"Could not update access list."});
},makeFolderPublic:function(_81){
this.readers="*,"+this.readers;
this.setAccessList(_81,"readers",this.readers);
},makeFolderPrivate:function(_82){
this.readers="";
this.setAccessList(_82,"readers",this.readers);
},setReaderList:function(_83){
var _84=this.prompt("Allow these users to read this folder (enter names separated by commas, or * for all):",this.readers);
if((_84!=null)&&(_84!="")){
this.readers=_84;
this.setAccessList(_83,"readers",this.readers);
}
},setEditorList:function(_85){
var _86=this.prompt("Allow these users to edit this folder (enter names separated by commas, or * for all):",this.editors);
if((_86!=null)&&(_86!="")){
this.editors=_86;
this.setAccessList(_85,"editors",this.editors);
}
},setSenderList:function(_87){
var _88=this.prompt("Allow these users to send notes to this folder (enter names separated by commas, or * for all):",this.editors);
if((_88!=null)&&(_88!="")){
this.senders=_88;
this.setAccessList(_87,"senders",this.senders);
}
},createUser:function(_89,_8a,_8b){
_8b=(_8b?1:0);
notesoup.postRequest({method:"createuser",params:{username:_89,password:_8a,stayhere:_8b}},{requestMessage:"Creating user "+_89+"...",successMessage:"New user created.",failureMessage:"Could not create user."});
},_myaflax_escape:function(str){
var s=str.split("<");
if(s.length>1){
return s.join("&lt;");
}
return str;
},folderFlash:function(str){
notesoup.postEvent(notesoup.foldername,"flash",str);
},folderShow:function(str){
notesoup.postEvent(notesoup.foldername,"show",str);
},folderSay:function(str){
notesoup.aflax.say_sent_time=new Date().getTime();
notesoup.postEvent(notesoup.foldername,"say",str);
},folderPing:function(str){
notesoup.aflax.ping_sent_time=new Date().getTime();
notesoup.postEvent(notesoup.foldername,"ping",str);
window.setTimeout("notesoup.aflax.ping_sent_time=null;",5000);
},folderSee:function(str){
this.say("Opening browser window on: "+str);
notesoup.postEvent(notesoup.foldername,"see",str);
},postEvent:function(_93,_94,arg){
notesoup.postRequest({method:"postevent",params:{tofolder:_93,op:[_94,arg,_93]}},{failureMessage:"Could not send notification."});
},oneHertzCallback:function(){
if(this.in1HzCallback){
if(notesoup.debugmode>7){
this.say("System error - 1 Hz tick underflow","error");
}
}else{
this.in1HzCallback=true;
this.ontick();
this.syncUI();
notesoup.ui.syncAll();
if(this.syncInterval>0){
if(--this.synctimeremaining<=0){
this.syncToServer();
}
}
this.in1HzCallback=false;
}
window.setTimeout("notesoup.oneHertzCallback();",1000);
},ontick:function(){
if(!notesoup.runScripts){
return;
}
for(var n in this.notes){
if(!this.notes[n]["editing"]){
this.notes[n].calleventhandler("ontick");
}
}
},setSyncTimer:function(){
this.synctimeremaining=this.syncInterval;
},sendSync:function(_97){
if(_97==null){
_97=this.foldername;
}
this.postRequest({method:"sync",params:{"fromfolder":_97,"count":""+this.syncCount++}},{failureMessage:"Could not sync with the server."});
},setRefreshInterval:function(){
var _98=this.prompt("Enter number of seconds between updates or 0 to turn off updates",this.syncInterval);
if((_98!=null)&&(_98!="")){
this.syncInterval=_98;
this.setSyncTimer();
}
},onSuccess:function(_99,_9a){
notesoup.processServerResponse(_99,_9a);
if(_9a.successProc){
window.setTimeout(_9a.successProc,20);
}
},onException:function(err){
notesoup.say("Transport exception.","error");
},onFailure:function(_9c,_9d){
notesoup.say("The server has failed to respond.","error");
if(_9d.failureMessage){
notesoup.say(_9d.failureMessage,"error");
}
if(_9d.failureProc){
window.setTimeout(_9d.failureProc,20);
}
},postRequest:function(_9e,_9f){
if(this.debugmode){
this.debug("> "+_9e["method"]);
}
_9e["id"]=this.commandid++;
if((_9e.method!="login")&&(_9e.method!="logout")){
_9e.params["lastupdate"]=""+this.lastupdate;
}
this.setSyncTimer();
try{
var _a0=Ext.util.JSON.encode(_9e);
}
catch(e){
this.alert("postRequest: error stringifying request: "+e.message+" id=",_9e["id"]);
return false;
}
if(this.debugmode>2){
this.debug(_a0);
}
var _a1=_a0.length;
this.bytesSent.push(_a1);
this.bytesSentTotal+=_a1;
var opt={url:this.apiuri,method:"POST",params:_a0,success:this.onSuccess,failure:this.onFailure};
for(var o in _9f){
opt[o]=_9f[o];
}
if(_9f.requestMessage){
this.say(_9f.requestMessage);
}
opt.starttime=new Date().getTime();
if(this.frombookmarklet){
_9e.params["method"]=_9e.method;
_9e.params["id"]=_9e.id;
if("note" in _9e.params){
_9e.params["note"]=Ext.util.JSON.encode(_9e.params["note"]);
}
var p=Ext.urlEncode(_9e.params);
var q=this.baseuri+"notesoup.php?"+p;
this.loadScript(q);
return true;
}
var a=Ext.Ajax.request(opt);
++this.commandsPending;
this.updateActivityIndicator("sync",true);
return true;
},processServerResponse:function(_a7,_a8){
notesoup.uiUpdateTimerStart=new Date().getTime();
var _a9=notesoup.uiUpdateTimerStart-_a8.starttime;
var _aa=_a7.responseText.length;
this.bytesReceived.push(_aa);
this.bytesReceivedTotal+=_aa;
if(this.debugmode>2){
this.debug("< "+_a9+" "+_a7.responseText);
}
var t1,_ac,_ad;
try{
var _ac=new Date().getTime();
_a7=Ext.util.JSON.decode(_a7.responseText);
var _ad=new Date().getTime();
var t1=Math.floor(_ad-_ac);
}
catch(e){
notesoup.say("Error parsing response body: "+e.message+" at "+e.at+":"+_a7.responseText,"error");
return;
}
this.processServerResponseObject(_a7,_a9,_a8.successMessage,_a8.failureMessage);
},processServerResponseObject:function(_ae,_af,_b0,_b1){
this.setSyncTimer();
if(_ae["error"]){
this.say("Server says, \""+_ae["error"]+"\"","error");
if(_b1!=null){
this.say(_b1,"error");
}
return;
}else{
if(_b0){
this.say(_b0);
}
}
var _b2;
try{
_b2=_ae["command"];
}
catch(e){
this.alert("Command array anomaly: "+e);
}
var cmd,arg,_b5;
if(_b2){
try{
for(i=0;i<_b2.length;i++){
cmd=_b2[i][0];
arg=_b2[i][1];
_b5="";
switch(cmd){
case "beginupdate":
break;
case "endupdate":
break;
case "updatenote":
_b5=arg["id"];
this.updateNote(arg);
break;
case "deletenote":
_b5=arg;
this.destroyNote(arg);
break;
case "setupdatetime":
_b5=arg;
this.lastupdate=arg;
break;
case "navigateto":
_b5=arg;
document.location.href=arg;
break;
case "readonlysession":
notesoup.say("Ignoring readonly command.","error");
break;
case "whosthere":
_b5=arg;
this.completeLogin(arg);
break;
case "say":
_b5=arg;
this.say(arg);
break;
case "show":
_b5=arg;
notesoup.ui.flashCenteredText(arg);
break;
case "sync":
_b5="server initiated sync";
this.sendSync();
break;
case "folderlist":
_b5="folderlist";
if("ui" in notesoup){
if("addFoldersToFolderList" in notesoup.ui){
this.folderlist=arg;
this.ui.addFoldersToFolderList(this.folderlist);
}
}
break;
default:
this.alert("Unrecognized server command: "+cmd);
break;
}
if(this.debugmode){
this.debug("< "+cmd+" "+_b5);
}
}
}
catch(e){
this.alert("Error processing "+cmd+" "+_b5+": "+e);
}
}
this.syncUI();
if(_af){
this.rttlast=_af;
this.rttstack.push(_af);
this.rtttotal=this.rtttotal+_af;
this.rttaverage=Math.floor(this.rtttotal/this.commandid);
this.debug("AJAX transport: roundtrip last="+this.rttlast+"ms average="+this.rttaverage+"ms count="+this.commandid);
}
--this.commandsPending;
this.updateActivityIndicator("sync",false);
},updateActivityIndicator:function(_b6,set){
var elt=$("activityindicator");
if(!elt){
return;
}
if(set){
if(_b6=="ontick"){
elt.src=this.imageHost+"images/famfamfam.com/lightning.png";
}else{
if(_b6=="sync"){
elt.src=this.imageHost+"images/ajax-busy.gif";
}
}
}else{
if(this.aflax&&this.aflax.connection){
elt.src=this.imageHost+"images/famfamfam.com/status_online.png";
}else{
elt.src=this.imageHost+"images/famfamfam.com/status_offline.png";
}
}
if((this.debugmode>4)&&(this.commandsPending>1)&&(_b6=="sync")){
this.debug("Commands in flight: "+this.commandsPending);
}
},getNotesOrderedBy:function(_b9,_ba,_bb){
function attrcmpgt(x,y){
return ((x.attr<y.attr)?-1:((x.attr>y.attr)?1:0));
}
function attrcmplt(x,y){
return ((x.attr>y.attr)?-1:((x.attr<y.attr)?1:0));
}
var _c0=[];
for(var n in notesoup.notes){
_c0.push({"id":n,"attr":(_b9 in notesoup.notes[n]?notesoup.notes[n][_b9]:0)});
}
_c0.sort(_ba?attrcmpgt:attrcmplt);
var _c2=[];
if(_bb==undefined){
_bb="id";
}
for(var n=0;n<_c0.length;n++){
_c2.push(notesoup.notes[_c0[n].id][_bb]);
}
return _c2;
},getNoteCount:function(){
var i=0;
for(var n in notesoup.notes){
i++;
}
return i;
},showZ:function(){
var n;
var _c6=-1;
var _c7=99999;
for(n in this.notes){
note=this.notes[n];
debug("note: "+note.id+" z="+note.zIndex+" "+typeof (note.zIndex));
z=note.zIndex;
if(typeof (z)=="string"){
z=parseInt(z);
}
if(z>_c6){
_c6=z;
}
if(z<_c7){
_c7=z;
}
}
debug("min z="+_c7+" max z="+_c6);
},getDuration:function(s){
var _c9=s.split(" ");
switch(_c9.length){
case 1:
return parseFloat(_c9[0]);
case 2:
var _ca=parseFloat(_c9[0]);
var _cb=this.getConversionToMilliseconds(_c9[1].toLowerCase());
if((_ca>=0)&&(_cb>0)){
return Math.floor(_ca*_cb);
}
default:
notesoup.say("Sorry, I don't recognize this duration: "+s);
return 0;
}
},getConversionToMilliseconds:function(_cc){
if(_cc.substring(_cc.length-1)!="s"){
_cc+="s";
}
switch(_cc){
case "milliseconds":
return 1;
case "seconds":
return 1000;
case "minutes":
return 1000*60;
case "hours":
return 1000*60*60;
case "days":
return 1000*60*60*24;
case "weeks":
return 1000*60*60*24*7;
case "fortnights":
return 1000*60*60*24*7*2;
case "months":
return 1000*60*60*24*30;
case "years":
return 1000*60*60*24*365;
default:
notesoup.say("Sorry, I don't recognize this unit of time: "+_cc);
return 0;
}
},stringifyTimeDiff:function(_cd){
var _ce=1000;
var _cf=_ce*60;
var _d0=_cf*60;
var _d1=_d0*24;
var s="";
if(_cd<0){
s+="-";
_cd=-_cd;
}
if(_cd>_d1){
s+=Math.floor(_cd/_d1)+" days ";
_cd%=_d1;
}
if(_cd>_d0){
s+=Math.floor(_cd/_d0)+" hours ";
_cd%=_d0;
}
if(_cd>_cf){
s+=Math.floor(_cd/_cf)+" minutes ";
_cd%=_cf;
}
s+=Math.floor(_cd/1000)+" seconds ";
return s;
},loadScript:function(_d3){
var _d4=document.getElementsByTagName("head")[0];
try{
var _d5=document.createElement("script");
_d5.type="text/javascript";
_d5.src=_d3;
this.say("Loading external script: "+_d3);
_d4.appendChild(_d5);
this.say("Loaded.");
}
catch(e){
this.say("Exception loading: "+_d3,"error");
dump(e);
}
},loadStyle:function(_d6){
var _d7=document.getElementsByTagName("head")[0];
try{
var _d8=document.createElement("link");
_d8.type="text/css";
_d8.rel="stylesheet";
_d8.href=_d6;
this.say("Loading external style: "+_d6);
_d7.appendChild(_d8);
this.say("Loaded.");
}
catch(e){
this.say("Exception loading: "+_d6,"error");
dump(e);
}
},stopScripts:function(){
return;
},toggleRunScripts:function(){
this.runScripts=!this.runScripts;
this.updateRunScriptsIndicator();
if(this.runScripts){
this.say("Scripts are enabled.");
}else{
this.say("Scripts are disabled.","warning");
}
},updateRunScriptsIndicator:function(){
this.ui.setRunScriptsCookie(this.runScripts?"enable":"disable");
var elt=$("scriptstatus");
if(elt){
elt.src=this.runScripts?this.imageHost+"images/famfamfam.com/plugin.png":this.imageHost+"images/famfamfam.com/plugin_disabled.png";
}
},makeBootBookmarkletNote:function(){
this.getBookmarkletNote(this.getBootBookmarkletLink());
},makeQuickNoteBookmarkletNote:function(){
this.getBookmarkletNote(this.getQuickNoteBookmarkletLink());
},getBookmarkletNote:function(s){
return this.saveNote({notename:"Bookmarklet",text:"Drag this link to the bookmark bar:<br/>"+s},this.foldername);
},getBootBookmarkletLink:function(){
return "<a href=\""+this.getBootBookmarklet()+"\">Instant Soup Bookmarklet</a>";
},getBootBookmarklet:function(){
return this.getBootBookmarkletCode(this.baseuri,"js/instantsoup.js");
},getBootBookmarkletCode:function(_db,_dc){
var _dd=["javascript:function%20boot(url){","var%20s=document.createElement('script');","s.setAttribute('language','javascript');","s.setAttribute('src',url);","document.body.appendChild(s);}","window.instantsoupbooturi='",_db,"';","boot('",_db+_dc,"');"];
return _dd.join("");
},getQuickNoteBookmarkletLink:function(){
return "<a href=\""+this.getQuickNoteBookmarkletCode()+"\">Instant Note Bookmarklet</a>";
},getQuickNoteBookmarkletCode:function(){
var _de=["javascript:function%20boot(url){","var%20s=document.createElement('script');","\ts.setAttribute('language','javascript');","\ts.setAttribute('src',url);","\tdocument.body.appendChild(s);}","var%20t=prompt('Enter%20a%20short%20note','<a%20href='+document.location+'>'+document.title+'</a>');","boot('",notesoup.baseuri,"notesoup.php?note=%7B%22notename%22%3A%22Quick%20Note%22%2C%22text%22%3A%22'+encodeURIComponent(t.replace(/^s*|s*$/g,''))+'%22%7D&tofolder=user%2Finbox&method=savenote&id=1');"];
return _de.join("");
}};
function soupnote(_df){
this.set(_df);
}
soupnote.prototype.set=function(_e0){
for(var o in _e0){
if(notesoup.debugmode>6){
notesoup.debug("soupnote.set option: "+o+" "+_e0[o]);
}
this[o]=_e0[o];
}
};
soupnote.prototype.run=function(){
return this.calleventhandler("text");
};
soupnote.prototype.eval=function(str){
if(!notesoup.runScripts){
return null;
}
try{
return eval(str);
}
catch(e){
notesoup.say("Script error: "+notesoup.dump(e)+" in "+this.id+".eval("+str+")");
}
};
soupnote.prototype.calleventhandler=function(_e3,arg){
if(!notesoup.runScripts){
return null;
}
if(_e3 in this){
if(notesoup.debugmode>6){
notesoup.debug("Event: "+this.id+"."+_e3+"="+this[_e3]);
notesoup.alert("Event: "+this.id+"."+_e3+"="+this[_e3]);
}
try{
if(typeof (this[_e3])=="string"){
return eval(Ext.util.Format.stripTags(this[_e3]));
}else{
if(typeof (this[_e3])=="function"){
return this[_e3](arg);
}else{
throw ("Unknown handler type");
}
}
}
catch(e){
notesoup.stopScripts();
notesoup.alert("Script error: "+e+" in "+this.id+"."+_e3+"..in..."+this[_e3]);
}
}
};
soupnote.prototype.toJSON=function(){
return Ext.util.JSON.encode(this);
};
soupnote.prototype.toString=function(){
return this.toJSON();
};
soupnote.prototype.getContentDiv=function(){
return $(this.id+notesoup.ui.contentSuffix);
};
soupnote.prototype.setContentDiv=function(_e5){
var t=new Ext.Template(_e5);
t.overwrite(this.getContentDiv(),this);
};
soupnote.prototype.show=function(){
if(!notesoup.ui.existsDOMNote(this)){
notesoup.ui.createDOMNote(this);
}
this.onrender();
if("showme" in this){
delete this.showme;
}
};
soupnote.prototype.save=function(_e7){
notesoup.saveNote(this,_e7);
};
soupnote.prototype.toFront=function(){
this.zIndex=notesoup.ui.getTopZ();
$(this.id+notesoup.ui.divSuffix).style.zIndex=this.zIndex;
};
soupnote.prototype.toBack=function(){
this.zIndex=0;
$(this.id+notesoup.ui.divSuffix).style.zIndex=0;
};
soupnote.prototype.append=function(_e8){
notesoup.appendToNote(_e8,this.id);
};
soupnote.prototype.flash=function(_e9){
if(notesoup.syncCount<2){
return;
}
window.setTimeout("Ext.get("+this.id+notesoup.ui.contentSuffix+").frame(\""+_e9+"\", 1);",50);
};
soupnote.prototype.bump=function(dx,dy){
var _ec=Ext.get(this.id+notesoup.ui.divSuffix);
this.xPos=Math.max(0,this.xPos+dx);
this.yPos=Math.max(0,this.yPos+dy);
_ec.moveTo(this.xPos,this.yPos,{duration:0.15});
this.skuffle(this.xPos,this.yPos);
};
soupnote.prototype.isIn=function(x,y){
return ((x>=this.xPos)&&(x<=(this.xPos+this.width))&&(y>=this.yPos)&&(y<=(this.yPos+this.height)));
};
soupnote.prototype.skuffle=function(_ef,_f0){
var _f1=this;
if(!(_f1.height>20)){
notesoup.say("OOPS: thisnote.height < 20 in skuffle: ["+_f1.height+"]");
}
var _f2=_ef+(_f1.width/2);
var _f3=_f0+(_f1.height/2);
for(var n in notesoup.notes){
if(n==_f1.id){
continue;
}
var _f5=notesoup.notes[n];
if(!(_f5.height>20)){
notesoup.say("OOPS: othernote.height < 20 in skuffle: ["+_f5.height+"]");
}
var _f6=_f5.xPos+(_f5.width/2);
var _f7=_f5.yPos+(_f5.height/2);
var _f8=_f6-_f2;
var _f9=_f7-_f3;
var _fa=Math.sqrt((_f8*_f8)+(_f9*_f9));
if(_f5.isIn(_ef,_f0)||_f5.isIn(_ef+this.width,_f0)||_f5.isIn(_ef,_f0+this.height)||_f5.isIn(_ef+this.width,_f0+this.height)){
var _fb=5;
var dx=_fb*(_f8/_fa);
var dy=_fb*(_f9/_fa);
_f5.bump(dx,dy);
}
}
};
soupnote.prototype.fields=function(){
var _fe=[];
for(var f in this){
if(typeof (this[f])!="function"){
_fe.push(f);
}
}
return _fe.sort();
};
soupnote.prototype.setRenderFunc=function(_100){
this.onrender=_100;
this.showme=true;
};
soupnote.prototype.onrender=function(){
if(notesoup.debugmode){
notesoup.debug("default-render "+this.id);
}
var _101=Ext.get(this.id);
var _102=Ext.get(this.id+notesoup.ui.divSuffix);
_102.setXY([this.xPos,this.yPos],{duration:0.8});
_102.setSize(this.width,this.height,{duration:0.8});
this.displayText=this.text||"<br/>";
if((this.notetype=="proxy")&&!(this.proxysavethrough==true)){
isHardProxy=true;
var src="";
if((this.proxyfor.substring(0,5)=="http:")||(this.proxyfor.substring(0,6)=="https:")){
src=this.proxyfor;
}else{
src="/data/soupbase/"+this.proxyfor;
}
if(notesoup.ui.isImageFile(src)){
this.displayText="<a href='"+src+"' target='_blank'><img src='"+src+"' style='width:100%;'/></a>"+this.displayText;
}else{
this.displayText=this.displayText+"<br/><a href='"+src+"' target='_blank'>"+src+"</a>";
}
}
if(this.opacity!=undefined){
_102.setStyle("opacity",""+this.opacity);
}
if(!("zIndex" in this)||(typeof (this.zIndex)!="number")||(this.zIndex<0)){
if("zIndex" in this){
notesoup.say("Bogus zIndex fixed for: "+this.id);
}
this.toFront();
}else{
_102.setStyle("zIndex",this.zIndex);
}
notesoup.ui.noteTemplate.overwrite(_101.dom,this);
delete this.displayText;
Ext.get(this.id+"_menu").on("click",notesoup.ui.showNoteMenu);
if(navigator.userAgent.search("iPhone")<0){
Ext.get(this.id+"_menu").hide();
}
};
soupnote.prototype.fieldeditor=function(){
var _104=Ext.data.Record.create([{name:"name",mapping:"name"},{name:"value",mapping:"value"}]);
var _105=this.fields();
var _106=[];
for(var i=0;i<_105.length;i++){
_106.push({name:_105[i],value:this[_105[i]]});
}
var ds=new Ext.data.Store({proxy:new Ext.data.MemoryProxy(_106),reader:new Ext.data.ArrayReader({id:"name"},_104)});
ds.load();
var cm=new Ext.grid.ColumnModel([{header:"Name",dataIndex:"name"},{header:"Value",dataIndex:"value",editor:new Ext.grid.GridEditor(new Ext.form.TextArea({grow:true,allowBlank:true}))}]);
cm.defaultSortable=true;
var f=new Ext.form.Form({labelAlign:"top",hideLabels:true});
f.fieldset({id:this.id+"_grid",legend:""});
f.addButton("Add field...",this.addfield,this);
f.addButton("Done",this.endfieldeditor,this);
var _10b=this.id+notesoup.ui.contentSuffix;
var _10c=Ext.get(_10b);
_10c.dom.innerHTML="";
f.render(_10c);
if(this.bgcolor){
$(this.id+notesoup.ui.contentSuffix).style.background=this.bgcolor;
}
var _10d=Ext.get(this.id+"_grid");
var _10e=_10d.createChild({tag:"div"});
var grid=new Ext.grid.EditorGrid(_10e,{ds:ds,cm:cm,minColumnWidth:15,autoHeight:true,autoSizeColumns:true,autoSizeHeaders:true,enableColumnMove:true,stripeRows:true,enableColLock:false});
grid.render();
grid.on("afteredit",function(o){
notesoup.say("afteredit: "+this.id+" "+o.record.get("name")+" "+o.field+" "+o.value+" "+o.originalValue+" "+o.row+" "+o.column);
var _111=o.record.get("name");
if(_111=="id"){
notesoup.renameNote(this,o.value);
}else{
notesoup.say("Setting "+_111+" to "+o.value);
this[_111]=o.value;
this.save();
}
},this);
this.editing=true;
};
soupnote.prototype.endfieldeditor=function(){
delete this.editing;
this.onrender=soupnote.prototype.onrender;
this.showme=true;
};
soupnote.prototype.addfield=function(){
var _112=notesoup.prompt("New field name:","");
if((_112.length>0)&&(!(_112 in this))){
this[_112]="";
this.showme=true;
}
};
soupnote.prototype.plaintexteditor=function(){
return this.setupeditor(true);
};
soupnote.prototype.htmleditor=function(){
return this.setupeditor(false);
};
soupnote.prototype.setupeditor=function(_113){
var e=new Ext.form.Form({labelAlign:"top",hideLabels:true});
var _115=_113?new Ext.form.TextArea({clientID:this.id,hideLabels:true,width:this.width-28,height:Math.max(100,this.height)}):new Ext.form.HtmlEditor({clientID:this.id,hideLabels:true,width:this.width-28,height:Math.max(100,this.height-85)});
_115.setValue(this.text);
e.container({},_115).hideLabels=true;
e.addButton("Save",notesoup.endhtmleditorSave,_115);
e.addButton("Cancel",notesoup.endhtmleditorCancel,_115);
var _116=this.id+notesoup.ui.contentSuffix;
var _117=Ext.get(_116);
_117.dom.innerHTML="";
e.render(_117);
this.editing=true;
};
notesoup.endhtmleditorSave=function(){
return notesoup.notes[this.clientID].endhtmleditor(true,this.getValue());
};
notesoup.endhtmleditorCancel=function(){
return notesoup.notes[this.clientID].endhtmleditor(false,"");
};
soupnote.prototype.endhtmleditor=function(_118,_119){
delete this.editing;
this.onrender=soupnote.prototype.onrender;
if(_118){
this.text=_119;
this.save();
}
this.showme=true;
};
soupnote.prototype.syncDivs=function(){
var _11a=Ext.get(this.id+"_br");
var _11b=Ext.get(this.id+notesoup.ui.divSuffix);
this.height=(_11a.getTop()+_11a.getHeight())-_11b.getTop()+1;
_11b.setHeight(this.height);
};
soupnote.prototype.xtrack=function(_11c){
var _11d=_11c.getPageX();
var _11e=Ext.get(_11c.getTarget());
var _11f=_11e.getX();
var _120=_11e.getWidth();
if((_11d<_11f)||(_11d>(_11f+_120))){
return -1;
}
var _121=100*((_11d-_11f)/_120);
notesoup.whisper(_121);
};
soupnote.prototype.getFeed=function(_122){
Ext.Ajax.request({method:"GET",url:"http://pingdog.net/getfeed/getfeed.py",params:{rssuri:_122},success:this.getFeedHandler,scope:this});
notesoup.say("Feed request sent...");
};
soupnote.prototype.getFeedHandler=function(_123,_124,_125){
if(_124){
notesoup.say("Well we got our RSS data back...");
this.text=_123.responseText;
this.show();
}else{
this.say("Error fetching feed.","error");
}
};
notesoup.$n=function(_126){
for(var n in notesoup.notes){
if(notesoup.notes[n].notename==_126){
return notesoup.notes[n];
}
}
return undefined;
};
$n=notesoup.$n;
soupnote.prototype.print=function(s){
if(!this.stdout){
var _129="Note Soup Output";
if(this.notename){
_129+=" for "+this.notename;
}
this.stdout=window.open("","notesoup-output","resizable=1,scrollable=1,width=600,height=400");
}
if(!this.stdout){
alert("oops print");
}
this.stdout.document.write(s+"<br/>\n");
};
soupnote.prototype.flushprint=function(opts){
if(this.stdout){
this.stdout.document.close();
delete this.stdout;
}
};
notesoup.ui={initialize:function(){
notesoup.alert=function(msg){
Ext.MessageBox.show({title:"Note Soup says:",msg:msg,buttons:Ext.MessageBox.OK,width:800,height:600,scope:notesoup});
return this;
},this.backgroundColorMenu=new Ext.menu.ColorMenu({id:"backgroundColorMenu",handler:function(cm,_12d){
document.body.style.background="#"+_12d;
}});
this.pageMenu=new Ext.menu.Menu({id:"pageMenu",items:[{text:"Show Folder Tree",handler:notesoup.ui.initFolderTree},{text:"Show Grid View",handler:notesoup.ui.gridview},{text:"Show Debug Console",handler:function(){
Ext.log("debugger here...");
}},"-",{text:"Erase all notes(!)",handler:function(){
notesoup.erase();
}},"-",{text:"Arrange/Tile",handler:function(){
notesoup.ui.arrangeNotes("tile");
}},{text:"Arrange/Cascade",handler:function(){
notesoup.ui.arrangeNotes("cascade");
}},{text:"Arrange/Random",handler:function(){
notesoup.ui.arrangeNotes("random");
}},"-",{text:"Bookmarklet/Instant Soup",handler:function(){
notesoup.makeBootBookmarkletNote();
}},{text:"Bookmarklet/Instant Note",handler:function(){
notesoup.makeQuickNoteBookmarkletNote();
}},"-",{text:"Set desktop color",menu:this.backgroundColorMenu,icon:notesoup.imageHost+"images/famfamfam.com/color_wheel.png"}]});
this.colorMenu=new Ext.menu.ColorMenu({id:"colorMenu",handler:function(cm,_12f){
notesoup.ui.handleColorMenuPick(_12f);
}});
this.noteMenu=new Ext.menu.Menu({id:"noteMenu",items:[{text:"Edit Note",handler:function(e){
notesoup.ui.getTargetNote().toFront();
notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.htmleditor);
},icon:notesoup.imageHost+"images/famfamfam.com/note_edit.png"},{text:"Edit Note as Text",handler:function(e){
notesoup.ui.getTargetNote().toFront();
notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.plaintexteditor);
},icon:notesoup.imageHost+"images/famfamfam.com/note_edit.png"},{text:"Edit Title",handler:function(){
notesoup.ui.editTitle(notesoup.ui.getTargetNote());
},icon:notesoup.imageHost+"images/famfamfam.com/tag_blue_edit.png"},{text:"Edit Note Fields",handler:function(){
notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.fieldeditor);
},icon:notesoup.imageHost+"images/famfamfam.com/tag_blue_edit.png"},"-",{text:"Set Background",menu:this.colorMenu,icon:notesoup.imageHost+"images/famfamfam.com/color_wheel.png"},"-",{text:"Duplicate Note",handler:function(){
notesoup.sendNote(notesoup.targetNote,notesoup.foldername,notesoup.foldername,false);
},icon:notesoup.imageHost+"images/famfamfam.com/note_add.png"},"-",{text:"Send as email...",handler:function(){
var _132=notesoup.notes[notesoup.targetNote].text||"";
_132=_132.replace(/<br\/>/g,"");
document.location.href="mailto:?"+Ext.urlEncode({subject:notesoup.notes[notesoup.targetNote].notename||"",body:_132});
},icon:notesoup.imageHost+"images/famfamfam.com/user_go.png"},"-",{text:"Run as Script",handler:function(){
notesoup.notes[notesoup.targetNote].run();
},icon:notesoup.imageHost+"images/famfamfam.com/application_go.png"},"-",{text:"Send to Trash",handler:function(){
notesoup.deleteNote(notesoup.targetNote);
},icon:notesoup.imageHost+"images/famfamfam.com/note_delete.png"}]});
this.showNoteMenu=function(e){
e.stopEvent();
var node=e.target;
while(node!=document.body){
if(node.className=="note"){
notesoup.targetNote=node.id;
notesoup.ui.noteMenu.showAt(e.getXY());
return;
}
node=node.parentNode;
}
notesoup.ui.pageMenu.showAt(e.getXY());
};
Ext.get(document.body).on("contextmenu",notesoup.ui.showNoteMenu);
this.newNoteMenu=new Ext.menu.Menu({id:"newNoteMenu",tooltip:{title:"New Note Menu",text:"Click to create a new note"},items:[{text:"My card...",handler:function(){
notesoup.sendNote("bizcard","user/templates",notesoup.foldername,false);
},icon:notesoup.imageHost+"images/famfamfam.com/note_add.png"},{text:"Clock",handler:function(){
notesoup.sendNote("clock","user/templates",notesoup.foldername,false);
},icon:notesoup.imageHost+"images/famfamfam.com/note_add.png"},{text:"Timer",handler:function(){
notesoup.sendNote("timer","user/templates",notesoup.foldername,false);
},icon:notesoup.imageHost+"images/famfamfam.com/note_add.png"},{text:"The Button",handler:function(){
notesoup.sendNote("button","user/templates",notesoup.foldername,false);
},icon:notesoup.imageHost+"images/famfamfam.com/note_add.png"},{text:"Personalize the Workspace",handler:function(){
notesoup.sendNote("workspacebackground","user/templates",notesoup.foldername,false);
},icon:notesoup.imageHost+"images/famfamfam.com/note_add.png"},{text:"Latency",handler:function(){
notesoup.sendNote("latency","user/templates",notesoup.foldername,false);
},icon:notesoup.imageHost+"images/famfamfam.com/note_add.png"}]});
this.tbColorMenu=new Ext.menu.ColorMenu({handler:function(cm,_136){
if(typeof (_136)=="object"){
return;
}
notesoup.ui.defaultNoteColor="#"+_136.toString();
notesoup.say("Default color set to: "+notesoup.ui.defaultNoteColor);
notesoup.ui.commandbar.getEl().dom.style.background=notesoup.ui.defaultNoteColor;
notesoup.ui.commandbar.focus();
}});
this.commandbar=new Ext.form.TextField({width:700,fieldClass:"commandbar"});
this.commandbar.setValue("Welcome to Note Soup...");
this.filterbar=new Ext.form.TextField({width:200,fieldClass:"commandbar"});
this.tb=new Ext.Toolbar("toolbar",[],{width:200});
this.tb.add({text:"&nbsp;&nbsp;&nbsp;&nbsp;",icon:notesoup.imageHost+"images/famfamfam.com/note_add.png",menu:this.newNoteMenu},new Ext.Toolbar.Separator(),{text:"&nbsp;&nbsp;&nbsp;&nbsp;",icon:notesoup.imageHost+"images/famfamfam.com/color_wheel.png",menu:this.tbColorMenu},new Ext.Toolbar.Separator(),new Ext.Toolbar.Spacer(),new Ext.Toolbar.Button({text:"&nbsp;&nbsp;&nbsp;",icon:notesoup.imageHost+"images/famfamfam.com/accept.png",handler:function(){
notesoup.doCommand(notesoup.ui.commandbar.getValue());
}}),new Ext.Toolbar.Spacer(),new Ext.Toolbar.Spacer(),this.commandbar,new Ext.Toolbar.Spacer(),new Ext.Toolbar.Spacer(),new Ext.Toolbar.Spacer(),new Ext.Toolbar.Spacer(),"-",new Ext.Toolbar.Spacer(),new Ext.Toolbar.Spacer(),"Filter:",this.filterbar,new Ext.Toolbar.Button({text:"&nbsp;&nbsp;&nbsp;",icon:notesoup.imageHost+"images/famfamfam.com/cancel.png",handler:function(){
notesoup.ui.filterNotes("");
}}));
this.commandbarEl=this.commandbar.getEl();
this.commandbarEl.on("keyup",this.commandBarWatcher);
this.commandbar.focus();
this.filterbarEl=this.filterbar.getEl();
this.filterbarEl.on("keyup",this.filterBarWatcher);
if(!("folderlist" in notesoup)){
notesoup.folderlist=["inbox","trash","wx"];
}
this.folderMenu=new Ext.menu.Menu({id:"folderMenu",items:[{text:"New Folder...",handler:function(){
notesoup.createFolder();
},icon:notesoup.imageHost+"images/famfamfam.com/folder_add.png"},{text:"Open Folder",handler:function(){
notesoup.openFolder(notesoup.targetFolder);
},icon:notesoup.imageHost+"images/famfamfam.com/folder_go.png"},"-",{text:"Copy Folder to...",handler:function(){
notesoup.copyFolder(notesoup.targetFolder,null);
},icon:notesoup.imageHost+"images/famfamfam.com/folder_add.png"},{text:"Rename Folder...",handler:function(){
notesoup.renameFolder();
},icon:notesoup.imageHost+"images/famfamfam.com/folder_edit.png"},"-",{text:"Set Folder Password...",handler:function(){
notesoup.setFolderPassword(notesoup.targetFolder);
},icon:notesoup.imageHost+"images/famfamfam.com/lock.png"},"-",{text:"Empty the Trash",handler:function(){
notesoup.emptyTrash();
},icon:notesoup.imageHost+"images/famfamfam.com/database_delete.png"},"-",{text:"Logout",handler:function(){
notesoup.logout();
},icon:notesoup.imageHost+"images/famfamfam.com/disconnect.png"},]});
Ext.QuickTips.init();
notesoup.ui.defaultNoteColor="#FFFF30";
notesoup.ui.getRunScriptsCookie();
notesoup.marquee.push("Type here and press Enter to create a note..........");
this.noteTemplate=new Ext.Template(this.noteTemplateSource);
this.rawnoteTemplate=new Ext.Template(this.rawnoteTemplateSource);
},initFolderTree:function(){
var _137="foldertree";
$(_137).innerHTML="<div class=\"commandbar\"><center>my soup</center></div><hr/><div id=\"foldertreewindow\"></div>";
$(_137).style.zIndex=20000;
$(_137).style.background="#fafaff";
$(_137).style.opacity=0.6;
var _138=new Ext.Resizable(_137,{pinned:false,width:200,height:400,minWidth:50,minHeight:50,preserveRatio:false,handles:"se",draggable:true,widthIncrement:10,heightIncrement:10,dynamic:true});
var _139=new Ext.tree.TreePanel("foldertreewindow",{rootVisible:false,animate:true,enableDD:true,enableDrop:true,containerScroll:true});
var root=new Ext.tree.TreeNode({allowDrag:false,allowDrop:false});
_139.setRootNode(root);
var _13b=root.appendChild(new Ext.tree.TreeNode({text:"private folders",cls:"foldertree",allowDrag:false,allowDrop:true}));
for(var i=0;i<notesoup.folderlist.length;i++){
var node=_13b.appendChild(new Ext.tree.TreeNode({text:notesoup.folderlist[i],iconCls:"a-folder",leaf:true,allowDrag:true,allowDrop:true}));
node.on("click",function(node,evt){
evt.stopEvent();
var _140=this.text;
if(_140.split("/").length<2){
_140=notesoup.username+"/"+_140;
}
notesoup.openFolder(_140);
},node);
}
var _141=root.appendChild(new Ext.tree.TreeNode({text:"shared folders",leaf:false,cls:"foldertree",allowDrag:false,allowDrop:true}));
var node=_141.appendChild(new Ext.tree.TreeNode({text:"shared",leaf:true,allowDrag:true,allowDrop:true}));
var _142=root.appendChild(new Ext.tree.TreeNode({text:"public folders",leaf:false,cls:"foldertree",allowDrag:false,allowDrop:true}));
var node=_142.appendChild(new Ext.tree.TreeNode({text:"public",leaf:true,allowDrag:true,allowDrop:true}));
var _143=root.appendChild(new Ext.tree.TreeNode({text:"people",leaf:false,cls:"foldertree",allowDrag:false,allowDrop:true}));
var node=_143.appendChild(new Ext.tree.TreeNode({text:"harry@seattle.net",leaf:true,allowDrag:true,allowDrop:true}));
var node=_143.appendChild(new Ext.tree.TreeNode({text:"sally@speakeasy.net",leaf:true,allowDrag:true,allowDrop:true}));
_139.render();
root.expandChildNodes(true);
_139.on("dragdrop",function(tree,node,_146,evt){
notesoup.say("tree dragdrop for "+node.text);
});
_139.on("dragenter",function(){
notesoup.say("dragenter");
},_139);
_139.on("dragover",function(){
notesoup.say("dragover");
},_139);
_139.on("nodedragover",function(){
notesoup.say("tree nodedragover");
},_139);
_139.on("beforenodedrop",function(_148){
notesoup.say("tree beforenodedrop");
return true;
});
_139.on("nodedrop",function(_149){
notesoup.say("tree nodedrop");
});
_139.on("contextmenu",function(node,evt){
notesoup.say("tree context menu for "+node.text);
notesoup.targetFolder=node.text;
evt.stopEvent();
notesoup.ui.folderMenu.showAt(evt.getXY());
},_139);
},trimTrailingString:function(id,_14d){
var _14e=id.lastIndexOf(_14d);
if(_14e<0){
return id;
}
if(_14e==(id.length-_14d.length)){
id=id.substring(0,id.length-_14d.length);
}
return (id);
},divSuffix:"-rzwrap",contentSuffix:"_content",getTargetNote:function(){
return notesoup.notes[notesoup.targetNote];
},getNoteIDFromWindowID:function(id){
return (this.trimTrailingString(id,this.divSuffix));
},getFolderIDFromFolderListID:function(id){
var _151=this.trimTrailingString(id,"_folder");
if(_151.split("/").length==1){
if(_151[0]!="/"){
_151=notesoup.username+"/"+_151;
}else{
_151=_151.substring(1,_151.length);
}
}
return _151;
},existsDOMNote:function(_152){
return ($(_152.id+this.divSuffix));
},createDOMNote:function(_153,_154){
if(notesoup.debugmode){
notesoup.debug("createDOMnote "+_153.id+" "+_153.zIndex);
}
var item=document.createElement("div");
item.setAttribute("id",_153.id);
item.className="note";
item.style.left=0;
item.style.top=0;
document.body.appendChild(item);
var _156=new Ext.Resizable(_153.id,{wrap:true,pinned:false,width:_153.width,height:_153.height,minWidth:50,minHeight:50,preserveRatio:false,handles:"e",draggable:true,widthIncrement:10,heightIncrement:10,dynamic:true});
var _157=_156.getEl();
_153.flash("#ffff00");
_157.on("dblclick",function(e){
var _159=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.id)];
_159.toFront();
_159.setRenderFunc(e.shiftKey?soupnote.prototype.plaintexteditor:soupnote.prototype.htmleditor);
});
_157.on("click",function(e){
var _15b=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.id)];
_15b.toFront();
});
_156.on("resize",function(_15c,_15d,_15e,_15f){
var _160=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
_160.width=_15d;
_160.height=_15e;
_160.save();
});
_156.on("beforeresize",function(_161,_162){
var _163=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
_163.toFront();
return true;
});
_156.dd.b4StartDrag=function(e){
var _165=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this._domRef.id)];
_165.toFront();
notesoup.drag={id:_165.id,start:new Date().getTime(),x:this.initPageX,y:this.initPageY};
return true;
};
_156.dd.addToGroup("TreeDD");
_156.dd.onDrag=function(e){
var _167=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this._domRef.id)];
var d=notesoup.drag;
d.end=new Date().getTime();
d.deltat=notesoup.drag.end-notesoup.drag.start;
d.deltax=this.lastPageX-d.x;
d.x=this.lastPageX;
d.deltay=this.lastPageY-d.y;
d.y=this.lastPageY;
d.dbar=Math.sqrt((d.deltax*d.deltax)+(d.deltay*d.deltay));
d.velocity=d.dbar/(d.deltat/1000);
return true;
};
_156.dd.onDragDrop=function(e,_16a){
e.stopEvent();
var _16b=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
var _16c=Ext.get(_16b.id+notesoup.ui.divSuffix);
var _16d=(typeof (_16a)=="string")?_16a:_16a[0].handleElId+"***";
var _16e=parseInt(_16c.getLeft());
var _16f=parseInt(_16c.getTop());
_16b.xPos=_16e;
_16b.yPos=_16f;
var d=notesoup.drag;
if(e.shiftKey&&d.velocity>20){
if(d.velocity>300){
d.velocity=300;
}
var dx=d.velocity*(d.deltax/d.dbar);
var dy=d.velocity*(d.deltay/d.dbar);
_16b.xPos=Math.max(0,_16e+dx);
_16b.yPos=Math.max(0,_16f+dy);
_16c.moveTo(_16b.xPos,_16b.yPos,true);
}
_16b.set({syncme:true});
};
_156.dd.onInvalidDrop=function(e,_174){
var _175=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
var _176=Ext.get(_175.id+notesoup.ui.divSuffix);
var _177=null;
notesoup.say("Dropping "+_175.id+" on "+_177);
var _178=parseInt(_176.getLeft());
var _179=parseInt(_176.getTop());
_175.xPos=_178;
_175.yPos=_179;
var d=notesoup.drag;
if(d.velocity>20){
if(d.velocity>300){
d.velocity=300;
}
var dx=d.velocity*(d.deltax/d.dbar);
var dy=d.velocity*(d.deltay/d.dbar);
_175.xPos=Math.max(0,_178+dx);
_175.yPos=Math.max(0,_179+dy);
_176.moveTo(_175.xPos,_175.yPos,true);
}
_175.save();
notesoup.ui.commandbar.focus();
return true;
};
_156.dd.onDragOver=_156.dd.onDragEnter=function(e,ids){
if(e.shiftKey){
var _17f=notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
_17f.skuffle(this.lastPageX,this.lastPageY);
}
return true;
};
_156.dd.onDragOut=function(e,ids){
return true;
};
},noteTemplateSource:["<div class=\"x-box-tl\"><div class=\"x-box-tr\">","<div class=\"x-box-tc\"></div>","</div></div>","<div class=\"x-box-ml\"><div class=\"x-box-mr\"><div class=\"x-box-mc\">","<div class=\"notetitle\">{notename}","<img id=\"{id}_menu\""," src=\"",notesoup.baseuri,"images/famfamfam.com/bullet_arrow_down.png\""," style=\"float:right;cursor:pointer;\"/>","</div>","<div class=\"notebody\" id=\"{id}_content\" ","style=\"background:{bgcolor};\">{displayText}</div>","</div></div></div>","<div class=\"x-box-bl\"><div class=\"x-box-br\" id=\"{id}_br\"><div class=\"x-box-bc\"></div></div></div>"],rawnoteTemplateSource:["<div style=\"border: 1px solid gray;\">","<div class=\"notetitle\">{notename}","<img id=\"{id}_menu\""," src=\"images/famfamfam.com/bullet_arrow_down.png\""," style=\"float:right;cursor:pointer;\"/>","</div>","<div class=\"notebody\" id=\"{id}_content\" ","style=\"background:{bgcolor};\">{displayText}</div>","</div>","<div class=\"x-box-br\" id=\"{id}_br\"></div>"],syncAll:function(){
for(var n in notesoup.notes){
notesoup.notes[n].syncDivs();
}
},getTopZ:function(){
var topz=-99999;
for(var n in notesoup.notes){
if(!("zIndex" in notesoup.notes[n])||(typeof (notesoup.notes[n].zIndex)!="number")){
notesoup.notes[n].zIndex=0;
}
if(notesoup.notes[n].zIndex>topz){
topz=notesoup.notes[n].zIndex;
}
}
if(typeof (topz)!="number"){
notesoup.say("OOPS! topz");
return 10101;
}
return (topz<0)?0:topz+1;
},deleteDOMNote:function(_185){
var _186=Ext.get(_185.id+this.divSuffix);
_185.flash("#808080");
_186.fadeOut({remove:true,duration:0.8});
},handleColorMenuPick:function(_187){
if(typeof (_187)=="object"){
return;
}
var _188=notesoup.ui.getTargetNote();
_188.set({"bgcolor":"#"+_187.toString()});
_188.save();
_188.show();
},editTitle:function(){
var _189=notesoup.ui.getTargetNote();
Ext.MessageBox.show({title:"Edit Note Name",msg:"Enter a new title for this note:",scope:_189,value:_189.notename,width:300,buttons:Ext.MessageBox.OKCANCEL,prompt:true,multiline:false,fn:function(btn,text){
if(btn=="ok"){
this.notename=text;
this.save();
this.show();
}
}});
},arrangeNotes:function(_18c,_18d){
_18d=_18d?_18d:"yPos";
var x=10;
var y=40;
var z=1;
var _191={windowWidth:Ext.lib.Dom.getViewWidth(),windowHeight:Ext.lib.Dom.getViewHeight()};
switch(_18c.toLowerCase()){
case "cascade":
var _192=notesoup.getNotesOrderedBy(_18d,true,"id");
for(var i=0;i<_192.length;i++){
notesoup.notes[_192[i]].set({"xPos":x,"yPos":y,"zIndex":z,"showme":true,"syncme":true});
x+=40;
y+=40;
z+=1;
}
break;
case "tile":
var maxy=0;
var _192=notesoup.getNotesOrderedBy(_18d,true,"id");
for(var i=0;i<_192.length;i++){
n=_192[i];
var w="width" in notesoup.notes[n]?notesoup.notes[n].width:100;
if(typeof (w)=="string"){
w=parseInt(w);
}
if((x+w)>_191.windowWidth){
x=10;
y=maxy+10;
}
notesoup.notes[n].set({xPos:x,yPos:y,showme:true,syncme:true});
var h=notesoup.notes[n].height;
if(typeof (h)=="string"){
alert("wtf");
}
if((y+h)>maxy){
maxy=y+h;
}
x+=(w+10);
}
break;
default:
for(var n in notesoup.notes){
notesoup.notes[n].set({"xPos":Math.floor(Math.random()*(_191.windowWidth)),"yPos":Math.floor(Math.random()*(_191.windowHeight)),"zIndex":Math.floor(Math.random()*100),"showme":true,"syncme":true});
}
break;
}
},isImageFile:function(_198){
if(_198==undefined){
return false;
}
var _199=[".png$",".jpg$",".gif$"];
for(var i=0;i<_199.length;i++){
var t=new RegExp(_199[i]);
if(t.test(_198.toLowerCase())){
return true;
}
}
return false;
},getRunScriptsCookie:function(){
notesoup.runScripts=true;
return;
},setRunScriptsCookie:function(_19c){
throw "up";
}};
notesoup.notificationCount=0;
notesoup.notificationLife=5000;
notesoup.ui.onClickNotification=function(e){
var item=Ext.get(e.target);
if(item.dom.className.indexOf("frozen")<0){
item.addClass("frozen");
}else{
$("notificationwindow").removeChild(item.dom);
}
};
notesoup.ui.onNotificationTimeout=function(id){
if($(id).className.indexOf("frozen")<0){
$("notificationwindow").removeChild($(id));
}
};
notesoup.say=function(s,_1a1){
_1a1=_1a1||"info";
window.status=s;
if(_1a1=="info"){
return;
}
var item=document.createElement("div");
var id="notification"+notesoup.notificationCount++;
item.setAttribute("id",id);
item.className="notificationitem";
switch(_1a1){
case "warning":
item.style.background="#ffff00";
break;
case "error":
item.style.background="#ff0000";
break;
case "tell":
item.style.background="#aaaaff";
break;
default:
break;
}
item.innerHTML=s;
$("notificationwindow").appendChild(item);
Ext.get(item).on("click",function(e){
notesoup.ui.onClickNotification(e);
});
window.setTimeout("notesoup.ui.onNotificationTimeout(\""+id+"\");",notesoup.notificationLife);
};
function $(_1a5){
if(typeof _1a5=="string"){
_1a5=document.getElementById(_1a5);
}
return _1a5;
}
notesoup.ui.gridview=function(){
var _1a6=Ext.data.Record.create([{name:"notename",mapping:"notename"},{name:"id",mapping:"id"},{name:"bgcolor",mapping:"bgcolor"},{name:"xPos",mapping:"xPos"},{name:"yPos",mapping:"yPos"},{name:"zIndex",mapping:"zIndex"},{name:"width",mapping:"width"},{name:"height",mapping:"height"},{name:"text",mapping:"text"},{name:"proxyfor",mapping:"proxyfor"},{name:"editing",mapping:"editing"},{name:"syncme",mapping:"syncme"},{name:"showme",mapping:"showme"}]);
var _1a7=[];
for(var n in notesoup.notes){
_1a7.push(notesoup.notes[n]);
}
var ds=new Ext.data.Store({proxy:new Ext.data.MemoryProxy(_1a7),reader:new Ext.data.ArrayReader({id:"id"},_1a6)});
ds.load();
var cm=new Ext.grid.ColumnModel([{header:"Title",dataIndex:"notename",width:30,sortable:true,editor:new Ext.grid.GridEditor(new Ext.form.TextField({allowBlank:false}))},{header:"ID / Filename",dataIndex:"id",width:10,sortable:true},{header:"Color",dataIndex:"bgcolor",width:10,sortable:true},{header:"xPos",dataIndex:"xPos",width:10,sortable:true},{header:"yPos",dataIndex:"yPos",width:10,sortable:true},{header:"zIndex",dataIndex:"zIndex",width:10,sortable:true,editor:new Ext.grid.GridEditor(new Ext.form.NumberField({allowBlank:false,allowNegative:false,maxValue:10}))},{header:"width",dataIndex:"width",width:10,sortable:true},{header:"height",dataIndex:"height",width:10,sortable:true},{header:"text",dataIndex:"text",width:100,sortable:true,multiline:true},{header:"proxyfor",dataIndex:"proxyfor",width:50,sortable:true},{header:"editing",dataIndex:"editing",width:10,sortable:true},{header:"syncme",dataIndex:"syncme",width:10,sortable:true},{header:"showme",dataIndex:"showme",width:10,sortable:true}]);
var grid=new Ext.grid.EditorGrid("notegrid",{ds:ds,cm:cm,minColumnWidth:15,autoSizeColumns:true,autoSizeHeaders:true,enableColumnMove:true,stripeRows:true,enableColLock:false});
grid.render();
$("notegrid").style.zIndex=65535;
$("notegrid").style.opacity=0.9;
$("notegrid").style.background="#f8f8ff";
};
notesoup.ui.filterBarWatcher=function(_1ac){
notesoup.ui.filterNotes(notesoup.ui.filterbar.getValue());
};
notesoup.ui.filterNotes=function(_1ad){
var reg=new RegExp(_1ad,"i");
var _1af=(_1ad.length>0)?function(_1b0){
return (reg.test(_1b0.text)||reg.test(_1b0.notename));
}:function(_1b1){
return true;
};
for(var n in notesoup.notes){
var _1b3=notesoup.notes[n];
var elt=Ext.get(n+notesoup.ui.divSuffix);
if(_1af(_1b3)){
elt.setOpacity(_1b3.opacity);
elt.setStyle("zIndex",_1b3.zIndex);
}else{
elt.setStyle("opacity",0.2);
elt.setStyle("zIndex",0);
}
}
};
notesoup.ui.commandBarWatcher=function(_1b5){
if(_1b5.keyCode==13){
var _1b6=notesoup.ui.commandbar.getValue();
notesoup.ui.commandbar.setValue("");
if(_1b6.length>0){
notesoup.ui.lastCommand=_1b6;
notesoup.doCommand(_1b6);
}
}else{
if((_1b5.keyCode==38)&&((_1b5.ctrlKey)||(_1b5.altKey))){
notesoup.ui.commandbar.setValue(notesoup.ui.lastCommand);
}else{
if((_1b5.keyCode==27)&&notesoup.frombookmarklet){
notesoup.destroy();
}
}
}
};
notesoup.doCommand=function(cmd){
this.doCommandWorker(cmd);
};
notesoup.doCommandWorker=function(cmd){
for(var i=0;i<this.registeredCommands.length;i++){
var ctab=this.registeredCommands[i];
var _1bb=ctab[0];
var _1bc=ctab[1];
var _1bd=ctab[2];
if(_1bb.length&&(cmd.substring(0,_1bb.length)==_1bb)){
if(cmd[0]=="/"){
var arg=cmd.substring(_1bb.length,cmd.length);
if(arg[0]==" "){
arg=arg.substring(1,arg.length);
}
return (_1bd.apply)(notesoup,[arg]);
}else{
return (_1bd.apply)(notesoup,[cmd]);
}
}
}
return notesoup.createNoteFromSlashDelimitedLines(cmd);
};
notesoup.cmdShowHelp=function(cmd){
var _1c0=notesoup.registeredCommands;
var _1c1="<h3><b><center>Cheat Sheet: Things You Can Do In The Command Bar</center></b></h3>";
_1c1+="<span style=\"font-size:0.6em;\"><center>(click on this to make it stay visible)</center></span>";
var _1c2="<table style=\"font-size:0.8em;\">";
for(var i=0;i<_1c0.length;i++){
_1c2+="<tr><td style=\"width:20%\"><b>"+_1c0[i][0]+"</b></td><td><i>"+_1c0[i][1]+"</i></td></tr>";
}
_1c2+="</table>";
if(notesoup.readonly){
notesoup.say(_1c1+"<hr/>"+_1c2);
}else{
_1c1="<h2><b><center>Things You Can Do<br>In The Command Bar</center></b></h2>";
this.saveNote({"notename":"<b><center>Cheat Sheet</center></b>","text":_1c1+"<hr/>"+_1c2,"bgcolor":"#aaffaa","width":"350"},notesoup.foldername);
}
};
notesoup.cmdNotRecognized=function(cmd){
this.say("No command handler for: "+cmd);
this.cmdShowHelp(cmd);
};
notesoup.evaljs=function(cmd){
try{
notesoup.say("Evaluating: "+cmd.substring(1));
var _1c6=eval(cmd.substring(1));
if(_1c6!=undefined){
notesoup.say(_1c6);
}
}
catch(e){
notesoup.say("Script error: "+e+" in:"+cmd.substring(1),"error");
return false;
}
return true;
};
notesoup.createBookmark=function(cmd){
var _1c8={"bgcolor":notesoup.ui.defaultNoteColor,"width":"250","height":"100"};
_1c8.notename=notesoup.prompt("Enter a title:",cmd);
_1c8.notetype="proxy";
_1c8.proxyfor=cmd||notesoup.prompt("Enter the URL:",cmd);
notesoup.saveNote(_1c8,notesoup.foldername);
return true;
};
notesoup.cmdAppendText=function(cmd){
var _1ca=cmd.split("/");
_1ca[0]=_1ca[0].substring(2,_1ca[0].length);
var _1cb=_1ca[0];
var note=$n(_1cb);
if(note){
notesoup.say("Updating "+_1cb+"...");
var _1cd="";
for(var i=1;i<_1ca.length;i++){
_1cd+=_1ca[i]+"\n";
}
$(note.id+notesoup.ui.divSuffix).style.zIndex=notesoup.ui.getTopZ();
notesoup.appendToNote(_1cd+"<br>\n",note.id,notesoup.foldername);
return true;
}else{
return notesoup.createNoteFromSlashDelimitedLines(cmd);
}
};
notesoup.createNoteFromSlashDelimitedLines=function(cmd){
var _1d0={"bgcolor":notesoup.ui.defaultNoteColor,"width":"250","height":"100"};
var _1d1=cmd.split("/");
_1d0.notename=_1d1[0];
_1d0.text="";
for(var i=1;i<_1d1.length;i++){
_1d0.text+=_1d1[i]+"<br/>\n";
}
if(notesoup.debugmode>2){
notesoup.debug("doCommand: thenote="+_1d0.toString());
}
notesoup.saveNote(_1d0,notesoup.foldername);
return true;
};
notesoup.registeredCommands=[["","<b>To create a note type:<br>title/line 1/line 2... then press Enter.</b>",""],["=","Evaluate javascript expression",notesoup.evaljs],["??","Open a wikipedia search window",function(cmd){
window.open("http://en.wikipedia.org/wiki/Special:Search?go=Go&search="+cmd.substring(2),"Search","",false);
return true;
}],["?","Open a google search window",function(cmd){
window.open("http://www.google.com/search?q="+cmd.substring(1),"Search","",false);
return true;
}],[">>",">>note/text appends text to note",notesoup.cmdAppendText],["http://","Create a bookmark (paste a URL and press Enter)",notesoup.createBookmark],["https://","Create a bookmark",notesoup.createBookmark]];
notesoup.ui.setDefaultNoteColor=function(_1d5){
_1d5="#"+_1d5.toString();
notesoup.ui.defaultNoteColor=_1d5;
this.commandbar.focus();
};
notesoup.tips=["Type title/line 1/line 2/... to create a note.","To edit a note, click the little gray triangle.","Try clicking on the little gray triangles.","Click the \"?\" icon for help on commands.","Type /help for help on commands.","Hover the mouse over any icon for help.","The little gray triangles are menus.  Click on them.","The green messages will stay put if you click on them.","When finished editing a note, press Alt+S to save your changes!","Eat your soup.  It's good for you."];
notesoup.getTip=function(){
return "Tip: "+this.tips[Math.floor(Math.random()*this.tips.length)];
};
notesoup.whisper=notesoup.setCommandBar=function(str){
if(str==undefined){
str=this.getTip();
}
notesoup.ui.commandbar.setValue(str);
};
notesoup.marquee={payload:"",offset:0,interval:40,longinterval:1000,starttime:0,endtime:0,push:function(_1d7){
var _1d8=(notesoup.marquee.payload.length>0);
notesoup.marquee.payload+="\n"+_1d7;
if(!_1d8){
notesoup.marquee.update();
notesoup.marquee.starttime=new Date().getTime();
}
},update:function(){
if(notesoup.marquee.offset>=notesoup.marquee.payload.length){
notesoup.marquee.payload="";
notesoup.marquee.offset=0;
notesoup.ui.commandbar.setValue("");
notesoup.marquee.endtime=new Date().getTime();
return;
}
if(notesoup.marquee.payload[notesoup.marquee.offset]=="["){
notesoup.say("found [");
notesoup.marquee.offset++;
notesoup.marquee.offset++;
notesoup.doCommand(notesoup.ui.commandbar.getValue());
}else{
if(notesoup.marquee.payload[notesoup.marquee.offset]=="\n"){
notesoup.marquee.payload=notesoup.marquee.payload.substring(notesoup.marquee.offset+1);
notesoup.marquee.offset=0;
window.setTimeout("notesoup.marquee.update();",notesoup.marquee.longinterval);
return;
}else{
notesoup.ui.commandbar.setValue(notesoup.marquee.payload.substring(0,notesoup.marquee.offset+1));
notesoup.marquee.offset++;
}
}
window.setTimeout("notesoup.marquee.update();",notesoup.marquee.interval);
}};

