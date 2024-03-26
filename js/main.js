let leafletMap, timeline, timeRange, globalData, defaultData, defaultTimeRange;
/**
 * timeRange is a global variable that holds the range of dates that the user has selected.
 */

d3.csv("data/ufoSample.csv")
  .then((data) => {
    console.log(`decoding ${data.length} rows`);
    data.forEach((d) => {
      d.city = replaceCodedChar(d.city_area);
      d.state = replaceCodedChar(d.state.toUpperCase());
      d.country = replaceCodedChar(d.country.toUpperCase());
      d.described_encounter_length = replaceCodedChar(
        d.described_encounter_length
      );
      d.description = replaceCodedChar(d.description);
      d.latitude = +d.latitude; //make sure these are not strings
      d.longitude = +d.longitude; //make sure these are not strings
      d.date_documented = new Date(d.date_documented);
    });
    //set the global data variable
    globalData = data;

    //set the default data variable by copying
    defaultData = JSON.parse(JSON.stringify(data));

    // initialize default time range
    defaultTimeRange = d3.extent(data, (d) => d.date_documented);
    timeRange = defaultTimeRange;

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#ufo-map" }, data);

    // Timeline chart with the sightings by month
    timeline = new TimeLineChart(
      {
        parentElement: "#ufo-timeline",
        containerWidth: 1200,
        containerHeight: 500,
      },
      data,
      "date_documented"
    );
  })

  .catch((error) => console.error(error));

function updateLeafletMap() {
  leafletMap.updateVis();
}

function updateAll() {}
