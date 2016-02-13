//
//
// Chris Polis, 2016
// Read game data for season and aggregate by team
//  eg url: http://www.basketball-reference.com/leagues/NBA_1968_games.html

//
var buildUrl = function(year) {
  return 'http://www.basketball-reference.com/leagues/NBA_'+year+'_games.html';
};

//
var readSeason = function(year) {
  var page = require('webpage').create(),
      url = buildUrl(year);
  page.open(url, function(status) {
    if(status !== 'success') { console.log('Failed to load: ', url, status); }

    // inject local js
    if(!page.injectJs('./lib/bit-array.js') ||
       !page.injectJs('./lib/lodash.js')) { console.log('failed to inject'); }

    //
    var parsed = page.evaluate(function(year) {

      // read and parse games from table rows
      var games = _(document.querySelectorAll('#div_games table tbody tr'))
        .toArray()
        .filter(function(tr) { return tr.children[3] && tr.children[4].innerText; })
        .map(function(tr) { return {
          away: tr.children[3].innerText,
          awayPts: +tr.children[4].innerText,
          home: tr.children[5].innerText,
          homePts: +tr.children[6].innerText}; })
        .value();

      // find wins and losses, encode as hex from bit-array
      var teams = _(games)
        .map('away')
        .uniq() // array of team names
        .map(function(name) {
          var teamGames = games
            .filter(function(g) { return g.home === name || g.away === name })
            .map(function(g) { return (g.home === name && g.homePts > g.awayPts) ||
                                    (g.away === name && g.awayPts > g.homePts); });
          var winCount = teamGames.filter(_.identity).length,
              encodedGames = new BitArray(teamGames.length);
          teamGames.forEach(function(winLoss, ndx) { encodedGames.set(ndx, winLoss); });
          return [year, name, encodedGames.toHexString(), teamGames.length, winCount]; })
        .value();
      return teams;
    }, year);
    console.log(parsed.join('\n'));
  });
};

//
var currentYear = 1968;
setInterval(function() {
  if(currentYear === 2017) { phantom.exit(); }
  readSeason(currentYear++);
}, 13e3); // go through seasons, with 13sec delay
