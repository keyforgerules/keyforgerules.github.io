var ratings = {};
var info = {};
var debug = window.location.href.indexOf('debug') > -1;

function numstr(val) { return Math.round(val * 1000) / 1000.0; }

$.ajax({
  url: 'info.json'
}).done(function(data) {
  if (typeof(data) == "string")
    data = JSON.parse(data);
  info = data;
  renderInfo(info);
});

function AddLine(data, $target) {
  var $row = $('<tr></tr>');
  for (key in data) {
    var $col = $('<td></td>').html(data[key]);
    $col.appendTo($row);
  }
  $row.appendTo($target);
}

function renderInfo(info) {
  var $target = $('#info');
  AddLine(["Matches", info.matches], $target);
  AddLine(["Decks", info.decks], $target);
  AddLine(["Last updated", info.date.substr(0, 10)], $target);

  var $target = $('#houseList tbody').empty();
  var num = 1;
  var list = info.houses;
  for (i in list) {
    AddLine([
      num, list[i].Name, list[i].Wins, numstr(list[i].WinsWithAdjusted), list[i].Losses,  numstr(list[i].Rating * 100) + '%', numstr(list[i].RatingWithout * 100) + '%', numstr(list[i].AdjustedAwp)
    ], $target);
    num++;
  }

  var $target = $('#comboList tbody').empty();
  var num = 1;
  var list = info.combos;
  for (i in list) {
    AddLine([
      num, list[i].Name, list[i].Wins, numstr(list[i].WinsWithAdjusted), list[i].Losses, numstr(list[i].Rating * 100) + '%', numstr(list[i].RatingWithout * 100) + '%', numstr(list[i].AdjustedAwp)
    ], $target);
    num++;
  }
}

$.ajax({
  url: 'card_rating.json'
}).done(function(data) {
  if (typeof(data) == "string")
    data = JSON.parse(data);

  var cardDict = {};
  for (key in data) {
    cardDict[data[key].Id] = data[key];
  }
  ratings = cardDict;

  renderTop(data);
});

function renderTop(list) {
  var $target = $('#topList tbody').empty();
  var num = 1;
  for (i in list) {
    AddLine([
      num, list[i].Name, list[i].House, list[i].Wins, numstr(list[i].WinsAdjusted), list[i].Losses,
       numstr(list[i].With * 100)+ '%', numstr(list[i].Without * 100)+ '%', numstr(list[i].Awp)
    ], $target);
    num++;
  }
}

$.ajax({
  url: 'top.json'
}).done(function(data) {
  if (typeof(data) == "string")
    data = JSON.parse(data);

  renderTopDecks('#topDecks', data.Top);
  renderTopDecks('#avrgDecks', data.Average);
  renderTopDecks('#botDecks', data.Bottom);

  var $target = $('#info');
  AddLine(["Highest deck AWP score", numstr(data.Top[0].Awp)], $target);
  AddLine(["Median deck AWP score", numstr(data.Average[0].Awp)], $target);
  AddLine(["Lowest deck AWP score", numstr(data.Bottom[0].Awp)], $target);
});

function renderTopDecks(div, list) {
  var $target = $(div + ' tbody').empty();
  var num = 1;
  for (i in list) {
    AddLine([num, '<a href="https://www.keyforgegame.com/deck-details/'+list[i].Id+'">' + list[i].Name + "</a>", numstr(list[i].Awp)], $target);
    num++;
  }
}

$('#getRating').on('click', function() {
  var $info = $('#infoList').empty();
  var $cards = $('#cardList tbody').empty();
  $('#loader').toggleClass('hidden', false);

  var name = $('#deckName').val().trim();

  var isGuid = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(name);;  
  if (isGuid) {

    var name = name.substr(length-36);
    var guid = 'https://www.keyforgegame.com/api/decks/'+ name +'/?links=cards';

    $.ajax({
       url: 'https://cors-anywhere.herokuapp.com/' + guid,
       crossDomain: true 
      }).done(function(data) { DisplayDeck(data.data, data._linked.cards); });
  } else {
    var search = 'https://www.keyforgegame.com/api/decks/?page=1&page_size=1&links=cards&search=' + name;

    $.ajax({ 
      url: 'https://cors-anywhere.herokuapp.com/' + search,
      crossDomain: true 
    }).done(function(data) { DisplayDeck(data.data[0], data._linked.cards); });
  }
});//.trigger('click');

function DisplayDeck(data, cards) {
  $('#loader').toggleClass('hidden', true);

  if (debug) console.log('data', JSON.stringify(data));
  if (debug) console.log('cards', JSON.stringify(cards));

  var cardDict = {};
  for (key in cards) {
    cardDict[cards[key].id] = cards[key];
  }

  if (debug) console.log('dictionary', JSON.stringify(cardDict));

  var $info = $('#infoList').empty();
  AddLine(["Name", data.name], $info);

  var $cards = $('#cardList tbody').empty();

  var sum = 0;
  var hsum = {};
  for (i in data._links.cards) {
    var id = data._links.cards[i];
    if (debug) console.log('Add card ', id);

    var card = cardDict[id];
    if (debug) console.log('> card ', card);

    var cardId = card.expansion + '_' + card.card_number;

    var rating = ratings[cardId].Rating;
    var awp = ratings[cardId].Awp;
    sum += rating;
    hsum[card.house] = (hsum[card.house] || 0) + rating;

    AddLine([card.card_title, card.house, numstr(rating * 100) + '%', numstr(awp)], $cards);
  }

  var awp = ((sum / 36.0) - 0.5) * 100;
  var percentile = numstr(calcPercentile(awp) * 100) + '%';
  AddLine(["Total AWP score", numstr(awp)], $info);
  AddLine(["Deck percentile", percentile], $info);
  AddLine(["Id", data.id], $info);

  for (key in hsum) {
    AddLine(["AWP score for " + key, numstr(((hsum[key] / 12.0) - 0.5) * 100)], $info);
  }
}

var graphData;
$.ajax({
  url: 'graph.json'
}).done(function(data) {
  if (typeof(data) == "string")
    data = JSON.parse(data);
  graphData = ToLine(data);
  CreateGraph(data);
});

function calcPercentile(val) {
  var line = graphData;
  val = parseFloat(val);
  if (val <= line[0][0]) return 0;
  if (val >= line[line.length - 1][0]) return 1;
  for (var i = 1; i < line.length; i++)
  {
    if (val >= line[i - 1][0] && val < line[i][0]) {
      var x0 = line[i - 1][0];
      var x1 = line[i][0];
      var y0 = line[i - 1][1];
      var y1 = line[i][1];

      return  y0 + (y1 - y0) * (val - x0) * (x1 - x0);
    }
  }
}

function ToLine(data) {
  var line = [[data[0].x0, 0]];
  var sum = 0;
  for (var i = 0; i < data.length; i++) {
    sum += data[i].y;
  }  
  var accu = 0;
  for (var i = 0; i < data.length; i++) {
    accu += data[i].y;
    line.push([data[i].x1, accu / sum]);
  }
  return line;
}

function CreateGraph(data) {
  var color = Chart.helpers.color;
  var labels = [];
  var values = [];
  for (key in data) {
    labels.push(Math.round(data[key].xm*100)/100);
    values.push(data[key].y);
  }
  var barChartData = {
    labels: labels,
    datasets: [{
      label: 'Number of decks',
      backgroundColor: color("blue").alpha(0.5).rgbString(),
      borderColor: "blue",
      borderWidth: 1,
      data: values
    }]
  };

  var ctx = document.getElementById('canvas').getContext('2d');
  window.myBar = new Chart(ctx, {
    type: 'bar',
    data: barChartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      scales: {
        yAxes: [{ scaleLabel: {
          display: true,
          labelString: 'Deck count'
        } }],
        xAxes: [{ scaleLabel: {
          display: true,
          labelString: 'AWP score'
        } }],
      }
    }
  });
}