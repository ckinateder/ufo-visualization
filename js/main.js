let leafletMap,
  timeline,
  hourChart,
  timeRange,
  globalData,
  defaultData,
  coloring,
  processedData,
  dataFilter;
/**
 * timeRange is a global variable that holds the range of dates that the user has selected.
 */

const colorByOptions = ["year", "month", "time", "shape"];
const defaultColoring = "year";

d3.csv("data/ufo_sightings.csv")
  .then((data) => {
    console.log(`decoding ${data.length} rows`);

    processedData = [];

    data.forEach((d) => {
      processedData.push({
        city: replaceCodedChar(d.city_area),
        state: replaceCodedChar(d.state.toUpperCase()),
        country: replaceCodedChar(d.country.toUpperCase()),
        described_encounter_length: replaceCodedChar(
          d.described_encounter_length
        ),
        encounterLength: +d.encounter_length, // mins
        description: replaceCodedChar(d.description),
        latitude: +d.latitude,
        longitude: +d.longitude,
        date_documented: new Date(d.date_documented),
        date_time: new Date(d.date_time),
        shape: replaceCodedChar(d.ufo_shape),
      });
    });

    // random sample of a test set - CHANGE THIS TO THE FULL DATASET
    let dataSize = data.length / 4;
    processedData = processedData
      .sort(() => Math.random() - Math.random())
      .slice(0, dataSize);

    //set the global data variable

    //set the default data variable by copying
    defaultData = JSON.parse(JSON.stringify(processedData));

    // initialize default time range
    timeRange = [];
    // data filter is constructed like [{id: filterId, column: column, range: [min, max], transformation: function}, ...]
    // transformation is a function that is applied to the data before filtering, but could be none
    // this is used to filter the data with the inFilter function
    dataFilter = [];

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#ufo-map" }, processedData);

    // Timeline chart with the sightings by month
    timeline = new TimeLineChart(
      {
        parentElement: "#ufo-timeline",
        containerWidth: 1200,
        containerHeight: 500,
      },
      processedData,
      "date_time"
    );

    // Hour chart with the sightings by hour
    let hourGetter = (d) => d.date_time.getHours();
    hourChart = new HistogramChart(
      {
        parentElement: "#ufo-hour-trends",
        title: "Distribution of Sightings by Hour",
        xAxisLabel: "Hour",
        containerWidth: 1200,
        containerHeight: 500,
        numBins: 24,
      },
      processedData,
      "date_time",
      getHours
    );

    // Chart with sightings by day of year
    let dayGetter = (d) => getDayOfYear(d.date_time);
    dayChart = new HistogramChart(
      {
        parentElement: "#ufo-day-trends",
        title: "Distribution of Sightings by Day of Year",
        xAxisLabel: "Day of Year",
        containerWidth: 1200,
        containerHeight: 500,
        numBins: 366,
      },
      processedData,
      "date_time",
      getDayOfYear
    );

    // Chart with sightings by encounter length
    let encounterLengthGetter = (d) => d.encounterLength;
    encounterLengthChart = new HistogramChart(
      {
        parentElement: "#ufo-encounter-length-trends",
        title: "Distribution of Sightings by Encounter Length",
        xAxisLabel: "Encounter Length (s)",
        containerWidth: 1200,
        containerHeight: 500,
        numBins: 100,
        quantileLimit: 0.95, // how much to tighten the quantiles
      },
      processedData,
      "encounterLength"
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

function updateFilter(filter) {
  /**
   * filter is an object with the following structure:
   * {
   * id: filterId,
   * column: column,
   * range: [min, max],
   * transformation: function (optional)
   * }
   */
  // check if filter has id, range
  if (!filter.id || !filter.range || !filter.column) {
    console.error("Invalid filter object");
    return;
  }

  // if filter has no transformation, set it to identity
  if (!filter.transformation) {
    filter.transformation = (d) => d;
  }

  // check if the filter is already in the dataFilter
  let index = dataFilter.findIndex((d) => d.id == filter.id);
  if (index == -1) {
    dataFilter.push(filter);
  } else {
    dataFilter[index] = filter;
  }
  console.log(
    `Updated filter '${filter.id}': now filtering by ${dataFilter.length} filters`
  );
}

removeFilter = (filterId) => {
  dataFilter = dataFilter.filter((d) => d.id != filterId);
  console.log(
    `Updated filter '${filterId}': now filtering by ${dataFilter.length} filters`
  );
};

function inFilter(d) {
  // apply transformations and check if the data is within the range
  for (let i = 0; i < dataFilter.length; i++) {
    let filter = dataFilter[i];
    let point = d[filter.column];
    let transformedData = filter.transformation(point);
    if (
      filter.range.length == 2 &&
      (filter.range[0] > transformedData || filter.range[1] < transformedData)
    ) {
      return false;
    }
  }
  return true;
}

function updateAll() {}
