function replaceCodedChar(str) {
  /**
   * REGEX EXPLANATION
   * /&(?:[a-z]+|#x?\d+)(;?)/gm
   * & matches the character & with index 3810 (2616 or 468) literally (case sensitive)

   * Non-capturing group (?:[a-z]+|#x?\d+)
    * 1st Alternative [a-z]+
      * Match a single character present in the list below [a-z]
      * + matches the previous token between one and unlimited times, as many times as possible, giving back as needed (greedy)
      * a-z matches a single character in the range between a (index 97) and z (index 122) (case sensitive)
    * 2nd Alternative #x?\d+
      * # matches the character # with index 3510 (2316 or 438) literally (case sensitive)
      * x matches the character x with index 12010 (7816 or 1708) literally (case sensitive)
        * ? matches the previous token between zero and one times, as many times as possible, giving back as needed (greedy)
      * \d matches a digit (equivalent to [0-9])
        * + matches the previous token between one and unlimited times, as many times as possible, giving back as needed (greedy)
   * 1st Capturing Group (;?)
    * ; matches the character ; with index 5910 (3B16 or 738) literally (case sensitive)
      * ? matches the previous token between zero and one times, as many times as possible, giving back as needed (greedy)
   * Global pattern flags
    * g modifier: global. All matches (don't return after first match)
    * modifier: multi line. Causes ^ and $ to match the begin/end of each line (not only begin/end of string)
  */
  return str.replace(/&(?:[a-z]+|#x?\d+)(;?)/gm, "");
}

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
      console.log(d);
    });

    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: "#ufo-map" }, data);
  })
  .catch((error) => console.error(error));

/**
  d3.csv('data/worldCities.csv')
  .then(data => {
      console.log(data[0]);
      console.log(data.length);
      data.forEach(d => {
        console.log(d);
        d.latitude = +d.lat; //make sure these are not strings
        d.longitude = +d.lng; //make sure these are not strings
      });
  
      // Initialize chart and then show it
      leafletMap = new LeafletMap({ parentElement: '#ufo-map'}, data);
  
  
    })
    .catch(error => console.error(error));
   */
