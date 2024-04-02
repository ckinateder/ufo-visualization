let leafletMap,
  timeline,
  hourChart,
  dayChart,
  encounterLengthChart,
  shapeChart,
  timeRange,
  globalData,
  defaultData,
  coloring,
  processedData,
  dataFilter,
  chartList,
  normalColor,
  accentColor,
  wrdcloud;

const defaultNormalColor = "#61a4ba";
const defaultAccentColor = "#FFB400";
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
      let obj = {
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
        shape: replaceCodedChar(d.ufo_shape).toLowerCase(),
      };
      if (obj.shape === "na") obj.shape = "unknown";
      processedData.push(obj);
    });

    // random sample of a test set - CHANGE THIS TO THE FULL DATASET
    let dataSize = data.length / 4;
    processedData = processedData
      .sort(() => Math.random() - Math.random())
      .slice(0, dataSize);

    // set color scheme
    normalColor = defaultNormalColor;
    accentColor = defaultAccentColor;

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
      "date_time",
      (column, range) =>
        `Date of sighting filtered between ${range[0].toLocaleDateString()} and ${range[1].toLocaleDateString()}.`
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
      getHours,
      (column, range) =>
        `Time of day filtered between ${hourToTime(range[0])} and ${hourToTime(
          range[1]
        )}.`
    );

    // Chart with sightings by day of year
    dayChart = new HistogramChart(
      {
        parentElement: "#ufo-day-trends",
        title: "Distribution of Sightings by Day of Year",
        xAxisLabel: "Day of Year",
        containerWidth: 1200,
        containerHeight: 500,
        numBins: 183,
      },
      processedData,
      "date_time",
      getDayOfYear,
      (column, range) =>
        `Day of year filtered between ${Math.round(range[0])} and ${Math.round(
          range[1]
        )}.`
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
        numBins: 50,
        quantileLimit: 0.95, // how much to tighten the quantiles
        yScale: d3.scaleSqrt,
      },
      processedData,
      "encounterLength",
      (d) => d,
      (column, range) =>
        `Encounter length filtered between ${Math.round(
          range[0]
        )} and ${Math.round(range[1])} seconds.`
    );

    // chart with sightings by shape
    shapeChart = new BarChart(
      {
        parentElement: "#ufo-shape-trends",
        title: "Distribution of Sightings by Shape",
        xAxisLabel: "Shape",
        containerWidth: 1200,
        containerHeight: 500,
      },
      processedData,
      "shape",
      (d) => d,
      (column, range) =>
        `Shape filtered to show only sightings with shape ${joinArray(
          range,
          "or"
        )}.`
    );

    wrdcloud = new WordCloud(
      {
        parentElement: "#ufo-wordcloud",
        title: "Word Cloud based on Descriptions",
        containerWidth: 1200,
        containerHeight: 500,
      },
      processedData,
      "description",
      (d) => d
    );

    // add all the charts to the chartList (except the map, which is updated separately)
    chartList = [
      timeline,
      hourChart,
      dayChart,
      encounterLengthChart,
      shapeChart,
    ];

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

function updateColoring() {
  leafletMap.setColoring(coloring);
  leafletMap.updateVis();
}

function updateLeafletMap() {
  leafletMap.updateVis();
}
function updateFilter(filter) {
  /**
   filter is an object with the following structure:
    {
      id: string,
      column: string,
      range: [min, max],
      transformation: function,
      description: string
    }
    The description will be a string that will be shown in the filter list.
    
    The transformation will be a function that will be applied to the data before filtering.
    This will take 1 argument, the data point, and will return the transformed data point.
    Example:
      transformation: (d) => d.toLowerCase()
    
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
  console.log(`Updated filter '${filter.id}'`);
  console.log(dataFilter);
  renderFilter();
  updateLeafletMap(); // update the leaflet map
  wrdcloud.updateVis();
}

removeFilter = (filterId) => {
  dataFilter = dataFilter.filter((d) => d.id != filterId);
  console.log(
    `Removed filter '${filterId}', now ${dataFilter.length} filters.`
  );
  renderFilter();
  updateLeafletMap();
  wrdcloud.updateVis();
};

function renderFilter() {
  // render the filters applied
  // iterate through the dataFilter and render the filters
  const filterList = d3.select("#filter-container");

  filterList
    .selectAll(".filter-item")
    .data(dataFilter)
    .join("div")
    .attr("class", "filter-item")
    .text((d) => d.description)
    .on("click", (event, d) => {
      removeFilter(d.id);
      getChartById(d.id).resetBrushArea();
    })
    .on("mouseover", (event, d) => {
      // set the cursor to pointer
      d3.select(event.currentTarget).style("cursor", "pointer");
      // set style to strike through with a transition duration of 0.2s
      d3.select(event.currentTarget).style("text-decoration", "line-through");
    })
    .on("mouseout", (event, d) => {
      // reset the cursor
      d3.select(event.currentTarget).style("cursor", "default");

      // reset the style
      d3.select(event.currentTarget).style("text-decoration", "none");
    });
}

function inFilter(d) {
  // apply transformations and check if the data is within the range
  // this WORKS even with stings!! as long as they were sorted alphabetically beforehand
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

function resetAll() {
  // reset the data
  processedData = JSON.parse(JSON.stringify(defaultData));
  // reset the filters
  dataFilter = [];
  // reset the coloring
  coloring = defaultColoring;
  d3.select("#coloring").property("value", defaultColoring);
  updateColoring();

  // reset map
  leafletMap.resetMap();

  // reset the brush areas
  resetAllBrushAreas();

  // reset the filter list
  renderFilter();

  // update the visualizations
  updateAll();
}

// get the chart by id
function getChartById(id) {
  for (let chart of chartList) {
    if (chart.filterId == id) {
      return chart;
    }
  }
  return null;
}

// reset all brush areas
function resetAllBrushAreas() {
  // reset the brush area
  for (let chart of chartList) {
    chart.resetBrushArea();
  }
}

function updateAll() {
  updateLeafletMap();
  for (let chart of chartList) {
    chart.updateVis();
  }
}

// handlers
d3.select("#reset").on("click", resetAll);

d3.select("#coloring").on("change", () => {
  // get selection value
  coloring = d3.select("#coloring").property("value");
  updateColoring();
});
