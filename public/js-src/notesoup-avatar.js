/**
*	notesoup-avatar.js
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
notesoup.set({

	reinsertAvatar: function() {
		notesoup.insertAvatar.defer(50, notesoup);
	},

	insertAvatar: function() {
		if (!this.loggedin || !this.username) return;	// want avatoon?  log in.
		try {

			// wait for stable push layer
			if ((!notesoup.push.connected) || ((new Date() - notesoup.push.connected) < 100))
				return notesoup.reinsertAvatar();

			// first time?  build the avatar note
			if (!this.avatarID) {
				this.avatarID = 'avatar' + notesoup.pushClientID;
				this.avatarNote = {
					template: [
							"<center>",
								"<img ondragstart='return false;' src='{proxyfor}'/><br/>",
									//"<div style='background: {bgcolor}'>",
										"<b>{notename}</b><br/>",
									//"</div>",
								"<div id='", this.avatarID, '_content', "'></div>",
							"</center>"
						].join(''),
					//text: 'This space available.',
					id: this.avatarID,
					mtime: this.getServerTime(),
					opacity: 0.8,
					//widgetid: 'avatar',
					imports: 'system/widgets/@Avatar',
					width: 80,
					height: 72,
					xPos: 12,
					yPos: 36,		// 30 + Math.floor(Math.random() * 200),
					notename: this.username || ('intruder ' + this.serveropts.clientip + ':' + this.serveropts.clientport),
					nosave: true,
					//bgcolor: (this.username == 'system') ? 'red' : (this.ui.defaultNoteColor == '#FFFF99') ? this.ui.getRandomColor() : this.ui.defaultNoteColor,
					notetype: 'proxy',
					//proxyfor: 'http://notesoup.net/images/UII_Icons/32x32/user.png',
					//proxyfor: '/object/' + this.username + '/public/avatar.jpg',
					proxyfor: notesoup.gamePieces[Math.floor(Math.random() * notesoup.gamePieces.length)],
					username: this.username,
					clientid: this.pushClientID
				};
				notesoup.postEvent('/folder/' + notesoup.foldername, 'updatenote', this.avatarNote);
				return this.reinsertAvatar();
			}
			// not first time - has our note come home yet?
			if (!notesoup.notes[this.avatarID]) {
				notesoup.postEvent('/folder/' + notesoup.foldername, 'updatenote', this.avatarNote);
				return this.reinsertAvatar();
			}
		} catch (e) {
			notesoup.say('oops insertAvatar: ' + notesoup.dump(e), 'error');
		}
	},
	
	refreshAvatar: function() {
		if (!this.loggedin || !this.username || !this.avatarID) return;
		//notesoup.say('refreshAvatar...');
		try {
			if ((this.avatarID) && (this.avatarID in notesoup.notes)) {
				//notesoup.say('refreshAvatar...', 'tell');
				notesoup.notes[this.avatarID].mtime = this.getServerTime();
				notesoup.postEvent('/folder/' + notesoup.foldername, 'updatenote', notesoup.notes[this.avatarID]);
			}
			else this.insertAvatar();
		} catch (e) {
			notesoup.say('oops refreshAvatar: ' + notesoup.dump(e));
		}
	},
	
	removeAvatar: function() {
		if (!this.loggedin || !this.username) return;
		if (this.avatarID) {
			notesoup.say('Removing avatar...');
			notesoup.postEvent('/folder/' + notesoup.foldername, 'deletenote', this.avatarID);
			delete this.avatarID;
		}
	},
	
	summonAvatar: function(tonote) {
		if (this.avatarID && notesoup.notes[this.avatarID] && notesoup.notes[this.avatarID].follow &&
			(tonote.id != this.avatarID)) {
			notesoup.notes[this.avatarID].moveTo(tonote.xPos-60, tonote.yPos);
			this.refreshAvatar.defer(this.ui.defaultEffectsDuration+10, this);
		}
	},
	
	gamePieces: [
		/* blue */		"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAErElEQVRoge2YX2hTZxjGfzn515O0VrN0ujKrFBFCFarEIC3aVmNxrEPMRYVebAMZMnCou\/FK+dALUWEqg02clrELQZHOi+5CrDa6KVLCKBNJlbJpnfgvJrZpmp5kOWcXjcNqrW36nSmS5y6H932f58n37\/0+KKKIIooo4g3AYkbRPXv21Oi6\/gUQBBbmP98GuhRF+WH37t03ZHNKNSKEcADfjIxYv+zpmaX097uJx+0AeDxZFi1KEQgM6S5X7nvgayFERha3NCN5E79Eo+5gZ2cFmqZMGOd06rS0PMbnS3UBH8syMzFbYTgUjbqD4XAZbW0RPJ6RCYM0TaGjYy7RqDsIHJJFLsWIEGJJKmXd0tlZQWtrLwcPdrJpU+8r4w0DOjsrSKWsW4QQS2RosMkoAmyORMqtmqZw6lQtmmbj7NnJ9WmaQiRSbm1oiG8GdsxUgKypte7WLRcA8biL9vYA8bjrtUn5nHUyBMgyUvX0qX3aSfmcKhkCZC72NwpZRgZmz85OOymfMyBDgCwj5xcvnni7nQz5nPMyBMgycsLvH8w5nfqUE5xOHb9\/MAeckCHAKqNIOBx+1NzcMNfjya7o6yt9bbzFAhs2PKKyUjsqhPhRhgaZi32Hz5fqCoUeMtnIOJ06odDDZy3KjM+PZ5AyIgDhcDjX2Nh4qqIi61m2LOm3Wg1LJmMlk1GwWqGiIktt7RAbNz7WKyu174DP3sqm8Xk818aHgA\/zn\/8GOsxq402FEOJedfUxo7r6mCGEuGcm1ztzIJoytQCEEC7gZ4vFsg7AMIzzwEYhxPQPnCnAzBE50NJyrrmu7oLl8OEqS1+fqxk4YBaZmUZCiYSdXM5CMmnl3DkvjC1+UyDrPjIhWls\/J5k0leI\/mDkiHcHgE2w2A5vNIBh8AtBhFpmZf1d7TU3qo5qavxbmf98G2s0iM2XXEkIst9m03+Cxevz4chIJFz7fMGvXPhmx241VQojfZXOaNbX2ORz31a1bu\/jkkz9IpRQikVlcuPCeC9hnBqFZU6v+6NEV9PeXjnuEuHnTzfr1sXozCGU+0JUCa4BVwI4jRxZYk8nxPWlZWY5t2+7kGHvP+hW4KIQYlsE\/YyNCiACwfXRUCQ0MqM47d0pYunSY3t4yIpFZ42L9\/iFqa5Ncv17KggWjVFWltZISvQM4LITomYmOgo3s37+\/LJ1OfxuL2T+9enWOJRp1k82OlZs3T6Ot7T6XL3uIRscuWj7fMKtXxzl58gMePHACYLcb+Hwp6uoShteb\/UlV1a927tyZ\/N+MjJkYvXjlSrn\/0qU56PrLZbzeDI2NCebPTwNw965KODyHWMzxUqyiGDQ0JKivH4yoasmaQswUtNjT6fTenp5yf3e355UxsZiDM2fmTqmerlvo7vZgtxv+QGBwL7B9upoK3X5br10rLzD11cjXbC0k9525jxRq5PTKlYNShQDka54uJLcgI6qq7goEhiJNTXEUxSikxHgRikFTU5xAYCiiququQmqYsv1OFW98+30eEx2IsZiDeNzG6OjYcxCAw6FTUpLD4\/kHrzfz9hyIL+KFFqUGqAbeB9z5kBTwCPgTuIHkFqWIIoqYHP8C8VHBlXyU0kYAAAAASUVORK5CYII=", 
		/* green */		"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAE0ElEQVRoge2ZX2xTZRjGf+ecdu3p6Gy7dbCxP0Q0hm1KxDmnSJxjgyyaEIcQTFBjiCFekICacAX5AhdkRMTE+C8KGrxAIJlZjN5sYBOIIQuRSNzQKPJnwGAdXVnXdm3Xc7ygGhxjsO47gKTP3Tl5n\/d5n7zn+763XyGHHHLIIYe7AMWKpFu2bKk2DONNoAmYk3l9BuhSVfXzzZs398jWlGpECJEHvB\/Txt466g6qf7giXLEnAChMOXg45qY+4jdcadsnwNtCiKQsbWlGMia+73WFmzqK+kio6QnjHIbGssFyqmKeLuAFWWZUGUky2NnrCjcdLDvF6rmX8eWNTRiUUNMcKD5LryvcBOyUJS7FiBCiJqqNre0o6mNV+RV2zD\/PK+Whm8abmHQU9RHVxtYKIWpk1CCrI2u6Cwa1hJpmb5+Pd38pY2+fb1JCQk3TXTCoAWtkFCDLSPPv+lUAQkkbX5wuIpS03ZKU4TTLKECWkYoh+9TXbIZTIaMAmYv9rkKWkXPeVN6USRnOORkFyDLS+Uj8gSmTMpxOGQXIMrKrbrgo7TC02yY4DI264aI0sEtGAbevPAkCgcDAkucaZxamHE\/25l+9ZbyCQmuwgtlJ16dCiK9k1CBzsW+oinm6VgxUMllnHIbGioHKf0aUDbLEpXQEIBAIpBsaGvb5U07fEyOFtZqpKEnVJKkaaKgUp3QWRHy8PFhplCZdHwOv35ND4\/W4boxvBcoyr88D7f+LMX48hBAXviz5sxTgjf6HLgohZluldd8ciJZ1RAjhAr5VFKUZwDTNTuAlIUTMCj0rO7L9xVXfLXl69QHlvbJflZOu8BJgu1ViVhppDdkTpDGJaCl+KLwA1xa\/Jbj1rD0NLA\/MI6KlrJT4F1Z2pH1pqBSbqWAzFZaGSgHarRKzsiO7a6Lelpqod07m+Qyw2yoxS3YtIcQCmyt2xJx\/Qv8s6GQoaaM66qE5VBqzm+oiIcTPsjWt+rS22Rcc19c99RvLKgeIqmN0uwfp9F10AdusELTKyMKP+mfccAlx0nUVYKEVgjIv6GYAjcAiYMOO8h5t\/I7lTtt5p686zbX7rMPAISHEiAz9aRsRQtQB60fVsdazzqjjjGOEx6I+jruv0O0e\/E9sXaSIxyOFnMgPMScxg8rR\/ITTsLUDHwghuqdTR9ZG2tra3PF4\/MOgffS1I54BpdcVJqUYAJQkdV69NJeA9xI9+WEAqqMeGoZm8fWsU\/TnxQGwmypVMQ\/PhotNf8q5R9f1dRs3bozcMSNtbW3u+Gj80OGCy7U\/ei5hKOYNMf6Uk8ahEipG8wE454xyyNtP0D56Q6xqKjwfnsWi4ZnHdKfemI2ZrM6ReDy+9WhBsPagt\/+mMUH7KPuKT99WPkMxOejtx26qtfXD\/q3A+qnWlO2utfKngoEsqTdHJufKbLj3ze+RbI3sf2a4WGohAJmc+7PhZmVE1\/VN9RH\/scVDJajm9I8i1VRYPFRCfcR\/TNf1TdnkyOoWpaurK9nS0vJN6YijtCrmmZ\/UDCVkT0y4e00Gu6nyaMzL8mClOS\/m2aPr+qo7uv1ej4kOxGBegpAtQVxLk8z8BZdnaOhpDd+YA3\/Sce8ciOMxbkSpBh4EioH8TEgUGAD+AnqQPKLkkEMOk+NvfLq+bU637uYAAAAASUVORK5CYII=", 
		/* red */		"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAEk0lEQVRoge2YXWgUZxSGn9lNdjIbvTDpptWWJBRU8oPUnyxBDV3zY6K1StWEltZ6IUUKFWopeKUcvJFYWoViS6l6USmiwUgKFWvSuMVUdBUt0t1UhXYNlYBrNmBMNrMmM73IClZjTNZvUGRfmIsZvve85+V8P2c+yCCDDDLI4BlAcyLozp07yyzL+gioBYpTn6NAh8vl+n7Hjh1h1ZpKjYiIB\/jKOzT0sf\/cOdec69fJ7+sDoC8\/n2uzZxOqrLSGvN5vgc9EJKlKW5mRlImfSyKR2tVtbeimOe44U9f5ac0auktLO4C3VJlxqQiSwp6SSKR2\/a\/H0D7wYOeNH1o3TRpbWiiJRGqBParElRgRkfLcwcHNq9vaSL6by\/CX+STfm\/Z4gm2zuq2N3MHBzSJSriIHVRXZVBEKuXXTxHP4Ljmf9+E5fHdCgm6aVIRCbmCTigRUGambc\/UqAFrcwrN\/AC1uPZGU4tSpSECVkcK8\/v4pk1KcQhUJqFzszxSqjPTEZ8yYMinF6VGRgCoj7dfmzp0yKcVpV5GAKiMHLvj9o6auT5pg6joX\/P5R4ICiHNRARPYdaWqyLU2zLZj40TT7SFOTLSL7VOmrXOxbu0tLO1oaG5moMqau09LYeL9F2apK3K0qUDAYHA0EAkdu+3x5lxcuXDTidmt6MomeTGK53cQKCri0YAHH16+3emfN+gbY+Fw2jQ\/igTZ+LfBa6vO\/QKtTbbyjEJGb0aIiO1pUZIvITSe1XpgD0ZGpBSAiXuC4pml1ALZttwPviMiQE3pZTgRNYffGVceW58XjaOvucGLlyuV\/lZTsBj5xQszJqbU2Lx7HPTrKtIEBVpw4AWOL3xE4WRFYdwfvwICjEvfhZEVaT9XXM5KVxUhWFqfq6wFanRJzsiIHw+XlK8Ll5cWp9yhw0CkxR3YtEVkwPWuga5V9ynj1u3+g3yZcVkZHXd3QvezsKhG5pFrTqam16+3sX4yXtwzgXuPCOzhIRShEbXu7F9jlhKBTRpa8sq\/nkUuIku5ugCVOCCpbIyIyDagGqoAc+m08+8fdsXJE5AvgDNApIhNft0wST71GRMQPfKoPD68tvnFDL4xG+XPePN64fJmKUOh\/Yy\/4\/fwxfz7lV67QU1xMtKjINHNyWoG9IhIaV2CSSNtIc3Pz9EQi8fVLsdiHS7u6tNJIhKx79wDonTmTHzds4M1gkLLwWKMbLivjt0CA9w8dYmZvLwAj2dlESkvpWrrUvu3z\/WAYxpZt27aldfCkZaS5uXn6cCLRueTMmUWB06dxWY\/eYcV8PoLV1dwoHLvtKerpIdDZiS8We2Ss5XIRXLaM36uqLuYYRnW6ZqYMEdl7sqHhyb+0U3xONjTYIrI3nZzS3bWaKs+eTZP6eKRiNqXDfWH+R9I1cvTc4sVKEwFIxTyaDjctI4ZhbD9fWXmxs6YGy\/X0RbVcLjprajhfWXnRMIzt6cRwZPudLJ759vsgxjsQC2IxZsTjeBMJPMmxG5+kx8OQYdCfl8ctn+\/5ORAfxkMtShnwOlAA5KaGDAK3gL+BMIpblAwyyGBi\/AeeVOxN+qsGPQAAAABJRU5ErkJggg==", 
		/* yellow */	"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAEq0lEQVRoge2YXWxTZRjHf+f04+y0nbDBuvG1TcRlH6CRdKAuyMY24geTiLgLY+SCGGKiCXjDFeQNXJBhIiYmamIgxhgTFzIhxhgyYEVE3WiGhLTMiWzdxLluwAi0pR879YJqEMbcynuEkP7vevL8n\/\/zz\/M+73lOIYssssgii3sAxYykO3bsqDIM4w2gAShNP+4HDquq+sn27dv9sjWlGhFC2IH3HI7Em8urg2pZ2UVm5YcBuHjJSW\/vLDpPlhiRiO0j4B0hRFyWtjQjaRPfVJQPN6xtCqBpyQnjYjErB7+u5GxP4WHgBVlmVBlJ0thTUT7c8MrLp1HUK6RSxoRBmpakef0ZKsqHG4A9ssSlGBFCLHY645vWNgWIJ8JEY2PEE5FJGCnWNgVwOuObhBCLZdQgqyMbl3kGLZqWxG5zoGszsNsckxI0Lckyz6AF2CijAFlGGsvKRgBQFBW7zYWi\/HfqNKdRRgGyjBTn50WnTUpzimUUIHPY7ylkGRm4dFmfNinNGZBRgCwj7b29BdMmpTntMgqQZWRvl2\/BeCxmnTIhFrPS5VswDuyVUYBFRhKv1xuqqakvvHjJUV1VGZoCQ6HtwGL+GJrxsRDiUxk1yBz2LWd7Cg+37l\/CZJ2Jxay07l\/y94qyRZa4lI4AeL3e8dra2i9HR1353T\/P94wnFUXLMdC0JIahMjKaS\/epubQdeMwYGnroQ2DDfbk03oyb1vh1wPz049+BNrPWeFMhhLgQ7FuTCvatSQkhLpip9cC8EE05WgBCCAfwlaIojQCpVKodeEkIMdlanDGmfvFPH7s3bDi4Oj8vispcvvm2fHXPL+7dwFtmiJl5tNbl50WxWAxcrhjPP9sDN4bfFJjZEZTUXJx6zEyJf2BmR9oOtZeRTKokkyqH2ssA2swSM7Mj+\/yBouf8gaLS9O9+YJ9ZYqbcWkKIpbm54e+b1vj0eXPGAQv+QCHtRx6NJBKWFUKIbtmaZh2tXS82denuwj4s1is4HHGqPYM01v\/qAHaZIWiWkZoiN7f9CVFRHgKoMUNQ2owIIVzAKmAFkAMW7DbXRKE5Qoh3gePAUSHENRn6dz0jQohlwGZNS6wrLRnTSoovc8Y\/hycev0C1Z\/BfsSd9Czh1eh5LqoYIDuTRH5wZi8VsbcD7Qoiuu6kjYyMtLS250Wj0g9mzr72+oqZfqawIYbWOAzD0Zy6ff7GU2mfOU1U5DIA\/UIj3u4W89mo3c4quApBMWgicdXP8RGlqdNT1ma7rb2\/duvXq\/2akpaUl9\/r16NGap\/s8dSt\/Q1VTt8WMjDjpOLaI4MBMAEqKx6hbeY6CgvBtsYah0HHsEU788LAvJ0dflYmZjGYkGo3ufHL5gKe+7twdYwoKwjSvPz2lfKqaor7uHMmkxfNTZ\/FOYPN0a8r01mp+ankwQ+qdkc7ZnAn3gfkeydRI64+dJVILAUjnbM2Em5ERXde3dXYV+450LMIw7n7LMQyFIx2L6Owq9um6vi2THKZcv1PFPb9+b8ZEL0S3O0zezAgORwK7\/Ya5eNxCJGLj8piDUMh5\/7wQb8UtK0oVsBBwA850SBgIAecBP5JXlCyyyGJy\/AXwMrTt5LcPtAAAAABJRU5ErkJggg==", 
		/* black */		"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAE2ElEQVRoge2YXWxTdRjGfz392kFhXWWbTgKUdUO30c2lzjkYLnMbWwyYLZF4pTEoxAsT8IYryF8wIWAiJiZqoiwEMJlcbJGEsIQOm0nmXJo5K8ygrR0LTPmw6wZrWbu1XlAjwhis\/A8Q0ueuJ+\/7Ps\/T9\/\/xngNppJFGGmk8AOi0KLpjx47ieDz+DlAHLE0+HgJciqJ8uX379tOyOaUaEUKYgI+vXYu8e2pgQDl39ixjoVEAMi1ZLFqyhJKysnhGhvo58L4QIiqLW5qRpImjAb+vrrvLRSw6s0ajycTql+uw5dtdwCuyzCgyiiSxN+D31fX3dtLyGliyZv6PYtEoJzqPEfD76oC9ssilGBFClEQi4U3dXS7WNhvY9kEG65qNt41PJBJ0d7mIRMKbhBAlMjTI6siGQa9XH4tGOdIR40NxjSMdsVkTYtEog16vHtggQ4AsI\/XDgQAAodEEbYeihEYTd0xK5tTLECDLyOIr42NzTkrmLJYhQOZmf6CQZWR4\/oLMOSclc4ZlCJBl5Phim23OScmc4zIEyDKyr8jhmDaaTHedYDSZKHI4poF9MgToZRRxu90X6+vrczMtlueH\/L47xut0Omoa1pCdk\/uFEGK\/DA0yN\/sWW77dVdvYxGydMZpM1DY2\/TuibJFFLqUjAG63e7qmpuabLKvV+kxxsVNR9Lqp2BSxWBS9Xo\/1iYUUFhVRu6Yxnp2T+xnw5kM5NN6IG8b4FmBR8vE5oF2rMV5TCCHOOx0rEk7HioQQ4ryWXI\/MhajJ0gIQQswDOnQ6XT1AIpE4DjQLIcJa8GnZkT3r1rY3vFTdqvu69SvdkN\/fAOzRikxLIy3jY2PE49OEJybo6XbD9c2vCQxaFQbY+Fac8IQmK+kWaNmR9spV1ej1evR6PZWrqgHatSLTsiOtywoKm5YVFC5N\/h4CWrUi0+TUEkKUG41XT5qN36ltBy8wFgJbgZ2KqlVhg8FQLYTol82p1dLaNX9el\/r2xr9paJoiEgkz6PXS13NyHrBLC0KtltbKg\/svM3w2RufR\/z5CDPn9VK2uWakFoTQjQojHgVqgGsgYC0HboRlnwgwhxEfA98AJIcRVGfz3vEeEEBXA5ujkZMtfIyPmkfPnsC9fzm+\/DjLo9f4vtsjhoPDZInxnzpD39CKezMubNJnN7cAnQoi+e9GRspHdu3fPj0Qin44Gg294+z26gM\/H1NQUAAuzs2l8tZn+vl4Cv19\/0bIV2CmvqKTz2w4uX7oEgMFgwGa34yh3JrKs1gOqqr63devWK\/fNSNLEiQGPx9nf10s8Hr8lxmK14nzhRXLzngLgwsifeH78gVAweEusoiiUV1RS5nR6VFWtTcVMSnskEonsPPXzgNPT23PbmFAwiOvY0buqF4\/H8fT2YDAanCWlZTuBzXPVlOrxu\/6Xn6RfBSRrrk8l95F5H0nVyOEVz5VLFQKQrHk4ldyUjKiquq2ktMzjrKxCUe69qYqi4KysoqS0zKOq6rZUaqT0FcXlckWbmpraFubk5C3Nt5dOxaK68VBoxtNrNhgMBvILC6mpX5Ow5ecfUFX19ft6\/N6ImS7EUDDI+FiIyclJYrHrI4rRaMRsNrMg04LFan14LsSbcdOIUgwsA3KAx5IhE8BF4A\/gNJJHlDTSSGN2\/APwbryUrfQkDwAAAABJRU5ErkJggg==", 
		/* white */		"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAEj0lEQVRoge2YT2gUZxjGf7MrO7uzCZiNiYolhh4Ca3KQkgmBVVyWVQjVharxIjaIiBRa0F48Gb7qQWKhFgptoWil4KEuZkFoDjEsI42QZCV6cIzkUNZQE0hicmi7yazjbA+O4J+YJus3VWSf2w7v8z7vw\/u937yzUEEFFVRQwVuA4kXS06dPNzuOcxRIAo3u4zww4PP5furu7jZla0o1IoQIAN9omvZZW1ubr6mpidraWgAePXrE+Pg4IyMjTqFQ+AH4UghRlKUtzYhr4rdoNJpMpVKoqrpknGVZXLt2jbGxsQHgY1lmfDKSuDgfjUaT+\/cnUZQ0pdL8kkGqqtLZ2Uk0Gk0C52WJSzEihGgJh8PHUqkUxeJVFhe7KRavLstJpVKEw+FjQogWGTXI6sgRXdf9qqoSCOwjGPyKQGDfsgRVVdF13Q8ckVGALCM7m5qaAFCUGgKBQyhKzX+SXM5OGQXIMtIQiURWTXI5DTIKkDnsbxWyjEzMzc2tmuRyJmQUIMvI9fHx8VWTXM51GQXIMnIhl8s9sSxrxQTLssjlck+ACzIK8MtIYhjGdCwWWz83N6c3NzeviJPJZJicnPxRCHFJRg0yh\/3E2NjYQDqdZrnOWJZFOp1+tqKckCUupSMAhmE8icfjv87OzkZu377datu2oqoqqqriOA4zMzOMjo6SyWScqamp74Gud3JpfB7PrfF7gQ\/cx38CvV6t8Z5CCPEwn8+X8vl8SQjx0Eut9+aF6MnRAhBCaEBGUZSdAKVS6TrwiRCi4IXeGi+SujjX1WXsikQiKMol+vr6dt2\/f\/8c8LkXYl4erb2RSAS\/309VVRUdHR3wdPg9gZcdAX5G06q9lXDhZUd6+\/v7sW0b27bp7+8H6PVKzMuOXDRNs8M0zUb3dx646JWYJ7eWEOKj6mp7cPduNbRp02FgLaZpMjAwUHj8+PF2IcSobE2vjtbZPXuU0Pr1F\/D7+9A0DV3XSSaTGnDWC0GvjMQ2bDj6yp8Q0WgUIOaFoLQZEUJUAQlgOxCEtQQCh5YKDQohvgZ+B7JCiL9l6L\/xjAgh2oDjqqrubWxsVBsaGrh79y5bt25F1\/UXYnO5HHfu3KGlpYWJiQny+bxlWVYv8K0QYuRN6ijbSE9PT\/XCwsJ369at+3Tbtm3Kli1bWLPmaYOnpqa4fPkyO3bs4NmHlmma3Lhxg4MHD7Jx40YAbNvm3r17DA4OlmZnZ38JhUJfnDx58q\/\/zUhPT0\/14uJiNhaLtcbjcXy+V0dtZmYGwzB48OABAJs3byYej1NXV\/dKrOM4GIbBzZs3bwWDwUQ5ZsqakYWFhTPt7e2tiUTitTF1dXV0dnauKJ\/P5yORSGDbduvQ0NAZ4Phqayr31jrQ3t5eJvX1cHMeKIf73nyPlGvkytDQkNRCANycV8rhlmUkFAqdGh4evpXNZnEcp5wUL8BxHLLZLMPDw7dCodCpcnJ4cv2uFG\/9+n0eS70Q6+vrqampQdM0AoEAAMVikUKhwPz8PNPT0+\/OC\/FlvLSiNAMfAvVA2A35B5gG\/gBMJK8oFVRQwfL4F7uYui2Zq79FAAAAAElFTkSuQmCC", 
		/* gray */		"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAEj0lEQVRoge2YT2gUZxjGf7OZnWQ2G0yazTZ0NyYuBBayAS1pMdGAtYlQeqoHD4ItKEV6KGih5KR86EHioRYKbaEoxVs9pFDoKSKhitAi9ZCYeMmamJ1GJpsmsruz2+zsTA9Zi39imqzfNFb2uc3wPe\/zPrzfn\/f7oIoqqqiiii2A4kXQM2fOdDmO8zEwAHSUf88AV30+33enT5++I1tTqhEhhAZ84ff7P4lGo77m5mYCgQAAlmWxuLhIKpVyisXiN8BnQogVWdrSjJRN\/BwKhQbi8Tiqqq45zrZt7t69Szqdvgq8L8uMT0aQMi6EQqGBnTs7aG39BVXNrjlIVVUSiQShUGgAuCBLXIoRIURC07Tj8XicpqYbRKOXaWq6sS4nHo+jadpxIURCRg6yKnIsEonUqKrK0tJeUqkjLC3tXZegqiqRSKQGOCYjAVlGBpubmwGw7SDp9LvYdvBfSWXOoIwEZBnZruv6pkllznYZCchc7FsKWUbu5\/P5TZPKnPsyEpBlZHRxcXHTpDJnVEYCsoxcNAyjZNv2hgm2bWMYRgm4KCOBGhlBxsbGzP7+\/tcty3orHA5viDM5OUkmk\/lWCPG9jBxkLvaT6XT66sTEBOtVxrZtJiYmHrUoJ2WJS6kIwNjYWGnfvn0\/WJb12vz8fI\/ruoqqqqiqiuu65HI55ufnmZqacrLZ7NfARy9l0\/g4HmvjDwLR8u8UMPK\/aOOfhhDC2LVr1xsAt2\/f\/kMIEfFK65U5ED2riBAiAPyoKMoggOu6o8AHQgjLCz0vK3L+8OHRA0ePXld6e3uVUCh0ADjvlZiXRg7quo7P50PTNDo7O2F18XuCte+jkjA5+Tm1tbVeSvwDLysyMj09jeM4OI7D9PQ0wIhXYl5W5JJpmu+ZptlR\/p4BLnkl5smuJYR4Mxgs3ti9O6MXi+9g20FM0ySZTFqlUqlfCPG7bE2vpta5vr4\/9UTiJ8LhX\/H7\/UQiEWKxWAA454WgV0b2FAqDzzxCtLS0AOzxQlDmA10Q2A\/0Ayf7+vpqNE17YszKygo3b94ssfqedR24JoRY+wFsk3hhI0KIt4ETqqoebGxsrN22bRumadLa2kok8mRrZRgGDx48IBwO8\/DhQ5aXl\/+ybXsE+FII8duL5FGxkeHh4YZ8Pv9VIBD4sL29XWlpacHnW52pmUyG8fFx2tvbeXTRMk2T2dlZuru7aWhoAMBxHBYWFpidnXUty7qs6\/qnQ0NDmf\/MyPDwcEOhULjW1tbWs2PHDhTl2TC5XI6ZmRmWl5cBaGxspKOjg\/r6+mfGuq7LvXv3mJubu1VXV7e\/EjMVnSP5fP5sNBrticVizx1TX19PV1fXhuIpikIsFsNxnJ5UKnUWOLHZnCrdtQ61tbVVSH0+yjEPVcJ9Ze4jlRq5Mjc3JzURgHLMK5VwKzKi6\/opwzBuJZNJXNetJMQTcF2XZDKJYRi3dF0\/VUkMT7bfjWLLt9\/HsdaBGAwGqaurw+\/3U1Oz+uJUKpUoFosUCgWy2ezLcyA+jadalC4gBoSBRwdHDjCBJHAHyS1KFVVUsT7+BvrCyVvP0GEFAAAAAElFTkSuQmCC"
	]
});


soupnote.prototype.set({
	//summonAvatar: function() {
	//	if (this.widgetid == 'avatar') return;	//avatar.follow for another day
	//	notesoup.summonAvatar(this.xPos-60, this.yPos);
	//},

	doAvatarMenu: function(e, isHome) {
		notesoup.say("Avatar menu: " + isHome);
	}
});

