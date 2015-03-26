/**
 * This application is released under the Apache License V2.0
 * Checkout the project repository on GitHub: https://github.com/glazou/story-map-journal-generator
 */

/*
 * Configuration
 */

var ARCGIS_INFO = {
	authentication: {
		// Choose between OAuth or hardcoded username/password
		type: 'oauth', // 'oauth' | 'user'
		// OAuth configuration
		oauth: {
			appid: 'YVh0vMW0FEJDMWoy',
			jsapi: '//js.arcgis.com/3.13/'
		},
		// User configuration
		user: {
			user: '',
			pwd:  '',
		}
	},
	url:  'www.arcgis.com/',
	// Enter a webmap id if 'map-x-y' is going to be used
	webmapForEmbed: 'd6bb04eaaa714482896f3b50a0730e4e'
};

/*
 * Constants
 */

var JOURNAL_MAIN_STAGE_TYPE = ['webmap', 'image', 'video', 'webpage', 'map-x-y'];
var MAP_LEVELS = {
	world: 1,
	continent: 3,
	country: 5,
	state: 6,
	county: 10,
	city:13,
	block: 16
};

var isBrowser = typeof window !== 'undefined';
var itemTemplate = {
	item: null,
	itemData: null
};

if ( ARCGIS_INFO.authentication.type == 'user' && (! ARCGIS_INFO.authentication.user.user || ! ARCGIS_INFO.authentication.user.pwd) ) {
	error("Username and password not configured: see app/app.js");

	if (isBrowser) {
		$("#generate-map-journal").addClass("disabled");
		$("#json-data").val("");
	}
}
else if (isBrowser) {
	if ( ARCGIS_INFO.authentication.type == 'oauth' ) {
		if ( ARCGIS_INFO.authentication.oauth.appid ) {
			document.write("<script language='javascript' type='text/javascript' src='" + ARCGIS_INFO.authentication.oauth.jsapi + "'><\/script>");
			document.write("<script language='javascript' type='text/javascript'>require([\"esri/IdentityManager\", \"dojo/domReady!\"], function(Map) { window.jsapiLoadedCallback(); });<\/script>");
		}
		else {
			error("OAuth appid not configured");
			$("#generate-map-journal").addClass("disabled");
			$("#json-data").val("");
		}
	}
	else {
		$(document).ready(initView);
	}	
}
// Node.js
else {
	var path = require('path');
	var fs = require('fs');
	var deferred = require('deferred');
	var $ = require('jquery');
	var rp = require('request-promise');

	getItemTemplate();

	var filePath1 = path.join(__dirname, '../data/map-journal-sample.json');
	var journalJson = fs.readFileSync(filePath1, { encoding: 'utf-8' });

	generateMapJournal(journalJson);
}

function generateMapJournal(rawData)
{
	parseJournalDefinition(rawData).then(function(data){
		createMapJournal(data);
	});
}

/*
 * Journal data parsing
 */

function parseJournalDefinition(rawData)
{
	var resultDeferred = getDeferred();

	if ( ! itemTemplate.item || ! itemTemplate.itemData ) {
		error("Could not load Map Journal item template");
		return;
	}

	if ( isBrowser ) { 
		generateStep1();
	}

	if( ! rawData ) {
		error("No data");
		return;
	}

	var journal = null;

	try {
		journal = JSON.parse(rawData);
	} catch(e) {
		console.error(e);
	}

	if ( ! journal ) {
		error("Could not parse the JSON");
		return;
	}

	if ( ! journal.title ) {
		error("Journal title not defined");
		return;
	}

	if ( ! journal.sections || ! journal.sections.length ) {
		error("Sections not defined");
		return;
	}

	journal.sections.forEach(function(section,i){
		var invalid = false;

		if ( ! section.title ){
			error("Section " + i + " is missing title");
			invalid = true;
		}

		if ( ! section.mainstage ){
			error("Section " + i + " is missing main stage");
			invalid = true;
		}

		if ( ! section.panel ){
			error("Section " + i + " is missing panel");
			invalid = true;
		}

		if ( JOURNAL_MAIN_STAGE_TYPE.indexOf(section.mainstage.type) == -1 ){
			error("Section " + i + " mainstage is not valid");
			invalid = true;
		}

		if ( invalid ) {
			return;
		}

		section.content = section.panel.text;
		section.media = {};

		if( section.panel.map ) {
			if ( ! section.panel.map.x || ! section.panel.map.y ) {
				error("Section " + i + " panel map is not valid");
			}
			else {
				section.content += '<p><div class="iframe-container mj-frame-by-frametag fit" tabindex="0">' + buildMapEmbedFrame({
					x: section.panel.map.x,
					y: section.panel.map.y,
					scale: section.panel.map.mapScale,
					popup: {
						symbolUrl: section.panel.map.mapSymbolUrl,
						content: section.panel.map.popupContents
					}
				}) + '</div></p><br />';
			}
		}

		if( section.mainstage.type == 'map-x-y' ) {
			var ts = null;

			if (typeof window !== 'undefined') {
				ts = performance.now(); // Date.now()
			}
			else {
				var hrTime = process.hrtime();
				ts = hrTime[0] * 1000000 + hrTime[1] / 1000;
			}

			section.media = {
				type: 'webpage',
				webpage: {
					display: 'stretch',
					ts: ts, 
					url: "",
					frameTag: buildMapEmbedFrame({
						x: section.mainstage.x,
						y: section.mainstage.y,
						scale: section.mainstage.mapScale,
						popup: {
							symbolUrl: section.mainstage.mapSymbolUrl,
							content: section.mainstage.popupContents
						},
						unload: true
					})
				}
			};
		}
		else if( section.mainstage.type == 'webmap' ) {
			section.media.type = section.mainstage.type;
			section.media[section.mainstage.type] = {
				id: section.mainstage.id,
				extent: null,
				layers: null,
				popup: null,
				legend: {
					enable: false,
					openByDefault: false
				},
				overview: {
					enable: false,
					openByDefault: false
				}
			};
		}
		else {
			section.media.type = section.mainstage.type;

			var display = section.mainstage.display;

			if ( ! display ) {
				display = section.media.type == 'image' ? 'fill' : 'stretch';
			}

			section.media[section.mainstage.type] = {
				display: display,
				url: section.mainstage.url
			};
		}

		delete section.mainstage;
		delete section.panel;

		section.contentActions = [];
		section.creaDate = Date.now();
		section.pubDate = Date.now();
		section.status = "PUBLISHED";		
	});

	if ( isBrowser ) {
		console.log("Sections parsed successfully:", journal.sections);
	}
	else {
		console.log("Sections parsed successfully");
	}

	if ( ! journal.sections.length ) {
		error("Could not find any section");
		return;
	}

	if ( isBrowser ) {
		$("#json-data").attr("disabled", true);
	}

	resultDeferred.resolve(journal);

	return isBrowser ? resultDeferred : resultDeferred.promise;
}

function createMapJournal(journal)
{
	var user = ARCGIS_INFO.authentication.oauth.user || ARCGIS_INFO.authentication.user.user;

	/*
	 * Get ArcGIS Online Token
	 */

	getToken().then(function(token){
		console.log("ArcGIS Online token: OK");

		/*
		 * Create Map Journal item
		 */

		var item = itemTemplate.item,
			itemData = itemTemplate.itemData;

		item.title = journal.title;

		itemData.values.story.sections = journal.sections;

		createItem(
			user,
			token,
			itemTemplate.item,
			itemTemplate.itemData
		).then(function(itemId){
			console.log("Create item: OK");

			/*
			 * Update Map Journal item
			 */

			updateItemData(
				user,
				token,
				itemId,
				{
					url: getMapJournalUrl(itemId)
				}
			).then(function(success){
				console.log("Update item: OK");

				/*
				 * Share Map Journal item
				 */

				shareItem(
					user,
					token,
					itemId
				).then(function(success){
					console.log("Share item: OK");

					if ( success ) {
						if ( isBrowser ) {
							$("#generate-map-journal")
								.html('Story generated!');

							$(".progress").addClass("hide");

							setTimeout(function(){
								$("#generate-map-journal")
									.removeClass('disabled')
									.html('Generate the Map Journal');
							}, 2000);

							$("#open-map-journal")
								.removeClass('hide')
								.html('Open the Map Journal')
								.off('click')
								.on('click', function(){
									openMapJournal(itemId);
								});


							$("#json-data").attr("disabled", false);
						}
						else {
							console.log("Journal generated successfully");
							console.log(getMapJournalUrl(itemId));
						}
					}
				});
			});
		});
	});
}

/*
 * Utils
 */

function buildMapEmbedFrame(p)
{
	var url = 'http://www.arcgis.com/apps/Embed/index.html' +
		'?webmap=' + ARCGIS_INFO.webmapForEmbed +
		'&center=' + p.x + ',' + p.y +
		'&scale=false';

	/*
	 * Scale
	 */
	var scale = null;

	if ( p.scale ) {
		if ( MAP_LEVELS[p.scale] !== undefined ){
			scale = MAP_LEVELS[p.scale];
		}
	}

	if ( scale === null ) {
		scale = MAP_LEVELS.county;
	}

	url += '&level=' + scale;

	/*
	 * Pop-up
	 */
	if ( p.popup ) {
		if ( ! p.popup.symbolUrl )
			p.popup.symbolUrl = 'http%3A%2F%2Fstatic.arcgis.com%2Fimages%2FSymbols%2FShapes%2FBluePin2LargeB.png';
		else
			p.popup.symbolUrl = encodeURIComponent(p.popup.symbolUrl);

		url += '&marker=' + p.x + ';' + p.y + ';;;' + p.popup.symbolUrl + ';';

		if ( p.popup.content )
			url += p.popup.content;
	}

	return '<iframe width="100%" height="225px" style=" border: none;" src="' + url + '"></iframe>';
}

function getMapJournalUrl(itemId)
{
	return 'http://' + ARCGIS_INFO.url + 'apps/MapJournal/?appid=' + itemId;
}

/*
 * Item template
 */

function getItemTemplate()
{
	if ( isBrowser ) {
		$.ajax({ 
			type: 'GET',
			url: 'data/map-journal-item-template.json',
			dataType: 'json'
		}).then(function(data){
			itemTemplate.item = data;
		});

		$.ajax({ 
			type: 'GET',
			url: 'data/map-journal-item-data-template.json',
			dataType: 'json'
		}).then(function(data){
			itemTemplate.itemData = data;
		});
	}
	else {
		var filePath2 = path.join(__dirname, '../data/map-journal-item-template.json');
		itemTemplate.item = JSON.parse(fs.readFileSync(filePath2, { encoding: 'utf-8' }));

		var filePath3 = path.join(__dirname, '../data/map-journal-item-data-template.json');
		itemTemplate.itemData = JSON.parse(fs.readFileSync(filePath3, { encoding: 'utf-8' }));
	}
}

/*
 * ArcGIS Online utils
 */

function getToken()
{
	var resultDeferred = getDeferred();

	if ( ! isBrowser && ARCGIS_INFO.authentication.type == 'oauth' ) {
		error("Can't use OAuth when using node.js");
		resultDeferred.reject();
	}
	else if ( ARCGIS_INFO.authentication.type == 'oauth' ) {
		resultDeferred.resolve(ARCGIS_INFO.authentication.oauth.token);
	}
	else {
		agolRequest(
			"POST",
			"generateToken", 
			null,
			{
				username: ARCGIS_INFO.authentication.user.user,
				password: ARCGIS_INFO.authentication.user.pwd,
				referer: isBrowser ? document.location.origin : 'http://www.arcgis.com',
				f: 'json'
			}
		).then(function(rawResponse){
			var response = JSON.parse(rawResponse);
			if ( response && response.token )
				resultDeferred.resolve(response.token);
		});
	}

	return isBrowser ? resultDeferred : resultDeferred.promise;
}

function createItem(user, token, _item, itemData)
{
	var resultDeferred = getDeferred();

	//var item = $.extend({}, _item);
	var item = JSON.parse(JSON.stringify(_item));

	item.uploaded = Date.now();
	item.modified = Date.now();
	item.owner = user;
	item.token = token;
	item.f = 'json';
	item.overwrite = true;
	item.text = JSON.stringify(itemData);

	item.tags = item.tags.join(',');
	item.typeKeywords = item.typeKeywords.join(',');

	agolRequest(
		"POST",
		"addItem", 
		user,
		item
	).then(function(rawResponse){
		var response = JSON.parse(rawResponse);
		if ( response && response.success )
			resultDeferred.resolve(response.id);
	});

	return isBrowser ? resultDeferred : resultDeferred.promise;
}

function updateItemData(user, token, itemId, itemData)
{
	var resultDeferred = getDeferred();

	itemData.f = 'json';
	itemData.token = token;

	agolRequest(
		"POST",
		"update", 
		user + '/items/' + itemId,
		itemData
	).then(function(rawResponse){
		var response = JSON.parse(rawResponse);
		if ( response && response.success )
			resultDeferred.resolve(response.id);
	});

	return isBrowser ? resultDeferred : resultDeferred.promise;
}

function shareItem(user, token, id)
{
	var resultDeferred = getDeferred();

	agolRequest(
		"POST",
		"shareItems", 
		user,
		{
			everyone: true,
			items: id,
			f: 'json',
			token: token
		}
	).then(function(rawResponse){
		var response = JSON.parse(rawResponse);
		
		if ( response && response.results && response.results.length )
			resultDeferred.resolve(response.results[0].success);
	});

	return isBrowser ? resultDeferred : resultDeferred.promise;
}

function agolRequest(type, operation, resource, data)
{
	var url = 'https://' + ARCGIS_INFO.url + 'sharing/rest/';
	
	if ( resource )
		url += 'content/users/' + resource + '/';

	url += operation;

	return doRequest(type, url, data);
}

/*
 * Browser / node.js abstraction
 */

function getDeferred()
{
	if (typeof window !== 'undefined') {
		return new $.Deferred();
	}
	else {
		return deferred();
	}
}

function doRequest(method, url, data)
{
	//console.log(method, url, data);

	if ( isBrowser ) {
		return $.ajax(
			{
				type: method,
				url: url,
				data: data
			} 
		);
	}
	else {
		return rp(
			{
				method: method,
				uri: url,
				qs: data
			}
		);
	}
}

/*
 * UI
 */

function jsapiLoadedCallback()
{
	require(["esri/IdentityManager", "esri/arcgis/OAuthInfo"], function(IdentityManager, ArcGISOAuthInfo)
	{
		var info = new ArcGISOAuthInfo({
			appId: ARCGIS_INFO.authentication.oauth.appid,
			popup: false
		});

		IdentityManager.registerOAuthInfos([info]);

		IdentityManager.checkSignInStatus(info.portalUrl).then(
			function(authInfo) {
				ARCGIS_INFO.authentication.oauth.user = authInfo.userId;
				ARCGIS_INFO.authentication.oauth.token = authInfo.token;
				initView();
			}, 
			function() {
				IdentityManager.getCredential(info.portalUrl);
			}
		);
	});
}

function initView()
{	
	$.ajax({ 
		type: 'GET',
		url: 'data/map-journal-sample.json',
		dataType: 'json'
	}).then(function(data){
		$("#json-data").val(JSON.stringify(data, null, 2));
		
		$("#generate-map-journal")
			.click(function(){
				generateMapJournal($("#json-data").val());
			})
			.removeClass('hide')
			.html('Generate the Map Journal');

		$("#json-data").keyup(function(){
			$("#generate-map-journal")
				.toggleClass("disabled", ! $("#json-data").val())
				.html('Generate the Map Journal');
			$("#open-map-journal").addClass("hide");
		});

		$("#help-btn").click(function(){
			$("#help-container").toggleClass("hide");
		});

	});

	getItemTemplate();
}

function generateStep1()
{
	if (typeof window !== 'undefined') {
		$("#generate-map-journal").addClass('disabled').html('Generating...');
		$("#open-map-journal").addClass("hide");

		startProgressIndicator();
	}
}

function startProgressIndicator()
{
	var progress = 0;

	$(".progress")
		.removeClass("hide")
		.find('.progress-bar').css("width", progress);

	var handler = setInterval(function(){
		progress += 7;

		if ( progress <= 110 )
			$(".progress-bar").css("width", progress + '%');
		else
			clearInterval(handler);
	}, 150);
}

function error(errorLbl)
{
	console.error("Fatal error: " + errorLbl);

	if ( isBrowser ) {
		$(".progress").addClass("hide");

		$("#errormsgcontainer")
			.removeClass("hide")
			.find(".errormsg").html("Error: " + errorLbl);
		
		$("#json-data").attr("disabled", false);
		$("#generate-map-journal").removeClass('hide').html('Generate the Map Journal');
		$("#open-map-journal").addClass("hide");
	}
}

function openMapJournal(itemId)
{
	window.open(getMapJournalUrl(itemId), '_blank');
}