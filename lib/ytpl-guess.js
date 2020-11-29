// Ugly but works
const miniget = require("miniget");
const { fuzzyNode, goUpUntilFieldsFound } = require("./fuzzy-obj");
const _ = require("lodash");
const dJSON = require("dirty-json");

const SEPARATOR = "|A|";
const SEPARATOR_END = "|Z|";

function naiveTrim(potentialJSON) {
  const result = potentialJSON.substring(potentialJSON.indexOf("{"));
  return result.substring(0, result.lastIndexOf("}") + 1);
}

function parseLess(awfultext) {
  const lines = awfultext.split(";");
  lines.pop();
  if (lines.length === 0) {
    throw Error("Ran out of lines");
  }
  const anotherTry = lines.join(";");
  try {
    return JSON.parse(anotherTry);
  } catch (e) {
    return parseLess(anotherTry);
  }
}

function patientlyParseJson(awfultext) {
  try {
    return dJSON.parse(awfultext);
  } catch (e) {
    try {
      return JSON.parse(naiveTrim(awfultext.split("\n")[0]));
    } catch (e) {
      parseLess(awfultext);
    }
  }
}

module.exports = {
  async guess(playlist) {
    const body = await miniget(
      `https://www.youtube.com/playlist?list=${playlist}&hl=en`
    ).text();

    const sample = body
      .replace(/<script[^>]*>/gi, SEPARATOR)
      .replace("</script>", SEPARATOR_END);

    const extracted = sample
      .split(SEPARATOR)
      .filter((i) => i.includes(playlist))
      .map((i) => naiveTrim(i.split(SEPARATOR_END)[0]))
      .map((i) => {
        // console.log(i.substr(0, 120) + "|" + i.substr(-520, 520));
        try {
          return patientlyParseJson(i);
        } catch (e) {}
      })
      .filter((i) => i);

    console.log(extracted);
    const root = fuzzyNode(extracted);

    const list = root.searchLeafPathsRegex(/playlist.*\].*videoId/i);

    let result = list.map((item) => {
      const spot = goUpUntilFieldsFound(item, [
        "videoId",
        "thumbnail",
        "title",
      ]);
      // console.log(spot.path);

      const realData = spot.flattenInto(["video", "thumbnail", "title"]);

      return {
        id: realData.video,
        title: realData.title,
        thumbnail: realData.thumbnail,
      };
    });

    result = _.uniqBy(result, "id");

    return {
      items: result,
      title: root.searchLeafPathsRegex(
        /playlist.*playlist.*info.*title.*text/i
      )[0],
      author: {
        name: root.searchLeafPathsRegex(/video.*owner.*text/i)[0],
      },
    };
  },
};
