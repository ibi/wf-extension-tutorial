(function () {
    var com_ibi_d3_bar_chart = {
      tooltip: null,
      tooltipID: null,
      renderChart: function (renderConfig) {
        //dataset from WebFOCUS
        var data = renderConfig.data;
  
        // set the dimensions and margins of the graph
        //you will want to change this section when you have it deployed to WebFOCUS.
        var margin = { top: 20, right: 20, bottom: 60, left: 40 },
          width = renderConfig.width - margin.left - margin.right,
          height = renderConfig.height - margin.top - margin.bottom;
  
        // set the ranges
        var x = d3.scaleBand().range([0, width]).padding(0.1);
        var y = d3.scaleLinear().range([height, 0]);
  
        // append the svg object to the body of the page
        // append a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg = d3
          .select("#" + renderConfig.container.id)
          .append("g")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
        // Scale the range of the data in the domains
        x.domain(
          data.map(function (d) {
            return d.xAxis;
          })
        );
        y.domain([
          0,
          d3.max(data, function (d) {
            return d.yAxis;
          }),
        ]);
  
        // append the rectangles for the bar chart
        svg
          .selectAll(".bar")
          .data(data)
          .enter()
          .append("rect")
          .attr("fill", renderConfig.properties.barColor)
          .attr("x", function (d) {
            return x(d.xAxis);
          })
          .attr("width", x.bandwidth())
          .attr("y", function (d) {
            return y(d.yAxis);
          })
          .attr("height", function (d) {
            return height - y(d.yAxis);
          })
          .on('mouseover', function (d, i, e) {
            d3.select(this).transition()
              .duration('50')
              .attr('opacity', '.85');
            com_ibi_d3_bar_chart.show_tooltip(
              renderConfig,
              com_ibi_d3_bar_chart.tooltip,
  
              d3.event.pageX,
              d3.event.pageY,
              d
            );
          })
          .on('mouseout', function (d, i) {
            d3.select(this).transition()
              .duration('50')
              .attr('opacity', '1');
  
          });
  
        $('#' + renderConfig.rootContainer.id).on('click', function () {
          if (com_ibi_d3_bar_chart.tooltip != undefined) {
            com_ibi_d3_bar_chart.tooltip.hide();
          }
        });
  
  
        // add the x Axis
        svg
          .append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));
  
        if (renderConfig.properties.xAxis.showTitle) {
          // text label for the x axis
          svg
            .append("text")
            .attr(
              "transform",
              "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
            )
            .style("text-anchor", "middle")
            .text(renderConfig.properties.xAxis.title);
        }
  
        // add the y Axis
        svg.append("g").call(d3.axisLeft(y));
  
        if (renderConfig.properties.yAxis.showTitle) {
          // text label for the y axis
  
          //get the WebFOCUS metadata of the yAxis
          var yAxisBucket = renderConfig.dataBuckets.getBucket("yAxis");
  
          svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            //.text(renderConfig.properties.yAxis.title);
            .text(yAxisBucket.fields[0].title);
        }
      },
      show_tooltip: function (
        renderConfig,
        tooltip,
        x,
        y,
        datum
      ) {
        var chart = renderConfig.moonbeamInstance;
        var evDispatcher = chart.eventDispatcher;
  
        //get the dataPoint that has been selected;
        //if  more than 1 dataPoint has been selected, just pass dataPoint_index to an arbitrary one as
        //the content shown in the tool tip is customized anyways (except for the measure data)
        var dataPoint = datum;
  
        if (evDispatcher.events.length == 0) {
          //handle multi drill options
  
          //base markup/content created by moonbeam to be rendered by the main tooltip
          var content = renderConfig.moonbeamInstance.getSeries(0).tooltip; //Base Content
  
          //specifies the chart riser / group selected
          var ids = { series: datum._s, group: datum._g };
  
          tooltip
            .content(content, dataPoint, renderConfig.data, ids)
            .position(x, y)
            .show();
        } else {
          //this scenario is for a single drill
  
          //contains the link url generated by WF chart api
          var dispatcher = chart.eventDispatcher.events.find(function (obj) {
            return obj.series == 0;
          });
  
          //specifies the chart riser / group selected
          var ids = { series: datum._s, group: datum._g };
  
          //base markup/content created by moonbeam to be rendered by the main tooltip
          var base_tooltip = renderConfig.moonbeamInstance.getSeries(0).tooltip;
  
          //tooltip to show
          var single_tooltip = [];
  
          //shallow copy of the base_tooltip
          for (
            var itemsIndex = 0;
            itemsIndex < base_tooltip.length;
            itemsIndex++
          ) {
            single_tooltip.push(base_tooltip[itemsIndex]);
          }
  
          var separator = { type: "separator" };
          single_tooltip.push(separator);
  
          //generate the drill URL
          var localURL = chart.parseTemplate(
            dispatcher.url,
            dataPoint,
            renderConfig.data,
            ids
          );
  
          //create the link object required to be added to the tooltip
          var link = {
            entry: "Link",
            url: localURL,
            target: dispatcher.target,
          };
  
          single_tooltip.push(link);
  
          //show the tooltip
          tooltip
            .content(single_tooltip, dataPoint, renderConfig.data, ids)
            .position(x, y)
            .show();
        }
      },
      initTooltip: function(renderConfig)
      {
        if (com_ibi_d3_bar_chart.tooltip == null) {
          var tooltip_properties = {
            fill: "lightgrey",
            border: {},
            cascadeMenuStyle: {
              hover: { labelColor: "#000000", fill: "#D8BFD8" },
            },
          };
          com_ibi_d3_bar_chart.tooltipID = renderConfig.container.id + '-tooltip';
    
          //re-sizing of window calls renderCallback; so only create tooltip once
          com_ibi_d3_bar_chart.tooltip = tdgchart.createExternalToolTip(
            "divGaligeoToolTip",
            "GaligeoTooltipId"
          );
          com_ibi_d3_bar_chart.tooltip
            //.style(tooltip_style)
            .properties(tooltip_properties)
            .autoHide(false);
        }
      }
    };
  
    function preRenderCallback(preRenderConfig) {
      var chart = preRenderConfig.moonbeamInstance;
    }
  
    //called when not all the data bucket field requirements are met
    function noDataRenderCallback(renderConfig) {
      var dummyData = [
        {
          xAxis: "A",
          yAxis: 100,
        },
        {
          xAxis: "B",
          yAxis: 200,
        },
      ];
  
      renderConfig.data = dummyData;
  
      com_ibi_d3_bar_chart.renderChart(renderConfig);
    }
  
    function renderCallback(renderConfig) {
      com_ibi_d3_bar_chart.initTooltip(renderConfig);
      com_ibi_d3_bar_chart.renderChart(renderConfig);
  
  
      renderConfig.renderComplete();
    }
  
    var scripts = [];
  
    window.jQuery == undefined
      ? scripts.push("/ibi_apps/ibx/resources/etc/jquery/jquery.js")
      : "";
    window.d3 == undefined ? scripts.push("lib/d3.v5.16.min.js") : "";
  
    scripts.push("lib/d3-selection-multi.min.js");
    scripts.push("lib/d3-time.min.js");
    scripts.push("lib/d3-time-format.min.js");
    scripts.push("lib/d3-transition.min.js");
  
    var config = {
      id: "com.ibi.d3_bar_chart",
      name: "D3 Simple Bar Chart",
      containerType: "svg",
      preRenderCallback: preRenderCallback,
      renderCallback: renderCallback,
      noDataRenderCallback: noDataRenderCallback,
      resources: {
        css: ["css/d3_bar_chart.css"],
        script: scripts,
      },
      //Start CHART-2971 new feature code
      modules: {
        eventHandler: {
          supported: true,
        },
        tooltip: {
          supported: true, // Multi drills are handled by adding additional entries to a riser's tooltip.  Enable this module, and define a default tooltip for each riser to support multi-drill.
        },
      },
      //End CHART-2917 new feature code
    };
  
    tdgchart.extensionManager.register(config);
  })();
  