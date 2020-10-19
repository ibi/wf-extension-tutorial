# Building an IBI Chart Extension: A Step by Step Guide for Web Developers #

This is a step-by-step guide on how to integrate a javascript-based visualization (**JS Viz**), such as D3, within WebFOCUS using the WebFOCUS (**WF**) Extension API. 

By wrapping the **JS Viz** within the **WF** extension API, this visualization will become available to be used by **WF** authoring tools such as InfoAssist and Designer.

This tutorial will walkthrough wrapping a simple bar chart generating using D3:

https://bl.ocks.org/d3noob/183abfcee0670fa49998afc695a8f5ad

NOTE: This tutorial is using the WF Extension API v2.0 (WebFOCUS v8204 and up); most of the concepts apply to v1.0 of the API but not all the helper functions and objects mentioned will be available.

## Audience ##

This tutorial is geared towards people who are well versed in javascript and various web development tools such as Visual Code, Chrome Dev Tools, and git.

It is highly recommended to play around with some of the other extensions in WebFOCUS InfoAssist or Designer to get a better understanding of how the UIs align with aspects of an extension.


## Step 1: Setting up a Dev Environment ##

To streamline the development process, it is recommended to create a stand-alone dev environment to start the wrapping of your  **JS Viz** vs. having to develop within the WebFOCUS environment.

Download the project template provided in this git repository as a starting point.

The project has a lot of similiarity in terms of file structure.

Specifically,
* any css files you need to style your **JS Viz** should go into the src/css folder
* any static js files that are required to render the **JS Viz** should go into the src/lib folder. 

**NOTE: If you are wrapping a **JS Viz** that is a D3 chart, it is highly recommended to include the following files to avoid compatibility issues with other WebFOCUS chart extensions. They have been added to the template project's src/lib folder.**
* d3 v5.16 or higher
* d3-selection-multi module v1.0.1
* d3-time module module v1.1
* d3-time-format module v2.2.3
* d3-transition module v1.3.2

The template project also contains:

* src/properties.json - this file needs to be packaged with the extension you are creating. You can find out more information about the properties file here: 
https://github.com/ibi/wf-extensions-chart/wiki/Extension-Configuration-with-properties.json

* wf_api.js - this file should only be used for development purposes and should not be added to your final extension package. This file contains stubs of various objects the WebFOCUS API would make available if your custom extension was fully integrated and deployed to WebFOCUS.

* draw_chart.html - stand-alone example of rendering the  **JS Viz** using a json array vs. how the example iterates through a csv file 

* src/com.ibi.d3_bar_chart.js - this file is the core file that is used to wrap up your **JS Viz** and bundled to your final extension package

For more information on the what files are required to bundle into your final extension and the structure of the package, see this link: https://github.com/ibi/wf-extensions-chart/wiki/Creating-a-WebFocus-Extension

### Step 1.1: Assessing the Required Data Structure ###

The data structure that feeds into the **JS Viz** needs to be assessed as it will determine the data definition of the wrapper. For more information on the WF Extension Data Interface see this link [https://github.com/ibi/wf-extensions-chart/wiki/Extension-Data-Interface].

In summary, data from WebFOCUS is going to be provided in a flat JSON data structure. The structure of the JSON data structure is defined by the dataBuckets object in the properties.json file. 

Looking at the bar chart example, the data needs to be an array of these type of objects:

    var data_records = [{
        "salesperson": "A",
        "sales": 100
    },
    ...
    {
        "salesperson": "Z",
        "sales": 500
    }]


Or in more generic terms:

    var data_records = [{
        "xAxis": "string"
        ,"yAxis": int
    },
    ...

The structure indicates that the xAxis property should be a dimension and the yAxis property should be measure. 

**NOTE: In most cases, string values are dimensions and measures are numeric values; an example of a numeric value that could be a dimension is a product ID number. Think of dimensions as a field that you want to group the data by.**

Based on the above data structure the **JS Viz** requires, the properties.json file should define the dataBuckets object like this:

    ...
	"dataBuckets":  {
		"buckets": [
			{
				"id": "xAxis",
				"type": "dimension",
				"count": {
					"min": 1,
					"max": 1
				}
			},
			{
				"id": "yAxis",
				"type": "measure",
				"count": {
					"min": 1,
					"max": 1
				}
			}
		]
	},
    ...

Here's a screenshot of what InfoAssist would show with this definition.
![Buckets in InfoAssist](/screenshots/01-InfoAssist-Buckets.png)

Here's a screenshot of what Designer would show with this definition.
![Buckets in Designer](/screenshots/01-Designer-Buckets.png)

The min property defines how many fields need to be dropped into the bucket before WebFOCUS will try to send real data to the **JS Viz** to render. For example, if min = 0, then no fields need to be added for WF to send data. If min = 1, then the user has to put at least one field into the bucket before WF will send real data. 

If not all the required data buckets have fields in them, the noDataRenderCallback function will be executed. In this callback, you would either put a message saying which buckets are missing fields or set dummy data up. You can see an example of implementing the noDataRenderCallback in com.ibi.d3_bar_chart.js

The max property defines the maximum number of fields a data bucket will accept.

### Step 1.2: Creating a stand-alone version with the data structure

Before even getting into turning the  **JS Viz** into a WF extension, create a stand-alone page that can run the example with the data structure defined in Step 1.1. In this particular tutorial, I removed the dependency of the csv data file from the online the example. 

The template project comes with draw_chart.html which is a stand-alone example that uses a JSON array of data vs. the csv file.

Deploy this file with the src/lib directory to your web server (tomcat, nodejs, etc.) to confirm it works. You should see this show up:

![D3 Bar Chart](/screenshots/02-stand-alone-chart.png)

### Step 1.3: Applying the dataBuckets definition to the template ###

In step 1.1, you identified how the dataBuckets object will be defined. The WF API takes this definition, and generates the following object at run time 

    //this is a partial definition of the dataBuckets object
    //there is a nice getBuckets function that isn't defined here
    //but available when you run this within WebFOCUS
    renderConfig.dataBuckets = {
        buckets: [{
            id: "xAxis"
            ,fields: [
                {
                    title: "My Field Title"
                    ,fieldName: "SYN.SEG.FIELDNAME1"
                }
            ]
        },
        {
            id: "yAxis"
            ,fields: [
                {
                    title: "My Field Title"
                    ,fieldName: "SYN.SEG.FIELDNAME2"
                }
            ]
        }],
        getBucket: function(bucketID)
        {
            //only available in WebFOCUS
        }
    }

The dataBuckets object has an object array called "buckets"; this contains all the metadata of the data structure. Some points of interest:

* the buckets[0].id property is the id defined in properties.json
* buckets[0].fields[0].title is the title defined in the metadata of a WebFOCUS synonym.  This could be handy to help with labelling such as your Axes vs. hard coding them.
* buckets[0].fields[0].fieldName is the fully qualified field name in the metadata of a WebFOCUS synonym. This comes in handy when you need a unique ID for the field and you need to do some data transformations with the dataset. 

**NOTE: it would be worthwhile to get familiar with WebFOCUS synonym and metadata; this will help you understand the dataBuckets better. You can find information on WebFOCUS metadata here: https://webfocusinfocenter.informationbuilders.com/wfappent/TL2s/TL_apps/source/metadata24.htm**

Here's the dataBuckets object (if using WebFOCUS 8204+) when I add the fields COUNTRY and SEATS from the CAR synonym in WebFOCUS using InfoAssist. This is what the template project uses in wf_api.js

    renderConfig.dataBuckets = {
        buckets: [{
            id: "xAxis"
            ,fields: [
                {
                    title: "COUNTRY"
                    ,fieldName: "CAR.ORIGIN.COUNTRY"
                }
            ]
        },
        {
            id: "yAxis"
            ,fields: [
                {
                    title: "SEATS"
                    ,fieldName: "CAR.BODY.SEATS"
                }
            ]
        }],
        getBucket: function(bucketID)
        {
            //only available in WebFOCUS
        }
    }

### Step 1.3: Adding a dataset similar to what WebFOCUS provides at runtime ###

With the buckets defined, we can use that information to help create a sample dataset. The dataset structure provided by WebFOCUS would look like this based on the above bucket definition and with the WebFOCUS CAR synonym's COUNTRY and SEAT fields chosen:

    renderConfig.data = [
        { "xAxis": "ENGLAND", "yAxis": 13, "_s": 0, "_g": 0 },
        { "xAxis": "FRANCE", "yAxis": 5, "_s": 0, "_g": 1 },
        { "xAxis": "ITALY", "yAxis": 10, "_s": 0, "_g": 2 },
        { "xAxis": "JAPAN", "yAxis": 8, "_s": 0, "_g": 3 }
    ];


Note how the xAxis and yAxis appears as properties.

The other interesting note is the _s and _g properties: 

* _s = the series id; 
* _g = the group id; 

The use of these properties will be discussed later; in short, they make it easy in adding WebFOCUS tooltips to chart elements such as the bars.

renderConfig.data is defined in the wf_api.js file; this should be used to feed into your  **JS Viz** to simplify the extension creation process when you're ready.

### Step 1.3: Other API properties to use ###

The following additional properties are made available in wf_api.js to help with rendering the  **JS Viz** within WebFOCUS. All these properties are set by WebFOCUS at run-time of the extension

* renderConfig.width = the width of the rendering container provided by WebFOCUS; in most cases it's the InfoAssist or Designer drawing canvas. In addition, it would be a panel within a WebFOCUS Page.

* renderConfig.height = the height of the rendering container provided by WebFOCUS; in most cases it's the InfoAssist or Designer drawing canvas. In addition, it would be a panel within a WebFOCUS Page. 

* renderConfig.container.id = the html id of the container WebFOCUS is going to use to render the  **JS Viz** in


### Step 1.4: Adding properties for the WebFOCUS author to configure ###

As part of the WebFOCUS extension implementation process, you have to decide what aspects of the visualization you want the content author to customize. 

In this tutorial, the extension is going to provide properties to configure the x axis, the y axis, and the color of the bar.

In the properties.json file, there's a property called "properties" and "propertyAnnotations". This defines all the properties a WebFOCUS author using InfoAssist or Designer can customize when they are creating content.

In this tutorial, the properties are:

  "properties": {
    "xAxis": {
      "title": "My Axis Title",
      "showTitle": true
    },
    "yAxis": {
      "title": "My Axis Title",
      "showTitle": true
    },
    "barColor": "#A0A0A0"
  },
  "propertyAnnotations": {
    "xAxis": {
      "title": "str",
      "showTitle": "bool"
    },
    "yAxis": {
      "title": "str",
      "showTitle": "bool"
    },
    "barColor": "color"
  }

The properties object defines the default values and the propertyAnnotations object defines the metadata attributes of a property.

For example, there xAxis.title is text that will be displayed on the x axis. xAxis.showTitle will let the content author decide whether to show this label on the x axis or not. Same goes for the yAxis properties. 

You can learn more about properties.json here: https://github.com/ibi/wf-extensions-chart/wiki/Extension-Configuration-with-properties.json 

The WebFOCUS API passes properties in renderConfig.properties; based on the properties.json definition above, this is how it would look:

    {
        xAxis: {
        title: "My X Axis Title",
        showTitle: true,
        },
        xAxis: {
        title: "My Y Axis Title",
        showTitle: true,
        },
        barColor: ["#4087b8"],
    }

The template defines this in wf_api.js in the renderConfig.properties section.

Use these configurations as part of the implementation for the stand-alone chart.

### Step 1.5: Implementation of the JS Viz using the template ###

With the dataBuckets, data, and properties aspects of renderConfig defined, you're ready to finish creating a stand-alone JS Viz that uses WebFOCUS API objects.

This section will make direct references to lines of code in ext_wrapper.html that can be found in the root folder of the template project. Here are some points of interest:

1. All the js references that were required in draw_chart.html are added into ext_wrapper.html.

2. On line 11, use renderConfig.width to calculate the drawing area of the chart

3. On line 12, use renderConfig.height to calculate the drawing area of the chart 

4. On line 20, there is a reference to the chart_ext.js file that contains the defined WebFOCUS extension API objects.

5. On line 27, the function render_chart(renderConfig) is defined; this function contains the code required to render the chart.

6. On line 29, the local data variable is set to the renderConfig dataset to be used to render

7. On line 45, use renderConfig.container.id to select the element where the   **JS Viz**  will be rendered

8. On line 74, use renderConfig.properties.barColor to set the color of the bars

9. On line 93, a check is done on the renderConfig.properties.xAxis.showTitle; if true, then add an xAxis label

10. On line 102, the  renderConfig.properties.xAxis.title property is used to set the label of the X axis

11. On line 108, a check is done on the renderConfig.properties.yAxis.showTitle; if true, then add an yAxis label

12. On line 112, get the metadata associated with yAxis so that we can use the title there.

13. On line 121, the  renderConfig.properties.yAxis.title property is used to set the label of the Y axis but commented out

14. On line 122, add the label from yAxis.fields[0].title

### Step 1.6: Deploy to Web Server for Debugging ###

Deploy the required files to your web server to make sure it runs. The following files were added to my tomcat root directory:

* all the files in src/lib folder
* ext_wrapper.html
* wf_api.js

This is what you should see:

[Insert Screenshot here! Screenshot of rendered chart]

## 2: Creating a WebFOCUS Extension ##

In the extensions github repository, there's already a good explanation of how to create a WebFOCUS extension that can be found here:
https://github.com/ibi/wf-extensions-chart/wiki/Creating-a-WebFocus-Extension

This section will take a look at some best practices on creating the extension based on the stand-alone page ext_wrapper.html.

The template project already contains the resources to "build" a WebFOCUS extension. Specifically in the src directory:

* icons folder - stores the images that will be used to render in various aspects of WebFOCUS including the Extension Manager and as a visual cue for selecting in InfoAssist and Designer.

* lib folder - contains all the external js libraries required - this will typically align with the js references made in ext_wrapper.html

**NOTE: You can reference URLs as well so you don't necessarily need to have a lib folder.**

* com.ibi.d3_bar_chart.js - the entry point for the WebFOCUS extension; this is where you would put most, if not all, of your custom code

* properties.json - defines aspects of the extension including properties that content authors can edit in WebFOCUS tools and the bucket definitions

In addition, the project contains a simple Windows bat program called "win_build_d3_bar_chart" that "builds" the extension by copying all the required files into a build folder. **It should only be used as a reference as your environment might be different**

### 2.1 - Moving from ext_wrapper.html to com.ibi.d3_bar_chart.js ###

In ext_wrapper.html, the function render_chart is implemented using the stubbed out object renderConfig, which  means the majority of the re-use is just cutting and pasting into com.ibi.d3_bar_chart.js

On line 3 of com.ibi.d3_bar_chart.js, there's an object defined, com_ibi_d3_bar_chart, that wraps up the render_chart function. By implementing this way,  you avoid possible collisons with functions with the same name.

**NOTE: If *JS Viz* requires a lot of code, then you may want to create an external js file like d3_bar_chart.js and put the com_ibi_d3_bar_chart object there. If you take this route, be sure to add it to the lib folder.**

On line 127 of com.ibi.d3_bar_chart.js, the function is called passing the WebFOCUS API renderConfig object.

On line 108, noDataRenderCallback function creates a dummyset of data for WebFOCUS to use if the content author hasn't chosen any fields to use in InfoAssist / Designer. You could also just show a message saying something along the lines of "Please add more fields to the buckets" by inserting html markup into the element with the id enderConfig.container.id.

As mentioned earlier, please see https://github.com/ibi/wf-extensions-chart/wiki/Creating-a-WebFocus-Extension to get a better understanding of the properties and 

### 2.2 - Building the extension ###

The template project comes with a simple example of how to package up all the files required for the extension to be deployed to WebFOCUS.

The batch file "win_build_d3_bar_chart.bat" deletes and creates a build folder, then copies all the necessary files into the build\com.ibi.d3_bar_chart folder. 

Use this batch file as a reference as your OS may be different or your folder structure may be different.

### 2.3  - Deploying the extension ###

See the "Installing a WebFOCUS Extension" link on github: https://github.com/ibi/wf-extensions-chart/wiki/Installing-a-WebFocus-Extension

In addition to the steps there, here are a few other considerations and troubleshooting tips.

#### Deployment Considerations ####

* Because you are technically in a "beta mode" of the visualization, you'll definitely need to do a lot of bug fixing and redeploying, so ideally, you get admin access to the WebFOCUS Client folder in your development environment. Otherwise, you're going to have very slow development cycle.

* You'll most likely run into caching issues, so you'll want to have WebFOCUS Admin Access so you can clear the WebFOCUS cache

* Probably obvious, but your WebFOCUS account needs to have permissions to use InfoAssist / Designer


#### Trouble Shooting FAQ ####

* When you've deployed / installed your extension, your extension may not show up in InfoAssist / Designer as an extension to choose from. There are one of two reasons this may be happening:
    * You need to clear your WebFOCUS Client cache by going to: WebFOCUS Admin Console->Clear Cache button in the top right corner
    * You need to clear your browser cache; the best way to do this in your development cycle is to either open up WebFOCUS in private window mode. If you are in Chrome, you can go Open Dev Tools->Settings (Gear Box Icon)->Under Network check on "Disable cache(while DevTools is open)

* If your extension is still not showing up, there's probably something wrong in your properties.json file. In my experience, it's typically the properties object doesn't align with the propertyAnnotations object; i.e. the for each property, you need to have a corresponding propertyAnnotation defined with the exact same name. Other things to watch out for in properties.json:

    * Spelling of propertyAnnotation types. The 4 valid types are "str","number","bool","color","array"
    * Make sure the translation object naming convention is followed perfectly

* When you select your extension in InfoAssist / Designer, you get an error message like this: can not find com.ibi.your_ext_name. This is typically a caching issue so follow the uncaching steps above.

* You get a text error message in the InfoAssist / Designer canvase vs. your visualization showing up. You should be able to expand the error message to see a stack trace of the error. 

This will likely be rooted in how you implemented the extension in com.ibi.d3_bar_chart. You should use Chrome's Developer Tool to help debug it or the equivalent tool.

Here is what I usually do to set up debugging with Chrome:

1. Open InfoAssist / Designer
2. Select your data source
3. Select your extension
4. Save your content; e.g. save it as "test_com_ibi_d3_bar_chart"
5. Close InfoAssist / Designer
6. Edit the file  you just saved
7. This will open the tool you used to create this
8. Open Developer Tools
9. Refresh the page which will reopen InfoAssist/ Designer
10. Now take a look at the Developer Tool->Sources Tab
11. Look for your extension reference.
    * In Designer, it's typically in ibi_apps->tdg/jschart/distribution/some_session_id
    * In InfoAssist, it's typically in ibi_apps->webconsole->some_session_id->ar_common->extensions/your_extension_id
    * The above will depend on your version of WebFOCUS but this should help you find it in other versions
12. Start with a break point at the beginning of the renderCallback function

You should be able to debug from there. If it doesn't even get there, review how you configured the extension in the config variable in your extension file.

##  3: Implementing advanced features ##


### 3.1: Tooltips ###
A common feature to add to a visualization are tooltips.

There are two ways to add tooltips; using CSS classes and creating custom ones using the WebFOCUS Extension APIs helper tools.

If you have full control over the rendering of elements for the **JS Viz**, then using CSS classes is the preferred way as it minimizes the amount of coding you have to do.

However, if you are using a 3rd party library, you may not be able to easily inject CSS classes to the appropriate elements.

#### 3.1.1: Adding tooltips using CSS classes
**Overview***
In this section, the file com.ibi.d3_bar_chart_311.js will be used as reference to explain adding a standard WebFOCUS tooltip.

To use WebFOCUS generated tooltips, you need to be able to add classes to elements that are bound to data. For the d3_simple_bar chart, the bars were generated based on the dataset so data-diven tooltips should show when a user puts their mouse over it. 

Other examples of chart elements that are data bound and useful to have tooltips:

* pie chart slices
* markers on line graphs
* bubbles in a bubble graph

Here are some key points in com.ibi.d3_bar_chart_311.js 

* Line 48-51: classes are assigned to each rect drawn using the utility function renderConfig.moonbeamInstance.buildClassName - this function generates the appropriate CSS class that will help WebFOCUS figure out what tooltip to show when the user puts their mouse over the bar
* Line 60-63: the function renderConfig.modules.tooltip.addDefaultToolTipContent generates the tooltip content; you need to iterate through all the drawn elements for the WebFOCUS extension API to associate the element with the appropriate tooltip.
* Line 129: renderConfig.renderComplete function needs to be called when the **JS Viz** is finished drawing to enable the WebFOCUS tooltips
* Line 159-161: extension configuration to enable the WebFOCUS extension tooltips

**Styling the WebFOCUS Tooltip**
The easiest way to change the style of the WebFOCUS tooltip would be to use CSS.

* d3_bar_chart.css was added to the src/css folder - take a look at the elements the css file is styling and how it's doing it; for more available elements and classes generated by the WebFOCUS tooltip, run a chart using this extension in WebFOCUS, open Chrome's developer tool, and put your mouse over one of the bars. You'll notice that WebFOCUS injects tooltip markup when you explore the DOM with Developer Tool.
* Line 152 of com.ibi.d3_bar_chart_311.js, the css file is referenced for loading by WebFOCUS at run time

*NOTE: You'll need to take uncaching steps as described in the Trouble Shooting FAQ section.*

Alternatively, you could dynamically inject CSS in the head element on the extension's; however, this is beyond the scope of this tutorial.

**Deploying com.ibi.d3_bar_chart_311**

The win_build_d3_bar_chart_311.bat is included in the root directory of this project. It's similar to the win_build_d3_bar_chart.bat file; the only differences are:

* adds the css folder as part of the build
* includes src/com.ibi.d3_bar_chart_311.js instead of src/com.ibi.d3_bar_chart.js and renames it to com.ibi.d3_bar_chart.js in the build folder

Run this bat and it will build the d3_bar_chart extension with the added WebFOCUS tooltip feature.












