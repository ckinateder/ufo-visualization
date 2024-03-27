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
Number.prototype.pad = function (size) {
  var s = String(this);
  while (s.length < (size || 2)) {
    s = "0" + s;
  }
  return s;
};

function rollupDataByMonthAndYear(data, dateColumn, justCounts) {
  // we want to roll the data into an object of lists, where each list is a month and year containing all the data that have that month and year
  /*
    If justCounts is false, the data will look like this:
    [
        {
            dateString: "1/2010",
            date: new Date(2010, 0, 1),
            count: 3,
            <data: [{}, {}, {}]>
        },
        {
            dateString: "2/2010",
            date: new Date(2010, 1, 1),
            count: 5,
            <data: [{}, {}, {}, {}, {}]>
        }
        ]
        
    ]
    If justCounts is true, the `data` attribute will not be included in the object.
    */

  let counts = [];

  // loop through the data
  data.forEach((d) => {
    // assert the column is a date object
    if (typeof d[dateColumn] !== "object") {
      console.error("The column is not a date object");
      return;
    }

    // get the month and year
    let month = d[dateColumn].getMonth() + 1;
    let year = d[dateColumn].getFullYear();
    let dateString = `${month.pad()}/${year}`;
    let netNoTime = new Date(
      d[dateColumn].getFullYear(),
      d[dateColumn].getMonth(),
      1
    );
    // create a new object to hold the data
    let newObject = {
      date: netNoTime,
      dateString: dateString,
      count: 1,
    };
    if (!justCounts) {
      newObject.data = [d];
    }

    // check if the month and year already exists in the new data
    let exists = counts.find((element) => element.dateString == dateString);

    // if it exists, increment the count
    if (exists) {
      exists.count++;
      // if we are not just counting, add the data to the existing object
      if (!justCounts) exists.data.push(d);
    } else {
      // otherwise, add the new object to the new data
      counts.push(newObject);
    }
  });

  // sort the data by date
  counts.sort((a, b) => a.date - b.date);

  return counts;
}

function filterDataByDateRange(data, dateColumn, range) {
  // filter the data by a date range
  return data.filter(
    (d) => d[dateColumn] >= range[0] && d[dateColumn] <= range[1]
  );
}

rollupDataByDayOfYear = (data, dateColumn, justCounts) => {
  // we want to roll the data into an object of lists, where each list is a day of the year containing all the data that have that day
  /*
        If justCounts is false, the data will look like this:
        [
            {
                dateString: "1/1",
                date: new Date(2010, 0, 1),
                count: 3,
                <data: [{}, {}, {}]>
            },
            {
                dateString: "1/2",
                date: new Date(2010, 0, 2),
                count: 5,
                <data: [{}, {}, {}, {}, {}]>
            }
            ]
            
        ]
        If justCounts is true, the `data` attribute will not be included in the object.
        */

  let counts = [];

  // loop through the data
  data.forEach((d) => {
    // assert the column is a date object
    if (typeof d[dateColumn] !== "object") {
      console.error("The column is not a date object");
      return;
    }

    // get the month and year
    let day = d[dateColumn].getDate();
    let month = d[dateColumn].getMonth() + 1;
    let dateString = `${month.pad()}/${day.pad()}`;
    let netNoTime = new Date(
      d[dateColumn].getFullYear(),
      d[dateColumn].getMonth(),
      d[dateColumn].getDate()
    );
    // create a new object to hold the data
    let newObject = {
      date: netNoTime,
      dateString: dateString,
      count: 1,
    };
    if (!justCounts) {
      newObject.data = [d];
    }

    // check if the month and year already exists in the new data
    let exists = counts.find((element) => element.dateString == dateString);

    // if it exists, increment the count
    if (exists) {
      exists.count++;
      // if we are not just counting, add the data to the existing object
      if (!justCounts) exists.data.push(d);
    } else {
      // otherwise, add the new object to the new data
      counts.push(newObject);
    }
  });

  // sort the data by date
  counts.sort((a, b) => a.date - b.date);

  return counts;
};

function countByHour(data, dateTimeColumn) {
  // we want to roll the data into an object of lists, where each list is an hour containing all the data that have that hour
  let counts = [];

  // loop through the data
  data.forEach((d) => {
    // assert the column is a date object
    if (typeof d[dateTimeColumn] !== "object") {
      console.error("The column is not a date object");
      return;
    }

    // get the hour
    let hour = d[dateTimeColumn].getHours();

    // create a new object to hold the data
    let newObject = {
      hour: hour,
      count: 1,
    };

    // check if the month and year already exists in the new data
    let exists = counts.find((element) => element.hour == hour);

    // if it exists, increment the count
    if (exists) {
      exists.count++;
    } else {
      // otherwise, add the new object to the new data
      counts.push(newObject);
    }
  });

  // sort the data by date
  counts.sort((a, b) => a.hour - b.hour);

  return counts;
}

const largeTickFormat = function (d) {
  //Logic to reduce big numbers
  var limits = [1000000000000000, 1000000000000, 1000000000, 1000000, 1000];
  var shorteners = ["Q", "T", "B", "M", "K"];
  for (var i in limits) {
    if (d > limits[i] - 1) {
      return (d / limits[i]).toFixed() + shorteners[i];
    }
  }
  return d;
};
const getDayOfYear = (date) =>
  Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0)) / 864e5);
