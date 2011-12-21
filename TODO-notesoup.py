
enablePushServer = True

# This is a nasty security hole and you shouldn't use it.
#
enableShellCommands = False
enableSSHCommands = True

# Turn this on to allow new users and their bots to create accounts
#
enableSignup = True

# Turn this on to enable bots to clog your sever with spam
#
enableFileUploads = True

# Turn this on to enable checking of the .passwd file for per-folder passwords
enableFolderPasswords = True

# Turn this on to enable search engines to see the contents of public workspaces
enableNotesWithInitialPayload = False
syncinterval = 60	# seconds between syncs, 0 to disable
saveTombstones = False

# all file names beginning with '.' are reserved for the system
# here are defs for the ones in current use
userinfo = '.userinfo'
folderlinks = '.folderlinks'
folderPasswordFile = '.passwd'
motdname = '.motd'

newnotecolor = '#FFF8B6'
notificationCount = 0

# We ship with a template or seed soupbase called the 'soupbase-seed'
soupbaseseed = os.path.join(os.getcwd(), 'soupbase-seed')

#################


def stripHTML(s):
	return re.sub('<.*?>', '', s)

def validatePasswordhash(u, ph):
	if u == '': return False
	storedhash = nio().getUserData(u, userinfo)
	return ph == storedhash.strip()

def validateHashedPassword(u, ph, nonce):
	if u == '': return False
	storedhash = nio().getUserData(u, userinfo)
	return ph == getHash(storedhash.strip() + nonce)

def getHash(p):
	hash = sha.new(p)
	return hash.hexdigest()

def validatePassword(u, p):
	return validatePasswordhash(u, getHash(p))

def setPasswordhash(u, p):
	nio().putUserData(u, userinfo, p)



# Get folder password
def getFolderPassword(folder):
	return nio().getFolderData(folder, folderPasswordFile)

# Set folder password	
def setFolderPassword(folder, folderpassword):
	return nio().putFolderData(folder, folderPasswordFile, folderpassword)
	

# Cheap tar pit: 
#
# Count bogus operations in a session and slow down our responses past
# the timeout point as the count gets 'unreasonably high', which is an
# indicator of a likely attack in progress.  Give a few mistakes for free to
# interactive users.  Complain in the server log at high values.
# Callers just sprinkle securityCheck() where a suspicious event or
# error on the API is noticed.
#

def securityCheck(s):

	print "SECCHEK:", s
	return

	b = incrementCheckCounter()

	# build a cheap tar pit for the bad guys
	if b > 250:
		# TODO: Improve on logging of potential attacks
		print 'Caught a bogon in the tar pit.'
		time.sleep(random.randrange(65,95))
	if b > 100:
		print 'Bogon approaching tar pit.'
		time.sleep(random.randrange(35,55))
	if b > 50:
		time.sleep(random.randrange(6,12))
	if b > 10:
		time.sleep(random.randrange(3,6))



def nameHasEvilChars(name):
	return nio().filenameHasEvilChars(name)


def createUser(u, p):
	if nio().userExists(u): return False

	def setupFolder(f):
		nio().createFolder(os.path.join(u, f))
		if nio().folderExists(os.path.join(skeletonuser, f)):
			copyfolder(os.path.join(skeletonuser, f), os.path.join(u, f))

	nio().createFolder(u)
	if len(p) > 0:	# no password hash?  no .userinfo file, account is locked
		setPasswordhash(u, p)
	nio().createFolder(os.path.join(u, trashfolder))

	setupFolder(inboxfolder)
	setupFolder(templatefolder)
	setupFolder(publicfolder)
	#setupFolder(peoplefolder)
	setupFolder(homefolder)
	#setupFolder(donefolder)

	# TODO: Copy template folder data for inbox, public, home, templates to new user account
	nio().setAccess(os.path.join(u, publicfolder), readers, '*')
	nio().setAccess(os.path.join(u, inboxfolder), senders, '*')
	return True
#########################

def internalRedirect(newuri):
	raise cherrypy.HTTPRedirect(newuri)

def goToLogin():
	return goToFolder(welcomefolder)

def goToAccessError():
	return goToFolder(accesserrorfolder)

def goToFolder(folder=''):
	if not folder: 
		cherrypy.log('goToFolder with bogus folder "%s"' % (folder))
		return goToLogin()
	internalRedirect(os.path.join('/folder', folder))


# Application state management pages

class NoteSoup:

	def index(self):
		r = getRequestor()
		if r: return goToFolder(os.path.join(r, inboxfolder))
		return goToFolder(welcomefolder)

class folder:

	def index(self):
		print "index hit..."
		goToFolder(welcomefolder)
	index.exposed = True
	#index._cp_config = {'hooks.before_request_body': pruneFCGI}

	def default(self, touser='', tofolderpart=''):

		# Verify arguments and folder exists
		if not touser or not tofolderpart:
			securityCheck('folder arg 1')
			return goToAccessError()
			#raise cherrypy.HTTPError(404) # Not Found

		# combine URL parts to make tofolder into a complete relative path
		tofolder = os.path.join(touser, tofolderpart)

		if not nio().folderExists(tofolder):
			securityCheck('folder arg 2')
			return goToAccessError()
			#raise cherrypy.HTTPError(404) # Not Found

		# Get here with destination user, folder
		# Check for required read access
		r = getRequestor()
		if not nio().hasReaderAccess(r, tofolder):
			securityCheck('forbidden folder')
			cherrypy.log('Unauthorized access attempt: %s %s' % (r, tofolder))
			return goToAccessError()
			#raise cherrypy.HTTPError(403) # Forbidden
			#return goToLogin()

		# Check for folder password
		if enableFolderPasswords:
			folderpass = getFolderPassword(tofolder)
			if folderpass:
				userdict = {}
				userdict['guest'] = folderpass

				if r: userdict[r] = folderpass
				#print 'checking auth for', r, userdict
	
				# Call the cherrypy httpauth framework (see auth.py)
				# this call never returns if the user hasn't supplied a password
				# it raises an exception to request http digest authentication
				# if it returns it means proper credentials were supplied,
				# so we fall through and serve the page
				securityCheck('folder password')	# discourage lots of tries
				auth.digest_auth(tofolder, userdict)

		global indexTemplate
		if not indexTemplate:
			indexTemplate = nio().getRawFile('index.html')

		# provision the client with a set of provisioning data p
		p = {}
		if r: 
			p['loggedin'] = True
			p['username'] = r
			p['isowner'] = nio().hasOwnerAccess(r, tofolder)
			p['iseditor'] = nio().hasEditorAccess(r, tofolder)
			p['issender'] = nio().hasSenderAccess(r, tofolder)
		else:
			p['loggedin'] = False

		p['foldername'] = tofolder
		p['serverversion'] = version
		p['servertime'] = time.time()
		p['clientip'] = cherrypy.request.remote.ip
		p['clientport'] = cherrypy.request.remote.port
		p['ispublic'] = nio().hasReaderAccess('*', tofolder)
		p['issender'] = nio().hasSenderAccess('*', tofolder)
		#p['test1'] = 'embedded"quote'
		#p['test2'] = '</script>'
		if (enableNotesWithInitialPayload and p['ispublic']): 
			p['initnotes'] = getNotesArray(tofolder)

		pdata = cgi.escape(json.write(p))

		return indexTemplate.replace("'{0}'", pdata, 1);

	default.exposed = True
	#default._cp_config = {'hooks.before_request_body': pruneFCGI}


class object:

	def _usage(self):
		securityCheck('object usage')
		return 'Usage: serverURL/object/[touser]/[tofolder]/[toitem]'

	def index(self):
		return self._usage()
	index.exposed = True

	def default(self, touser='', tofolder='', tonote=''):

		# No user? No folder?  Punt to the login screen
		if not touser or not tofolder or not tonote:
			securityCheck('object args')
			raise cherrypy.HTTPError(404) # Not Found

		# make tofolder into a complete path
		tofolder = os.path.join(touser, tofolder)

		# Get here with destination user, folder
		# Check for required read access
		r = getRequestor()
		if not nio().hasReaderAccess(r, tofolder):
			securityCheck('object access violation')
			cherrypy.log('Unauthorized access attempt: %s' % (tofolder))
			raise cherrypy.HTTPError(403) # Forbidden

		# Files beginning with '.' are NOT served
		# Neither are files that don't exist ;)
		if (tonote[0] == '.') or not nio().noteExists(tofolder, tonote):
			raise cherrypy.NotFound()

		# set the MIME type
		filetype = mimetypes.guess_type(tonote)[0]
		if filetype == None: filetype = 'text/plain'
		cherrypy.response.headers['Content-Type'] = filetype

		#return nio().getNote(tofolder, tonote)
		return nio().getFile(os.path.join(tofolder, tonote))

	default.exposed = True

from urlparse import urlparse

# File upload
class upload:

	def default(self, thefile=''):

		# must be logged in and uploads must be enabled or you must be root
		r = getRequestor()
		if not (enableFileUploads or (r == systemuser)):
			securityCheck('unauthorized upload attempt')
			cherrypy.log('Unauthorized upload attempt: %s' % thefile)
			raise cherrypy.HTTPError(403) # Forbidden

		print "UPLOAD:", thefile.filename, thefile.file, thefile.type

		# require sender (create) access on the folder
		referringurl = cherrypy.request.headers['Referer']
		if not referringurl:
			securityCheck('unauthorized upload attempt: no referer')
			cherrypy.log('Unauthorized upload attempt no referer: %s' % (tofolder or ''))
			raise cherrypy.HTTPError(403) # Forbidden

		folderpath = urlparse(referringurl)[2].split('/')
		if not (len(folderpath) == 4):
			print "malformed folderpath"
			raise cherrypy.HTTPError(403) # Forbidden
		tofolder = os.path.join(folderpath[2], folderpath[3])
		print 'UPLOAD: destination folder is', tofolder, referringurl, folderpath

		if not nio().hasEditorAccess(r, tofolder):
			securityCheck('unauthorized upload attempt 2')
			cherrypy.log('Unauthorized upload attempt 2: %s' % (tofolder or ''))
			raise cherrypy.HTTPError(403) # Forbidden

		# in-memory upload implementation
		# TODO: stream to a temp file and post up the file using set_key_from_file
		# TODO: quota and limit enforcement
		size = 0
		payload = []
	
		while True:
			try:
				data = thefile.file.read(1024 * 8)
				if not data: break
			except:
				print "UPLOAD: exception reading input stream"
				return 'oops'
			payload.append(data)
			size += len(data)
			print "UPLOAD: ", tofolder, thefile.filename, size, type(data), len(data), type(payload), len(payload)

		payloadstr = ''.join(payload)
		print "UPLOAD read complete: ", tofolder, thefile.filename, size, type(data), len(data), type(payloadstr), len(payloadstr)

		nio().putFile(os.path.join(tofolder, thefile.filename), payloadstr)
		createproxynote(tofolder, thefile.filename)
		print "UPLOADED: ", tofolder, thefile.filename, size, len(payloadstr)

		#return goToFolder(tofolder);
		return 'Upload complete. ' + str(size) + ' bytes transferred.'

	default.exposed = True

import simplejson

class who:

	def default(self, *args):
		if not getRequestor(): subs = 'huh?'
		else: subs = pushserver.getSubscriptions()
		cherrypy.response.headers["Content-Type"] = "text/plain"
		#return json.write(subs)
		return simplejson.dumps(subs, indent=4, skipkeys=True, sort_keys=True)
	default.exposed = True


class rss:

	def default(self, fromuser, fromfolder):
		
		print "RSS:", fromuser, fromfolder
		# Verify arguments and folder exists
		if not fromuser or not fromfolder:
			securityCheck('folder arg 1')
			raise cherrypy.HTTPError(404) # Not Found

		fromfolder = os.path.join(fromuser, fromfolder);
		if not nio().folderExists(fromfolder):
			securityCheck('folder arg 2')
			raise cherrypy.HTTPError(404) # Not Found

		# Get here with destination user, folder
		# Check for required read access
		r = getRequestor()
		if not nio().hasReaderAccess(r, fromfolder):
			securityCheck('forbidden folder')
			cherrypy.log('Unauthorized access attempt: %s' % (fromfolder))
			raise cherrypy.HTTPError(403) # Forbidden

		# Build the RSS output
		pagelink = os.path.join('/folder', fromfolder)
		html =  '<?xml version="1.0"?>'
		html += '<rss version="2.0"><channel>\n'
		html += '<title>Note Soup RSS Feed for ' + pagelink + '</title>\n'
		html += '<description>Note Soup RSS Feed for ' + pagelink + '</description>\n'
		html += '<link>' + pagelink + '</link>\n'
		html += '<generator>' + version + '</generator>\n'
		html += '<image><url>' + '/images/notesoup-badge-rss.png</url><title>Soup Feed</title><link>pagelink</link></image>\n'
		html += '<language>en-us</language>\n'

		for filename in nio().getDirList(fromfolder):

			# Skip lots of non-note file types
			#if filename[0] == '.': continue
			if filename.find('.') >= 0: continue
			#filepath = os.path.join(soupbase, fromfolder, filename)
			#if os.path.isdir(filepath): continue

			note = nio().getNote(fromfolder, filename)
			if note == {}: continue
			print 'rss: getting note ' + filename

			thename = ''
			if note.has_key('notename'):
				thename = stripHTML(unquote(note['notename']))
			if not thename:
				thename = 'untitled'
			html += '<item>\n'
			html += '<title>' + thename + '</title>\n'
			if note.has_key('text'):
				#thetext = stripHTML(unquote(note['text'][1:-1]))
				thetext = stripHTML(unquote(note['text']))
			else: thetext = ''

			print 'rss: thetext=', filename, thetext

			# too bad...
			#if note.has_key('bgcolor'):
			#	thetext = '<span style="background:' + note['bgcolor'] + ';">' + thetext + '</span>'

			print 'rss: thetext2=', filename, thetext

			html += '<description>' + thetext + '</description>\n'
			html += '<author>' + fromuser + '</author>\n'
			html += '<link>' + pagelink + '</link>\n'
			html += '<guid>' + pagelink + '/' + filename + '</guid>\n'

			#dt = datetime.utcfromtimestamp(fileDLM(os.path.join(soupbase, fromfolder, n)))

			dlm = nio().getFileDLM(os.path.join(fromfolder, filename))
			print "RSS: dlm", fromfolder, filename, dlm
			dt = datetime.datetime.fromtimestamp(dlm)

			updatetime = "%s, %02d %s %04d %02d:%02d:%02d GMT" % (
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dt.weekday()],
            dt.day,
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.month-1],
            dt.year, dt.hour, dt.minute, dt.second)
			html += '<pubdate>' + updatetime + '</pubdate>\n'

			html += '</item>\n'

		html += '</channel></rss>'
		
		print "RSS OUTPUT:", html

		cherrypy.response.headers["Content-Type"] = "text/xml"
		return html
	default.exposed = True


from ThumbnailUtility import *
class thumbnail:
	def default(self, uri='', size='Small'):
		if uri:
			print "THUMBNAIL:", size, uri
			thumburi = create_thumbnail(uri, size)
			raise cherrypy.HTTPRedirect(thumburi)
		return 'huh?'
	default.exposed = True;

class geturl:
	def default(self, url=''):
		print "GETURL:", url
		if not url: return 'error fetching url'
		if not getRequestor():
			securityCheck('geturl without login')
			cherrypy.log('Unauthorized access attempt: %s' % (url))
			raise cherrypy.HTTPError(403) # Forbidden
		
		s = 'url fetch failed'
		try:
			fd = urllib2.urlopen(url)
			s = fd.read()
			fd.close()
		#except HTTPError, e:
		#	print 'http error: ', e.code
		#except URLError, e:
		#	print 'url error: ', e.reason
		except:
			print 'http-error fetching url', url
		return s
	default.exposed = True;



import feedparser, simplejson
class getfeed:
	def default(self, url=''):
		print "GETFEED:", url
		if not url: return 'error fetching feed'
		if not getRequestor():
			securityCheck('getfeed without login')
			cherrypy.log('Unauthorized access attempt: %s' % (url))
			raise cherrypy.HTTPError(403) # Forbidden

		try:
			feed = feedparser.parse(url)
		except:
			print 'feedparser error fetching feed', url, sys.exc_info()
		cherrypy.response.headers['Content-Type'] = 'text/plain'
		#return simplejson.dumps(feed, indent=4, skipkeys=True, sort_keys=True)
		try:
			return simplejson.dumps(feed, skipkeys=True)
		except:
			return '{"bozo":1}'
	default.exposed = True;


# The API 

def APIArgumentError(params, callsite=''):
	securityCheck('api argument err ' + str(callsite))
	return APISendReply('Sorry', 'Argument error', [], params)

def APILoginError(params, callsite=''):
	if callsite: print 'LOGIN error at', callsite
	securityCheck('api login err')
	clearSessionData()
	return APISendReply('Sorry', 'Not logged in', [], params)

def APISuccess(params):
	return APISendReply('', '', [], params)

def APIFail(params):
	securityCheck('api fail')
	return APISendReply('Sorry', 'Bowl of fail', [], params)

def APIUnauthorized(params):
	securityCheck('api unauthorized')
	return APISendReply('Sorry', 'You are not authorized to do that.', [], params)

def APIPrepareReply(opstatus, opmessage, commandlist, params):

	if opstatus:	# error
		response = {
			"result":None,
			"error" :opstatus + ': ' + opmessage,
			"id":params['commandid']
		}
	
	else:			# success
	
		# if there's a message-of-the-day, push it to the status line
		motd = nio().getRawFile(motdname)
		if motd:
			commandlist.append(["say", motd])

		response = {
			"result":opstatus + opmessage,
			"error" :None,
			"time": time.time(),
			"id":params['commandid'],
			"command":commandlist
		}

	responsestr = json.write(response)

	#print "Server response: ", responsestr
	return responsestr


def APISendReply(opstatus, opmessage, commandlist, params):

	responsestr = APIPrepareReply(opstatus, opmessage, commandlist, params)

	# This ain't your grand-daddy's markup language
	cherrypy.response.headers["Content-Type"] = "text/plain"

	return responsestr


# JSON API service entry points

class api:


def apiHandleCommand(request):

	#print "Request:", request
	nullparams = {'commandid':0}

	method = request['method']

	#params = request['params']
	if request.has_key('params'):
		params = request['params']
	else:
		params = {}
	
	params['commandid'] = request['id']	# tuck this here for reply generation
	params['command'] = method
	params['requestor'] = getRequestor()
	#print "Params:", params

	# Only a few methods are allowed if we're not logged in
	if method == 'knockknock': return apiknockknock(params)
	if method == 'login': return apilogin(params)
	if method == 'logout': return apilogout(params)
#	if method == 'sync': return apisync(params)
	if method == 'createuser': return apicreateuser(params)
	if method == 'openfolder': return apiopenfolder(params)
	if method == 'getfolderlist': return apigetfolderlist(params)
	if method == 'getfeed': return apigetfeed(params)
	if method == 'getnote': return apigetnote(params)
	if method == 'getnotes': return apigetnotes(params)

	# Command below this point are only allowed for logged-in requestors
	if not params['requestor']:	
		return APILoginError(nullparams)

#	if method == 'savenote': return apisavenote(params)
	if method == 'appendtonote': return apiappendtonote(params)
#	if method == 'sendnote': return apisendnote(params)
	if method == 'renamenote': return apirenamenote(params)
	if method == 'geturl': return apigeturl(params)
	if method == 'gettemplatelist': return apigettemplatelist(params)

	# openfolder is above in pre-login
	# so is getfolderlist
	if method == 'createfolder': return apicreatefolder(params)
	if method == 'setfolderpassword': return apisetfolderpassword(params)
	if method == 'deletefolder': return apideletefolder(params)
	if method == 'renamefolder': return apirenamefolder(params)
	if method == 'copyfolder': return apicopyfolder(params)
	if method == 'setfolderacl': return apisetfolderacl(params)
	if method == 'getfolderacl': return apigetfolderacl(params)

	# createuser is above in pre-login
	#if method == 'updateuser': return apiupdateuser(params)
	if method == 'deleteuser': return apideleteuser(params)

	if method == 'emptytrash': return apiemptytrash(params)
	
	if method == 'postevent': return apipostevent(params)
	if method == 'shell': return apishell(params)
	if method == 'ssh': return apissh(params)
	if method == 'search': return apisearch(params)
	if method == 'server': return apiserver(params)
	if method == 'mail': return apimail(params)

	securityCheck('bogus api method')
	return APISendReply('fail', 'Unrecognized command', [], params)


def apiknockknock(params):

	securityCheck('knock knock')

	#if bogoncount > 200:
	#	return APILoginError(params)

	commandlist=[]
	commandlist.append(['whosthere', setLoginNonce()])
	return APISendReply('', '', commandlist, params)


def apilogin(params):

	nonce = getLoginNonce()		# clears session state (logs out) by side effect
	if len(nonce) == 0:			# no stored nonce?  login in wrong state!
		return APILoginError(params, 'no nonce')

	username = getStringParam(params, 'username')
	if not username:
		return APILoginError(params, 'no username')
	if not nio().userExists(username):
		return APILoginError(params, 'nonexistent username')

	passwordhash = getStringParam(params, 'passwordhash')
	if not passwordhash:
		return APILoginError(params, 'no password')

	isvalid = validateHashedPassword(username, passwordhash, nonce)
	passwordhash = ''
	nonce = ''
	if not isvalid:
		return APILoginError(params, 'invalid password')

	tofolder = getStringParam(params, 'tofolder')
	if not tofolder: tofolder = os.path.join(username, inboxfolder)

	# set the auth cookie and the backing session state data it refers to
	openSession(username)

	# Send them to the folder
	commandlist = []
	commandlist.append(['navigateto', os.path.join('/folder', tofolder)])
	return APISendReply('', '', commandlist, params)


def apilogout(params):

	# Logout when you're not logged in is fishy enough to merit a security flag
	if not getRequestor():
		securityCheck('spurious logout')

	clearSessionData()

	commandlist = []
	commandlist.append(['navigateto', '/'])	# the index service will sort them out
	return APISendReply('', '', commandlist, params)


def getPathParam(params, attrname, accesslevel):
	if not params.has_key(attrname) or not params[attrname]:
		return ''

	# Mend single-component names by prepending the requestor, simulating relative path names
	parts = params[attrname].split('/')
	if len(parts) == 1:
		params[attrname] = params['requestor'] + '/' + params[attrname]
		print "GPP: post-fixup", params[attrname]

	if not nio().hasAccess(params['requestor'], params[attrname], accesslevel):
		securityCheck('path access violation')
		return ''	
	return params[attrname]

def getStringParam(params, attrname):
	if not params.has_key(attrname) or not params[attrname]:
		return ''
	return params[attrname]

def getNotelistParam(params, attrname):
	if not params.has_key(attrname) or not params[attrname]: return None
	t = type(params[attrname])
	if t == type({}): return [params[attrname]]
	if t == type([]): return params[attrname]
	return None


# renamenote: save a note under a new name
# stage 1: new name must be unique or the operation fails
# TODO: stage 2: humane filenames: add -1, -2, -3 etc
# on failure send back error message
# on success we send back:
#   renamenote
	#   delete of old note
	#   updatenote to create the new note

def apirenamenote(params):

	fromfolder = getPathParam(params, 'fromfolder', owners);
	if not fromfolder: return APIUnauthorized(params)

	# Validate fromname and toname
	fromname = getStringParam(params, 'fromname');
	toname = getStringParam(params, 'toname');
	if not fromname or not toname:
		return APIArgumentError(params)
	
	if nio().filenameHasEvilChars(fromname) or nio().filenameHasEvilChars(toname):
		securityCheck('rename evil')
		return APIArgumentError(params)

	#if not nio().noteExists(fromfolder, fromname):
	#	securityCheck('rename nonexistent')
	#	return APIArgumentError(params)

	# Read the note
	note = nio().getNote(fromfolder, fromname)
	if note <> {}:
		note['id'] = toname
		commandlist = []
	
		# TODO: Generate humane note names like notename-123
		# TODO: File system race condition here might be repaired via review of tempfile.py
		if not nio().noteExists(fromfolder, toname):
			nio().putNote(fromfolder, toname, note)			# write the new

			# Deleted note tombstone: mark the old note file as deleted to prevent endless transporter wars
			deleted_note = {
				'deleted':1			# nio().getNoteModifiedTime(fromfolder, fromname)
			}
			nio().putNote(fromfolder, fromname, deleted_note)
			#os.remove(os.path.join(soupbase, f, oldname))	# remove the old			
	
			commandlist.append(['updatenote', note])
			commandlist.append(['deletenote', fromname])

			#notifyNoteEvent(fromfolder, ['updatenote', note])
			#notifyNoteEvent(fromfolder, ['deletenote', fromname])

		else:
			commandlist.append(['say','Rename failed: name in use'])

	return APISendReply('', '', commandlist, params)


def apisavenote(params):
	"""
	savenote: Save a note to a folder
		noteid
		note or list of note objects
		touser
		tofolder

	If the passed-in note has an 'id', the operation is treated as an update.  Editor permission
	is required on the folder in this case.
	If the passed-in note has no 'id' a new note is created and a new id is allocated; this
	requires only Sender permission.
	"""

	tofolder = getPathParam(params, 'tofolder', senders)
	if not tofolder: 
		return APIUnauthorized(params)

	# Get a notelist to work with
	notelist = getNotelistParam(params, 'note')
	if not notelist:
		return APIArgumentError(params, 'note')

	# Notifyfolder is optional
	notifyfolder = getStringParam(params, 'notifyfolder')
	notify = (notifyfolder == tofolder)

	commandlist = []
	for thenote in notelist:
		if thenote.has_key('id'):		# require edit access to overwrite a note
			if not nio().hasEditorAccess(params['requestor'], tofolder):
				return APIFail(params)
		else:
			thenote['id'] = nio().newNote(tofolder);	# append requires only sender

		# Mark the note with the sending origin
		thenote['from'] = params['requestor'] + ' in ' + notifyfolder

		try:
			nio().putNote(tofolder, thenote['id'], thenote)
		except:
			return APIFail(params)

		# Proxy note: save the text field to the affected file
		# TODO: Need to validate note.proxyfor to prevent .. attacks
		#if thenote.has_key('proxysavethrough') and thenote['proxysavethrough']:
		#	nio().putFile(thenote['proxyfor'], thenote['text'])

		#if params.has_key('modtime'):
		#	modtime = float(params['modtime'])
		#	if modtime > 0:
		#		os.utime(os.path.join(soupbase, tofolder, thenote.id), (modtime, modtime));

		c = ['updatenote', thenote]
		#notifyNoteEvent(tofolder, c)
		if notify: 
			commandlist.append(c)

	return APISendReply('', '', commandlist, params)


# appendtonote: append text to a note
#
# params:
# 	noteid: the id of the note to append the text to
# 	tofolder: the folder the note lives in
# 	notifyfolder: send updates if this folder is touched
# 	text: text to append
#
# TODO: Check for / handle proxy notes
#
def apiappendtonote(params):

	# Text data is required
	thetext = getStringParam(params, 'text')
	
	# Prepend the username
	# decided to let the client say what it wants
	#thetext = r + ': ' + thetext

	# Note id is required
	noteid = getStringParam(params, 'noteid')

	# Append access to the destination is required
	tofolder = getPathParam(params, 'tofolder', senders)

	if not thetext or not noteid or not tofolder: return APIUnauthorized(params)

	# Notifyfolder is optional
	notifyfolder = getStringParam(params, 'notifyfolder')

	# Get the note, update it, and write it out
	thenote = nio().getNote(tofolder, noteid)
	if (thenote == {}):
		thenote['id'] = noteid
		thenote['text'] = thetext
	else:
		if thenote.has_key('text'): thenote['text'] += thetext
		else: thenote['text'] = thetext
	nio().putNote(tofolder, noteid, thenote)

	c = ['updatenote', thenote]
	#notifyNoteEvent(tofolder, c)
	if (notifyfolder == tofolder):
		return APISendReply('', '', [c], params)

	# Nothing to send except success
	return APISuccess(params);



# sendnote: Send a note
#
# 	noteid: ID (filename) of note to send from the current logged in user/folder
#	fromfolder: currentlocation of the note noteid
# 	tofolder: destination of send
#	deleteoriginal: default True, if False original is not removed
#
def apisendnote(params):

	# Validate source
	# Determine whether we are requested to delete the original after the send
	# This requires higher (editor) privs than send-without-delete (aka template copy)
	if params.has_key('deleteoriginal'): deleteoriginal = params['deleteoriginal']
	else: deleteoriginal = True
	
	if deleteoriginal:
		# Validate the frompath for editor access
		fromfolder = getPathParam(params, 'fromfolder', editors);
	else:
		fromfolder = getPathParam(params, 'fromfolder', readers);

	if not fromfolder: return APIUnauthorized(params)

	# Validate destination
	tofolder = getPathParam(params, 'tofolder', senders)
	if not tofolder: return APIUnauthorized(params)

	# Get the noteid to send
	thenoteid = getStringParam(params, 'noteid');
	if not thenoteid: return APIArgumentError(params, 2)

	# Can't send what ain't there
	if not nio().noteExists(fromfolder, thenoteid):
		return APIArgumentError(params, 3)

	# Fetch the note being sent
	note = nio().getNote(fromfolder, thenoteid)
	if note == {}: return APIArgumentError(params, 4)	# somehow not well formed

	# Get the folder for which to send notifications, if any
	# If this arg is present the requester must have read access to the specified folder
	# If it's null we just forego notifications below
	notifyfolder = getPathParam(params, 'notifyfolder', readers)

	# Prune zIndex so the note negotiates with its new folder
	if note.has_key('zIndex'):
		del note['zIndex']
	
	# Can't send a zero-length file
	if note == {}: return APIArgumentError(params, 5)

	# Mark it with the sending origin
	note['from'] = params['requestor'] + ' from ' + fromfolder

	# Get a new id if we would be overwriting (seems unlikely dunnit?!)
	if nio().noteExists(tofolder, thenoteid):
		print "INTERESTING: send file name collision ", thenoteid, fromfolder, tofolder
		note['id'] = nio().newNote(tofolder)

	nio().putNote(tofolder, note['id'], note)
	#notifyNoteEvent(tofolder, ['updatenote', note])

	if deleteoriginal:
		# Handle deletion of the sent note	
		# Deletion tombstones
		# instead of just deleting the note via:
		#    nio().deleteNote(fromfolder, thenoteid)
		# we mark the note deleted and leave it around for the deletion to propagate
		if saveTombstones:
			deleted_note = {
				'deleted': nio().getNoteModifiedTime(tofolder, note['id'])
			}
			nio().putNote(fromfolder, thenoteid, deleted_note)
		else:
			nio().deleteNote(fromfolder, thenoteid)

		#notifyNoteEvent(fromfolder, ['deletenote', thenoteid])

		# we are deleting the original; delete any associated proxy
		# iff we are deleting out of its host directory
		if note.has_key('notetype') and (note['notetype'] == 'proxy') and note.has_key('proxyfor'):
		
			p = note['proxyfor'].split('/')
			t = tofolder.split('/')[1];
			if (t == 'trash') and (len(p) == 3) and (p[0] != 'http:') and (p[0] != 'https:') and \
				(os.path.join(p[0], p[1]) == fromfolder):

				# delete the uploaded file
				# BUG: TODO: move it to the trash instead
				print "SEND: Deleting proxy", p[0], p[1], p[2]
				nio().deleteFile(os.path.join(p[0], p[1], p[2]));

	# Add this folder to the user's folder list
	#apiaddtofolderlist(tofolder)
	
	# Handle notifications back to the client
	if (notifyfolder):

		commandlist = []

		# If we deleted the source note from the
		# Finally, delete it from the client side
		#commandlist.append(['beginupdate',''])

		if fromfolder == notifyfolder and deleteoriginal:
			commandlist.append(['deletenote', thenoteid])
		if tofolder == notifyfolder:
			commandlist.append(['updatenote', note])

		# Tidy up and send the update package
		if len(commandlist):
			return APISendReply('', '', commandlist, params)

	return APISuccess(params)


def apigetnote(params):

	fromfolder = getPathParam(params, 'fromfolder', readers)
	if not fromfolder: return APIUnauthorized(params)
	
	noteid = getStringParam(params, 'noteid')
	if not noteid: return APIArgumentError(params)
	
	thenote = nio().getNote(fromfolder, noteid)
	if thenote and thenote <> {}:
		commandlist = []
		commandlist.append(['getnote', thenote])
		return APISendReply('', '', commandlist, params)

	return APIArgumentError(params)


def apigetfolder(params):

	fromfolder = getPathParam(params, 'fromfolder', readers)
	if not fromfolder: return APIUnauthorized(params)

	t1 = time.time()

	notes = {}
	for noteid in nio().getDirList(fromfolder):
		thenote = nio().getNote(fromfolder, noteid)
		if thenote and thenote <> {}:
			notes[noteid] = thenote

	print 'APIGETFOLDER: time=', time.time() - t1

	commandlist = []
	commandlist.append(['getfolder', notes])
	return APISendReply('', '', commandlist, params)


def getRequestorsFolderList(requestor):

	#print "GFL:", requestor
	rawlist = nio().getDirList(requestor)
	if len(rawlist):
		#print "GFL: raw", rawlist
		folderlist = []
		for l in rawlist:
			#print
			#print "GFL ITEM", l, type(l), str(l)
			folderlist.append(os.path.join(requestor, l))
	else:
		folderlist = [welcomefolder]
	#print "GFL: cooked", folderlist
	return folderlist


def apigetfolderlist(params):

	folderlist = getRequestorsFolderList(params['requestor'])

	commandlist = []
	commandlist.append(['folderlist', folderlist])
	print "APIGETFOLDERLIST", folderlist
	return APISendReply('', '', commandlist, params)


def apicreatefolder(params):

	print "CREATEFOLDER", params['tofolder'], params['requestor']

	# Get the name for the new folder
	tofolder = getStringParam(params, 'tofolder')
	if not tofolder: 
		return APIArgumentError(params)

	# force lowercase
	tofolder = string.lower(tofolder)

	if nio().foldernameHasEvilChars(tofolder): 
		print "CREATEFOLDER: Bogus chars in foldername: ", tofolder, nio().foldernameHasEvilChars(tofolder)
		return APIArgumentError(params)

	# If no user part was passed in tack on the requestor and give it a go
	parts = tofolder.split('/')
	if len(parts) == 1:
		if (len(params['requestor']) > 0):
			tofolder = os.path.join(params['requestor'], tofolder)
		else:
			return APIArgumentError(params)

	# If no user part was passed in it is an error
	touser = nio().getUserFromFolderPath(tofolder)
	print "CF2", tofolder, touser
	if not touser:
		return APIArgumentError(params)

	if not nio().hasOwnerAccess(params['requestor'], os.path.join(touser, inboxfolder)):	# inbox as proxy for ownership
		return APIUnauthorized(params)

	if nio().folderExists(tofolder):
		securityCheck('create existing folder')
		return APISendReply('Failure', 'Cannot create folder', [], params)
	
	if not nio().createFolder(tofolder):
		securityCheck('create folder fail')
		return APISendReply('Failure', 'Cannot create folder', [], params)

	if not params.has_key('stayhere') or not params['stayhere']:
		commandlist = []
		commandlist.append(['navigateto', os.path.join('/folder', tofolder)])
		return APISendReply('', '', commandlist, params)
	return APISuccess(params)


def apisetfolderpassword(params):
	"""
	setfolderpassword: set read-access password on a folder
		tofolder: folder
		password: the password to set
	"""
	# Validate destination
	tofolder = getPathParam(params, 'tofolder', owners)
	if not tofolder: return APIUnauthorized(params)

	# Validate new password
	password = getStringParam(params, 'password')
	if not password:
		return APIArgumentError(params)

	if  not setFolderPassword(tofolder, password):
		return APIFail(params)

	return APISuccess(params)


def apiopenfolder(params):
	"""
		openfolder: open a new folder
		tofolder: folder to open
	
		This implementation sends a navigateto command to the client.
	"""
	tofolder = getPathParam(params, 'tofolder', readers)
	if not tofolder: return APIUnauthorized(params)
	touser = nio().getUserFromFolderPath(tofolder)

	commandlist = []
	commandlist.append(['navigateto', os.path.join('/folder', tofolder)])
	return APISendReply('', '', commandlist, params)


def getUserNameFromFolderPath(f):
	return f.split('/')[0]


def apirenamefolder(params):
	"""
	renamefolder: rename a folder
		fromfolder: folder to rename
		tofolder: new name for folder

	owner permission is required on the source

	systemuser can rename across users
	"""
	# Validate the source
	fromfolder = getPathParam(params, 'fromfolder', owners);
	if not fromfolder: return APIUnauthorized(params)

	tofolder = getStringParam(params, 'tofolder')
	if not tofolder or nio().foldernameHasEvilChars(tofolder) or nio().folderExists(tofolder): 
		return APIArgumentError(params)

	# Disallow cross-user renames, except for root, who should know better
	if (getUserNameFromFolderPath(fromfolder) != getUserNameFromFolderPath(tofolder)):
			return APIUnauthorized(params)

	# oops, this needs to be done via copy/delete
	return APIFail(params)

	# Attempt the rename
	try:
		os.rename(os.path.join(soupbase, fromfolder), os.path.join(soupbase, tofolder))
	except:
		return APIFail(params)

	# Navigate to renamed folder <tofolder>
	commandlist = []
	commandlist.append(['navigateto', os.path.join('/folder/', tofolder)])
	return APISendReply('', '', commandlist, params)


def apideletefolder(params):
	"""
	deletefolder: Move contents to trash folder and delete this one
	"""

	fromfolder = getPathParam(params, 'fromfolder', owners);
	if not fromfolder: return APIUnauthorized(params)

	# move all notes and attachments to the trash
	notelist = nio().getDirList(fromfolder);
	tofolder = os.path.join(params['requestor'], trashfolder)
	for filename in notelist:
		f = filename.find('.')
		if f < 0:		# a note - move to trash
			note = nio().getNote(fromfolder, filename)
			nio().putNote(tofolder, filename, note)
			nio().deleteNote(fromfolder, filename)	# for proper notifications

		elif f == 0:	# dotfile - delete
			nio().deleteFile(fromfolder, filename)

		else:		# has extension - not a note -- copy to trash
			filedata = nio().getFile(os.path.join(fromfolder, filename))
			nio().putFile(os.path.join(tofolder, filename), filedata)
			nio().deleteFile(os.path.join(fromfolder, filename))

	# delete the folder
	nio().deleteFolder(fromfolder)

	# Send them to their inbox
	commandlist = []
	commandlist.append(['navigateto', os.path.join('/folder', params['requestor'], 'inbox')])
	return APISendReply('', '', commandlist, params)


def apicopyfolder(params):
	"""
	copyFolder: copy all notes from one current folder to another

	- If the destination does not exist, it is created.
	- Files marked with a 'deleted' attribute are not copied.
	- Files which would overwrite existing files in the destination are not copied.
	- Filename (noteid) is not changed in the copy.  This needs further thought and probably remedy.  TODO.
	"""

	fromfolder = getPathParam(params, 'fromfolder', readers);
	if not fromfolder: return APIUnauthorized(params)

	tofolder = getStringParam(params, 'tofolder')
	if not tofolder: return APIArgumentError(params)

	# validate the destination.  tricky since it might not exist so can't use normal path code
	parts = tofolder.split('/')
	if len(parts) == 1:
		tofolder = os.path.join(params['requestor'], parts[0])	# add username if missing
	elif len(parts) != 2:
		return APIArgumentError(params)

	if nio().folderExists(tofolder):
		if not nio().hasSenderAccess(params['requestor'], tofolder):
			return APIUnauthorized(params)
	else:
	
		# Folder does not exist.  Ok to create it...
		try:
			nio().createFolder(tofolder);
		except:
			return APISendReply('Failure', 'Cannot create folder', [], params)
	
	if copyfolder(fromfolder, tofolder):	
		commandlist = []
		commandlist.append(['say','Contents of folder ' + fromfolder + ' copied to ' + tofolder])
		return APISendReply('', '', commandlist, params)
	else:
		return APISendReply('Failure', 'Error copying folder', [], params)


def copyfolder(fromfolder, tofolder):
	"""
	copyfolder worker: copy all notes from one folder to another

	called by apicopyfolder and by the new user setup from skeleton

	TODO: better error handling here
	TODO: tofolder needs defensive security checking
	"""

	for noteid in nio().getDirList(fromfolder):
		note = nio().getNote(fromfolder, noteid)
		if not note: continue
		if note == {}: continue
		note['id'] = nio().newNote(tofolder);
		if not nio().putNote(tofolder, note['id'], note): return False
		#notifyNoteEvent(tofolder, ['updatenote', note])
	return True


def apiemptytrash(params):
	"""
	emptytrash: empty the trash
	"""
	folder = os.path.join(params['requestor'], trashfolder)
	for n in nio().getDirList(folder):
		print "EMPTY TRASH: deleting ", folder, n
		nio().deleteNote(folder, n)
	return APISuccess(params)

# getaccess: Get an access control list
#	accessmode: readers, editors, senders
#	accesslist: list of permissions
#
def apigetfolderacl(params):
	"""
	getAccesslist: set the ACL of a folder
	
		accessmode: senders, readers, editors, owners
		accesslist: list of usernames with the permission
	"""
	tofolder = getPathParam(params, 'tofolder', owners)
	if not tofolder or not nio().folderExists(tofolder): 
		return APIUnauthorized(params)

	aclobject = {
		'folder': tofolder,
		'readers': nio().getAccess(tofolder, readers),
		'editors': nio().getAccess(tofolder, editors),
		'senders': nio().getAccess(tofolder, senders)
	}
	commandlist=[]
	commandlist.append(['folderacl', aclobject])
	return APISendReply('', '', commandlist, params)


# setaccess: Set an access control list
#	accessmode: readers, editors, senders
#	accesslist: list of permissions
#
def apisetfolderacl(params):
	"""
	setaccesslist: set the ACL on a folder
	
		accessmode: senders, readers, editors, owners
		accesslist: list of usernames with the permission
	"""
	tofolder = getPathParam(params, 'tofolder', owners)
	if not tofolder: return APIUnauthorized(params)

	if params.has_key('senders'):
		if not nio().setAccess(tofolder, senders, params['senders']): return APIFail(params)

	if params.has_key('readers'):
		if not nio().setAccess(tofolder, readers, params['readers']): return APIFail(params)

	if params.has_key('editors'):
		if not nio().setAccess(tofolder, editors, params['editors']): return APIFail(params)

	return APISuccess(params)


def apisync(params):
	"""
	sync: synchronize a folder
		fromfolder: folder to sync
		lastupdate: optional last sync handle (0 if we've never synced)

	Cause the server to return a list of commands 
	to bring the client up to date on changes in the folder 
	between lastupdate and Now()
	"""
	fromfolder = getPathParam(params, 'fromfolder', readers);
	if not fromfolder: return APIUnauthorized(params)

	if params.has_key('lastupdate'): lastupdate = float(params['lastupdate'])
	else: lastupdate = 0

	updatecommandlist = []
	updatecommandlist = checkFolderForUpdate(fromfolder, lastupdate)
	return APISendReply('', '', updatecommandlist, params)


def apicreateuser(params):
	"""
	createuser: create a new user
		username: name to create
		password: password for the new user
		stayhere: optional flag to stay in current workspace
			otherwise we navigate to the new user's inbox
	"""
	# Who's asking?
	if not(enableSignup or (params['requestor'] == systemuser)):
		return APIUnauthorized(params)

	username = getStringParam(params, 'username')
	password = getStringParam(params, 'password')
	if not username or not password:
		return APIArgumentError(params)

	# force lowercase
	username = string.lower(username)

	if nio().userExists(username) or (username in reservedusernames) or nio().filenameHasEvilChars(username):
		securityCheck('create user 1')
		return APIArgumentError(params)

	#if requireemailusername:
	#	if not isEmailAddress(username):
	#		return APIArgumentError(params)

	createUser(username, password)
	securityCheck('create user 2')

	# set the auth cookie and the backing session state data it refers to
	openSession(username)

	# Build the reply
	commandlist=[]
	commandlist.append(['say', 'Created new user ' + username])
	commandlist.append(['navigateto', os.path.join('/folder', username, inboxfolder)])
	return APISendReply('', '', commandlist, params)


#def apiupdateuser(params):
#	return APIFail(params)

def apideleteuser(params):
	return APIFail(params)


def apigetfeed(params):
	return APIFail(params)

def apigeturl(params):
	return APIFail(params)


#		['system/templates', 'blank', 'New Blank Note'],
#		['system/templates', 'bizcard', 'My Card'],
#		['system/templates', 'clock', 'Clock'],
#		['system/templates', 'timer', 'Timer']
systemtemplates = None

import operator

def getTemplates(folder):
	notelist = nio().getDirList(folder)
	templatelist = []
	i = 0
	while i < len(notelist):
		thenote = nio().getNote(folder, notelist[i])
		if 'notename' in thenote:
			thetitle = thenote['notename']
		else: thetitle = 'untitled'
		templatelist.append([folder, notelist[i], thetitle])
		i = i + 1
	try:	# sigh.  python 2.3.5 does not have itemgetter
		templatelist.sort(key=operator.itemgetter(2))
	except:
		pass
	return templatelist


autoIncludeSystemTemplates = False


def apigettemplatelist(params):

	t1 = time.time()
	if ('fromfolder' in params):
		fromfolder = getPathParam(params, 'fromfolder', readers);
		if not fromfolder: return APIUnauthorized(params)
		templatelist = getTemplates(fromfolder)
	else:
		templatelist = []
		if autoIncludeSystemTemplates:
			global systemtemplates
			if not systemtemplates:
				systemtemplates = getTemplates(os.path.join(systemuser, templatefolder))
			templatelist = systemtemplates
		templatelist = templatelist + getTemplates(os.path.join(params['requestor'], templatefolder))

	print "APIGETTEMPLATELIST", templatelist, time.time() - t1, 'ms'
	commandlist = []
	commandlist.append(['templatelist', templatelist])
	return APISendReply('', '', commandlist, params)


def getNotes(fromfolder):
	notelist = nio().getDirList(fromfolder)
	notes = {}
	for i in range(len(notelist)):
		if notelist[i].find('.') >= 0: continue
		thenote = nio().getNote(fromfolder, notelist[i])
		notes[notelist[i]] = thenote
	return notes

def getNotesArray(fromfolder):
	notelist = nio().getDirList(fromfolder)
	notes = []
	for i in range(len(notelist)):
		if notelist[i].find('.') >= 0: continue
		thenote = nio().getNote(fromfolder, notelist[i])
		notes.append(json.write(thenote))
	return notes


def apigetnotes(params):

	t1 = time.time()
	fromfolder = getPathParam(params, 'fromfolder', readers);
	if not fromfolder: return APIUnauthorized(params)

	notes = getNotes(fromfolder)

	print "APIGETNOTES:", len(notes), 'notes', time.time() - t1, 'ms', notes
	commandlist = []
	commandlist.append(['notes', notes])
	return APISendReply('', '', commandlist, params)



import commands

def apishell(params):

	if not enableShellCommands or (params['requestor'] != systemuser):
		return APIUnauthorized(params);

	tofolder = getPathParam(params, 'tofolder', owners)
	if not tofolder: tofolder = systemuser + '/' + inboxfolder

	thecmd = getStringParam(params, 'shellcommand')
	if not thecmd: return APIArgumentError(params)

	print "****SHELL: ", thecmd
	s = commands.getoutput(thecmd)
	noteid = nio().newNote(tofolder)
	note = {
		'id': noteid,
		'notename': 'output for: ' + thecmd,
		'bgcolor': '#ffffff',
		'width': 500
	}
	if s[0][0] == '<': note['text'] = ''.join(s.split('\n'))
	else: note['text'] = '<br>'.join(s.split('\n'))
	nio().putNote(tofolder, noteid, note)

	#notifyNoteEvent(tofolder, ['updatenote', note])
	commandlist = []
	commandlist.append(['updatenote', note])
	return APISendReply('', '', commandlist, params)


try:
	import paramiko
except:
	enableSSHCommands = False


#connection: user@host:port
#password: ther password, in plain text.  ugh.
#command: the shell command
#tofolder: where to send the output


def apissh(params):

	if not enableSSHCommands:
		return APIUnauthorized(params);

	tofolder = getPathParam(params, 'tofolder', editors)
	if not tofolder: tofolder = params['requestor'] + '/' + inboxfolder

	notifyfolder = getStringParam(params, 'notifyfolder')

	command = getStringParam(params, 'sshcommand')
	if not command: return APIArgumentError(params, 1)
	
	password = getStringParam(params, 'password')
	if not password: return APIArgumentError(params, 2)

	connection = getStringParam(params, 'connection')
	if not connection: return APIArgumentError(params)
	if (connection.find('@') >= 0):
		user, host = connection.split('@')
	else:
		user = params['requestor']
		host = connection

	if (host.find(':') >= 0): host, port = host.split(':')
	else: port = 22

	if not user or not host or not port:
		return APIArgumentError(params, 3)

	print "****SSH: ", user, host, port, command
	c = paramiko.SSHClient()
	c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
	c.connect(host, port, user, password)
	stdin, stdout, stderr = c.exec_command(command)
	s = stdout.read()
	e = stderr.read()
	c.close()

	print "SSH: stdout=", s
	print "SSH: stderr=", e

	commandlist = []
	if len(s):
		noteid = nio().newNote(tofolder)
		note = {
			'id': noteid,
			'notename': 'ssh output for ' + user + '@' + host + ':' + str(port),
			'bgcolor': 'black',
			'iscommandoutput': True,
			'width': 500
		}
		if s[0][0] == '<': note['text'] = ''.join(s.split('\n'))
		else: note['text'] = '<br/>'.join(s.split('\n'))

		note['text'] = ''.join([
			'<div class="sshoutput" style="font-family:monospace; color:lime">', 
			'<b>', user, '@', host, ':', str(port), '>&nbsp;</b>', command, '<br/>',
			note['text'], '</div>']);

		nio().putNote(tofolder, noteid, note)
		commandlist.append(['updatenote', note])

	if len(e):
		noteid = nio().newNote(tofolder)
		stderrnote = {
			'id': noteid,
			'notename': 'ssh error output for ' + user + '@' + host + ':' + str(port),
			'bgcolor': '#ffa0a0',
			'iscommandoutput': True,
			'width': 500
		}
		if e[0][0] == '<': stderrnote['text'] = ''.join(e.split('\n'))
		else: stderrnote['text'] = '<br/>'.join(e.split('\n'))
		nio().putNote(tofolder, noteid, stderrnote)
		commandlist.append(['updatenote', stderrnote])

	if notifyfolder == tofolder:
		return APISendReply('', '', commandlist, params)
	else: return APISuccess(params)


def apisearch(params):
	searchfor = getStringParam(params, 'searchfor')
	if not searchfor: return APIArgumentError(params)

	matchCount = 0
	searchAttachments = False
	commandlist = []

	def isMatch(searchfor, note):
		return (json.write(note).find(searchfor) >= 0)
	
	folderlist = getRequestorsFolderList(params['requestor']);
	for f in folderlist:
		for noteid in nio().getDirList(f):
			if noteid.find('.') >= 0: 
				if not searchAttachments: continue
			note = nio().getNote(f, noteid)
			if not note: continue
			if note == {}: continue

			if isMatch(searchfor, note):
				print "MATCH: ", noteid
				note['nosave'] = True;
				commandlist.append(['updatenote', note]);
				matchCount = matchCount + 1;

	commandlist.append(['say', str(matchCount) + ' hits found.']);
	return APISendReply('', '', commandlist, params)


enableSystemCommands = True

def apiserver(params):
	#if not enableSystemCommands or (params['requestor'] != systemuser):
	#	return APIUnauthorized(params);

	cmd = getStringParam(params, 'servercommand')
	print "APISERVERCOMMAND: ", cmd
	if cmd == 'stop':
		print "Stopping the server..."
		raise SystemExit
	elif cmd == 'halt':
		print "Halting the server..."
		os._exit(-2)
	elif cmd == 'restart':
		print "Restarting the server..."
		#global cherrypy
		#cherrypy.engine.reexec()
		os.kill(os.getpid(), signal.SIGTERM)
	else:
		print "Unrecognized command: ", cmd

	return APISuccess(params)



from notesoupmail import sendmail

def apimail(params):

	sender = params['requestor']
	if not sender: return APIUnauthorized(params)

	to = getStringParam(params, 'to')
	if not to or not sender: return APIArgumentError(params, 'tofrom')

	subject = getStringParam(params, 'subject')
	if not subject: subject = ''
	
	body = getStringParam(params, 'body')
	if not body: body = ''
	
	ret = sendmail(sender, to, subject, body)
	if not ret:
		print "APIMAIL: error sending mail"
		return APIFail(params)
	else:
		print "APIMAIL: sent mail from ", sender, " to ", to
		return APISuccess(params)




#################
# sessions
#################

sessioncookie = 'notesoup'
cookielen = 40
session_maxage = 2*(24*60*60)	# a day
nonce_maxage = 30	# 30 seconds: log in or buzz off
cancel_maxage = 0	# this is how you cancel
noncelen = 32


def setCookie(cookiename, maxage):
	cookie = cherrypy.response.cookie
	cookie[sessioncookie] = cookiename
	cookie[sessioncookie]['path'] = '/'
	cookie[sessioncookie]['expires'] = time.strftime("%a, %d-%b-%Y %H:%M:%S GMT", time.gmtime(time.time() + maxage))
	cookie[sessioncookie]['version'] = 1
	print "SET COOKIE:", cookiename, maxage

def setLoginNonce():
	token = nio().randomName(cookielen)
	# BUG: check for collision (token exists, 1 in 56^32)

	nonce_maxage = 30		# login or buzz off
	setCookie(token, nonce_maxage);
	sessiondata = {
		'notename': 'pre-login nonce',
		'id': token,
		'bgcolor': 'red',
		#'nonce': 'mary had a little lamb',
		'nonce': nio().randomName(noncelen),
		'expires': time.time() + nonce_maxage 
	}
	putSessionData(token, sessiondata);
	print "SET NONCE:", sessiondata['nonce']
	return sessiondata['nonce']

def getLoginNonce():
	sd = getSessionData()
	print "GET NONCE: sd=", sd
	if not sd or sd is {} or not 'nonce' in sd:
		print "GET NONCE: NO NONCE FOUND"
		return ''
	print "GET NONCE:", sd['nonce']
	clearSessionData()		# consume the nonce and token
	return sd['nonce']

def openSession(username):
	token = nio().randomName(cookielen)
	setCookie(token, session_maxage);
	sessiondata = {
		'notename': username,
		'text': username + ' logged in at ' + time.strftime("%a, %d %b %Y %H:%M:%S +0000", time.gmtime()),
		'bgcolor': 'lime',
		'id': token,
		'username': username,
		'expires': time.time() + session_maxage
	}
	putSessionData(token, sessiondata);

	# TODO: clear bogusopcount
	return token

def getSessionToken():
	request = cherrypy.request
	cookie = request.cookie
	if not sessioncookie in cookie.keys(): 
		print "GET SESSION TOKEN: NO TOKEN", cookie.keys()
		return ''
	token = str(cookie[sessioncookie].value)
	print "GET SESSION TOKEN:", token
	return token

def getSessionData(token=''):
	if not token: token = getSessionToken()
	return nio().getSessionData(token);

def putSessionData(token, sessiondata):
	return nio().putSessionData(token, sessiondata)

def getRequestor():
	sd = getSessionData()
	if not sd or sd is {} or not 'username' in sd:
		print "GETREQUESTOR: null requestor"
		return ''
	print "GETREQUESTOR:", sd['username']
	return sd['username']

def clearSessionData():
	token = getSessionToken()
	print "CLEAR SESSION DATA:", token
	if not token: return {}
	nio().deleteSessionData(token)
	setCookie(token, cancel_maxage);



bogons = '.bogons'
def incrementCheckCounter():
	token = getSessionToken()
	if (token):
		countstr = nio().getFile(os.path.join(bogons, token))		
		if (countstr): count = int(countstr) + 1
		else: count = 1
		nio().putFile(os.path.join(bogons, token), str(count))
		return count
	return 0

def clearCheckCounter():
	token = getSessionToken()
	if (token):
		return nio().deleteFile(os.path.join(bogons, token))

#################



def NotesoupServer(useFastCGI=False):
	"""
	Startup and main loop entry for the notesoup http server.
		useFastCGI: if True we expect to be running under FCGI
	"""
	appdirectory = os.getcwd()

	#print notesoupdir, soupbase

	if False and not os.path.isdir(os.path.join(userhome, notesoupdir)):
		print 'Note Soup directory "' + notesoupdir + '"not found, initializing...'
		os.makedirs(os.path.join(userhome, notesoupdir))

		# create the log directory
		logdir = os.path.join(userhome, notesoupdir, 'log')
		if not os.path.isdir(logdir): os.makedirs(logdir)
	
		# create the sessions directory
		sessionsdir = os.path.join(userhome, notesoupdir, 'sessions')
		if not os.path.isdir(sessionsdir): os.makedirs(sessionsdir)

		print 'Note Soup directory initialized.'

	# Sanity check the installation
	if False: # and not xxxnioxxx.folderExists(welcomefolder):
		print 'Soupbase "' + soupbase + '" not found, initializing...'

		# Copy the seed soupbase to the new soup
		import commands
		thecommand = 'cp -r ' + soupbaseseed + ' ' + soupbase
		print 'Copying: ' + thecommand
		o = commands.getoutput('cp -r ' + soupbaseseed + ' ' + soupbase);
		print o
		print 'Copy complete.'

		#import shutil
		#print 'Copying ' + soupbaseseed + ' to ' + soupbase + '...'
		#shutil.copytree(soupbaseseed, soupbase)
		#print 'Copy complete.'

		#os.makedirs(soupbase)
		print 'Soupbase initialized.'
		print
		print '****************************************************'
		print 'System account is locked by default.'
		print 'Use the soupadmin utility to set the system password.'
		print '****************************************************'
		print

	if False:	# and not xxxNioxxx.folderExists(welcomefolder):
		print "Can't find 'soupbase', configuration problem? ", welcomefolder
		print "cwd is: " + os.getcwd()
		sys.exit(0)

	#curdir = os.path.join(os.getcwd(), os.path.dirname(__file__))
	curdir = os.getcwd()

	# Load our workspace template
	#global indexTemplate, fileNio
	#indexTemplate = fileNio.getRawFile('index.html')

	# Engage our FCGI filter
	#cherrypy.tools.pruneFCGI = cherrypy.Tool('before_request_body', pruneFCGI, priority=50)

	#print 'Conf:', conf

	root = NoteSoup()
	root.folder = folder()
	root.object = object()
	root.api = api()
	root.getapi = getapi()
	root.thumbnail = thumbnail()
	root.upload = upload()
	root.rss = rss()
	root.geturl = geturl()
	root.getfeed = getfeed()
	root.who = who()
	soupapp = cherrypy.tree.mount(root, config=conf)

	serverconfig['server.socket_port'] = httpPort
	print "serverconfig", serverconfig
	cherrypy.config.update(serverconfig)
	#	global homeuri
	#	if not homeuri:
	#		homeuri = cherrypy.url('')
	#		print 'Forcing homeuri to', homeuri


	# Start the server
	if useFastCGI == 'cherrypy':	
		# cherrypy native WSGI  (not currently working)
		#pass
		from cherrypy._cpwsgi import WSGIServer
		cherrypy.server.start(initOnly=True, serverClass=None)
		cherrypy.engine.start()
		#WSGIServer().start()

	elif useFastCGI == 'flup':
		# FLUP WSGI bridge to Apache running mod_useFastCGI
		# Can't get native CherryPy WSGi server to work on Dreamhost but this works for cp 2.2
		cherrypy.engine.start(blocking = False)
		from flup.server.fcgi import WSGIServer
		WSGIServer(soupapp).run()

	else:
		# CherryPy native HTTP server
		#print "Starting HTTP server on ", homeuri
		print "Starting HTTP server on ", cherrypy.url('')
		cherrypy.server.quickstart()
		cherrypy.engine.start()


# Push server change notification interface

def apipostevent(params):
	"""	postevent: post an event on a folder resource
		channeluri: the push channel to post on
		op: the event operation
	"""

	#todo: check auth on folders
	tochannel = getStringParam(params, 'tochannel');
	if not tochannel: return APIUnauthorized(params)

	if not params.has_key('op') or not params['op']:
		return APIArgumentError(params)

	clientid = getStringParam(params, 'clientid');

	notifyChange(tochannel, params['op'], getRequestor(), clientid)
	return APISuccess(params)


def notifyFolderChange(folder, op, u, clientid):
	notifyChange('/folder/' + folder, op, u, clientid)


def notifyChange(folder, op, u, clientid):
	""" inject a folder event into the event push server """

	if not enablePushServer: return

	## Make folder into an absolute URI, if it isn't already, so it is a channeluri
	#if folder.find('http://') == -1 and folder.find('https:') == -1:
	#	folder = os.path.join(homeuri, 'folder', folder)

	# Establish the sender's identity
	if not u: u = getRequestor()

	global notificationCount
	notificationCount = notificationCount + 1
	notification = {
		'sender': u,
		'clientid': clientid,
		'channeluri': folder,
		'op': op[0],
		'data': op[1],
		'id': notificationCount
	}
	pushserver.PushNotification(notification)


def runSoup():
	"""main notesoup entry point: parse options and start up the server(s)"""

	# parse command line options
	from optparse import OptionParser
	usage = "usage: %prog [options]"
	parser = OptionParser()

	parser.add_option("-p", "--port",
						dest="httpPort", type='int',
						help="port for HTTP service")

	parser.add_option("-f", "--flup",
						dest="flup", type='int',
						help="run flup WSGI server (web hosting behind apache)")

	parser.add_option("-m", "--mountpoint",
						dest='soupbase',
						help='set notesoup mountpoint - data root folder')

	parser.add_option("-s", "--s3",
						dest='s3',action='store_true',
						help='use s3 for storage')

	parser.add_option("-S", "--ssl",
						dest='ssl',action='store_true',
						help='use ssl for the transport')

	parser.add_option("-n", "--pushserver",
						dest='pushserver',
						help='set push server address')

	parser.add_option("-o", "--pushport",
						dest='pushport', type='int',
						help='set push server port')

	(options, args) = parser.parse_args()

	if options.httpPort:
		global httpPort
		httpPort = options.httpPort
		print 'http port set to:', httpPort

		#global httpHost, homeuri
		#if httpPort == 80: homeuri = httpHost
		#else: homeuri = httpHost + ':' + str(httpPort)
		#print 'homeuri set to', homeuri

	if options.flup:
		global useFastCGI
		useFastCGI = 'flup'
		print "flup/WSGI mode"
	
	if options.soupbase:
		print 'Setting soupbase to: ', options.soupbase
		global soupbase
		soupbase = options.soupbase

	if options.pushserver:
		global pushHost
		print "Setting pushHost to", options.pushserver
		pushHost = options.pushserver
		
	if options.pushport:
		global pushPort
		print "Setting pushPort to", options.pushport
		pushPort = options.pushport
	
	global storageMode
	if options.s3:
		print "Setting storage mode to S3."
		storageMode = 's3'
	else:
		storageMode = 'file'
	print "Storage mode: ", storageMode

	if options.ssl:
		serverconfig['server.ssl_certificate'] = 'ssl/server.crt'
		serverconfig['server.ssl_private_key'] = 'ssl/server.key'
		print "SSL enabled."
		
	import thread
	if enablePushServer:
		push_server_thread = thread.start_new_thread(pushserver.RunPushServer,(storageMode, pushHost, pushPort))
		cherrypy.engine.on_stop_engine_list.append(pushserver.KillPushServer)

	#cherrypy.server.interrupt = SystemExit()

	NotesoupServer(False)


if __name__ == '__main__':
	# By default just run the server with defaults
	runSoup()

