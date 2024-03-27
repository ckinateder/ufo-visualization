let leafletMap,
  timeline,
  hourChart,
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
      filteredData.push({
        city: replaceCodedChar(d.city_area),
        state: replaceCodedChar(d.state.toUpperCase()),
        country: replaceCodedChar(d.country.toUpperCase()),
        described_encounter_length: replaceCodedChar(
          d.described_encounter_length
        ),
        description: replaceCodedChar(d.description),
        latitude: +d.latitude,
        longitude: +d.longitude,
        date_documented: new Date(d.date_documented),
        date_time: new Date(d.date_time),
        shape: replaceCodedChar(d.ufo_shape),
      });
    });

    // random sample of a test set - CHANGE THIS TO THE FULL DATASET
    let dataSize = 4000;
    filteredData = filteredData
      .sort(() => Math.random() - Math.random())
      .slice(0, dataSize);

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

    // Hour chart with the sightings by hour
    let hourGetter = (d) => d.date_time.getHours();
    hourChart = new HistogramChart(
      {
        parentElement: "#ufo-hour-trends",
        title: "Sightings by Hour",
        xAxisLabel: "Hour",
        containerWidth: 1200,
        containerHeight: 500,
        numBins: 24,
      },
      filteredData,
      hourGetter
    );

    // Chart with sightings by day of year
    let dayGetter = (d) => getDayOfYear(d.date_time);
    dayChart = new HistogramChart(
      {
        parentElement: "#ufo-day-trends",
        title: "Sightings by Day of Year",
        xAxisLabel: "Day of Year",
        containerWidth: 1200,
        containerHeight: 500,
        numBins: 366,
      },
      filteredData,
      dayGetter
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
