let leafletMap,
  timeline,
  timeRange,
  globalData,
  defaultData,
  defaultTimeRange,
  coloring,
  filteredData,
  incompleteDat;
/**
 * timeRange is a global variable that holds the range of dates that the user has selected.
 */

const colorByOptions = ["year", "month", "time", "shape"];
const defaultColoring = "year";

d3.csv("data/ufo_sightings.csv")
  .then((data) => {
    console.log(`decoding ${data.length} rows`);

    filteredData = [];

    data.forEach((d) => {
      let point = {};
      point.city = replaceCodedChar(d.city_area);
      point.state = replaceCodedChar(d.state.toUpperCase());
      point.country = replaceCodedChar(d.country.toUpperCase());
      point.described_encounter_length = replaceCodedChar(
        d.described_encounter_length
      );
      point.description = replaceCodedChar(d.description);
      point.latitude = +d.latitude; //make sure these are not strings
      point.longitude = +d.longitude; //make sure these are not strings
      point.date_documented = new Date(d.date_documented);
      point.date_time = new Date(d.date_time);
      point.time_of_day = convertTimeOfDay(point.date_time);
      point.shape = replaceCodedChar(d.ufo_shape);
      filteredData.push(point);
    });
    //set the global data variable

    //set the default data variable by copying
    defaultData = JSON.parse(JSON.stringify(filteredData));

    // initialize default time range
    defaultTimeRange = d3.extent(filteredData, (d) => d.date_time);
    timeRange = defaultTimeRange;

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#ufo-map" }, filteredData);

    // Timeline chart with the sightings by month
    timeline = new TimeLineChart(
      {
        parentElement: "#ufo-timeline",
        containerWidth: 1200,
        containerHeight: 500,
      },
      filteredData,
      "date_time"
    );

    // SETTING UP THE CONTROL PANEL

    // fill coloring dropdown
    d3.select("#coloring")
      .selectAll("option")
      .data(colorByOptions)
      .enter()
      .append("option")
      .text((d) => d);
    coloring = defaultColoring;
    d3.select("#coloring").property("value", defaultColoring);
    updateColoring();
  })

  .catch((error) => console.error(error));

d3.select("#coloring").on("change", function () {
  coloring = d3.select(this).property("value");
  updateColoring();
});

function updateColoring() {
  leafletMap.setColoring(coloring);
  leafletMap.updateVis();
}

function updateLeafletMap() {
  leafletMap.updateVis();
}

function updateAll() {}
