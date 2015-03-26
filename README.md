# Story Map Journal Generator

The Story Map Journal is ideal when you want to combine narrative text with maps and other embedded content. 

The typical Map Journal creation involve using the integrated WYSIWYG builder. That app let you generate a Map Journal through a simple JSON document, without using that builder.

The resulting application is hosted in ArcGIS Online, you can edit it later as if you had used the builder.

[Map Journal GitHub repository](https://github.com/Esri/map-journal-storytelling-template-js) |
[Map Journal page on Esri Story Maps website](http://storymaps.arcgis.com/en/app-list/map-journal/)

## Instructions

The usage scenarios are:
* as a node.js application with ArcGIS Online credentials defined in the configuration file
* as a web application with authentication through ArcGIS Online OAuth dialog
* as a web application with authentication through ArcGIS Online credentials defined provided in the configuration file

### As a Node.js application

1. Install [Node.js](http://nodejs.org/) 
2. Download the application
3. Run `npm install` in the application root
4. Edit app/app.js with your credentials and an ArcGIS Online OAuth App ID, see [adding items for ArcGIS Online for Organizations users](http://doc.arcgis.com/en/arcgis-online/share-maps/add-items.htm#ESRI_SECTION1_0D1B620254F745AE84F394289F8AF44B) or [registering your application for ArcGIS for Developers users](https://developers.arcgis.com/authentication/signing-in-arcgis-online-users/#registering-your-application)
5. Optionally if you want to use the `webmap-x-y` type, edit app/app.js with a webmap ID (`webmapForEmbed`)
6. Run `node index`

### As a web application with OAuth authentication

1. Download the application
2. Deploy on a web server
4. Edit app/app.js with an ArcGIS Online OAuth App ID, see [adding items for ArcGIS Online for Organizations users](http://doc.arcgis.com/en/arcgis-online/share-maps/add-items.htm#ESRI_SECTION1_0D1B620254F745AE84F394289F8AF44B) or [registering your application for ArcGIS for Developers users](https://developers.arcgis.com/authentication/signing-in-arcgis-online-users/#registering-your-application)
5. Optionally if you want to use the `webmap-x-y` type, edit app/app.js with a webmap ID (`webmapForEmbed`)
6. Access the application over the web server

### As a web application with ArcGIS Online credentials

1. Install [Node.js](http://nodejs.org/) 
2. Download the application
3. Run `npm install` in the application root
4. Edit app/app.js with your credentials
5. Optionally if you want to use the `webmap-x-y` type, edit app/app.js with a webmap ID (`webmapForEmbed`)
6. Run `node index`

**Make sure to not deploy the application on a public server to avoid exposing your credentials.**

## JSON configuration

The JSON defining the Map Journal to be generated can be edited through `data/map-journal-sample.json`.

The general JSON structure is:
```
{
	title: 'Journal title',
	sections: [
		{
			// First
		},
		{
			// Second section
		},
		// ... limited to 99 sections ... 
	]
}
```

With a section being defined by a title a `Main Stage` (larger area) and `Panel` (smaller scollable area intended for the narrative).

```
{
	"title": "",
	"mainstage": {
		// Image, video, webpage or map configure goes here
	},
	"panel": {
		// Text, can include images, videos, webpage and map 
	}
}
```

See some exemple below.

**Section with an image in the Main Stage**

```
{
	"title": "<p>First section</p>",
	"mainstage": {
		"type": "image",
		"url": "http://farm8.static.flickr.com/7373/13429795365_f57595be16_b.jpg"
	},
	"panel": {
		"text": "<p>Image in main stage</p>"
	}
}
```

**Section with a Map in the Main Stage**
 ```
{
	"title": "<p>Second section</p>",
	"mainstage": {
		"type": "webmap",
		"id": "ea8e4e1f70014f3a8919dc3d8c08a29e"
	},
	"panel": {
		"text": "<p>A Map of <strong>world volcanoes</strong>.</p><p>&nbsp;</p><p>&nbsp;</p><p>Open the Map in <a href=\"http://www.arcgis.com/home/webmap/viewer.html?webmap=2a45f767a6e549bfbe5bf638681f1fac\" target=\"_blank\">ArcGIS Online Map Viewer</a>.<p>&nbsp;</p><p>&nbsp;</p></p>"
	}
}
```

**Section with a webpage in the Main Stage and an image in the panel**
 ```
{
	"title": "<p>Third section</p>",
	"mainstage": {
		"type": "webpage",
		"url": "http://story.maps.arcgis.com/home/webscene/viewer.html?webscene=fd3b56984801434aa71f75b1926bde5b&ui=min"
	},
	"panel": {
		"text": "<p>Embed of ArcGIS Online scene viewer, <a href=\"http://story.maps.arcgis.com/home/webscene/viewer.html?webscene=fd3b56984801434aa71f75b1926bde5b\" target=\"_blank\">link to the scene</a>.</p><p><div class=\"image-container activate-fullscreen\"><img src=\"http://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Fimmvorduhals_2010_03_27_dawn.jpg/1280px-Fimmvorduhals_2010_03_27_dawn.jpg\" /></div></p>"
	}
}
```

**Section with a Map in the Main Stage and in the panel configured as an x/y**
 ```
{
	"title": "<p>Fourth <strong style=\"color:red\">section</strong></p>",
	"mainstage": {
		"type": "map-x-y",
		"x": -116.538019,
		"y": 33.825898,
		"mapScale": "block",
		"mapSymbolUrl": "http://static.arcgis.com/images/Symbols/Shapes/PurplePin2LargeB.png",
		"popupContents": "Hello Palm Springs!"
	},
	"panel": {
		"text": "<p>Map in the main stage <strong>+ map in the panel</strong></p>",
		"map": {
			"x": -116.538019,
			"y": 33.825898,
			"mapScale": "continent"
		}
	}
}
```