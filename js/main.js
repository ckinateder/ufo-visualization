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

    // Make array of sightings by month and year
    let sightingsByMonth = sampleDateColumnByMonthAndYear(
      data,
      "date_documented",
      "date"
    );

    console.log(sightingsByMonth);

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#ufo-map" }, data);
    line = new TimeLineChart(
      { parentElement: "#ufo-timeline" },
      sightingsByMonth,
      "date",
      "count"
    );
  })

  .catch((error) => console.error(error));
