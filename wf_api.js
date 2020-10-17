//this file serves a simplified template for representing the WebFOCUS extension API
//this SHOULD NOT be added as part of the final extension package

//this object is the primary object that WF API will pass to your extension wrapper
var renderConfig = {
  data: [
    { xAxis: "ENGLAND", yAxis: 13, _s: 0, _g: 0 },
    { xAxis: "FRANCE", yAxis: 5, _s: 0, _g: 1 },
    { xAxis: "ITALY", yAxis: 10, _s: 0, _g: 2 },
    { xAxis: "JAPAN", yAxis: 8, _s: 0, _g: 3 },
  ],
  //properties as defined in properties.json file that is required as part of wrapping a JS Viz;
  //WF API uses what is defined in the properties section of the object defined in properties.json.
  //in this example, we defined radialAxis and stackBarColors so
  //we should define that here for usage
  properties: {
    xAxis: {
      title: "My X Axis Title",
      showTitle: true,
    },
    yAxis: {
      title: "My Y Axis Title",
      showTitle: true,
    },
    barColor: ["#4087b8"],
  },
  dataBuckets: {
    buckets: [
      {
        id: "xAxis",
        fields: [
          {
            title: "COUNTRY",
            fieldName: "CAR.ORIGIN.COUNTRY",
          },
        ],
      },
      {
        id: "yAxis",
        fields: [
          {
            title: "SEATS",
            fieldName: "CAR.BODY.SEATS",
          },
        ],
      },
    ],
    getBucket: function (bucketID) {
      //available when deployed to WebFOCUS
      //returns the item in the buckets array with the bucketID

      //here's a quick implementation of it for your use

      var bucket = null;

      for (var i = 0; i < renderConfig.dataBuckets.buckets.length; i++) {
        var id = renderConfig.dataBuckets.buckets[i].id;

        if (id == bucketID) {
          bucket = renderConfig.dataBuckets.buckets[i];
          break;
        }
      }

      return bucket;
    },
  },
  width: 960,
  height: 500,
  container:{
    id: 'chart_container'
  }

};
