# Bounce

###Descriere
Aplicatie web de tip chat cu gruparea utilizatorilor in camere ce permite trimiterea mesajelor text prin websockets si apelarea audio-video a unei persoane din lista folosind WebRTC.
###Demo: [https://vimeo.com/131300153](https://vimeo.com/131300153)
###Tehnologii si biblioteci folosite
* Node.js (express)
* MongoDB
* Socket.io
* WebRTC ([adapter.js](https://github.com/Temasys/AdapterJS) pentru Angular.js)
* Angular.js
* SASS

##Instalare

###Setup local (linux/osx OS)
Este necesara instalarea urmatoarelor pachete
- __Nodejs__
- __Npm__
- __MongoDB__
- __ruby__, __ruby-dev__
- __compass__ (gem install compass)
- __build-essentials__ (in functie de system-ul de operare pachetul poate avea alt nume)

Urmatorii pasi pentru instalare sunt:

- `git clone _git@github.com:bogdancernat/licenta.git`
- `cd _folder-proiect_`
- `npm install`
- `bower install` ([http://bower.io/](http://bower.io/))
- `cp config-example.json config.json`
- `cp pm2-example.json pm2.json`
- `node bin/www` sau `pm2 start pm2.json` (`npm install pm2 -g` [https://github.com/Unitech/pm2](https://github.com/Unitech/pm2))


###Limitari
Aplicatia a fost testata pe __Google Chrome v.43__ (Desktop / Android), __Firefox v.38__ (Desktop / Android), __Firefox v.40.0a2__.
Safari si iOS nu suporta inca WebRTC fara instalarea unor plug-ins aditionale.


Exista posibilitatea ca in cazul in care apelul se face de pe aceeasi retea interna, pe __Firefox__ conexiunea catre celalalt peer sa nu se poata realiza cu succes.
###Important
WebRTC are nevoie de servere STUN/TURN pentru realizarea conexiunii peer-to-peer. Desi exista o serie de servere de acest tip gratis si disponibile pentru a fi folosite, pentru acest proiect am ales sa folosesc [https://www.twilio.com/](https://www.twilio.com/) ca provider de server STUN/TURN. Este necesar sa se creeze un cont free si apoi completarea in fisierul __config.js__ cu _api_key_ si _auth_token_ obtinute de pe Twilio.

De asemenea este nevoie de browsere moderne (**Google Chrome / Firefox**)
