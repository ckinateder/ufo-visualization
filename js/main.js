let leafletMap, timeline, timeRange;
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

    // initialize default time range
    timeRange = d3.extent(data, (d) => d.date_documented);

    // Make array of sightings by month and year for the timeline chart
    let sightingsByMonth = sampleDateColumnByMonthAndYear(
      data,
      "date_documented",
      "date"
    );

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#ufo-map" }, data);

    // Timeline chart with the sightings by month
    timeline = new TimeLineChart(
      { parentElement: "#ufo-timeline" },
      sightingsByMonth,
      "date",
      "count"
    );
  })

  .catch((error) => console.error(error));

function updateAll() {}
